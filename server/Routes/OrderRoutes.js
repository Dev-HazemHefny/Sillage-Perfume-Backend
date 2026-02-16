import express from "express";
import {
  createOrder,
  trackOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
} from "../Controllers/OrderController.js";

import { handleValidationErrors } from "../Middlewares/handleValidationError.js";
import { protect, adminOnly } from "../Middlewares/auth.js";
import {
  createOrderValidator,
  trackOrderValidator,
  updateOrderStatusValidator,
  getOrdersValidator,
} from "../Validators/OrderValidator.js";

const router = express.Router();

// Public
router.post("/", createOrderValidator, handleValidationErrors, createOrder);
router.get("/track", trackOrderValidator, handleValidationErrors, trackOrder);

// Admin (protected)
router.get("/", protect, adminOnly, getOrdersValidator, handleValidationErrors, getOrders);
router.get("/stats/summary", protect, adminOnly, getOrderStats);
router.get("/:id", protect, adminOnly, getOrderById);
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  updateOrderStatusValidator,
  handleValidationErrors,
  updateOrderStatus
);
router.delete("/:id", protect, adminOnly, deleteOrder);

export default router;
