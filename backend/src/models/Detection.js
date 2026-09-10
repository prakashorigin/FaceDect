const mongoose = require("mongoose");

const detectionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: ["Camera", "Capture", "Upload"] },
    faces: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    imageName: { type: String, trim: true, maxlength: 160, default: "" },
  },
  { timestamps: true, versionKey: false },
);

module.exports = mongoose.model("Detection", detectionSchema);
