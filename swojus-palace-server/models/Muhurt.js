const mongoose = require("mongoose");

const MuhurtSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String },
  type: {
    type: String,
    enum: ["Main Muhurt", "Sub Muhurt"],
    default: "Main Muhurt",
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Muhurt", MuhurtSchema);
