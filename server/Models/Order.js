import mongoose from "mongoose";
import crypto from "crypto";
const OrderSchema = new mongoose.Schema(
  {
    // حالة الطلب
    orderStatus: {
      type: String,
      enum: ["pending", "accepted", "delivered", "canceled"],
      default: "pending",
    },

    // تاريخ التوصيل المتوقع (اختياري)
    delivery_at: {
      type: Date,
    },

    // عناصر الطلب مع sizeId و size لتوافق مع منطق المشروع
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        sizeId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        size: { type: Number, required: true },
        qty: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // عنوان الشحن
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      governorate: { type: String },
      postalCode: { type: String },
    },

    // حسابات الأسعار - لن تكون مطلوبة عند الإنشاء لأن الـ pre-save سيحسبها
    shippingPrice: { type: Number, default: 0, min: 0 },
    itemPrice: { type: Number, default: 0, min: 0 },

    userPhone: { type: String, required: true, trim: true },
    userName: { type: String, required: true, trim: true },
    totalPrice: { type: Number, default: 0, min: 0 },

    trackingCode: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
    },
  },
  { timestamps: true, versionKey: false },
);

function generateTrackingCode() {
  // Format: SILL-XXXXXX (SILL + 6 random alphanumeric)
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SILL-${random}`;
}

// Pre-save hook to generate tracking code
OrderSchema.pre("save", async function () {
  // حساب الأسعار (itemPrice, shippingPrice, totalPrice)
  try {
    const itemPrice = this.items.reduce((sum, it) => sum + (it.price || 0) * (it.qty || 0), 0);
    this.itemPrice = itemPrice;

    // سياسة شحن بسيطة: شحن مجاني للطلبات >= 500، وإلا 50
    this.shippingPrice = itemPrice >= 500 ? 0 : 50;

    this.totalPrice = this.itemPrice + this.shippingPrice;
  } catch (e) {
    return next(e);
  }

  // Generate unique tracking code
  if (!this.trackingCode) {
    let code;
    let isUnique = false;

    // Keep generating until unique
    while (!isUnique) {
      code = generateTrackingCode();
      const existing = await this.constructor.findOne({ trackingCode: code });
      if (!existing) isUnique = true;
    }

    this.trackingCode = code;
  }
});
const Order = mongoose.model("Order", OrderSchema);
export default Order;
