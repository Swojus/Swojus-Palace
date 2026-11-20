const express = require("express");
const router = express.Router();
const Muhurt = require("../models/Muhurt");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

function serializeMuhurt(item) {
  const type =
    item.type === "Sub Muhurt" ? "Sub Muhurt" : "Main Muhurt";
  return {
    _id: item._id,
    date: item.date,
    description: item.description,
    type,
    createdAt: item.createdAt,
  };
}

// list muhurt (any authenticated user)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const items = await Muhurt.find().sort({ date: 1 });
    res.json(items.map(serializeMuhurt));
  } catch (err) {
    console.error("Error listing muhurt dates:", err);
    res.status(500).json({ error: "Unable to load Muhurt dates" });
  }
});

// get single muhurt by id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Muhurt.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(serializeMuhurt(item));
  } catch (err) {
    console.error("Error fetching muhurt by id:", err);
    res.status(400).json({ error: "Invalid id or bad request" });
  }
});

// create (admin only)
router.post("/", authMiddleware, requireAdmin, async (req, res) => {
  const { date, description, type } = req.body ?? {};
  if (
    typeof date !== "string" ||
    !date ||
    typeof description !== "string" ||
    !["Main Muhurt", "Sub Muhurt"].includes(type)
  ) {
    return res.status(400).json({
      error: "Date, description, and a valid Muhurt type are required",
    });
  }

  try {
    const created = await Muhurt.create({ date, description, type });
    res.status(201).json(serializeMuhurt(created));
  } catch (err) {
    console.error("Error creating muhurt date:", err);
    res.status(500).json({ error: "Unable to save Muhurt date" });
  }
});

// delete (admin only)
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  await Muhurt.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
