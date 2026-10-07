const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

// GET /api/users - admin only
router.get("/", authMiddleware, requireAdmin, async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(
    users.map((user) => ({
      ...user.toObject(),
      isApproved: user.isApproved !== false,
      approved: user.isApproved !== false,
    })),
  );
});

router.patch("/:id/approve", authMiddleware, requireAdmin, async (req, res) => {
  const { approved } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.isApproved = Boolean(approved);
  await user.save();

  res.json({
    ...user.toObject(),
    isApproved: user.isApproved,
    approved: user.isApproved,
  });
});

module.exports = router;
