const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/event-management";
    const email = process.env.ADMIN_EMAIL || process.argv[2];
    const newPhone = process.env.NEW_PHONE || process.argv[3];
    if (!email || !newPhone) {
      console.error("Provide ADMIN_EMAIL and NEW_PHONE as env vars or args");
      process.exit(1);
    }
    await mongoose.connect(uri);
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found:", email);
      await mongoose.disconnect();
      process.exit(1);
    }
    user.phone = newPhone;
    await user.save();
    console.log("Updated phone for", email);
    await mongoose.disconnect();
  } catch (e) {
    console.error("Error updating phone:", e);
    process.exit(1);
  }
})();
