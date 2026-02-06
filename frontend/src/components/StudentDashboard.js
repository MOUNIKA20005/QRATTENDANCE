import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import axios from "axios";
import { io } from "socket.io-client";
import "./StudentDashboard.css";

const socket = io("http://localhost:5000");

const StudentDashboard = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningRef = useRef(true);

  const [message, setMessage] = useState("Scanning QR…");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [showRecords, setShowRecords] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // 🔹 NEW (ONLY WHAT IS NEEDED)
  const [student, setStudent] = useState(null);

  useEffect(() => {
    startCamera();
    loadStudentProfile();
    return stopCamera;
  }, []);

  const loadStudentProfile = () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const decoded = JSON.parse(atob(token.split(".")[1]));
    setStudent(decoded);
  };

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
    if (Date.now() > issuedAtMs + parsed.expiryMinutes * 60000)
      return resetScanner("❌ QR expired");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/attendance/mark",
        parsed,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message}`);
    } catch (err) {
      resetScanner(err.response?.data?.message || "❌ Attendance failed");
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

  useEffect(() => {
    socket.on("leaveStatusUpdate", (data) => {
      if (student && data.studentId === student._id) {
        alert(`Leave status updated: ${data.status}`);
      }
    });
    return () => socket.off("leaveStatusUpdate");
  }, [student]);

  const submitLeaveRequest = async () => {
    const token = localStorage.getItem("token");
    if (!leaveDate || !leaveReason) return alert("⚠ Fill all fields");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/leave/request",
        { date: leaveDate, reason: leaveReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message);
      setLeaveDate("");
      setLeaveReason("");
    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="student-dashboard-layout">

      {/* LEFT DASHBOARD (UNCHANGED CONTENT) */}
      <div className="student-dashboard-container">
        <h2>Student Dashboard</h2>
        <p className="scan-message">{message}</p>

        <video ref={videoRef} autoPlay muted playsInline className="video-feed" />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="action-buttons">
          <button onClick={fetchRecords}>📋 Attendance Records</button>
          <button onClick={fetchSummary}>📊 Attendance Percentage</button>
        </div>

        {showRecords && (
          <div className="table-wrapper">
            <h3>Attendance Records</h3>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i}>
                    <td>{r.subject}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showSummary && (
          <div className="progress-section">
            {summary.map((s, i) => (
              <div className="progress-card" key={i}>
                <div className="progress-header">
                  <span>{s.subject}</span>
                  <span>{s.percentage}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="leave-section">
          <h3>Submit Leave Request</h3>
          <input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} />
          <input
            type="text"
            placeholder="Reason"
            value={leaveReason}
            onChange={e => setLeaveReason(e.target.value)}
          />
          <button onClick={submitLeaveRequest}>Submit</button>
        </div>
      </div>

      {/* RIGHT PROFILE (ONLY ADDITION) */}
      {student && (
        <div className="student-profile-card">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="profile"
            className="profile-avatar"
          />
          <h3>{student.name || "Student"}</h3>
          <p>{student.email}</p>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>
      )}

    </div>
  );
};

export default StudentDashboard;