const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../app");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const User = require("../models/User");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";

afterEach(() => {
  jest.restoreAllMocks();
});

test("manager event submissions create an admin notification", async () => {
  const userId = new mongoose.Types.ObjectId();
  const event = {
    _id: new mongoose.Types.ObjectId(),
    customerName: "Test Customer",
    eventDate: "2026-11-01",
  };
  const user = { _id: userId, name: "Test Manager" };

  jest.spyOn(User, "findById").mockReturnValue({
    select: jest.fn().mockResolvedValue(user),
  });
  jest.spyOn(Event, "create").mockResolvedValue(event);
  const createNotification = jest
    .spyOn(Notification, "create")
    .mockResolvedValue({});
  const token = jwt.sign({ userId, roleId: 2 }, jwtSecret);

  const response = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .send({ customerName: event.customerName, eventDate: event.eventDate });

  expect(response.statusCode).toBe(201);
  expect(createNotification).toHaveBeenCalledWith({
    action: "created",
    eventName: event.customerName,
    eventDate: event.eventDate,
    actorName: user.name,
  });
});

test("admin event submissions do not create manager notifications", async () => {
  const userId = new mongoose.Types.ObjectId();
  jest.spyOn(User, "findById").mockReturnValue({
    select: jest
      .fn()
      .mockResolvedValue({ _id: userId, roleId: 1, name: "Test Admin" }),
  });
  jest.spyOn(Event, "create").mockResolvedValue({
    _id: new mongoose.Types.ObjectId(),
    title: "Admin event",
  });
  const createNotification = jest
    .spyOn(Notification, "create")
    .mockResolvedValue({});
  const token = jwt.sign({ userId, roleId: 1 }, jwtSecret);

  const response = await request(app)
    .post("/api/events")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Admin event" });

  expect(response.statusCode).toBe(201);
  expect(createNotification).not.toHaveBeenCalled();
});

test("admin event updates create a shared notification with the actor name", async () => {
  const userId = new mongoose.Types.ObjectId();
  const eventId = new mongoose.Types.ObjectId();
  const updated = {
    _id: eventId,
    customerName: "Updated Customer",
    eventDate: "2026-11-01",
  };

  jest.spyOn(User, "findById").mockReturnValue({
    select: jest
      .fn()
      .mockResolvedValue({ _id: userId, roleId: 1, name: "Test Admin" }),
  });
  jest.spyOn(Event, "findByIdAndUpdate").mockResolvedValue(updated);
  const createNotification = jest
    .spyOn(Notification, "create")
    .mockResolvedValue({});
  const token = jwt.sign({ userId, roleId: 1 }, jwtSecret);

  const response = await request(app)
    .put(`/api/events/${eventId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ customerName: updated.customerName });

  expect(response.statusCode).toBe(200);
  expect(createNotification).toHaveBeenCalledWith({
    action: "updated",
    eventName: updated.customerName,
    eventDate: updated.eventDate,
    actorName: "Test Admin",
  });
});

test("manager enquiry conversions create an admin notification", async () => {
  const userId = new mongoose.Types.ObjectId();
  const enquiryId = new mongoose.Types.ObjectId();
  const converted = {
    _id: enquiryId,
    eventSource: "Booking",
    customerName: "Converted Customer",
    eventDate: "2026-11-01",
  };

  jest.spyOn(User, "findById").mockReturnValue({
    select: jest
      .fn()
      .mockResolvedValue({ _id: userId, roleId: 2, name: "Test Manager" }),
  });
  const updateEvent = jest
    .spyOn(Event, "findOneAndUpdate")
    .mockResolvedValue(converted);
  const createNotification = jest
    .spyOn(Notification, "create")
    .mockResolvedValue({});
  const token = jwt.sign({ userId, roleId: 2 }, jwtSecret);

  const response = await request(app)
    .post(`/api/events/${enquiryId}/convert`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      customerName: converted.customerName,
      eventDate: converted.eventDate,
      eventSource: "Booking",
    });

  expect(response.statusCode).toBe(200);
  expect(updateEvent).toHaveBeenCalledWith(
    { _id: enquiryId.toString(), eventSource: "Enquiry" },
    expect.objectContaining({
      $set: expect.objectContaining({ eventSource: "Booking" }),
    }),
    { new: true, runValidators: true },
  );
  expect(createNotification).toHaveBeenCalledWith({
    action: "converted",
    eventName: converted.customerName,
    eventDate: converted.eventDate,
    actorName: "Test Manager",
  });
});

test("manager legacy updates can only convert an enquiry", async () => {
  const userId = new mongoose.Types.ObjectId();
  const enquiryId = new mongoose.Types.ObjectId();

  jest.spyOn(User, "findById").mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: userId }),
  });
  const updateEvent = jest
    .spyOn(Event, "findOneAndUpdate")
    .mockResolvedValue(null);
  const createNotification = jest
    .spyOn(Notification, "create")
    .mockResolvedValue({});
  const token = jwt.sign({ userId, roleId: 2 }, jwtSecret);

  const response = await request(app)
    .put(`/api/events/${enquiryId}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ eventSource: "Enquiry", title: "Updated enquiry" });

  expect(response.statusCode).toBe(403);
  expect(updateEvent).not.toHaveBeenCalled();
  expect(createNotification).not.toHaveBeenCalled();
});
