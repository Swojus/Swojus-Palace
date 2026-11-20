const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../app");
const Event = require("../models/Event");
const User = require("../models/User");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";

afterEach(() => {
  jest.restoreAllMocks();
});

function authenticateManager() {
  const userId = new mongoose.Types.ObjectId();
  jest.spyOn(User, "findById").mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: userId }),
  });
  return jwt.sign({ userId, roleId: 2 }, jwtSecret);
}

test("check-in adds the mattress inventory item to existing events", async () => {
  const eventId = new mongoose.Types.ObjectId();
  const event = {
    _id: eventId,
    inventory: [],
    save: jest.fn().mockResolvedValue(),
  };
  jest.spyOn(Event, "findById").mockResolvedValue(event);

  const response = await request(app)
    .post(`/api/events/${eventId}/checkin`)
    .set("Authorization", `Bearer ${authenticateManager()}`)
    .send({ issuedCounts: { mattress: 2 } });

  expect(response.statusCode).toBe(200);
  expect(response.body.inventory).toContainEqual(
    expect.objectContaining({
      id: "mattress",
      name: "Mattress",
      issuedQty: 2,
    }),
  );
  expect(event.save).toHaveBeenCalled();
});

test("check-out adds the mattress inventory item to legacy events", async () => {
  const eventId = new mongoose.Types.ObjectId();
  const event = {
    _id: eventId,
    eventDate: "2020-01-01",
    inventory: [],
    save: jest.fn().mockResolvedValue(),
  };
  jest.spyOn(Event, "findById").mockResolvedValue(event);

  const response = await request(app)
    .post(`/api/events/${eventId}/checkout`)
    .set("Authorization", `Bearer ${authenticateManager()}`)
    .send({ returnedCounts: { mattress: 1 } });

  expect(response.statusCode).toBe(200);
  expect(response.body.inventory).toContainEqual(
    expect.objectContaining({
      id: "mattress",
      name: "Mattress",
      returnedQty: 1,
    }),
  );
  expect(event.save).toHaveBeenCalled();
});
