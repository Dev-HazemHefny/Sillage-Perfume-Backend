import mongoose from "mongoose";
import crypto from "crypto";
const OrderSchema = new mongoose.Schema(
  {
    orderStatus: {
      type: String,
      enum: ["pending", "accepted", "delivered", "canceled"],
      default: "pending",
    },
delivery_at: {
  type: Date,
  required: true,
//   validate: {
//     validator: function (value) {
//       return value > new Date();
//     },
//     message: "Delivery date must be in the future",
//   },
},
items: [
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
],

    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
    },
    shippingPrice: { type: Number, required: true, min: 0 },
    itemPrice: { type: Number, required: true, min: 0 },
    userPhone: { type: String, required: true,trim:true },
    userName: { type: String, required: true, trim: true },
    totalPrice: { type: Number, required: true, min: 0 },

    trackingCode: {
      type: String,
      unique: true,
      index: true,
      uppercase: true,
    },
  },
  { timestamps: true, versionKey: false },
);

function generateTrackingCode() {
  // Format: SILL-XXXXXX (SILL + 6 random alphanumeric)
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SILL-${random}`;
}

// Pre-save hook to generate tracking code
OrderSchema.pre("save", async function (next) {
  // Calculate totals
  //
  // Generate unique tracking code
  if (!this.trackingCode) {
    let code;
    let isUnique = false;

    // Keep generating until unique
    while (!isUnique) {
      code = generateTrackingCode();
      const existing = await this.constructor.findOne({ trackingCode: code });
      if (!existing) isUnique = true;
    }

    this.trackingCode = code;
  }

  next();
});
const Order = mongoose.model("Order", OrderSchema);
export default Order;
