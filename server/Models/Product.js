import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      required: [true, "Gender target is required"],
    },
    season: [
      {
        type: String,
        enum: ["spring", "summer", "fall", "winter"],
      },
    ],
  },
  { timestamps: true, versionKey: false },
);
ProductSchema.index({ category: 1 });
ProductSchema.index({ gender: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ season: 1 });
const Product = mongoose.model("Product", ProductSchema);
export default Product;
