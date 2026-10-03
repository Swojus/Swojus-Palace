require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

async function seed() {
  const uri =
    process.env.MONGO_URI || "mongodb://localhost:27017/event-management";
  await mongoose.connect(uri);
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123";
  const exists = await User.findOne({ email });
  if (exists) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }
  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({
    email,
    password: hash,
    roleId: 1,
    name: "Admin",
  });
  console.log("Seeded admin:", admin.email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
