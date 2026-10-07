const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const setup = require("./setup");
const bcrypt = require("bcrypt");

test("POST /api/auth/login should authenticate seeded user", async () => {
  const password = "TestPass123";
  const hashed = await bcrypt.hash(password, 10);
  User.findOne = jest.fn().mockResolvedValue({
    _id: new mongoose.Types.ObjectId(),
    email: "test@example.com",
    password: hashed,
    roleId: 1,
    isApproved: true,
    name: "Test",
  });
  RefreshToken.create = jest.fn().mockResolvedValue({});

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com", password });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("token");
  expect(res.body.user.email).toBe("test@example.com");
  // cookie set
  expect(res.headers["set-cookie"]).toBeDefined();
});

test("POST /api/auth/login should reject unapproved users with admin approval message", async () => {
  const password = "TestPass123";
  const hashed = await bcrypt.hash(password, 10);
  User.findOne = jest.fn().mockResolvedValue({
    _id: new mongoose.Types.ObjectId(),
    email: "pending@example.com",
    password: hashed,
    roleId: 2,
    isApproved: false,
    name: "Pending",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "pending@example.com", password });

  expect(res.statusCode).toBe(403);
  expect(res.body.error).toBe("Required admin approval");
});

test("POST /api/auth/login should authenticate a user by phone number", async () => {
  const password = "Yuvraj@123";
  const hashed = await bcrypt.hash(password, 10);
  const phone = "8485834013";
  User.findOne = jest.fn().mockImplementation(async (query) => {
    const entries = query && query.$or ? query.$or : [];
    const matched = entries.some((entry) => {
      if (entry.email === "yuvraj@example.com") return true;
      if (entry.email === phone) return true;
      if (entry.phone === phone) return true;
      return false;
    });
    if (matched) {
      return {
        _id: new mongoose.Types.ObjectId(),
        email: "yuvraj@example.com",
        phone,
        password: hashed,
        roleId: 2,
        isApproved: true,
        name: "Yuvraj",
      };
    }
    return null;
  });
  RefreshToken.create = jest.fn().mockResolvedValue({});

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: phone, password });

  expect(User.findOne).toHaveBeenCalledWith(
    expect.objectContaining({
      $or: expect.arrayContaining([
        expect.objectContaining({ email: phone }),
        expect.objectContaining({ phone: phone }),
      ]),
    }),
  );
  expect(res.statusCode).toBe(200);
  expect(res.body.user.phone).toBe(phone);
  expect(res.body.user.email).toBe("yuvraj@example.com");
});
