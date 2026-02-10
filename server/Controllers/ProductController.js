import { asyncHandler } from "../Middlewares/errorHandler.js";
import cloudinary from "../config/cloudinary.js";
import Product from "../Models/Product.js";
import Category from "../Models/Category.js";

// @desc    Get all products with advanced filters
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    gender,
    season,
    status,
    minPrice,
    maxPrice,
    featured,
    search,
    page = 1,
    limit = 12,
    sort = "-createdAt",
  } = req.query;

  // Build filter
  const filter = {};

  if (category) filter.category = category;
  if (gender) filter.gender = gender;
  if (season) filter.season = season;
  if (status) filter.status = status;
  if (featured !== undefined) filter.featured = featured === "true";

  // Price range filter (check min price in sizes)
  if (minPrice || maxPrice) {
    filter["sizes.price"] = {};
    if (minPrice) filter["sizes.price"].$gte = Number(minPrice);
    if (maxPrice) filter["sizes.price"].$lte = Number(maxPrice);
  }

  // Search
  if (search) {
    filter.$text = { $search: search };
  }

  // Pagination
  const skip = (page - 1) * limit;

  // Execute
  const products = await Product.find(filter)
    .populate("category", "name slug image")
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    status: "success",
    message: "Products retrieved successfully",
    data: products,
    pagination: {
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: Number(limit),
    },
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug image description");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({
    status: "success",
    message: "Product retrieved successfully",
    data: product,
  });
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
export const createProduct = asyncHandler(async (req, res) => {
  const { category, sizes, season, tags, ...productData } = req.body;

  // Check category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Handle image upload
  if (!req.file) {
    res.status(400);
    throw new Error("Product image is required");
  }

  const images = [
    {
      url: req.file.path,
      public_id: req.file.filename,
    },
  ];

  // ✅ Parse arrays من الـ form-data
  const parsedSizes = JSON.parse(sizes);
  const parsedSeason = season ? JSON.parse(season) : [];
  const parsedTags = tags ? JSON.parse(tags) : [];

  // Create product
  const product = await Product.create({
    ...productData,
    category,
    sizes: parsedSizes,
    season: parsedSeason,
    tags: parsedTags,
    images,
  });

  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: product,
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const { category, sizes, season, tags, ...updates } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Check category if updating
  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      res.status(404);
      throw new Error("Category not found");
    }
    updates.category = category;
  }

  // Handle new image upload
  if (req.file) {
    // Delete old image from cloudinary
    if (product.images[0]?.public_id) {
      await cloudinary.uploader.destroy(product.images[0].public_id);
    }

    updates.images = [
      {
        url: req.file.path,
        public_id: req.file.filename,
      },
    ];
  }

  // ✅ Parse arrays لو موجودة
  if (sizes) {
    updates.sizes = JSON.parse(sizes);
  }
  if (season) {
    updates.season = JSON.parse(season);
  }
  if (tags) {
    updates.tags = JSON.parse(tags);
  }

  Object.assign(product, updates);
  await product.save();

  res.status(200).json({
    status: "success",
    message: "Product updated successfully",
    data: product,
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Delete images from cloudinary
  for (const image of product.images) {
    await cloudinary.uploader.destroy(image.public_id);
  }

  await product.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
    data: [],
  });
});

// @desc    Update size stock
// @route   PATCH /api/products/:id/stock
// @access  Admin
export const updateSizeStock = asyncHandler(async (req, res) => {
  const { sizeId, stock } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const size = product.sizes.id(sizeId);
  if (!size) {
    res.status(404);
    throw new Error("Size not found");
  }

  size.stock = stock;
  await product.save();

  res.status(200).json({
    status: "success",
    message: "Stock updated successfully",
    data: product,
  });
});

// @desc    Get available filters
// @route   GET /api/products/filters/available
// @access  Public
export const getAvailableFilters = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).select(
    "name slug image"
  );

  const priceRange = await Product.aggregate([
    { $unwind: "$sizes" },
    {
      $group: {
        _id: null,
        minPrice: { $min: "$sizes.price" },
        maxPrice: { $max: "$sizes.price" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    message: "Filters retrieved successfully",
    data: {
      categories,
      genders: ["men", "women", "unisex"],
      seasons: ["spring", "summer", "fall", "winter", "all-season"],
      statuses: ["available", "unavailable"],
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
    },
  });
});