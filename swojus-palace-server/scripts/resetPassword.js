const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

(async () => {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/event-management";
    const email = process.env.ADMIN_EMAIL;
    const newPassword = process.env.ADMIN_PASSWORD;
    if (!email || !newPassword) {
      console.error(
        "ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required",
      );
      process.exit(1);
    }
    await mongoose.connect(uri);
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found:", email);
      await mongoose.disconnect();
      process.exit(1);
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    if (user.passwordHash) user.passwordHash = undefined;
    await user.save();
    console.log("Password updated for", email);
    await mongoose.disconnect();
  } catch (e) {
    console.error("Error resetting password:", e);
    process.exit(1);
  }
})();
