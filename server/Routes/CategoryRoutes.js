import express from "express";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../Controllers/CategoryController.js";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "../Validators/CategoryValidator.js";
import { handleValidationErrors } from "../Middlewares/handleValidationError.js";
import { protect } from "../Middlewares/auth.js"; // Updated
import { uploadCategoryImage } from "../Middlewares/upload.js";

const categoryRouter = express.Router();

// Public routes
categoryRouter.get("/", getCategories);
categoryRouter.get("/:id", getCategoryById);

// Admin routes (protected)
categoryRouter.post(
  "/",
  protect, // Updated
  uploadCategoryImage,
  createCategoryValidator,
  handleValidationErrors,
  createCategory
);

categoryRouter.put(
  "/:id",
  protect, // Updated
  uploadCategoryImage,
  updateCategoryValidator,
  handleValidationErrors,
  updateCategory
);

categoryRouter.delete("/:id", protect, deleteCategory); // Updated

export default categoryRouter;