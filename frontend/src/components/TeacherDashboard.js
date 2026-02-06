import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import axios from "axios";
import { io } from "socket.io-client";
import "./TeacherDashboard.css";

const socket = io("http://localhost:5000");

export default function TeacherDashboard() {
  const [subject, setSubject] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [report, setReport] = useState([]);
  const [message, setMessage] = useState("");
  const [percentage, setPercentage] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const [pulse, setPulse] = useState(false);

  const [notifications, setNotifications] = useState([]);

  // ---------------- GENERATE QR ----------------
  const generateQR = () => {
    if (!subject) {
      alert("Enter subject first");
      return;
    }

    const data = JSON.stringify({
      subject,
      issuedAt: new Date().toISOString(),
      expiryMinutes: 5,
    });

    setQrValue(data);
    setMessage("✅ QR generated! Students can scan now.");
  };

  // ---------------- FETCH REPORT ----------------
  const fetchReport = async () => {
    const token = localStorage.getItem("token"); // ✅ FIX
    if (!token) return setMessage("⚠ Please login as a teacher first");
    if (!subject) return alert("Enter subject to fetch report");

    try {
      const res = await axios.get(
        `http://localhost:5000/api/attendance/report/${subject}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReport(res.data);

      if (res.data.length > 0) {
        const presentCount = res.data.filter(
          (r) => r.status === "Present"
        ).length;

        setPercentage(
          Math.round((presentCount / res.data.length) * 100)
        );
        setLiveCount(presentCount);
      } else {
        setPercentage(null);
        setLiveCount(0);
      }

      setMessage(`✅ Report fetched successfully for ${subject}`);
    } catch (err) {
      setMessage(
        `❌ Failed to fetch report: ${
          err.response?.data?.message || err.message
        }`
      );
      setReport([]);
      setPercentage(null);
      setLiveCount(0);
    }
  };

  // ---------------- LIVE ATTENDANCE ----------------
  useEffect(() => {
    if (!subject) return;

    socket.emit("joinSubject", subject);

    socket.on("attendanceUpdate", () => {
      setPulse(true);
      fetchReport();
      setTimeout(() => setPulse(false), 800);
    });

    return () => socket.off("attendanceUpdate");
  }, [subject]);

  // ---------------- LEAVE NOTIFICATIONS ----------------
  useEffect(() => {
    socket.on("leaveNotification", (data) => {
      setNotifications((prev) => [
        {
          id: data._id,
          type: "newLeave",
          message: `New leave request from ${data.studentName}`,
          data,
        },
        ...prev,
      ]);
    });

    socket.on("leaveStatusUpdate", (data) => {
      setNotifications((prev) => [
        {
          id: data._id,
          type: "statusUpdate",
          message: `Leave status updated: ${data.studentName} is ${data.status}`,
          data,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.off("leaveNotification");
      socket.off("leaveStatusUpdate");
    };
  }, []);

  // ---------------- HANDLE APPROVE / DENY ----------------
  const handleLeaveAction = async (id, action) => {
    try {
      const token = localStorage.getItem("token"); // ✅ FIX

      await axios.post(
        `http://localhost:5000/api/leave/${id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                type: "statusUpdate",
                message: `Leave ${action}ed for ${n.data.studentName}`,
              }
            : n
        )
      );

      socket.emit("leaveStatusChanged", { id, action });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update leave status");
    }
  };

  return (
    <div className="teacher-dashboard-container">
      <h2>Teacher Dashboard</h2>

      <input
        type="text"
        placeholder="Enter Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="input-subject"
      />

      <div className="button-group">
        <button onClick={generateQR} className="btn-generate">
          Generate QR
        </button>
        <button onClick={fetchReport} className="btn-report">
          View Report
        </button>
      </div>

      {qrValue && (
        <div className="qr-section">
          <QRCodeCanvas value={qrValue} size={250} />
          <p>Students scan this QR</p>
        </div>
      )}

      {message && <p className="message">{message}</p>}

      {subject && (
        <div className={`live-count ${pulse ? "pulse" : ""}`}>
          Live Attendance: {liveCount} ✅
        </div>
      )}

      {percentage !== null && (
        <p className="attendance-percentage">
          Attendance Percentage: {percentage}%
        </p>
      )}

      {report.length > 0 && (
        <div className="table-wrapper">
          <h3>Attendance Report for {subject}</h3>
          <table border="1">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Email</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.studentId?.name || "N/A"}</td>
                  <td>{r.studentId?.email || "N/A"}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notifications-panel">
          <h3>Notifications</h3>
          <ul>
            {notifications.map((n) => (
              <li key={n.id} className={n.type}>
                <span>{n.message}</span>
                {n.type === "newLeave" && (
                  <>
                    <button onClick={() => handleLeaveAction(n.id, "approve")}>
                      ✅ Approve
                    </button>
                    <button onClick={() => handleLeaveAction(n.id, "deny")}>
                      ❌ Deny
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}