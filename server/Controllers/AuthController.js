import jwt from "jsonwebtoken";
import { asyncHandler } from "../Middlewares/errorHandler.js";
import User from "../Models/User.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register first admin (run once)
// @route   POST /api/auth/register
// @access  Public (should be disabled after first admin creation)
export const registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if any admin exists
  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) {
    res.status(400);
    throw new Error("Admin already exists. Registration is disabled.");
  }

  // Create admin
  const admin = await User.create({
    name,
    email,
    password,
    role: "admin",
  });

  // Generate token
  const token = generateToken(admin._id);

  res.status(201).json({
    status: "success",
    message: "Admin registered successfully",
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    },
  });
});

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if admin exists (select password explicitly)
  const admin = await User.findOne({ email }).select("+password");

  if (!admin) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Check if admin is active
  if (!admin.isActive) {
    res.status(403);
    throw new Error("Account is deactivated. Contact support.");
  }

  // Verify password
  const isPasswordCorrect = await admin.comparePassword(password);
  if (!isPasswordCorrect) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Generate token
  const token = generateToken(admin._id);

  res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
      token,
    },
  });
});

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private (Admin)
export const getMe = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user.id);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  res.status(200).json({
    status: "success",
    message: "Admin profile retrieved successfully",
    data: admin,
  });
});

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private (Admin)
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const admin = await User.findById(req.user.id);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Check if email is being changed and if it's already taken
  if (email && email !== admin.email) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error("Email already in use");
    }
  }

  admin.name = name || admin.name;
  admin.email = email || admin.email;

  const updatedAdmin = await admin.save();

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: updatedAdmin,
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private (Admin)
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await User.findById(req.user.id).select("+password");

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  // Verify current password
  const isPasswordCorrect = await admin.comparePassword(currentPassword);
  if (!isPasswordCorrect) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  // Generate new token
  const token = generateToken(admin._id);

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
    data: { token },
  });
});

// @desc    Logout (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private (Admin)
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
    data: [],
  });
});