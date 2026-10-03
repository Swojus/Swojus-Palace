const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Event = require("../models/Event");
const Muhurt = require("../models/Muhurt");
const RefreshToken = require("../models/RefreshToken");

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventflow";
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.error(
      "Please set ADMIN_EMAIL env var to the admin account to keep.",
    );
    process.exit(1);
  }

  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    console.error("Admin user not found for", adminEmail);
    process.exit(1);
  }

  const confirm = process.env.CONFIRM;
  if (confirm !== "yes") {
    console.log(
      "This will delete all users (except the admin), events, muhurt and refresh tokens.",
    );
    console.log("To proceed, set CONFIRM=yes and run again.");
    process.exit(0);
  }

  // Delete users except admin
  const userRes = await User.deleteMany({ _id: { $ne: admin._id } });
  console.log("Deleted users:", userRes.deletedCount);

  // Delete events
  const evRes = await Event.deleteMany({});
  console.log("Deleted events:", evRes.deletedCount);

  // Delete muhurt
  const muRes = await Muhurt.deleteMany({});
  console.log("Deleted muhurt entries:", muRes.deletedCount);

  // Delete refresh tokens
  const rtRes = await RefreshToken.deleteMany({});
  console.log("Deleted refresh tokens:", rtRes.deletedCount);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
