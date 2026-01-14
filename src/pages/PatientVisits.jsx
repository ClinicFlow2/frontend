// src/pages/PatientVisits.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPatient } from "../api/patients";
import { createVisit, getVisits } from "../api/visits";

export default function PatientVisits() {
  const { id } = useParams(); // patient id
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  // Create-visit form
  const [form, setForm] = useState({
    visit_date: "", // optional, backend default = now
    visit_type: "CONSULTATION",
    chief_complaint: "",
    history_of_present_illness: "",
    physical_exam: "",
    assessment: "",
    plan: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([getPatient(id), getVisits({ patientId: id })]);

      setPatient(p);
      setVisits(Array.isArray(v) ? v : []);
    } catch (err) {
      console.log("PATIENT VISITS LOAD ERROR:", err?.response?.data || err);
      alert("❌ Failed to load visits.");
      navigate(`/patients/${id}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        patient: Number(id),
        visit_type: form.visit_type,

        ...(form.visit_date ? { visit_date: form.visit_date } : {}),

        chief_complaint: form.chief_complaint.trim(),
        history_of_present_illness: form.history_of_present_illness.trim(),
        physical_exam: form.physical_exam.trim(),
        assessment: form.assessment.trim(),
        plan: form.plan.trim(),
        notes: form.notes.trim(),
      };

      await createVisit(payload);

      setForm((f) => ({
        ...f,
        visit_date: "",
        chief_complaint: "",
        history_of_present_illness: "",
        physical_exam: "",
        assessment: "",
        plan: "",
        notes: "",
      }));

      alert("✅ Visit created!");
      await load();
    } catch (err) {
      console.log("CREATE VISIT ERROR:", err?.response?.data || err);
      alert("❌ Failed to create visit:\n" + JSON.stringify(err?.response?.data || err, null, 2));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p style={{ marginTop: 20 }}>Loading visits...</p>;
  if (!patient) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(`/patients/${id}`)} style={btn}>
          ← Back
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Link to="/patients" style={{ ...btn, textDecoration: "none" }}>
            Patients list
          </Link>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <h2 style={{ margin: 0 }}>
          Visits — {patient.first_name} {patient.last_name}
        </h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          Patient code: <b>{patient.patient_code || "-"}</b>
        </div>
      </div>

      {/* Create Visit */}
      <form
        onSubmit={handleCreate}
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          background: "white",
          maxWidth: 920,
        }}
      >
        <h3 style={{ marginTop: 0 }}>New Visit</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={label}>Visit type</label>
            <select
              value={form.visit_type}
              onChange={(e) => setForm((f) => ({ ...f, visit_type: e.target.value }))}
              style={input}
            >
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
          </div>

          <div>
            <label style={label}>Visit date/time (optional — leave empty to use “now”)</label>
            <input
              type="datetime-local"
              value={form.visit_date}
              onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
              style={input}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={label}>Chief complaint</label>
          <input
            value={form.chief_complaint}
            onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
            placeholder="Example: Fever and cough"
            style={input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>History of present illness</label>
            <textarea
              value={form.history_of_present_illness}
              onChange={(e) =>
                setForm((f) => ({ ...f, history_of_present_illness: e.target.value }))
              }
              placeholder="Example: Fever for 2 days, cough, mild headache..."
              style={textarea}
              rows={5}
            />
          </div>

          <div>
            <label style={label}>Physical exam</label>
            <textarea
              value={form.physical_exam}
              onChange={(e) => setForm((f) => ({ ...f, physical_exam: e.target.value }))}
              placeholder="Example: Temp elevated, throat red..."
              style={textarea}
              rows={5}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>Assessment (diagnosis / impressions)</label>
            <textarea
              value={form.assessment}
              onChange={(e) => setForm((f) => ({ ...f, assessment: e.target.value }))}
              placeholder="Example: Suspected upper respiratory infection..."
              style={textarea}
              rows={4}
            />
          </div>

          <div>
            <label style={label}>Plan (treatment plan)</label>
            <textarea
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              placeholder="Example: CBC + malaria test, start symptomatic treatment..."
              style={textarea}
              rows={4}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={label}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional"
            style={textarea}
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            marginTop: 12,
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#f7f7f7",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {saving ? "Saving..." : "Create visit"}
        </button>
      </form>

      {/* Visit history */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0 }}>Visit history</h3>
          <span style={{ color: "#666" }}>{visits.length}</span>

          <button onClick={load} style={{ ...btn, marginLeft: "auto" }}>
            Refresh
          </button>
        </div>

        {visits.length === 0 ? (
          <p style={{ color: "#666", marginTop: 10 }}>No visits yet.</p>
        ) : (
          <>
            <div style={{ marginTop: 8, color: "#666", fontSize: 13 }}>
              Tip: click a row to open visit details + vitals.
            </div>

            <div
              style={{
                marginTop: 10,
                overflowX: "auto",
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                background: "white",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    <th style={th}>Date</th>
                    <th style={th}>Type</th>
                    <th style={th}>Vitals (latest)</th>
                    <th style={th}>Chief complaint</th>
                    <th style={th}>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr
                      key={v.id}
                      style={{ ...row, borderTop: "1px solid #eee" }}
                      title="Open visit"
                      onClick={() => navigate(`/patients/${id}/visits/${v.id}`)}
                    >
                      <td style={td}>{formatDateTime(v.visit_date)}</td>
                      <td style={td}>{formatVisitType(v.visit_type)}</td>
                      <td style={td}>{formatVitalsSummary(v?.vital_signs)}</td>
                      <td style={td}>{v.chief_complaint || "-"}</td>
                      <td style={td}>{v.assessment || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
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

function pickLatestVitals(vitalSigns) {
  if (!Array.isArray(vitalSigns) || vitalSigns.length === 0) return null;

  const sorted = [...vitalSigns].sort((a, b) => {
    const da = new Date(a?.measured_at || 0).getTime();
    const db = new Date(b?.measured_at || 0).getTime();
    return db - da;
  });

  return sorted[0] || null;
}

function formatVitalsSummary(vitalSigns) {
  const latest = pickLatestVitals(vitalSigns);
  if (!latest) return "-";

  const parts = [];

  if (latest.temperature_c !== null && latest.temperature_c !== undefined && latest.temperature_c !== "") {
    parts.push(`T ${latest.temperature_c}°C`);
  }

  const sys = latest.bp_systolic;
  const dia = latest.bp_diastolic;
  if (
    (sys !== null && sys !== undefined && sys !== "") ||
    (dia !== null && dia !== undefined && dia !== "")
  ) {
    parts.push(`BP ${sys || "?"}/${dia || "?"}`);
  }

  if (latest.heart_rate_bpm !== null && latest.heart_rate_bpm !== undefined && latest.heart_rate_bpm !== "") {
    parts.push(`HR ${latest.heart_rate_bpm}`);
  }

  if (
    latest.oxygen_saturation_pct !== null &&
    latest.oxygen_saturation_pct !== undefined &&
    latest.oxygen_saturation_pct !== ""
  ) {
    parts.push(`SpO₂ ${latest.oxygen_saturation_pct}%`);
  }

  if (parts.length === 0) return "Vitals recorded";
  return parts.join(" | ");
}

const row = {
  cursor: "pointer",
};

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

const textarea = {
  width: "100%",
  padding: 10,
  border: "1px solid #ddd",
  borderRadius: 8,
  resize: "vertical",
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
  whiteSpace: "nowrap",
};
