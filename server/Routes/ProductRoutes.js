import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateSizeStock,
  getAvailableFilters,
} from "../Controllers/ProductController.js";
import {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  updateSizeStockValidator,
} from "../Validators/ProductValidator.js";
import { handleValidationErrors } from "../Middlewares/handleValidationError.js";
import { protect } from "../Middlewares/auth.js";
import { uploadProductImage } from "../Middlewares/upload.js";


const productRouter = express.Router();

// Public routes
productRouter.get("/filters", getAvailableFilters);
productRouter.get("/", getProductsValidator, handleValidationErrors, getProducts);
productRouter.get("/:id", getProductById);

// Admin routes (protected)
productRouter.post(
  "/",
  protect, // Updated
  uploadProductImage,
  createProductValidator,
  handleValidationErrors,
  createProduct
);

productRouter.put(
  "/:id",
  protect, // Updated
  uploadProductImage,
  updateProductValidator,
  handleValidationErrors,
  updateProduct
);

productRouter.delete("/:id", protect, deleteProduct); // Updated

productRouter.patch(
  "/:id/stock",
  protect, // Updated
  updateSizeStockValidator,
  handleValidationErrors,
  updateSizeStock
);

export default productRouter;