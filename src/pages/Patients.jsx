// src/pages/Patients.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPatients, createPatient } from "../api/patients";

export default function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [query, setQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("M");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  async function loadPatients(pageToLoad = page, q = query, size = pageSize) {
    setLoading(true);
    try {
      const data = await getPatients({
        page: pageToLoad,
        pageSize: size,
        search: q.trim(),
      });

      setPatients(Array.isArray(data?.results) ? data.results : []);
      setCount(typeof data?.count === "number" ? data.count : 0);
      setHasNext(!!data?.next);
      setHasPrev(!!data?.previous);
      setPage(pageToLoad);
    } catch (err) {
      console.log("GET PATIENTS ERROR:", err?.response?.data || err);
      alert("❌ Failed to fetch patients.");
      setPatients([]);
      setCount(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients(1, query, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When pageSize changes, reload page 1
  useEffect(() => {
    loadPatients(1, query, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize]);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        sex,
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
        address: address.trim(),
      });

      // Clear form
      setFirstName("");
      setLastName("");
      setSex("M");
      setPhone("");
      setDateOfBirth("");
      setAddress("");

      alert("✅ Patient created!");

      // Reload first page
      await loadPatients(1, query, pageSize);
    } catch (err) {
      console.log("CREATE PATIENT ERROR:", err?.response?.data || err);
      alert("❌ Failed to create patient:\n" + JSON.stringify(err?.response?.data || err, null, 2));
    }
  };

  // Optional: keep client-side filtering for current page
  const filteredPatients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter((p) => {
      const haystack = [
        p.patient_code,
        p.first_name,
        p.last_name,
        p.phone,
        p.address,
        p.sex,
        p.date_of_birth,
        p.last_visit_date,
        p.next_visit_date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [patients, query]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const startIndex = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, count);

  if (loading) return <p style={{ marginTop: 20 }}>Loading patients...</p>;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Patients</h2>
        <span style={{ color: "var(--muted, #666)" }}>
          Showing {startIndex}-{endIndex} of {count}
        </span>
      </div>

      {/* Search */}
      <div style={{ marginTop: 14, marginBottom: 14, maxWidth: 520 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, name, phone, address..."
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid var(--border, #ddd)",
            borderRadius: 10,
            background: "var(--card, #fff)",
            color: "var(--text, #111)",
          }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
          <button onClick={() => loadPatients(1, query, pageSize)} style={btn()}>
            Search
          </button>

          {query.trim() && (
            <button
              onClick={() => {
                setQuery("");
                loadPatients(1, "", pageSize);
              }}
              style={btn()}
            >
              Clear
            </button>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "var(--muted, #666)", fontSize: 13 }}>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                padding: 10,
                borderRadius: 10,
                border: "1px solid var(--border, #ddd)",
                background: "var(--card, #fff)",
                color: "var(--text, #111)",
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Patient */}
      <form
        onSubmit={handleCreate}
        style={{
          marginBottom: 18,
          padding: 16,
          border: "1px solid var(--border, #e5e5e5)",
          borderRadius: 16,
          maxWidth: 720,
          background: "var(--card, #fff)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Add Patient</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            style={input}
          />
          <input
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            style={input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <select value={sex} onChange={(e) => setSex(e.target.value)} required style={input}>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>

          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required style={input} />

          <input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} required style={input} />
        </div>

        <button type="submit" style={{ ...btn(), width: "100%", marginTop: 12, fontWeight: 900 }}>
          Create Patient
        </button>
      </form>

      {/* Pagination controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button disabled={!hasPrev} onClick={() => loadPatients(page - 1, query, pageSize)} style={pagerBtn(!hasPrev)}>
          ← Previous
        </button>

        <div style={{ color: "var(--muted, #666)", fontSize: 13 }}>
          Page <b>{page}</b> of <b>{totalPages}</b>
        </div>

        <button disabled={!hasNext} onClick={() => loadPatients(page + 1, query, pageSize)} style={pagerBtn(!hasNext)}>
          Next →
        </button>

        <button onClick={() => loadPatients(page, query, pageSize)} style={{ ...btn(), marginLeft: "auto" }}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {filteredPatients.length === 0 ? (
        <p style={{ color: "var(--muted, #666)" }}>No patients found.</p>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--border, #e5e5e5)", borderRadius: 16, background: "var(--card, #fff)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--tableHead, rgba(255,255,255,0.04))" }}>
                <th style={th}>Code</th>
                <th style={th}>Name</th>
                <th style={th}>Sex</th>
                <th style={th}>DOB</th>
                <th style={th}>Last visit</th>
                <th style={th}>Next visit</th>
                <th style={th}>Phone</th>
                <th style={th}>Address</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--border, #eee)" }}>
                  <td style={td}>{p.patient_code || "-"}</td>

                  <td style={td}>
                    {/* IMPORTANT: route must exist in App.jsx: /patients/:id */}
                    <Link to={`/patients/${p.id}`} style={nameLink}>
                      {p.first_name} {p.last_name}
                    </Link>
                  </td>

                  <td style={td}>{p.sex || "-"}</td>
                  <td style={td}>{p.date_of_birth || "-"}</td>
                  <td style={td}>{p.last_visit_date || "-"}</td>
                  <td style={td}>{p.next_visit_date || "-"}</td>
                  <td style={td}>{p.phone || "-"}</td>
                  <td style={td}>{p.address || "-"}</td>

                  <td style={td}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {/* Button version (more reliable if CSS/Link styling breaks) */}
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${p.id}`)}
                        style={actionBtn}
                      >
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${p.id}/visits`)}
                        style={actionBtn}
                      >
                        Visits
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const input = {
  padding: 10,
  border: "1px solid var(--border, #ddd)",
  borderRadius: 12,
  background: "var(--card, #fff)",
  color: "var(--text, #111)",
};

const th = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: 13,
  color: "var(--muted, #444)",
  borderBottom: "1px solid var(--border, #eee)",
  whiteSpace: "nowrap",
};

const td = {
  padding: "12px 12px",
  verticalAlign: "top",
  color: "var(--text, #111)",
};

const nameLink = {
  color: "var(--link, #60a5fa)",
  textDecoration: "none",
  fontWeight: 800,
};

const actionBtn = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid var(--border, rgba(255,255,255,0.12))",
  background: "var(--card, transparent)",
  color: "var(--text, #111)",
  cursor: "pointer",
  fontWeight: 800,
};

function btn() {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border, rgba(255,255,255,0.12))",
    background: "var(--card, #fff)",
    color: "var(--text, #111)",
    cursor: "pointer",
    fontWeight: 800,
  };
}

function pagerBtn(disabled) {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border, rgba(255,255,255,0.12))",
    background: disabled ? "rgba(255,255,255,0.06)" : "var(--card, #fff)",
    color: "var(--text, #111)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontWeight: 800,
  };
}
