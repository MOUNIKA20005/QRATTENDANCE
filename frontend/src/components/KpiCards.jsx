import { useEffect, useState } from "react";
import axios from "axios";
import "./KpiCards.css";

export default function KpiCards() {
  const [kpi, setKpi] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchKpi();
  }, []);

  const fetchKpi = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/analytics/kpi",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setKpi(res.data);
    } catch (err) {
      console.error("KPI fetch failed", err);
    }
  };

  if (!kpi) return null;

  return (
    <div className="kpi-grid">
      <div className="kpi-card blue">
        <h4>Total Students</h4>
        <p>{kpi.totalStudents}</p>
      </div>

      <div className="kpi-card purple">
        <h4>Total Teachers</h4>
        <p>{kpi.totalTeachers}</p>
      </div>

      <div className="kpi-card green">
        <h4>Total Attendance</h4>
        <p>{kpi.totalAttendance}</p>
      </div>

      <div className="kpi-card orange">
        <h4>Today Present</h4>
        <p>{kpi.todayPresent}</p>
      </div>
    </div>
  );
}
