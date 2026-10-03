const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const setup = require("./setup");
const bcrypt = require("bcrypt");

test("POST /api/auth/login should authenticate seeded user", async () => {
  const password = "TestPass123";
  const hashed = await bcrypt.hash(password, 10);
  User.findOne = jest.fn().mockResolvedValue({
    _id: "abc123",
    email: "test@example.com",
    password: hashed,
    roleId: 1,
    name: "Test",
  });

  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "test@example.com", password });

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveProperty("token");
  expect(res.body.user.email).toBe("test@example.com");
  // cookie set
  expect(res.headers["set-cookie"]).toBeDefined();
});
