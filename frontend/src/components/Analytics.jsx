import axios from "axios";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import KpiCards from "./KpiCards";
import Heatmap from "./Heatmap";

export default function Analytics() {
  const token = localStorage.getItem("token");

  // FILTERS
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // DATA
  const [subjectData, setSubjectData] = useState([]);
  const [dailyData, setDailyData] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  // FETCH ANALYTICS
  const fetchAnalytics = async (filters = {}) => {
    try {
      const subjectRes = await axios.get(
        "http://localhost:5000/api/analytics/subject-wise",
        { headers, params: filters }
      );

      const dailyRes = await axios.get(
        "http://localhost:5000/api/analytics/daily",
        { headers, params: filters }
      );

      setSubjectData(subjectRes.data || []);
      setDailyData(dailyRes.data || []);
    } catch (err) {
      console.error("Analytics fetch failed", err);
    }
  };

  // APPLY BUTTON HANDLER (THIS IS THE FIX)
  const handleApply = () => {
    const filters = {};
    if (subject.trim()) filters.subject = subject;
    if (from) filters.from = from;
    if (to) filters.to = to;

    fetchAnalytics(filters);
  };

  // EXPORT CSV
  const exportCSV = async () => {
    try {
      const params = {};
      if (subject.trim()) params.subject = subject;
      if (from) params.from = from;
      if (to) params.to = to;

      const res = await axios.get(
        "http://localhost:5000/api/analytics/export",
        {
          headers,
          params,
          responseType: "blob",
        }
      );

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance-analytics.csv";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV export failed", err);
    }
  };

  useEffect(() => {
    fetchAnalytics(); // initial load
  }, []);

  return (
    <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
      <KpiCards />

      <h2>📊 Attendance Analytics</h2>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />

        <button onClick={handleApply}>Apply</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {/* SUBJECT WISE */}
      <div style={{ height: 300 }}>
        <h3>Subject-wise Attendance</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subjectData}>
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* DAILY TREND */}
      <div style={{ height: 300, marginTop: 40 }}>
        <h3>Daily Attendance Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <XAxis dataKey="_id" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="present"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Heatmap token={token} subjectFilter={subject} from={from} to={to} />
    </div>
  );
}