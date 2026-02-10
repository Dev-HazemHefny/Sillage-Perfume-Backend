import jwt from "jsonwebtoken";
import { asyncHandler } from "./errorHandler.js";
import User from "../Models/User.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // Check if token exists
  if (!token) {
    res.status(401);
    throw new Error("Not authorized - No token provided");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized - User not found");
    }

    // Check if user is active
    if (!req.user.isActive) {
      res.status(403);
      throw new Error("Account is deactivated");
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized - Invalid token");
  }
});

// Optional: Check if user is admin (redundant since all users are admins, but good for future)
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({
      status: "fail",
      message: "Admin access only",
      data: [],
    });
  }
};