const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

/* ===================== MIDDLEWARE ===================== */
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

/* ===================== ROUTES ===================== */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/test", require("./routes/test"));
app.use("/api/qr", require("./routes/qr"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/report", require("./routes/report")); 
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/leave", require("./routes/leave"));

/* ===================== TEST ROOT ===================== */
app.get("/", (req, res) => res.send("QR Attendance Backend Running"));
app.get("/test-report", (req, res) => res.send("REPORT TEST OK"));

/* ===================== DATABASE ===================== */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });

/* ===================== SERVER + SOCKET ===================== */
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make socket accessible inside routes
app.set("io", io);

/* ===================== SOCKET EVENTS ===================== */
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  socket.on("joinSubject", (subject) => {
    socket.join(subject);
    console.log(`📌 ${socket.id} joined subject: ${subject}`);
  });

  // Join personal room for reminders/notifications
  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`📌 ${socket.id} joined personal room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

/* ===================== GLOBAL ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

/* ===================== START SERVER ===================== */
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

module.exports = { app, io }; // export io for routes if needed
