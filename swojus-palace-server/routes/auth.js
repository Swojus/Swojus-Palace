const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";
const ACCESS_EXPIRES = process.env.ACCESS_EXPIRES || "8h";
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || "7", 10);

function makeAccessToken(user) {
  return jwt.sign({ userId: user._id, roleId: user.roleId }, jwtSecret, {
    expiresIn: ACCESS_EXPIRES,
  });
}

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  const identifier = String(email).trim();
  const normalizedPhone = identifier.replace(/\D/g, "").slice(0, 10);
  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { phone: normalizedPhone }],
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  // Support legacy documents that may store the hash in `passwordHash`
  const storedHash = user.password || user.passwordHash;
  if (!storedHash)
    return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, storedHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const isApproved = user.roleId === 1 || user.isApproved === true;
  if (!isApproved) {
    return res.status(403).json({ error: "Required admin approval" });
  }

  const token = makeAccessToken(user);

  // create refresh token and persist
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  );
  await RefreshToken.create({
    token: refreshToken,
    userId: user._id,
    expiresAt,
  });

  // set httpOnly cookie (will be ignored by non-browser clients)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });

  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      isApproved: user.isApproved !== false,
      name: user.name,
    },
  });
});

// register
router.post("/register", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email || !password || !name)
    return res.status(400).json({ error: "Missing fields" });

  const normalizedPhone = (phone || "").replace(/\D/g, "").slice(0, 10);
  if (!/^\d{10}$/.test(normalizedPhone)) {
    return res
      .status(400)
      .json({ error: "Phone number must be exactly 10 digits." });
  }

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(409).json({ error: "Email already registered" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone: normalizedPhone,
      password: hashed,
      roleId: 2,
      isApproved: false,
    });

    const token = makeAccessToken(user);

    // create refresh token and persist
    const refreshToken = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await RefreshToken.create({
      token: refreshToken,
      userId: user._id,
      expiresAt,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        roleId: user.roleId,
        isApproved: user.isApproved !== false,
        name: user.name,
      },
    });
  } catch (e) {
    console.error("Registration error:", e);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/refresh", async (req, res) => {
  const cookie = req.cookies && req.cookies.refreshToken;
  if (!cookie) return res.status(401).json({ error: "No refresh token" });
  const found = await RefreshToken.findOne({ token: cookie });
  if (!found) return res.status(401).json({ error: "Invalid refresh token" });
  if (found.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: found._id });
    return res.status(401).json({ error: "Refresh token expired" });
  }
  const user = await User.findById(found.userId);
  if (!user) return res.status(401).json({ error: "User not found" });
  const token = makeAccessToken(user);
  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      roleId: user.roleId,
      isApproved: user.isApproved !== false,
      name: user.name,
    },
  });
});

router.post("/logout", async (req, res) => {
  const cookie = req.cookies && req.cookies.refreshToken;
  if (cookie) {
    await RefreshToken.deleteOne({ token: cookie }).catch(() => {});
  }
  res.clearCookie("refreshToken");
  res.json({ ok: true });
});

// me
router.get("/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const decoded = require("jsonwebtoken").verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: user._id,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      isApproved: user.isApproved !== false,
      name: user.name,
    });
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
