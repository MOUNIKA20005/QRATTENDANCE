import React from "react";

export default function Sidebar({ active, setActive }) {
  return (
    <div className="sidebar">
      <button onClick={() => setActive("dashboard")}>
        Dashboard
      </button>

      <button onClick={() => setActive("students")}>
        Students
      </button>

      <button onClick={() => setActive("teachers")}>
        Teachers
      </button>
      <button onClick={() => setActive("analytics")}>
        Analytics
      </button>
    </div>
  );
}