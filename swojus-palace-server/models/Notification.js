const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ["created", "updated", "converted", "checkin", "checkout"],
    required: true,
  },
  eventName: { type: String, required: true },
  eventDate: String,
  actorName: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", NotificationSchema);
