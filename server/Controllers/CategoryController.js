import { asyncHandler } from "../Middlewares/errorHandler.js";
import cloudinary from "../config/cloudinary.js";
import Category from "../Models/Category.js";
import Product from "../Models/Product.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort('name')
    .lean();

  // ✅ Count products for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (cat) => {
      const count = await Product.countDocuments({ category: cat._id });
      return { ...cat, productsCount: count };
    })
  );

  res.status(200).json({
    status: 'success',
    data: categoriesWithCount,
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  res.status(200).json({
    status: "success",
    message: "Category retrieved successfully",
    data: category,
  });
});

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  // Check if category exists
  const exists = await Category.findOne({ name });
  if (exists) {
    res.status(400);
    throw new Error("Category already exists");
  }

  // Check image upload
  if (!req.file) {
    res.status(400);
    throw new Error("Category image is required");
  }

  const category = await Category.create({
    name,
    description,
    isActive,
    image: {
      url: req.file.path,
      public_id: req.file.filename,
    },
  });

  res.status(201).json({
    status: "success",
    message: "Category created successfully",
    data: category,
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const { name, description, isActive } = req.body;

  // Check if new name already exists
  if (name && name !== category.name) {
    const exists = await Category.findOne({ name });
    if (exists) {
      res.status(400);
      throw new Error("Category name already exists");
    }
  }

  // Handle image update
  if (req.file) {
    // Delete old image
    await cloudinary.uploader.destroy(category.image.public_id);

    category.image = {
      url: req.file.path,
      public_id: req.file.filename,
    };
  }

  if (name) category.name = name;
  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();

  res.status(200).json({
    status: "success",
    message: "Category updated successfully",
    data: category,
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Check if category has products
  const productsCount = await Product.countDocuments({
    category: req.params.id,
  });

  if (productsCount > 0) {
    res.status(400);
    throw new Error(
      `Cannot delete category. ${productsCount} products are using this category`
    );
  }

  // Delete image from cloudinary
  await cloudinary.uploader.destroy(category.image.public_id);

  await category.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Category deleted successfully",
    data: [],
  });
});