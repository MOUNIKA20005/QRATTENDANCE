import axios from "axios";
import { useState } from "react";
import "./Report.css";

const API_BASE = "http://localhost:5000/api";

export default function Report() {
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  if (!token) {
    return <h3 className="error-text">Unauthorized. Login again.</h3>;
  }

  /* ================= FETCH REPORT ================= */
  const fetchReport = async () => {
    if (!subject || !from || !to) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${API_BASE}/report`, {
        params: { subject, from, to },
        headers: {
          Authorization:`Bearer ${token}`
        }
      });

      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT CSV ================= */
  const exportCSV = async () => {
    try {
      const res = await axios.get(`${API_BASE}/report/export`, {
        headers: {
          Authorization:`Bearer ${token}`
        },
        responseType: "blob"
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "attendance-report.csv";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch {
      alert("CSV export failed");
    }
  };

  return (
    <div style={{padding:20}}>
      <h2 style={{color:"violet",fontSize:"40px"}}>Attendance Reports</h2>

      <div className="report-filters">
        <input
          type="text"
          placeholder="Subject (e.g. DBMS)"
          value={subject}
          onChange={e => setSubject(e.target.value)}
        />

        <input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} />

        <button onClick={fetchReport} disabled={loading}>
          {loading ? "Fetching..." : "Fetch"}
        </button>

        <button className="export-btn" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="report-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5">No records found</td>
              </tr>
            ) : (
              data.map((r, i) => (
                <tr key={i}>
                  <td>{r.studentId?.name || "N/A"}</td>
                  <td>{r.studentId?.email || "N/A"}</td>
                  <td>{r.subject}</td>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
