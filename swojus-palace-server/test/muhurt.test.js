const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../app");
const Muhurt = require("../models/Muhurt");
const User = require("../models/User");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";

afterEach(() => {
  jest.restoreAllMocks();
});

function authenticateUser() {
  const userId = new mongoose.Types.ObjectId();
  jest.spyOn(User, "findById").mockReturnValue({
    select: jest.fn().mockResolvedValue({ _id: userId, roleId: 1 }),
  });
  return jwt.sign({ userId, roleId: 1 }, jwtSecret);
}

test("Muhurt create service saves and returns the selected type", async () => {
  const token = authenticateUser();
  const itemId = new mongoose.Types.ObjectId();
  const create = jest.spyOn(Muhurt, "create").mockImplementation(async (data) => ({
    _id: itemId,
    ...data,
  }));

  const response = await request(app)
    .post("/api/muhurt")
    .set("Authorization", `Bearer ${token}`)
    .send({
      date: "2026-11-20",
      description: "Sub muhurta",
      type: "Sub Muhurt",
    });

  expect(response.statusCode).toBe(201);
  expect(create).toHaveBeenCalledWith({
    date: "2026-11-20",
    description: "Sub muhurta",
    type: "Sub Muhurt",
  });
  expect(response.body.type).toBe("Sub Muhurt");
});

test("Muhurt list service includes the saved type for every record", async () => {
  const token = authenticateUser();
  const items = [
    {
      _id: new mongoose.Types.ObjectId(),
      date: "2026-11-20",
      description: "Sub muhurta",
      type: "Sub Muhurt",
    },
  ];
  jest.spyOn(Muhurt, "find").mockReturnValue({
    sort: jest.fn().mockResolvedValue(items),
  });

  const response = await request(app)
    .get("/api/muhurt")
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual([
    expect.objectContaining({
      date: "2026-11-20",
      description: "Sub muhurta",
      type: "Sub Muhurt",
    }),
  ]);
});

test("single Muhurt service includes the saved type", async () => {
  const token = authenticateUser();
  const itemId = new mongoose.Types.ObjectId();
  jest.spyOn(Muhurt, "findById").mockResolvedValue({
    _id: itemId,
    date: "2026-11-20",
    description: "Sub muhurta",
    type: "Sub Muhurt",
  });

  const response = await request(app)
    .get(`/api/muhurt/${itemId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual(
    expect.objectContaining({
      date: "2026-11-20",
      description: "Sub muhurta",
      type: "Sub Muhurt",
    }),
  );
});
