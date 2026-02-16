import { body, query } from "express-validator";

// مصفوفة العناصر: كل عنصر له product (id), sizeId, qty
export const createOrderValidator = [
  body("userName").trim().notEmpty().withMessage("userName is required"),
  body("userPhone")
    .trim()
    .matches(/^01[0125][0-9]{8}$/)
    .withMessage("Invalid Egyptian phone number"),
  body("shippingAddress.street").trim().notEmpty().withMessage("street is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("city is required"),
  body("shippingAddress.governorate").trim().notEmpty().withMessage("governorate is required"),
  body("items").isArray({ min: 1 }).withMessage("items must be a non-empty array"),
  body("items.*.product").notEmpty().isMongoId().withMessage("product id required"),
  body("items.*.sizeId").notEmpty().isMongoId().withMessage("sizeId required"),
  body("items.*.qty").isInt({ min: 1 }).withMessage("qty must be at least 1"),
];

export const trackOrderValidator = [
  query("trackingCode").notEmpty().withMessage("trackingCode is required"),
  query("phoneLastDigits").isLength({ min: 4, max: 4 }).withMessage("phoneLastDigits must be 4 digits"),
];

export const updateOrderStatusValidator = [
  body("status").isIn(["pending", "accepted", "delivered", "canceled"]).withMessage("Invalid status"),
];

export const getOrdersValidator = [
  query("orderStatus").optional().isIn(["pending", "accepted", "delivered", "canceled"]),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1 }),
];
