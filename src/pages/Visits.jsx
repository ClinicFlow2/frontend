// src/pages/Visits.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPatients } from "../api/patients";
import { getVisits } from "../api/visits";
import { formatDateTime } from "../utils/dateFormat";

export default function Visits() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [patientsData, visitsData] = await Promise.all([
        getPatients({ page: 1, pageSize: 50, search: search }),
        getVisits(), // Get recent visits
      ]);

      setPatients(Array.isArray(patientsData?.results) ? patientsData.results : []);
      setCount(typeof patientsData?.count === "number" ? patientsData.count : 0);

      // Sort visits by date (most recent first) and take last 5
      const sortedVisits = (Array.isArray(visitsData) ? visitsData : [])
        .sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date))
        .slice(0, 5);
      setRecentVisits(sortedVisits);
    } catch (err) {
      console.log("VISITS PAGE LOAD ERROR:", err?.response?.data || err);
      setError(t("visits.loadError"));
      setPatients([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load();
  }

  if (loading) {
    return (
      <div className="cf-animate-in" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cf-skeleton" style={{ height: 32, width: 120 }} />
          <div className="cf-skeleton" style={{ height: 20, width: 280 }} />
          <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="cf-animate-in" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6, color: "var(--text)" }}>{t("visits.title")}</h2>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {t("visits.selectPatient")}
          </p>
        </div>
        <button
          onClick={load}
          style={btn}
        >
          {t("common.refresh")}
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}

      {/* Recent Visits Card */}
      {recentVisits.length > 0 && (
        <div style={card}>
          <h3 style={{ marginTop: 0, marginBottom: 12, color: "var(--text)", fontSize: "1rem", fontWeight: 600 }}>
            {t("visitsPage.recentVisits")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentVisits.map((v) => (
              <Link
                key={v.id}
                to={`/patients/${v.patient}/visits/${v.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  textDecoration: "none",
                  color: "var(--text)",
                  transition: "all 150ms ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.background = "rgba(16, 185, 129, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.background = "var(--surface)";
                }}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                    {v.patient_name || `Patient #${v.patient}`}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>
                    {v.chief_complaint || t("patientVisits.consultation")}
                  </div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                  {formatDateTime(v.visit_date)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search and Patient Count */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1, minWidth: 200 }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("patients.searchPlaceholder")}
            style={input}
          />
          <button type="submit" style={btnPrimary}>
            {t("common.search")}
          </button>
        </form>
        <div style={{ color: "var(--muted)" }}>
          {t("visits.patientsCount")}: <b style={{ color: "var(--text)" }}>{count}</b>
        </div>
      </div>

      {patients.length === 0 && !error ? (
        <p style={{ color: "var(--muted)", marginTop: 16 }}>{t("visits.noPatients")}</p>
      ) : patients.length > 0 ? (
        <div
          className="cf-table-wrap"
          style={{
            marginTop: 16,
            overflowX: "auto",
            border: "1px solid var(--border)",
            borderRadius: 16,
            background: "var(--card)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg)" }}>
                <th style={th}>{t("patients.patientCode")}</th>
                <th style={th}>{t("patients.name")}</th>
                <th style={th}>{t("patients.lastVisit")}</th>
                <th style={th}>{t("patients.nextVisit")}</th>
                <th style={th}>{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>{p.patient_code || "-"}</td>
                  <td style={td}>
                    {p.first_name} {p.last_name}
                  </td>
                  <td style={td}>{formatDateTime(p.last_visit_date)}</td>
                  <td style={td}>{formatDateTime(p.next_visit_date)}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Link
                        to={`/patients/${p.id}/visits`}
                        style={btnLink}
                      >
                        {t("visits.openVisits")}
                      </Link>
                      <Link
                        to={`/patients/${p.id}`}
                        style={btnLinkSecondary}
                      >
                        {t("common.view")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px 12px",
  verticalAlign: "middle",
  color: "var(--text)",
  fontSize: "0.875rem",
};

const btn = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "0.875rem",
  transition: "all 150ms ease",
};

const btnPrimary = {
  ...btn,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "var(--accentText)",
};

const btnLink = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--accent)",
  background: "rgba(16, 185, 129, 0.1)",
  textDecoration: "none",
  color: "var(--accent)",
  fontWeight: 500,
  fontSize: "0.75rem",
  transition: "all 150ms ease",
};

const btnLinkSecondary = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  textDecoration: "none",
  color: "var(--text)",
  fontWeight: 500,
  fontSize: "0.75rem",
  transition: "all 150ms ease",
};

const input = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--inputBg)",
  color: "var(--inputText)",
  outline: "none",
  fontSize: "0.875rem",
  minWidth: 150,
};

const card = {
  marginTop: 16,
  padding: 16,
  border: "1px solid var(--border)",
  borderRadius: 16,
  background: "var(--card)",
};

const errorStyle = {
  marginTop: 16,
  padding: "12px 16px",
  borderRadius: 10,
  background: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#ef4444",
  fontSize: "0.875rem",
  fontWeight: 500,
};
