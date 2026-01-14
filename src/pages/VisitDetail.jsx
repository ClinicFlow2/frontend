// src/pages/VisitDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPatient } from "../api/patients";
import { createVitals, getVisit, getVitals } from "../api/visits";

export default function VisitDetail() {
  const { id, visitId } = useParams(); // id = patientId
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [visit, setVisit] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    measured_at: "",
    weight_kg: "",
    height_cm: "",
    temperature_c: "",
    bp_systolic: "",
    bp_diastolic: "",
    heart_rate_bpm: "",
    respiratory_rate_rpm: "",
    oxygen_saturation_pct: "",
    head_circumference_cm: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [p, v, vit] = await Promise.all([
        getPatient(id),
        getVisit(visitId),
        getVitals({ visitId }),
      ]);

      setPatient(p);
      setVisit(v);
      setVitals(Array.isArray(vit) ? vit : []);
    } catch (err) {
      console.log("VISIT DETAIL LOAD ERROR:", err?.response?.data || err);
      alert("❌ Failed to load visit details.");
      navigate(`/patients/${id}/visits`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, visitId]);

  const vitalsSorted = useMemo(() => {
    if (!Array.isArray(vitals)) return [];
    return [...vitals].sort((a, b) => {
      const da = a?.measured_at ? new Date(a.measured_at).getTime() : 0;
      const db = b?.measured_at ? new Date(b.measured_at).getTime() : 0;
      if (db !== da) return db - da;
      return (b?.id || 0) - (a?.id || 0);
    });
  }, [vitals]);

  const latestVitals = vitalsSorted.length > 0 ? vitalsSorted[0] : null;

  function toNumberOrNull(value, { int = false } = {}) {
    if (value == null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    const n = int ? Number.parseInt(trimmed, 10) : Number.parseFloat(trimmed);
    if (Number.isNaN(n)) return null;

    return int ? Math.trunc(n) : n;
  }

  async function handleCreateVitals(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        visit: Number(visitId),
        ...(form.measured_at ? { measured_at: form.measured_at } : {}),

        ...(toNumberOrNull(form.weight_kg) != null ? { weight_kg: toNumberOrNull(form.weight_kg) } : {}),
        ...(toNumberOrNull(form.height_cm) != null ? { height_cm: toNumberOrNull(form.height_cm) } : {}),
        ...(toNumberOrNull(form.temperature_c) != null ? { temperature_c: toNumberOrNull(form.temperature_c) } : {}),
        ...(toNumberOrNull(form.head_circumference_cm) != null
          ? { head_circumference_cm: toNumberOrNull(form.head_circumference_cm) }
          : {}),

        ...(toNumberOrNull(form.bp_systolic, { int: true }) != null
          ? { bp_systolic: toNumberOrNull(form.bp_systolic, { int: true }) }
          : {}),
        ...(toNumberOrNull(form.bp_diastolic, { int: true }) != null
          ? { bp_diastolic: toNumberOrNull(form.bp_diastolic, { int: true }) }
          : {}),
        ...(toNumberOrNull(form.heart_rate_bpm, { int: true }) != null
          ? { heart_rate_bpm: toNumberOrNull(form.heart_rate_bpm, { int: true }) }
          : {}),
        ...(toNumberOrNull(form.respiratory_rate_rpm, { int: true }) != null
          ? { respiratory_rate_rpm: toNumberOrNull(form.respiratory_rate_rpm, { int: true }) }
          : {}),
        ...(toNumberOrNull(form.oxygen_saturation_pct, { int: true }) != null
          ? { oxygen_saturation_pct: toNumberOrNull(form.oxygen_saturation_pct, { int: true }) }
          : {}),

        ...(String(form.notes || "").trim() ? { notes: String(form.notes).trim() } : {}),
      };

      await createVitals(payload);

      setForm({
        measured_at: "",
        weight_kg: "",
        height_cm: "",
        temperature_c: "",
        bp_systolic: "",
        bp_diastolic: "",
        heart_rate_bpm: "",
        respiratory_rate_rpm: "",
        oxygen_saturation_pct: "",
        head_circumference_cm: "",
        notes: "",
      });

      alert("✅ Vitals added!");
      await load();
    } catch (err) {
      console.log("CREATE VITALS ERROR:", err?.response?.data || err);
      alert("❌ Failed to add vitals:\n" + JSON.stringify(err?.response?.data || err, null, 2));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ marginTop: 20 }}>Loading visit...</p>;
  if (!visit || !patient) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(`/patients/${id}/visits`)} style={btn}>
          ← Back to visits
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Link to={`/patients/${id}`} style={{ ...btn, textDecoration: "none" }}>
            Patient details
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <h2 style={{ margin: 0 }}>
          Visit — {patient.first_name} {patient.last_name}
        </h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          Patient code: <b>{patient.patient_code || "-"}</b> · Visit ID: <b>{visit.id}</b>
        </div>
      </div>

      {/* Visit details */}
      <div style={{ marginTop: 14, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "white", maxWidth: 980 }}>
        <h3 style={{ marginTop: 0 }}>Visit details</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={kv}>
              <b>Date:</b> {formatDateTime(visit.visit_date)}
            </div>
            <div style={kv}>
              <b>Type:</b> {formatVisitType(visit.visit_type)}
            </div>
            <div style={kv}>
              <b>Chief complaint:</b> {visit.chief_complaint || "-"}
            </div>
          </div>

          <div>
            <div style={kv}>
              <b>Latest Temp:</b> {latestVitals?.temperature_c != null ? `${latestVitals.temperature_c} °C` : "-"}
            </div>
            <div style={kv}>
              <b>Latest BP:</b>{" "}
              {latestVitals?.bp_systolic != null && latestVitals?.bp_diastolic != null
                ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}`
                : "-"}
            </div>
            <div style={kv}>
              <b>Latest HR:</b> {latestVitals?.heart_rate_bpm != null ? `${latestVitals.heart_rate_bpm} bpm` : "-"}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <b>HPI:</b>
            <div style={box}>{visit.history_of_present_illness || "-"}</div>
          </div>
          <div>
            <b>Physical exam:</b>
            <div style={box}>{visit.physical_exam || "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <b>Assessment:</b>
            <div style={box}>{visit.assessment || "-"}</div>
          </div>
          <div>
            <b>Plan:</b>
            <div style={box}>{visit.plan || "-"}</div>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <b>Notes:</b>
          <div style={box}>{visit.notes || "-"}</div>
        </div>
      </div>

      {/* Add vitals */}
      <form onSubmit={handleCreateVitals} style={{ marginTop: 16, padding: 16, border: "1px solid #e5e5e5", borderRadius: 12, background: "white", maxWidth: 980 }}>
        <h3 style={{ marginTop: 0 }}>Add vitals</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={label}>Measured at (optional)</label>
            <input
              type="datetime-local"
              value={form.measured_at}
              onChange={(e) => setForm((f) => ({ ...f, measured_at: e.target.value }))}
              style={input}
            />
          </div>

          <div>
            <label style={label}>Temperature (°C)</label>
            <input
              value={form.temperature_c}
              onChange={(e) => setForm((f) => ({ ...f, temperature_c: e.target.value }))}
              placeholder="e.g. 38.5"
              style={input}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>Weight (kg)</label>
            <input value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} placeholder="e.g. 70" style={input} />
          </div>

          <div>
            <label style={label}>Height (cm)</label>
            <input value={form.height_cm} onChange={(e) => setForm((f) => ({ ...f, height_cm: e.target.value }))} placeholder="e.g. 175" style={input} />
          </div>

          <div>
            <label style={label}>Oxygen sat (%)</label>
            <input value={form.oxygen_saturation_pct} onChange={(e) => setForm((f) => ({ ...f, oxygen_saturation_pct: e.target.value }))} placeholder="e.g. 98" style={input} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>BP systolic</label>
            <input value={form.bp_systolic} onChange={(e) => setForm((f) => ({ ...f, bp_systolic: e.target.value }))} placeholder="e.g. 120" style={input} />
          </div>

          <div>
            <label style={label}>BP diastolic</label>
            <input value={form.bp_diastolic} onChange={(e) => setForm((f) => ({ ...f, bp_diastolic: e.target.value }))} placeholder="e.g. 80" style={input} />
          </div>

          <div>
            <label style={label}>Heart rate (bpm)</label>
            <input value={form.heart_rate_bpm} onChange={(e) => setForm((f) => ({ ...f, heart_rate_bpm: e.target.value }))} placeholder="e.g. 85" style={input} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>Resp rate (rpm)</label>
            <input value={form.respiratory_rate_rpm} onChange={(e) => setForm((f) => ({ ...f, respiratory_rate_rpm: e.target.value }))} placeholder="e.g. 18" style={input} />
          </div>

          <div>
            <label style={label}>Head circumference (cm)</label>
            <input value={form.head_circumference_cm} onChange={(e) => setForm((f) => ({ ...f, head_circumference_cm: e.target.value }))} placeholder="(kids) e.g. 47" style={input} />
          </div>

          <div>
            <label style={label}>Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="optional" style={input} />
          </div>
        </div>

        <button type="submit" disabled={saving} style={{ marginTop: 12, width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#f7f7f7", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700 }}>
          {saving ? "Saving..." : "Add vitals"}
        </button>
      </form>

      {/* vitals history */}
      <div style={{ marginTop: 16, maxWidth: 980 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Vitals history</h3>
          <span style={{ color: "#666" }}>{vitalsSorted.length}</span>

          <button onClick={load} style={{ ...btn, marginLeft: "auto" }}>
            Refresh
          </button>
        </div>

        {vitalsSorted.length === 0 ? (
          <p style={{ color: "#666", marginTop: 10 }}>No vitals recorded yet.</p>
        ) : (
          <div style={{ marginTop: 10, overflowX: "auto", border: "1px solid #e5e5e5", borderRadius: 12, background: "white" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={th}>Measured</th>
                  <th style={th}>Temp</th>
                  <th style={th}>BP</th>
                  <th style={th}>HR</th>
                  <th style={th}>RR</th>
                  <th style={th}>SpO2</th>
                  <th style={th}>Wt</th>
                  <th style={th}>Ht</th>
                  <th style={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {vitalsSorted.map((x) => (
                  <tr key={x.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={td}>{formatDateTime(x.measured_at)}</td>
                    <td style={td}>{x.temperature_c != null ? `${x.temperature_c}°C` : "-"}</td>
                    <td style={td}>
                      {x.bp_systolic != null && x.bp_diastolic != null ? `${x.bp_systolic}/${x.bp_diastolic}` : "-"}
                    </td>
                    <td style={td}>{x.heart_rate_bpm != null ? x.heart_rate_bpm : "-"}</td>
                    <td style={td}>{x.respiratory_rate_rpm != null ? x.respiratory_rate_rpm : "-"}</td>
                    <td style={td}>{x.oxygen_saturation_pct != null ? `${x.oxygen_saturation_pct}%` : "-"}</td>
                    <td style={td}>{x.weight_kg != null ? x.weight_kg : "-"}</td>
                    <td style={td}>{x.height_cm != null ? x.height_cm : "-"}</td>
                    <td style={td}>{x.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function formatVisitType(value) {
  if (!value) return "-";
  if (value === "CONSULTATION") return "Consultation";
  if (value === "FOLLOW_UP") return "Follow-up";
  return value;
}

const btn = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const label = {
  display: "block",
  fontSize: 13,
  color: "#444",
  marginBottom: 6,
};

const input = {
  width: "100%",
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
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

const kv = { lineHeight: 1.8 };

const box = {
  marginTop: 6,
  padding: 10,
  border: "1px solid #eee",
  borderRadius: 10,
  background: "#fafafa",
  whiteSpace: "pre-wrap",
};
