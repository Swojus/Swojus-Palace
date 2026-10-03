const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/event-management";
    await mongoose.connect(uri);
    const users = await User.find().select("-password").lean();
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (e) {
    console.error("Error listing users:", e);
    process.exitCode = 1;
  }
})();
