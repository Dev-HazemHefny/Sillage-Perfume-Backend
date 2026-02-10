import { body, query } from "express-validator";
import mongoose from "mongoose";

export const createProductValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3-100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10-1000 characters"),

  body("brand")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Brand name cannot exceed 50 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid category ID");
      }
      return true;
    }),

  // ✅ FIX: Handle stringified JSON for sizes
  body("sizes")
    .notEmpty()
    .withMessage("Sizes is required")
    .custom((value) => {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("At least one size is required");
        }

        // Validate each size object
        parsed.forEach((size, index) => {
          if (!size.size || size.size < 1) {
            throw new Error(`Size at index ${index} must be at least 1ml`);
          }
          if (!size.price || size.price < 0) {
            throw new Error(`Price at index ${index} must be a positive number`);
          }
          if (size.stock === undefined || size.stock < 0) {
            throw new Error(`Stock at index ${index} must be a non-negative number`);
          }
        });

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid sizes format");
      }
    }),

  body("gender")
    .notEmpty()
    .withMessage("Gender is required")
    .isIn(["men", "women", "unisex"])
    .withMessage("Gender must be: men, women, or unisex"),

  // ✅ FIX: Handle stringified JSON for season
  body("season")
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed)) {
          throw new Error("Season must be an array");
        }

        const validSeasons = ["spring", "summer", "fall", "winter", "all-season"];
        const allValid = parsed.every((s) => validSeasons.includes(s));
        
        if (!allValid) {
          throw new Error("Invalid season value. Must be: spring, summer, fall, winter, or all-season");
        }

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid season format");
      }
    }),

  body("status")
    .optional()
    .isIn(["available", "unavailable", "discontinued"])
    .withMessage("Invalid status"),

  body("featured")
    .optional()
    .custom((value) => {
      if (value === 'true' || value === 'false' || typeof value === 'boolean') {
        return true;
      }
      throw new Error("Featured must be boolean (true/false)");
    }),

  // ✅ FIX: Handle stringified JSON for tags
  body("tags")
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed)) {
          throw new Error("Tags must be an array");
        }

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid tags format");
      }
    }),
];

export const updateProductValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3-100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10-1000 characters"),

  body("brand")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Brand name cannot exceed 50 characters"),

  body("category")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid category ID");
      }
      return true;
    }),

  body("sizes")
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error("At least one size is required");
        }

        parsed.forEach((size, index) => {
          if (size.size && size.size < 1) {
            throw new Error(`Size at index ${index} must be at least 1ml`);
          }
          if (size.price !== undefined && size.price < 0) {
            throw new Error(`Price at index ${index} must be a positive number`);
          }
          if (size.stock !== undefined && size.stock < 0) {
            throw new Error(`Stock at index ${index} must be a non-negative number`);
          }
        });

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid sizes format");
      }
    }),

  body("gender")
    .optional()
    .isIn(["men", "women", "unisex"])
    .withMessage("Gender must be: men, women, or unisex"),

  body("season")
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed)) {
          throw new Error("Season must be an array");
        }

        const validSeasons = ["spring", "summer", "fall", "winter", "all-season"];
        const allValid = parsed.every((s) => validSeasons.includes(s));
        
        if (!allValid) {
          throw new Error("Invalid season value");
        }

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid season format");
      }
    }),

  body("status")
    .optional()
    .isIn(["available", "unavailable", "discontinued"])
    .withMessage("Invalid status"),

  body("featured")
    .optional()
    .custom((value) => {
      if (value === 'true' || value === 'false' || typeof value === 'boolean') {
        return true;
      }
      throw new Error("Featured must be boolean");
    }),

  body("tags")
    .optional()
    .custom((value) => {
      if (!value) return true;
      
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        
        if (!Array.isArray(parsed)) {
          throw new Error("Tags must be an array");
        }

        return true;
      } catch (error) {
        throw new Error(error.message || "Invalid tags format");
      }
    }),
];

export const getProductsValidator = [
  query("category").optional().isMongoId().withMessage("Invalid category ID"),
  query("gender")
    .optional()
    .isIn(["men", "women", "unisex"])
    .withMessage("Invalid gender"),
  query("season")
    .optional()
    .isIn(["spring", "summer", "fall", "winter", "all-season"])
    .withMessage("Invalid season"),
  query("status")
    .optional()
    .isIn(["available", "unavailable", "discontinued"])
    .withMessage("Invalid status"),
  query("minPrice").optional().isFloat({ min: 0 }),
  query("maxPrice").optional().isFloat({ min: 0 }),
  query("featured").optional().isBoolean(),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("sort").optional(),
];

export const updateSizeStockValidator = [
  body("sizeId").notEmpty().withMessage("Size ID is required"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative number"),
];