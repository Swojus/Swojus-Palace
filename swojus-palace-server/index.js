require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 4000;

// connect DB
mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/event-management",
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/users", require("./routes/users"));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
