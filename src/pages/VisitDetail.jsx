// src/pages/VisitDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPatient } from "../api/patients";
import { createVitals, getVisit, getVitals, downloadPrescriptionPdf } from "../api/visits";
import { getPrescriptions, unwrapListResults } from "../api/prescriptions";

const C = {
  bg: "var(--bg)",
  card: "var(--card)",
  surface: "var(--surface)",
  text: "var(--text)",
  muted: "var(--muted)",
  border: "var(--border)",
  shadow: "var(--shadow)",
  accent: "var(--accent)",
  accentText: "var(--accentText)",
};

export default function VisitDetail() {
  const { id, visitId } = useParams(); // id = patientId
  const navigate = useNavigate();

  const visitIdNum = useMemo(() => Number(visitId), [visitId]);

  const [patient, setPatient] = useState(null);
  const [visit, setVisit] = useState(null);

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prescriptions state
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState("");
  const [prescriptions, setPrescriptions] = useState([]);
  const [rxDownloadingId, setRxDownloadingId] = useState(null);

  const [showVitalsForm, setShowVitalsForm] = useState(false);

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

  async function loadPrescriptions() {
    setRxLoading(true);
    setRxError("");
    try {
      const data = await getPrescriptions({ page: 1, pageSize: 200, visitId: visitIdNum });
      setPrescriptions(unwrapListResults(data));
    } catch (err) {
      console.log("LOAD PRESCRIPTIONS ERROR:", err?.response?.data || err);
      setRxError("❌ Failed to load prescriptions for this visit.");
      setPrescriptions([]);
    } finally {
      setRxLoading(false);
    }
  }

  function normalizeVitals(vit) {
    if (Array.isArray(vit)) return vit;
    if (Array.isArray(vit?.results)) return vit.results;
    return [];
  }

  async function load() {
    setLoading(true);
    try {
      const [p, v, vit] = await Promise.all([
        getPatient(id),
        getVisit(visitId),
        getVitals({ visitId }), // GET /api/visits/vitals/?visit=<id>
      ]);

      setPatient(p);
      setVisit(v);
      setVitals(normalizeVitals(vit));

      await loadPrescriptions();
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
        visit: visitIdNum,
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

      setShowVitalsForm(false);
      await load();
    } catch (err) {
      console.log("CREATE VITALS ERROR:", err?.response?.data || err);
      alert("❌ Failed to add vitals:\n" + JSON.stringify(err?.response?.data || err, null, 2));
    } finally {
      setSaving(false);
    }
  }

  function goCreatePrescriptionLinked() {
    navigate(`/prescriptions?visit=${visitId}`);
  }

  async function handleDownloadPdf(rxId) {
    setRxDownloadingId(rxId);
    try {
      await downloadPrescriptionPdf(rxId);
    } catch (err) {
      console.log("PDF DOWNLOAD ERROR:", err?.response?.data || err);
      alert("❌ Failed to download PDF. Make sure you are logged in and your token is valid.");
    } finally {
      setRxDownloadingId(null);
    }
  }

  if (loading) return <p style={{ marginTop: 20, color: C.text }}>Loading visit...</p>;
  if (!visit || !patient) return null;

  return (
    <div style={{ padding: 20, background: C.bg, minHeight: "100vh", color: C.text }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 1100, margin: "0 auto" }}>
        <button onClick={() => navigate(`/patients/${id}/visits`)} style={btn}>
          ← Back to visits
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={goCreatePrescriptionLinked} style={btnPrimary}>
            + Create prescription (linked)
          </button>

          <Link to={`/patients/${id}`} style={{ ...btn, textDecoration: "none" }}>
            Patient details
          </Link>
        </div>
      </div>

      {/* Header */}
      <div style={{ marginTop: 14, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, color: C.text }}>
              Visit #{visit.id} — {patient.first_name} {patient.last_name}
            </h2>
            <div style={{ color: C.muted, marginTop: 6 }}>
              Patient code: <b>{patient.patient_code || "-"}</b> · Visit date: <b>{formatDateTime(visit.visit_date)}</b>
            </div>
          </div>

          <button onClick={load} style={btn} title="Refresh visit, vitals, and prescriptions">
            Refresh
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 14,
          maxWidth: 1100,
          marginLeft: "auto",
          marginRight: "auto",
          alignItems: "start",
        }}
      >
        {/* Left column */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Visit details */}
          <Card title="Visit details">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={kv}><b>Type:</b> {formatVisitType(visit.visit_type)}</div>
                <div style={kv}><b>Chief complaint:</b> {visit.chief_complaint || "-"}</div>
              </div>

              <div>
                <div style={kv}><b>HPI:</b></div>
                <div style={box}>{visit.history_of_present_illness || "-"}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <b>Physical exam:</b>
                <div style={box}>{visit.physical_exam || "-"}</div>
              </div>
              <div>
                <b>Assessment:</b>
                <div style={box}>{visit.assessment || "-"}</div>
              </div>
            </div>

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <b>Plan:</b>
                <div style={box}>{visit.plan || "-"}</div>
              </div>
              <div>
                <b>Notes:</b>
                <div style={box}>{visit.notes || "-"}</div>
              </div>
            </div>
          </Card>

          {/* Prescriptions */}
          <Card
            title="Prescriptions"
            right={
              <button onClick={loadPrescriptions} style={btn} disabled={rxLoading}>
                {rxLoading ? "Loading..." : "Refresh"}
              </button>
            }
            subtitle={`${prescriptions.length} prescription(s)`}
          >
            {rxError ? <p style={{ color: "#ff6b6b", marginTop: 10 }}>{rxError}</p> : null}

            {!rxLoading && prescriptions.length === 0 ? (
              <p style={{ color: C.muted, marginTop: 10 }}>No prescriptions yet for this visit.</p>
            ) : null}

            {prescriptions.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    style={{
                      padding: 12,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      background: C.surface,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      color: C.text,
                    }}
                  >
                    <div>
                      <b>Prescription #{rx.id}</b>
                      <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                        Created: {rx.created_at ? new Date(rx.created_at).toLocaleString() : "-"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadPdf(rx.id)}
                      disabled={rxDownloadingId === rx.id}
                      style={{ ...btnPrimary, whiteSpace: "nowrap" }}
                      title="Download PDF (authenticated)"
                    >
                      {rxDownloadingId === rx.id ? "Downloading..." : "PDF"}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Vital signs summary */}
          <Card
            title="Vital signs"
            subtitle={latestVitals?.measured_at ? `Latest: ${formatDateTime(latestVitals.measured_at)}` : "No vitals recorded"}
            right={
              <button onClick={() => setShowVitalsForm((s) => !s)} style={btn}>
                {showVitalsForm ? "Close" : "Add vitals"}
              </button>
            }
          >
            {!latestVitals ? (
              <div style={{ color: C.muted }}>No vital signs yet. Add vitals to start tracking this visit.</div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                <VitalsRow label="Temperature" value={latestVitals.temperature_c != null ? `${latestVitals.temperature_c} °C` : "-"} />
                <VitalsRow
                  label="Blood pressure"
                  value={
                    latestVitals.bp_systolic != null && latestVitals.bp_diastolic != null
                      ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}`
                      : "-"
                  }
                />
                <VitalsRow label="Heart rate" value={latestVitals.heart_rate_bpm != null ? `${latestVitals.heart_rate_bpm} bpm` : "-"} />
                <VitalsRow label="Resp. rate" value={latestVitals.respiratory_rate_rpm != null ? `${latestVitals.respiratory_rate_rpm} rpm` : "-"} />
                <VitalsRow label="SpO₂" value={latestVitals.oxygen_saturation_pct != null ? `${latestVitals.oxygen_saturation_pct}%` : "-"} />
                <VitalsRow label="Weight" value={latestVitals.weight_kg != null ? `${latestVitals.weight_kg} kg` : "-"} />
                <VitalsRow label="Height" value={latestVitals.height_cm != null ? `${latestVitals.height_cm} cm` : "-"} />
                <VitalsRow
                  label="Head circumference"
                  value={latestVitals.head_circumference_cm != null ? `${latestVitals.head_circumference_cm} cm` : "-"}
                />
              </div>
            )}

            {showVitalsForm ? (
              <form onSubmit={handleCreateVitals} style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div>
                    <label style={label}>Measured at (optional)</label>
                    <input
                      type="datetime-local"
                      value={form.measured_at}
                      onChange={(e) => setForm((f) => ({ ...f, measured_at: e.target.value }))}
                      style={input}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText="Temperature (°C)" value={form.temperature_c} onChange={(v) => setForm((f) => ({ ...f, temperature_c: v }))} placeholder="e.g. 38.5" />
                    <Field labelText="Oxygen sat (%)" value={form.oxygen_saturation_pct} onChange={(v) => setForm((f) => ({ ...f, oxygen_saturation_pct: v }))} placeholder="e.g. 98" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText="Weight (kg)" value={form.weight_kg} onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))} placeholder="e.g. 70" />
                    <Field labelText="Height (cm)" value={form.height_cm} onChange={(v) => setForm((f) => ({ ...f, height_cm: v }))} placeholder="e.g. 175" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText="BP systolic" value={form.bp_systolic} onChange={(v) => setForm((f) => ({ ...f, bp_systolic: v }))} placeholder="e.g. 120" />
                    <Field labelText="BP diastolic" value={form.bp_diastolic} onChange={(v) => setForm((f) => ({ ...f, bp_diastolic: v }))} placeholder="e.g. 80" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText="Heart rate (bpm)" value={form.heart_rate_bpm} onChange={(v) => setForm((f) => ({ ...f, heart_rate_bpm: v }))} placeholder="e.g. 85" />
                    <Field labelText="Resp rate (rpm)" value={form.respiratory_rate_rpm} onChange={(v) => setForm((f) => ({ ...f, respiratory_rate_rpm: v }))} placeholder="e.g. 18" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <Field
                      labelText="Head circumference (cm)"
                      value={form.head_circumference_cm}
                      onChange={(v) => setForm((f) => ({ ...f, head_circumference_cm: v }))}
                      placeholder="(kids) e.g. 47"
                    />
                    <Field labelText="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder="optional" />
                  </div>
                </div>

                <button type="submit" disabled={saving} style={{ ...btnPrimary, width: "100%", marginTop: 12 }}>
                  {saving ? "Saving..." : "Save vitals"}
                </button>
              </form>
            ) : null}
          </Card>

          {/* Vitals history */}
          <Card title="Vitals history" subtitle={`${vitalsSorted.length} record(s)`}>
            {vitalsSorted.length === 0 ? (
              <div style={{ color: C.muted }}>No vitals recorded yet.</div>
            ) : (
              <div style={{ marginTop: 8, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      <th style={th}>Measured</th>
                      <th style={th}>Temp</th>
                      <th style={th}>BP</th>
                      <th style={th}>HR</th>
                      <th style={th}>SpO₂</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsSorted.slice(0, 8).map((x) => (
                      <tr key={x.id} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={td}>{formatDateTime(x.measured_at)}</td>
                        <td style={td}>{x.temperature_c != null ? `${x.temperature_c}°C` : "-"}</td>
                        <td style={td}>{x.bp_systolic != null && x.bp_diastolic != null ? `${x.bp_systolic}/${x.bp_diastolic}` : "-"}</td>
                        <td style={td}>{x.heart_rate_bpm != null ? x.heart_rate_bpm : "-"}</td>
                        <td style={td}>{x.oxygen_saturation_pct != null ? `${x.oxygen_saturation_pct}%` : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {vitalsSorted.length > 8 ? (
                  <div style={{ marginTop: 8, color: C.muted, fontSize: 12 }}>
                    Showing latest 8 records (add pagination later if needed).
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Card({ title, subtitle, right, children }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 16, color: "var(--text)" }}>{title}</div>
          {subtitle ? <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>

      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function VitalsRow({ label, value }) {
  return (
    <div style={vRow}>
      <div style={{ color: "var(--muted)", fontWeight: 800, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 950, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function Field({ labelText, value, onChange, placeholder }) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={input} />
    </div>
  );
}

/* ---------- formatting ---------- */

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

/* ---------- styles (theme-driven) ---------- */

const card = {
  padding: 16,
  border: "1px solid var(--border)",
  borderRadius: 16,
  background: "var(--card)",
  boxShadow: "var(--shadow)",
  color: "var(--text)",
};

const btn = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 800,
};

const btnPrimary = {
  ...btn,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "var(--accentText)",
};

const label = {
  display: "block",
  fontSize: 12,
  color: "var(--muted)",
  marginBottom: 6,
  fontWeight: 900,
};

const input = {
  width: "100%",
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 12,
  outline: "none",
  background: "var(--inputBg)",
  color: "var(--inputText)",
};

const th = {
  textAlign: "left",
  padding: "10px 10px",
  fontSize: 12,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
  fontWeight: 900,
};

const td = {
  padding: "10px 10px",
  verticalAlign: "top",
  fontSize: 13,
  color: "var(--text)",
};

const kv = { lineHeight: 1.8, color: "var(--text)" };

const box = {
  marginTop: 6,
  padding: 12,
  border: "1px solid var(--border)",
  borderRadius: 14,
  background: "var(--surface)",
  whiteSpace: "pre-wrap",
  color: "var(--text)",
};

const vRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
};
