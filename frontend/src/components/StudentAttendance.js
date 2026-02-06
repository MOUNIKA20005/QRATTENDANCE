import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import axios from "axios";
import { io } from "socket.io-client";
import "./StudentDashboard.css";

const socket = io("http://localhost:5000");

const StudentDashboard = ({ user }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningRef = useRef(true);

  const [message, setMessage] = useState("Scanning QR…");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [notifications, setNotifications] = useState([]);

  /* ===================== LEAVE STATE (ADDED) ===================== */
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveMessage, setLeaveMessage] = useState("");
  const [myLeaves, setMyLeaves] = useState([]);

  useEffect(() => {
    startCamera();

    if (user?._id) socket.emit("joinRoom", user._id);

    socket.on("attendanceReminder", (data) => {
      setNotifications(prev => [
        { ...data, id: Date.now() },
        ...prev.slice(0, 4)
      ]);
    });

    return () => {
      stopCamera();
      socket.off("attendanceReminder");
    };
  }, [user]);

  const startCamera = async () => {
    try {
      scanningRef.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => requestAnimationFrame(scanQR);
    } catch {
      setMessage("❌ Camera permission denied");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
  };

  const scanQR = () => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        scanningRef.current = false;
        stopCamera();
        markAttendance(code.data);
        return;
      }
    }
    requestAnimationFrame(scanQR);
  };

  const markAttendance = async (qrData) => {
    let parsed;
    try {
      parsed = JSON.parse(qrData);
    } catch {
      return resetScanner("❌ Invalid QR format");
    }

    if (!parsed.subject || !parsed.issuedAt || typeof parsed.expiryMinutes !== "number") {
      return resetScanner("❌ Invalid QR data");
    }

    const issuedAtMs = new Date(parsed.issuedAt).getTime();
    const expiryMs = parsed.expiryMinutes * 60 * 1000;
    if (Date.now() > issuedAtMs + expiryMs) return resetScanner("❌ QR expired");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        parsed,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      resetScanner("❌ Attendance failed");
    }
  };

  const resetScanner = (msg) => {
    setMessage(msg);
    scanningRef.current = true;
    startCamera();
  };

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/attendance/my", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setRecords(res.data);
    setShowRecords(true);
    setShowSummary(false);
  };

  const fetchSummary = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get("http://localhost:5000/api/attendance/my/summary", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSummary(res.data);
    setShowSummary(true);
    setShowRecords(false);
  };

  /* ===================== LEAVE FUNCTIONS (ADDED) ===================== */

  const submitLeaveRequest = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setLeaveMessage("❌ Login required");
    if (!leaveDate || !leaveReason)
      return setLeaveMessage("❌ Date and reason required");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/leave/request",
        { date: leaveDate, reason: leaveReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveMessage("✅ Leave submitted");
      setLeaveDate("");
      setLeaveReason("");
      fetchMyLeaves();
    } catch (err) {
      setLeaveMessage("❌ Submission failed");
    }
  };

  const fetchMyLeaves = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        "http://localhost:5000/api/leave/my",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMyLeaves(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  return (
    <div className="student-dashboard-container">
      <h2>Student Dashboard</h2>
      <p className="scan-message">{message}</p>

      <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="action-buttons">
        <button onClick={fetchRecords}>📋 Attendance Records</button>
        <button onClick={fetchSummary}>📊 Attendance Percentage</button>
      </div>

      {/* ===================== LEAVE UI (ADDED) ===================== */}
      <div className="leave-section">
        <h3>Leave Request</h3>

        <input
          type="date"
          value={leaveDate}
          onChange={(e) => setLeaveDate(e.target.value)}
        />

        <input
          type="text"
          placeholder="Reason"
          value={leaveReason}
          onChange={(e) => setLeaveReason(e.target.value)}
        />

        <button onClick={submitLeaveRequest}>Submit Leave</button>
        {leaveMessage && <p>{leaveMessage}</p>}

        <h4>My Leave Requests</h4>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {myLeaves.map((l) => (
              <tr key={l._id}>
                <td>{new Date(l.date).toLocaleDateString()}</td>
                <td>{l.reason}</td>
                <td>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
