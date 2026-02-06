const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  subject: String,
  date: {
    type: String   // store as date string (YYYY-MM-DD)
  },
  status: {
    type: String,
    default: "Present"
  }
});

module.exports = mongoose.model("Attendance", AttendanceSchema);