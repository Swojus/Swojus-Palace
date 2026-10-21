const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

function getConversionUpdates(data) {
  return {
    title: data.title,
    customerName: data.customerName,
    phone: data.phone,
    altPhone: data.altPhone,
    venue: data.venue,
    rooms: data.rooms,
    eventDate: data.eventDate,
    eventTime: data.eventTime,
    eventType: data.eventType,
    eventSource: "Booking",
    inventory: data.inventory,
  };
}

async function convertEnquiry(id, data) {
  return Event.findOneAndUpdate(
    { _id: id, eventSource: "Enquiry" },
    { $set: getConversionUpdates(data) },
    { new: true, runValidators: true },
  );
}

async function notifyAdminOfConversion(user, event) {
  if (user.roleId !== 1) {
    await Notification.create({
      action: "converted",
      eventName: event.customerName || event.title || "New event",
      eventDate: event.eventDate,
      actorName: user.name || user.email || "Manager",
    });
  }
}

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

  if (req.user.roleId !== 1) {
    await Notification.create({
      action: "created",
      eventName: created.customerName || created.title || "New event",
      eventDate: created.eventDate,
      actorName:
        req.userDoc?.name || req.userDoc?.email || "Manager",
    });
  }

  res.status(201).json(created);
});

router.post("/:id/convert", authMiddleware, async (req, res) => {
  const converted = await convertEnquiry(req.params.id, req.body);

  if (!converted) {
    return res.status(404).json({ error: "Enquiry not found or converted" });
  }

  await notifyAdminOfConversion(req.userDoc, converted);
  res.json(converted);
});

// Managers can only use the legacy update route to convert enquiries.
router.put("/:id", authMiddleware, async (req, res) => {
  if (req.user.roleId === 1) {
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (updated) {
      await Notification.create({
        action: "updated",
        eventName: updated.customerName || updated.title || "Event",
        eventDate: updated.eventDate,
        actorName:
          req.userDoc?.name || req.userDoc?.email || "Admin",
      });
    }

    return res.json(updated);
  }

  if (req.user.roleId !== 2 || req.body.eventSource !== "Booking") {
    return res.status(403).json({ error: "Admin required" });
  }

  const converted = await convertEnquiry(req.params.id, req.body);
  if (!converted) {
    return res.status(404).json({ error: "Enquiry not found or converted" });
  }

  await notifyAdminOfConversion(req.userDoc, converted);
  res.json(converted);
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
