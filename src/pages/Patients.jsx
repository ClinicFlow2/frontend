// src/pages/Patients.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPatients, createPatient } from "../api/patients";
import { getProfile } from "../api/profile";
import { formatDate } from "../utils/dateFormat";

// Icons
const Icons = {
  Search: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Archive: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>
    </svg>
  ),
};

function TableSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div className="cf-skeleton" style={{ height: 20, width: "15%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "25%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "10%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "15%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "20%", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function Patients() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("M");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadPatients(pageToLoad = page, q = query, size = pageSize, archived = showArchived) {
    setLoading(true);
    try {
      const data = await getPatients({ page: pageToLoad, pageSize: size, search: q.trim(), archived });
      setPatients(Array.isArray(data?.results) ? data.results : []);
      setCount(typeof data?.count === "number" ? data.count : 0);
      setHasNext(!!data?.next);
      setHasPrev(!!data?.previous);
      setPage(pageToLoad);
    } catch (err) {
      console.log("GET PATIENTS ERROR:", err?.response?.data || err);
      setPatients([]);
      setCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load user profile to check admin status
    getProfile()
      .then((profile) => setIsAdmin(profile?.profile?.role === "admin"))
      .catch(() => setIsAdmin(false));
    loadPatients(1, query, pageSize, showArchived);
  }, []);
  useEffect(() => { loadPatients(1, query, pageSize, showArchived); }, [pageSize, showArchived]);

  // Debounce search: auto-search after 400ms of typing
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(1, query, pageSize, showArchived);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        sex,
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
        address: address.trim(),
      });
      setFirstName(""); setLastName(""); setSex("M"); setPhone(""); setDateOfBirth(""); setAddress("");
      setShowForm(false);
      await loadPatients(1, query, pageSize, showArchived);
    } catch (err) {
      alert("Failed to create patient: " + JSON.stringify(err?.response?.data || err, null, 2));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const haystack = [p.patient_code, p.first_name, p.last_name, p.phone, p.address, p.sex]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [patients, query]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const startIndex = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, count);

  return (
    <div className="cf-animate-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{t("patients.title")}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            {count > 0 
              ? t("patients.showingPatients", { start: startIndex, end: endIndex, total: count })
              : t("patients.noPatients")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
            borderRadius: 8, border: "none", background: "var(--accent)", color: "white",
            cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", transition: "all 150ms ease",
          }}
        >
          <Icons.Plus />
          {t("patients.addPatient")}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          marginBottom: 24, padding: 24, border: "1px solid var(--border)",
          borderRadius: 16, background: "var(--card)", boxShadow: "var(--shadow)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>{t("patients.newPatient")}</h3>
            <button type="button" onClick={() => setShowForm(false)} style={{
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1,
            }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.firstName")} *
              </label>
              <input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.lastName")} *
              </label>
              <input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.sex")} *
              </label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} required>
                <option value="M">{t("patients.male")}</option>
                <option value="F">{t("patients.female")}</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.dateOfBirth")} *
              </label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.phone")}
              </label>
              <input placeholder="+1 234 567 8900" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                {t("patients.address")} *
              </label>
              <input placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={submitting} style={{
              padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)",
              color: "white", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600,
              fontSize: "0.875rem", opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? t("patients.creating") : t("patients.createPatient")}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{
              padding: "10px 24px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--text)", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
            }}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 400 }}>
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
            <Icons.Search />
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPatients(1, query, pageSize, showArchived)}
            placeholder={t("patients.searchPlaceholder")}
            style={{ paddingLeft: 44 }}
          />
        </div>
        <button onClick={() => loadPatients(1, query, pageSize, showArchived)} style={{
          padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--text)", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
        }}>{t("common.search")}</button>
        {query && (
          <button onClick={() => { setQuery(""); loadPatients(1, "", pageSize, showArchived); }} style={{
            padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--muted)", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
          }}>{t("common.clear")}</button>
        )}
        {/* Archived toggle - only visible to admins */}
        {isAdmin && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8,
              border: showArchived ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid var(--border)",
              background: showArchived ? "rgba(245, 158, 11, 0.1)" : "var(--card)",
              color: showArchived ? "#d97706" : "var(--text)",
              cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
            }}
          >
            <Icons.Archive />
            {showArchived ? t("patients.showingArchived") : t("patients.showArchived")}
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{t("common.perPage")}:</span>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} style={{ width: "auto", padding: "8px 36px 8px 12px" }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
        {loading ? (
          <TableSkeleton />
        ) : filteredPatients.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--muted)" }}>
              <Icons.User />
            </div>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {query ? t("patients.noMatchingSearch") : t("patients.addFirstPatient")}
            </p>
          </div>
        ) : (
          <div className="cf-table-wrap" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--tableHead)" }}>
                  <th style={thStyle}>{t("patients.patientCode")}</th>
                  <th style={thStyle}>{t("patients.name")}</th>
                  <th style={thStyle}>{t("patients.sex")}</th>
                  <th style={thStyle}>{t("patients.dateOfBirth")}</th>
                  <th style={thStyle}>{t("patients.phone")}</th>
                  <th style={thStyle}>{t("patients.address")}</th>
                  <th style={thStyle}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p) => (
                  <tr key={p.id} style={{ transition: "background 150ms ease" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--tableRowHover)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={tdStyle}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", background: "var(--surface)", padding: "4px 8px", borderRadius: 4 }}>
                        {p.patient_code || "-"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link to={`/patients/${p.id}`} style={{ color: "var(--link)", fontWeight: 600, textDecoration: "none" }}>
                          {p.first_name} {p.last_name}
                        </Link>
                        {!p.is_active && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 9999,
                            fontSize: "0.6875rem", fontWeight: 600, background: "rgba(245, 158, 11, 0.1)", color: "#d97706",
                          }}>
                            {t("patients.archived")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 9999,
                        fontSize: "0.75rem", fontWeight: 600,
                        background: p.sex === "M" ? "rgba(59, 130, 246, 0.1)" : "rgba(236, 72, 153, 0.1)",
                        color: p.sex === "M" ? "#3b82f6" : "#ec4899",
                      }}>
                        {p.sex === "M" ? t("patients.male") : t("patients.female")}
                      </span>
                    </td>
                    <td style={tdStyle}>{formatDate(p.date_of_birth)}</td>
                    <td style={tdStyle}>{p.phone || "-"}</td>
                    <td style={{ ...tdStyle, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{p.address || "-"}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => navigate(`/patients/${p.id}`)} style={actionBtnStyle}>{t("common.view")}</button>
                        <button onClick={() => navigate(`/patients/${p.id}/visits`)} style={actionBtnStyle}>{t("nav.visits")}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredPatients.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "12px 0", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button disabled={!hasPrev} onClick={() => loadPatients(page - 1, query, pageSize, showArchived)}
              style={{ ...pagerBtnStyle, opacity: hasPrev ? 1 : 0.5, cursor: hasPrev ? "pointer" : "not-allowed" }}>
              <Icons.ChevronLeft /> {t("common.previous")}
            </button>
            <button disabled={!hasNext} onClick={() => loadPatients(page + 1, query, pageSize, showArchived)}
              style={{ ...pagerBtnStyle, opacity: hasNext ? 1 : 0.5, cursor: hasNext ? "pointer" : "not-allowed" }}>
              {t("common.next")} <Icons.ChevronRight />
            </button>
          </div>
          <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            {t("common.page")} {page} {t("common.of")} {totalPages}
          </span>
          <button onClick={() => loadPatients(page, query, pageSize, showArchived)} style={{ ...pagerBtnStyle, gap: 6 }}>
            <Icons.Refresh /> {t("common.refresh")}
          </button>
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left", padding: "14px 16px", fontSize: "0.75rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)",
  borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "14px 16px", verticalAlign: "middle", color: "var(--text)",
  borderBottom: "1px solid var(--border-light)", fontSize: "0.9375rem",
};
const actionBtnStyle = {
  padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)",
  background: "var(--card)", color: "var(--text)", cursor: "pointer",
  fontWeight: 500, fontSize: "0.8125rem", transition: "all 150ms ease",
};
const pagerBtnStyle = {
  display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 8,
  border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
  fontWeight: 500, fontSize: "0.875rem", transition: "all 150ms ease",
};
