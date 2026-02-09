import mongoose from "mongoose";
 const categorySchema = new mongoose.Schema({
name: { type: String, trim: true, required: true,maxlength:20 },
imageUrl: { type: String, required: true },
describtion: {type: String, required: true,trim:true },
}, { timestamps: true , versionKey: false })
const Category = mongoose.model('Category', categorySchema)
export default Category