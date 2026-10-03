const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

// GET /api/users - admin only
router.get("/", authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

module.exports = router;
