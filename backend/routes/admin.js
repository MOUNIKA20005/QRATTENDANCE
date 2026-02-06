const express = require("express");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= ADMIN CHECK MIDDLEWARE ================= */
const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/* ================= VIEW ALL USERS ================= */
router.get("/users", auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "name email role createdAt");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= DELETE USER ================= */
router.delete("/users/:id", auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= VIEW ALL ATTENDANCE ================= */
router.get("/attendance", auth, isAdmin, async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("studentId", "name email")
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LIVE STATS ================= */
router.get("/live", auth, isAdmin, async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await Attendance.aggregate([
      { $match: { status: "Present", date: { $gte: start, $lte: end } } },
      { $group: { _id: "$subject", count: { $sum: 1 } } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
