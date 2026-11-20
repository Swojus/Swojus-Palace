const express = require("express");
const router = express.Router();
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
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

router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.roleId === 1) {
      return res.status(403).json({ error: "Admin accounts cannot be deleted" });
    }

    await RefreshToken.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    return res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(400).json({ error: "Unable to delete user" });
  }
});

module.exports = router;
