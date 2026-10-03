const mongoose = require("mongoose");

const InventoryItem = new mongoose.Schema({
  id: String,
  name: String,
  issuedQty: { type: Number, default: 0 },
  returnedQty: { type: Number, default: 0 },
});

const EventSchema = new mongoose.Schema({
  title: String,
  customerName: String,
  phone: String,
  altPhone: String,
  venue: String,
  rooms: [String],
  eventDate: String,
  eventTime: String,
  eventType: String,
  inventory: [InventoryItem],
  eventSource: {
    type: String,
    enum: ["Booking", "Enquiry"],
    default: "Booking",
  },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);
