const express = require("express");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");

const router = express.Router();

/* ================= STUDENT: MARK ATTENDANCE ================= */
router.post("/mark", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can mark attendance" });
    }

    const { subject, issuedAt, expiryMinutes } = req.body;

    if (!subject || !issuedAt || !expiryMinutes) {
      return res.status(400).json({ message: "Invalid QR data" });
    }

    const issuedTime = new Date(issuedAt).getTime();
    if (isNaN(issuedTime)) {
      return res.status(400).json({ message: "Invalid QR timestamp" });
    }

    const diffMinutes = (Date.now() - issuedTime) / (1000 * 60);
    if (diffMinutes > expiryMinutes) {
      return res.status(400).json({ message: "QR code expired" });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const alreadyMarked = await Attendance.findOne({
      studentId: req.user._id, // Consistent with middleware
      subject,
      date: { $gte: start, $lte: end }
    });

    if (alreadyMarked) {
      return res.json({ message: "Attendance already marked for today" });
    }

    // Create the record
    const newRecord = await Attendance.create({
      studentId: req.user._id,
      subject,
      date: new Date(),
      status: "Present"
    });

    // POPULATE before emitting so Teacher sees the name!
    const populated = await newRecord.populate("studentId", "name");

    const io = req.app.get("io");

    // FIX: Emit to everyone (simpler for your demo) 
    // This ensures the teacher dashboard catches it
    io.emit("attendanceUpdate", {
      studentName: populated.studentId.name,
      subject: populated.subject,
      status: "Present",
      time: new Date().toLocaleTimeString()
    });

    res.json({ message: "Attendance marked successfully" });

  } catch (err) {
    console.error("❌ Mark attendance error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STUDENT: VIEW OWN ATTENDANCE ================= */
router.get("/my", auth, async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id }).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= STUDENT: SUMMARY ================= */
router.get("/my/summary", auth, async (req, res) => {
  try {
    // Check if req.user exists (Debug for your 401/404 issues)
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const records = await Attendance.find({ studentId: req.user._id });

    const summary = {};
    records.forEach(r => {
      if (!summary[r.subject]) summary[r.subject] = { total: 0, present: 0 };
      summary[r.subject].total++;
      if (r.status === "Present") summary[r.subject].present++;
    });

    const result = Object.keys(summary).map(subject => ({
      subject,
      percentage: Math.round(
        (summary[subject].present / summary[subject].total) * 100
      )
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= TEACHER: SUBJECT REPORT ================= */
router.get("/report/:subject", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can view reports" });
    }

    const records = await Attendance
      .find({ subject: req.params.subject })
      .populate("studentId", "name email");

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= TEACHER: LIVE COUNT ================= */
router.get("/live", auth, async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const data = await Attendance.aggregate([
      { $match: { status: "Present", date: { $gte: start, $lte: end } } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;