import mongoose from "mongoose";

const SizeSchema = new mongoose.Schema(
  {
    size: {
      type: Number,
      required: [true, "Size is required"],
      min: [1, "Size must be at least 1ml"],
    },
    unit: {
      type: String,
      enum: ["ml"],
      default: "ml",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, "Brand name cannot exceed 50 characters"],
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        public_id: {
          type: String,
          required: true,
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    sizes: {
      type: [SizeSchema],
      required: [true, "At least one size is required"],
      validate: {
        validator: function (sizes) {
          return sizes.length > 0;
        },
        message: "Product must have at least one size variant",
      },
    },
    gender: {
      type: String,
      enum: {
        values: ["men", "women", "unisex"],
        message: "Gender must be: men, women, or unisex",
      },
      required: [true, "Gender is required"],
    },
    season: [
      {
        type: String,
        enum: {
          values: ["spring", "summer", "fall", "winter", "all-season"],
          message: "Invalid season value",
        },
      },
    ],
    status: {
      type: String,
      enum: ["available", "unavailable", "discontinued"],
      default: "available",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, gender: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ featured: -1 });
ProductSchema.index({ "sizes.price": 1 });
ProductSchema.index({ name: "text", description: "text" });

// Virtual for total stock across all sizes
ProductSchema.virtual("totalStock").get(function () {
  return this.sizes.reduce((total, size) => total + size.stock, 0);
});

// Virtual for price range
ProductSchema.virtual("priceRange").get(function () {
  const prices = this.sizes.map((s) => s.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
});

// Pre-save middleware to update status based on stock
ProductSchema.pre("save", async function () {
  const totalStock = this.sizes.reduce((total, size) => total + size.stock, 0);

  if (totalStock === 0) {
    this.status = "unavailable";
  } else if (this.status === "unavailable" && totalStock > 0) {
    this.status = "available";
  }

  // Update isAvailable for each size
  this.sizes.forEach((size) => {
    size.isAvailable = size.stock > 0;
  });
});

const Product = mongoose.model("Product", ProductSchema);
export default Product;