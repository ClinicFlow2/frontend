// src/pages/Visits.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../api/patients";

export default function Visits() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [count, setCount] = useState(0);

  async function load() {
    setLoading(true);
    try {
      // get first page (enough for now)
      const data = await getPatients({ page: 1, pageSize: 50, search: "" });
      setPatients(Array.isArray(data?.results) ? data.results : []);
      setCount(typeof data?.count === "number" ? data.count : 0);
    } catch (err) {
      console.log("VISITS PAGE LOAD ERROR:", err?.response?.data || err);
      alert("❌ Failed to load patients for Visits.");
      setPatients([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p style={{ marginTop: 20 }}>Loading visits module...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>Visits</h2>
      <p style={{ color: "#666", marginTop: 6 }}>
        Select a patient to view / create visits.
      </p>

      <div style={{ marginTop: 12, color: "#666" }}>
        Patients: <b>{count}</b>
      </div>

      {patients.length === 0 ? (
        <p style={{ color: "#666", marginTop: 12 }}>No patients found.</p>
      ) : (
        <div
          style={{
            marginTop: 12,
            overflowX: "auto",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "white",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                <th style={th}>Code</th>
                <th style={th}>Name</th>
                <th style={th}>Last visit</th>
                <th style={th}>Next visit</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={td}>{p.patient_code || "-"}</td>
                  <td style={td}>
                    {p.first_name} {p.last_name}
                  </td>
                  <td style={td}>{formatDateTime(p.last_visit_date)}</td>
                  <td style={td}>{formatDateTime(p.next_visit_date)}</td>
                  <td style={td}>
                    <Link
                      to={`/patients/${p.id}/visits`}
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #ddd",
                        background: "white",
                        textDecoration: "none",
                        color: "#111",
                        fontWeight: 700,
                      }}
                    >
                      Open visits
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button onClick={load} style={{ ...btn, marginTop: 14 }}>
        Refresh
      </button>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

const btn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const th = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 13,
  color: "#444",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px 12px",
  verticalAlign: "top",
};
