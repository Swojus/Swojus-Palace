const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../app");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";

afterEach(() => {
  jest.restoreAllMocks();
});

function authenticate(roleId) {
  const adminId = new mongoose.Types.ObjectId();
  jest.spyOn(User, "findById").mockImplementation((id) => {
    if (String(id) === String(adminId)) {
      return {
        select: jest
          .fn()
          .mockResolvedValue({ _id: adminId, roleId, email: "admin@example.com" }),
      };
    }
    return Promise.resolve(null);
  });
  return {
    adminId,
    token: jwt.sign({ userId: adminId, roleId }, jwtSecret),
  };
}

test("admin can delete a manager and their refresh tokens", async () => {
  const { token } = authenticate(1);
  const targetId = new mongoose.Types.ObjectId();
  const target = { _id: targetId, roleId: 2, email: "manager@example.com" };
  jest.spyOn(User, "findById").mockImplementation((id) =>
    String(id) === targetId.toString()
      ? Promise.resolve(target)
      : {
          select: jest
            .fn()
            .mockResolvedValue({ _id: new mongoose.Types.ObjectId(), roleId: 1 }),
        },
  );
  const deleteTokens = jest
    .spyOn(RefreshToken, "deleteMany")
    .mockResolvedValue({ deletedCount: 1 });
  const deleteUser = jest
    .spyOn(User, "findByIdAndDelete")
    .mockResolvedValue(target);

  const response = await request(app)
    .delete(`/api/users/${targetId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body).toEqual({ ok: true });
  expect(deleteTokens).toHaveBeenCalledWith({ userId: targetId });
  expect(deleteUser).toHaveBeenCalledWith(targetId);
});

test("manager cannot delete a user", async () => {
  const { token } = authenticate(2);
  const deleteTokens = jest.spyOn(RefreshToken, "deleteMany");
  const response = await request(app)
    .delete(`/api/users/${new mongoose.Types.ObjectId()}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(403);
  expect(deleteTokens).not.toHaveBeenCalled();
});

test("admin cannot delete another admin account", async () => {
  const adminId = new mongoose.Types.ObjectId();
  const targetId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ userId: adminId, roleId: 1 }, jwtSecret);
  jest.spyOn(User, "findById").mockImplementation((id) => {
    if (String(id) === adminId.toString()) {
      return {
        select: jest
          .fn()
          .mockResolvedValue({ _id: adminId, roleId: 1, email: "admin@example.com" }),
      };
    }
    return Promise.resolve({ _id: targetId, roleId: 1 });
  });
  const deleteUser = jest.spyOn(User, "findByIdAndDelete");

  const response = await request(app)
    .delete(`/api/users/${targetId}`)
    .set("Authorization", `Bearer ${token}`);

  expect(response.statusCode).toBe(403);
  expect(deleteUser).not.toHaveBeenCalled();
});
