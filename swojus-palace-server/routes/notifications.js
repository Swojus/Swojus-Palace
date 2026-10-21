const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

router.get("/", authMiddleware, requireAdmin, async (req, res) => {
  const notifications = await Notification.find()
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(
    notifications.map((notification) => ({
      id: notification.id,
      action: notification.action,
      eventName: notification.eventName,
      eventDate: notification.eventDate,
      actorName: notification.actorName,
      createdAt: notification.createdAt.toISOString(),
      source: "server",
    })),
  );
});

router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.json({ ok: true });
});

module.exports = router;
