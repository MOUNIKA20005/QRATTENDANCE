console.log("🔥 REPORT ROUTE FILE LOADED");

const express = require("express");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");
const { Parser } = require("json2csv");

const router = express.Router();

// TEST ROUTE (VERY IMPORTANT)
router.get("/ping", (req, res) => {
  res.json({ message: "Report route is alive" });
});

// FETCH REPORT
router.get("/", auth, async (req, res) => {
  try {
    const { subject, from, to } = req.query;

    const filter = {};
    if (subject) filter.subject = subject;
    if (from && to) {
      filter.date = {
        $gte: new Date(from + "T00:00:00.000Z"),
        $lte: new Date(to + "T23:59:59.999Z")
      };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Report fetch failed" });
  }
});

// EXPORT CSV
router.get("/export", auth, async (req, res) => {
  try {
    const records = await Attendance.find().populate("studentId", "name email");

    const parser = new Parser();
    const csv = parser.parse(records.map(r => ({
      Name: r.studentId?.name || "N/A",
      Email: r.studentId?.email || "N/A",
      Subject: r.subject,
      Date: r.date,
      Status: r.status
    })));

    res.header("Content-Type", "text/csv");
    res.attachment("attendance-report.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "CSV export failed" });
  }
});

module.exports = router;   // ← NORMAL ASCII SPACE
