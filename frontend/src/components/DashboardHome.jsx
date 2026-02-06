import React from "react";

export default function DashboardHome({ users, attendance, liveStats }) {
  return (
    <div>
      <h2 style={{ marginBottom: "24px" }}>Dashboard Overview</h2>

      {/* KPI GRID */}
      <div className="kpi-grid">
        <div className="kpi-card blue">
          <h4>Total Users</h4>
          <p>{users.length}</p>
        </div>

        <div className="kpi-card green">
          <h4>Attendance Records</h4>
          <p>{attendance.length}</p>
        </div>

        <div className="kpi-card orange">
          <h4>Live Attendance</h4>
          <p>{liveStats.length}</p>
        </div>
      </div>
    </div>
  );
}