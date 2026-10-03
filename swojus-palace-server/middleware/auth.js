const jwt = require("jsonwebtoken");
const User = require("../models/User");

const jwtSecret =
  process.env.JWT_SECRET || "change_this_super_secret_or_set_in_env";

async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Unauthorized" });
  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    // optionally fetch user
    req.userDoc = await User.findById(decoded.userId).select("-password");
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireAdmin(req, res, next) {
  const roleId = req.user?.roleId;
  if (roleId !== 1) return res.status(403).json({ error: "Admin required" });
  next();
}

module.exports = { authMiddleware, requireAdmin };
