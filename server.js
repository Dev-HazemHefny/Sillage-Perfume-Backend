import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dbConnection } from "./server/config/db.js";
import { errorHandler } from "./server/Middlewares/errorHandler.js";

// Routes
import authRoutes from "./server/Routes/AuthRoutes.js";
import productRoutes from "./server/Routes/ProductRoutes.js";
import categoryRoutes from "./server/Routes/CategoryRoutes.js";

dotenv.config();

const app = express();
dbConnection;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Perfume Store API is running",
    version: "1.0.0",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Route not found",
    data: [],
  });
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
});