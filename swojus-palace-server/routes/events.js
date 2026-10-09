const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

// list events
router.get("/", authMiddleware, async (req, res) => {
  const events = await Event.find().sort({ eventDate: 1 });
  res.json(events);
});

// get single event
router.get("/:id", authMiddleware, async (req, res) => {
  const ev = await Event.findById(req.params.id);
  if (!ev) return res.status(404).json({ error: "Not found" });
  res.json(ev);
});

// create event (admin or manager)
router.post("/", authMiddleware, async (req, res) => {
  const data = req.body;
  const created = await Event.create(data);
  res.status(201).json(created);
});

// update event (admin only)
router.put("/:id", authMiddleware, requireAdmin, async (req, res) => {
  const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
});

// delete event (admin only)
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// check-in: set issuedQty values
router.post("/:id/checkin", authMiddleware, async (req, res) => {
  const { issuedCounts } = req.body; // { itemId: qty }
  const ev = await Event.findById(req.params.id);
  if (!ev) return res.status(404).json({ error: "Not found" });
  ev.inventory = ev.inventory.map((it) => ({
    ...it.toObject(),
    issuedQty: issuedCounts?.[it.id] ?? it.issuedQty,
  }));
  await ev.save();
  res.json(ev);
});

// check-out: set returnedQty, mark completed
router.post("/:id/checkout", authMiddleware, async (req, res) => {
  const { returnedCounts } = req.body; // { itemId: qty }
  const ev = await Event.findById(req.params.id);
  if (!ev) return res.status(404).json({ error: "Not found" });

  const eventDate = ev.eventDate ? new Date(`${ev.eventDate}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (eventDate && eventDate > today) {
    return res.status(400).json({
      error: "Cannot complete checkout before the event date.",
    });
  }

  ev.inventory = ev.inventory.map((it) => ({
    ...it.toObject(),
    returnedQty: returnedCounts?.[it.id] ?? it.returnedQty ?? 0,
  }));
  ev.completed = true;
  await ev.save();
  res.json(ev);
});

module.exports = router;
