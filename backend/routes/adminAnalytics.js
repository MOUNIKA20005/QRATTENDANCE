const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const auth = require("../middleware/auth"); // ✅ add auth

router.get("/kpi", auth, async (req, res) => {
  try {
    // TOTAL STUDENTS
    const totalStudents = await User.countDocuments({ role: "student" });

    // ✅ FIX DATE RANGE (start & end of today)
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // ✅ FIX STATUS CASE
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
      status: "Present",
    });

    const totalToday = await Attendance.countDocuments({
      date: { $gte: start, $lte: end },
    });

    const attendancePercent = totalToday
      ? Math.round((todayAttendance / totalToday) * 100)
      : 0;

    // ✅ FIX STATUS CASE
    const subjectWise = await Attendance.aggregate([
      { $match: { status: "Absent" } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    res.json({
      totalStudents,
      todayAttendance,
      attendancePercent,
      mostAbsentSubject: subjectWise[0]?._id || "N/A",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "KPI fetch failed" });
  }
});

module.exports = router;