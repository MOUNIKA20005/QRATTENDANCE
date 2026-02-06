import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import Students from "./Students";
import Teachers from "./Teachers";
import Analytics from "./Analytics";
import "./AdminDashboard.css";

const socket = io("http://localhost:5000");

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [liveStats, setLiveStats] = useState([]);
  const [active, setActive] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState([]); // For alerts

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchAttendance();
    fetchLiveStats();

    // LISTEN FOR LIVE UPDATES
    socket.on("attendanceUpdate", (data) => {
      fetchAttendance();
      fetchLiveStats();
    });

    // LISTEN FOR NOTIFICATIONS
    socket.on("notification", (data) => {
      setNotifications((prev) => [
        { ...data, id: Date.now() },
        ...prev.slice(0, 4), // Keep max 5 notifications
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== data.id));
      }, 5000);
    });

    return () => {
      socket.off("attendanceUpdate");
      socket.off("notification");
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch {
      setMessage("Failed to fetch users");
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendance(res.data);
    } catch {
      setMessage("Failed to fetch attendance");
    }
  };

  const fetchLiveStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/live", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiveStats(res.data);
    } catch {
      setMessage("Failed to fetch live stats");
    }
  };

  return (
    <div className="admin-layout">
      <Sidebar active={active} setActive={setActive} />

      <div className="admin-content">
        <h1>Admin Dashboard</h1>
        {message && <p className="message">{message}</p>}

        {/* NOTIFICATIONS PANEL */}
        <div className="notifications-panel">
          {notifications.map((n) => (
            <div key={n.id} className="notification-card">
              {n.studentName || n.studentId} marked {n.status} for {n.subject}
            </div>
          ))}
        </div>

        {active === "dashboard" && (
          <DashboardHome
            users={users}
            attendance={attendance}
            liveStats={liveStats}
          />
        )}
        {active === "students" && <Students users={users} />}
        {active === "teachers" && <Teachers users={users} />}
        {active === "analytics" && <Analytics users={users} />}
      </div>
    </div>
  );
}
