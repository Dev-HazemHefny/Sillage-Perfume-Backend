import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const dbConnection = mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));