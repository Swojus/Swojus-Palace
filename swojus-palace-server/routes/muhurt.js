const express = require("express");
const router = express.Router();
const Muhurt = require("../models/Muhurt");
const { authMiddleware, requireAdmin } = require("../middleware/auth");

// list muhurt (any authenticated user)
router.get("/", authMiddleware, async (req, res) => {
  const items = await Muhurt.find().sort({ date: 1 });
  res.json(items);
});

// get single muhurt by id
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const item = await Muhurt.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("Error fetching muhurt by id:", err);
    res.status(400).json({ error: "Invalid id or bad request" });
  }
});

// create (admin only)
router.post("/", authMiddleware, requireAdmin, async (req, res) => {
  const created = await Muhurt.create(req.body);
  res.status(201).json(created);
});

// delete (admin only)
router.delete("/:id", authMiddleware, requireAdmin, async (req, res) => {
  await Muhurt.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
