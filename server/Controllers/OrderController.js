import { asyncHandler } from "../Middlewares/errorHandler.js";
import Product from "../Models/Product.js";
import Order from "../Models/Order.js";
import mongoose from "mongoose";

// helper: generate tracking code مثل SILL-XXXXXX
const generateTrackingCode = (length = 6) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SILL-${result}`;
};

// @desc Create order (public)
// @route POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { userName, userPhone, shippingAddress, items, notes, delivery_at } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Cart items required");
  }

  // عند الإنشاء لا نخصم المخزون هنا — سيتم الخصم عندما يؤكد الادمن (status -> accepted)
  const orderItems = [];

  for (const it of items) {
    const { product: productId, sizeId, qty } = it;

    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(sizeId)) {
      res.status(400);
      throw new Error("Invalid product or size id");
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const size = product.sizes.id(sizeId);
    if (!size) {
      res.status(404);
      throw new Error("Product size not found");
    }

    // تحقق من التوفر فقط (لا تخصم)
    if (!size.isAvailable || size.stock < qty) {
      res.status(400);
      throw new Error(`Not enough stock for product ${product.name} size ${size.size}`);
    }

    orderItems.push({
      product: product._id,
      sizeId: size._id,
      size: size.size,
      qty,
      price: size.price,
    });
  }

  // توليد tracking code فريد
  let trackingCode = generateTrackingCode();
  let exists = await Order.findOne({ trackingCode });
  let attempts = 0;
  while (exists && attempts < 20) {
    trackingCode = generateTrackingCode();
    exists = await Order.findOne({ trackingCode });
    attempts++;
  }

  const order = await Order.create({
    userName,
    userPhone,
    shippingAddress,
    items: orderItems,
    notes,
    delivery_at: delivery_at ? new Date(delivery_at) : undefined,
    trackingCode,
  });

  res.status(201).json({
    status: "success",
    message: "Order created successfully",
    data: order,
    tracking: { trackingCode: order.trackingCode },
  });
});

// @desc Track order (public)
// @route GET /api/orders/track?trackingCode=...&phoneLastDigits=1234
export const trackOrder = asyncHandler(async (req, res) => {
  const { trackingCode, phoneLastDigits } = req.query;

  if (!trackingCode || !phoneLastDigits) {
    res.status(400);
    throw new Error("trackingCode and phoneLastDigits are required");
  }

  const order = await Order.findOne({ trackingCode }).populate("items.product", "name images");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const last4 = order.userPhone.slice(-4);
  if (last4 !== String(phoneLastDigits)) {
    res.status(403);
    throw new Error("Phone verification failed");
  }

  res.status(200).json({ status: "success", message: "Order retrieved", data: order });
});

// @desc Admin: get orders with filters & pagination
// @route GET /api/orders
export const getOrders = asyncHandler(async (req, res) => {
  const { orderStatus, userPhone, startDate, endDate, page = 1, limit = 20, sort = "-createdAt" } = req.query;
  const filter = {};

  if (orderStatus) filter.orderStatus = orderStatus;
  if (userPhone) filter.userPhone = userPhone;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(filter).sort(sort).skip(skip).limit(Number(limit)).lean();
  const total = await Order.countDocuments(filter);

  res.status(200).json({
    status: "success",
    message: "Orders retrieved",
    data: orders,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// @desc Admin: get order by id
// @route GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name sizes images");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.status(200).json({ status: "success", message: "Order retrieved", data: order });
});

// helper to restore stock for order items
// accepts optional session for transactional updates
const restoreStockForItems = async (items, session = null) => {
  for (const it of items) {
    const product = session
      ? await Product.findById(it.product).session(session)
      : await Product.findById(it.product);
    if (!product) continue;
    const size = product.sizes.id(it.sizeId);
    if (!size) continue;
    size.stock = (size.stock || 0) + it.qty;
    size.isAvailable = size.stock > 0;
    if (session) await product.save({ session });
    else await product.save();
  }
};

// @desc Admin: update order status
// @route PATCH /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const prevStatus = order.orderStatus;

  // If accepting the order -> deduct stock (transactional)
  if (status === "accepted" && prevStatus !== "accepted") {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const it of order.items) {
        const product = await Product.findById(it.product).session(session);
        if (!product) {
          throw new Error("Product not found while confirming order");
        }
        const size = product.sizes.id(it.sizeId);
        if (!size) throw new Error("Product size not found while confirming order");
        if ((size.stock || 0) < it.qty) {
          throw new Error(`Not enough stock to accept order for product ${product.name}`);
        }
        size.stock = size.stock - it.qty;
        size.isAvailable = size.stock > 0;
        await product.save({ session });
      }

      order.orderStatus = status;
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ status: "success", message: "Order accepted and stock deducted", data: order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(400);
      throw err;
    }
  }

  // If canceling an order that was previously accepted -> restore stock
  if (status === "canceled" && prevStatus === "accepted") {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await restoreStockForItems(order.items, session);
      order.orderStatus = status;
      await order.save({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ status: "success", message: "Order canceled and stock restored", data: order });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(400);
      throw err;
    }
  }

  // Other status transitions: just update
  order.orderStatus = status;
  await order.save();
  res.status(200).json({ status: "success", message: "Order status updated", data: order });
});

// @desc Admin: delete order
// @route DELETE /api/orders/:id
export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // إذا تم قبول الطلب (تم خصم المخزون) ولم يصل بعد، رجع المخزون قبل الحذف
  if (order.orderStatus === "accepted") {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await restoreStockForItems(order.items, session);
      await order.deleteOne({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ status: "success", message: "Order deleted and stock restored", data: [] });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      res.status(400);
      throw err;
    }
  }

  // حالات أخرى: إذا لم يتم خصم المخزون (لم يتم قبول الطلب) أو تم توصيله، نحذف مباشرة
  await order.deleteOne();

  res.status(200).json({ status: "success", message: "Order deleted", data: [] });
});

// @desc Admin: get order stats summary
// @route GET /api/orders/stats/summary
export const getOrderStats = asyncHandler(async (req, res) => {
  const counts = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
        revenue: { $sum: "$totalPrice" },
      },
    },
  ]);

  const summary = counts.reduce((acc, cur) => {
    acc[cur._id] = { count: cur.count, revenue: cur.revenue };
    return acc;
  }, {});

  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]);

  res.status(200).json({
    status: "success",
    message: "Order stats",
    data: {
      totalOrders,
      totalRevenue: totalRevenue[0] ? totalRevenue[0].total : 0,
      byStatus: summary,
    },
  });
});
