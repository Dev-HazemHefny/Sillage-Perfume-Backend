import { body } from "express-validator";

export const craeteValidator = [
  body("name").isLength({ min: 3, max: 20 }).withMessage("Name must be 3-20 characters"),
];

export const updateValidator = [
  body("name").optional().isLength({ min: 3, max: 20 }).withMessage("Name must be 3-20 characters"),
];