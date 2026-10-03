const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  roleId: { type: Number, default: 2 }, // 1=admin, 2=manager
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", UserSchema);
