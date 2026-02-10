import express from "express";
import {
  registerAdmin,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
} from "../Controllers/AuthController.js";
import {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} from "../Validators/AuthValidator.js";
import { handleValidationErrors } from "../Middlewares/handleValidationError.js";
import { protect } from "../Middlewares/auth.js";

const authRouter = express.Router();

// Public routes
authRouter.post(
  "/register",
  registerValidator,
  handleValidationErrors,
  registerAdmin
);
authRouter.post("/login", loginValidator, handleValidationErrors, login);

// Protected routes
authRouter.get("/me", protect, getMe);
authRouter.put(
  "/profile",
  protect,
  updateProfileValidator,
  handleValidationErrors,
  updateProfile
);
authRouter.put(
  "/change-password",
  protect,
  changePasswordValidator,
  handleValidationErrors,
  changePassword
);
authRouter.post("/logout", protect, logout);

export default authRouter;