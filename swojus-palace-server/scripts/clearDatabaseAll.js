const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventflow";
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB:", uri);

  const confirm = process.env.CONFIRM;
  if (confirm !== "yes") {
    console.log("This will DROP the entire database (ALL data will be lost).");
    console.log("To proceed, set CONFIRM=yes and run again.");
    process.exit(0);
  }

  const db = mongoose.connection.db;
  const dbName = db.databaseName;
  console.log("Dropping database:", dbName);
  await db.dropDatabase();
  console.log("Database dropped.");

  await mongoose.disconnect();
  console.log("Disconnected.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
