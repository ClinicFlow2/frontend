// src/pages/PatientVisits.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPatient } from "../api/patients";
import { createVisit, getVisits, deleteVisit } from "../api/visits";
import { formatDateTime } from "../utils/dateFormat";

export default function PatientVisits() {
  const { id } = useParams(); // patient id
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Create-visit form
  const [form, setForm] = useState({
    visit_date: "", // optional, backend default = now
    visit_type: "CONSULTATION",
    chief_complaint: "",
    medical_history: "",
    history_of_present_illness: "",
    physical_exam: "",
    complementary_exam: "",
    assessment: "",
    plan: "",
    treatment: "",
    notes: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [p, v] = await Promise.all([getPatient(id), getVisits({ patientId: id })]);
      setPatient(p);
      setVisits(Array.isArray(v) ? v : []);
    } catch (err) {
      console.log("PATIENT VISITS LOAD ERROR:", err?.response?.data || err);
      setError(t("patientVisits.loadError"));
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
    setError("");
    setSuccess("");

    try {
      const payload = {
        patient: Number(id),
        visit_type: form.visit_type,
        ...(form.visit_date ? { visit_date: form.visit_date } : {}),
        chief_complaint: form.chief_complaint.trim(),
        medical_history: form.medical_history.trim(),
        history_of_present_illness: form.history_of_present_illness.trim(),
        physical_exam: form.physical_exam.trim(),
        complementary_exam: form.complementary_exam.trim(),
        assessment: form.assessment.trim(),
        plan: form.plan.trim(),
        treatment: form.treatment.trim(),
        notes: form.notes.trim(),
      };

      await createVisit(payload);

      setForm((f) => ({
        ...f,
        visit_date: "",
        chief_complaint: "",
        medical_history: "",
        history_of_present_illness: "",
        physical_exam: "",
        complementary_exam: "",
        assessment: "",
        plan: "",
        treatment: "",
        notes: "",
      }));

      setSuccess(t("patientVisits.createSuccess"));
      await load();
    } catch (err) {
      console.log("CREATE VISIT ERROR:", err?.response?.data || err);
      setError(t("patientVisits.createError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e, visitId) {
    e.stopPropagation();
    if (!window.confirm(t("patientVisits.deleteConfirm"))) return;

    setDeleting(visitId);
    setError("");
    setSuccess("");

    try {
      await deleteVisit(visitId);
      setSuccess(t("patientVisits.deleteSuccess"));
      await load();
    } catch (err) {
      console.log("DELETE VISIT ERROR:", err?.response?.data || err);
      setError(t("patientVisits.deleteError"));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="cf-animate-in" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cf-skeleton" style={{ height: 32, width: 200 }} />
          <div className="cf-skeleton" style={{ height: 20, width: 280 }} />
          <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="cf-animate-in" style={{ padding: 20, background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => navigate(`/patients/${id}`)} style={btn}>
          ← {t("common.back")}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <Link to="/patients" style={{ ...btn, textDecoration: "none" }}>
            {t("patientVisits.patientsList")}
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div style={errorStyle}>
          {error}
        </div>
      )}
      {success && (
        <div style={successStyle}>
          {success}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <h2 style={{ margin: 0, color: "var(--text)" }}>
          {t("patientVisits.title")} — {patient.first_name} {patient.last_name}
        </h2>
        <div style={{ color: "var(--muted)", marginTop: 6 }}>
          {t("patients.patientCode")}: <b>{patient.patient_code || "-"}</b>
        </div>
      </div>

      {/* Create Visit */}
      <form
        onSubmit={handleCreate}
        style={{
          marginTop: 16,
          padding: 16,
          border: "1px solid var(--border)",
          borderRadius: 16,
          background: "var(--card)",
          boxShadow: "var(--shadow)",
          maxWidth: 920,
          color: "var(--text)",
        }}
      >
        <h3 style={{ marginTop: 0, color: "var(--text)" }}>{t("visits.newVisit")}</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={label}>{t("patientVisits.visitType")}</label>
            <select
              value={form.visit_type}
              onChange={(e) => setForm((f) => ({ ...f, visit_type: e.target.value }))}
              style={input}
            >
              <option value="CONSULTATION">{t("patientVisits.consultation")}</option>
              <option value="FOLLOW_UP">{t("patientVisits.followUp")}</option>
            </select>
          </div>

          <div>
            <label style={label}>{t("patientVisits.visitDateOptional")}</label>
            <input
              type="datetime-local"
              value={form.visit_date}
              onChange={(e) => setForm((f) => ({ ...f, visit_date: e.target.value }))}
              style={input}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={label}>{t("visits.chiefComplaint")}</label>
          <input
            value={form.chief_complaint}
            onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
            placeholder={t("patientVisits.chiefComplaintPlaceholder")}
            style={input}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>{t("patientVisits.medicalHistory")}</label>
            <textarea
              value={form.medical_history}
              onChange={(e) => setForm((f) => ({ ...f, medical_history: e.target.value }))}
              placeholder={t("patientVisits.medicalHistoryPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>

          <div>
            <label style={label}>{t("patientVisits.historyOfPresentIllness")}</label>
            <textarea
              value={form.history_of_present_illness}
              onChange={(e) => setForm((f) => ({ ...f, history_of_present_illness: e.target.value }))}
              placeholder={t("patientVisits.hpiPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>{t("patientVisits.physicalExam")}</label>
            <textarea
              value={form.physical_exam}
              onChange={(e) => setForm((f) => ({ ...f, physical_exam: e.target.value }))}
              placeholder={t("patientVisits.physicalExamPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>

          <div>
            <label style={label}>{t("patientVisits.complementaryExam")}</label>
            <textarea
              value={form.complementary_exam}
              onChange={(e) => setForm((f) => ({ ...f, complementary_exam: e.target.value }))}
              placeholder={t("patientVisits.complementaryExamPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div>
            <label style={label}>{t("patientVisits.assessment")}</label>
            <textarea
              value={form.assessment}
              onChange={(e) => setForm((f) => ({ ...f, assessment: e.target.value }))}
              placeholder={t("patientVisits.assessmentPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>

          <div>
            <label style={label}>{t("patientVisits.plan")}</label>
            <textarea
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
              placeholder={t("patientVisits.planPlaceholder")}
              style={textarea}
              rows={4}
            />
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={label}>{t("patientVisits.treatment")}</label>
          <textarea
            value={form.treatment}
            onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
            placeholder={t("patientVisits.treatmentPlaceholder")}
            style={textarea}
            rows={3}
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <label style={label}>{t("visits.notes")}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={t("patientVisits.notesPlaceholder")}
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
            borderRadius: 12,
            border: "1px solid var(--accent)",
            background: "var(--accent)",
            color: "var(--accentText)",
            cursor: saving ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.9375rem",
          }}
        >
          {saving ? t("common.saving") : t("patientVisits.createVisit")}
        </button>
      </form>

      {/* Visit history */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h3 style={{ margin: 0, color: "var(--text)" }}>{t("patientVisits.visitHistory")}</h3>
          <span style={{ color: "var(--muted)" }}>{visits.length}</span>

          <button onClick={load} style={{ ...btn, marginLeft: "auto" }}>
            {t("common.refresh")}
          </button>
        </div>

        {visits.length === 0 ? (
          <p style={{ color: "var(--muted)", marginTop: 10 }}>{t("patientVisits.noVisits")}</p>
        ) : (
          <>
            <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
              {t("patientVisits.clickRowTip")}
            </div>

            <div
              style={{
                marginTop: 10,
                overflowX: "auto",
                border: "1px solid var(--border)",
                borderRadius: 16,
                background: "var(--card)",
                boxShadow: "var(--shadow)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--surface)" }}>
                    <th style={th}>{t("patientVisits.date")}</th>
                    <th style={th}>{t("patientVisits.type")}</th>
                    <th style={th}>{t("patientVisits.vitalsLatest")}</th>
                    <th style={th}>{t("visits.chiefComplaint")}</th>
                    <th style={th}>{t("patientVisits.assessment")}</th>
                    <th style={th}>{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr
                      key={v.id}
                      style={{ ...row, borderTop: "1px solid var(--border)" }}
                      title={t("patientVisits.openVisit")}
                      onClick={() => navigate(`/patients/${id}/visits/${v.id}`)}
                    >
                      <td style={td}>{formatDateTime(v.visit_date)}</td>
                      <td style={td}>{formatVisitType(v.visit_type, t)}</td>
                      <td style={td}>{formatVitalsSummary(v?.vital_signs, t)}</td>
                      <td style={td}>{v.chief_complaint || "-"}</td>
                      <td style={td}>{v.assessment || "-"}</td>
                      <td style={td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/patients/${id}/visits/${v.id}`);
                            }}
                            style={btnSmall}
                            title={t("common.view")}
                          >
                            {t("common.view")}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, v.id)}
                            disabled={deleting === v.id}
                            style={btnDanger}
                            title={t("common.delete")}
                          >
                            {deleting === v.id ? "..." : t("common.delete")}
                          </button>
                        </div>
                      </td>
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

function formatVisitType(value, t) {
  if (!value) return "-";
  if (value === "CONSULTATION") return t("patientVisits.consultation");
  if (value === "FOLLOW_UP") return t("patientVisits.followUp");
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

function formatVitalsSummary(vitalSigns, t) {
  const latest = pickLatestVitals(vitalSigns);
  if (!latest) return "-";

  const parts = [];

  if (latest.temperature_c !== null && latest.temperature_c !== undefined && latest.temperature_c !== "") {
    parts.push(`T ${latest.temperature_c}°C`);
  }

  const sys = latest.bp_systolic;
  const dia = latest.bp_diastolic;
  if ((sys !== null && sys !== undefined && sys !== "") || (dia !== null && dia !== undefined && dia !== "")) {
    parts.push(`BP ${sys || "?"}/${dia || "?"}`);
  }

  if (latest.heart_rate_bpm !== null && latest.heart_rate_bpm !== undefined && latest.heart_rate_bpm !== "") {
    parts.push(`HR ${latest.heart_rate_bpm}`);
  }

  if (latest.oxygen_saturation_pct !== null && latest.oxygen_saturation_pct !== undefined && latest.oxygen_saturation_pct !== "") {
    parts.push(`SpO₂ ${latest.oxygen_saturation_pct}%`);
  }

  if (parts.length === 0) return t("patientVisits.vitalsRecorded");
  return parts.join(" | ");
}

const row = { cursor: "pointer" };

const btn = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--text)",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "0.875rem",
  transition: "all 150ms ease",
};

const btnSmall = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--accent)",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "0.75rem",
  transition: "all 150ms ease",
};

const btnDanger = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid rgba(239, 68, 68, 0.3)",
  background: "rgba(239, 68, 68, 0.1)",
  color: "#ef4444",
  cursor: "pointer",
  fontWeight: 500,
  fontSize: "0.75rem",
  transition: "all 150ms ease",
};

const label = {
  display: "block",
  fontSize: 13,
  color: "var(--muted)",
  marginBottom: 6,
  fontWeight: 500,
};

const input = {
  width: "100%",
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  background: "var(--inputBg)",
  color: "var(--inputText)",
  outline: "none",
  fontSize: "0.875rem",
};

const textarea = {
  width: "100%",
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  resize: "vertical",
  background: "var(--inputBg)",
  color: "var(--inputText)",
  outline: "none",
  fontSize: "0.875rem",
};

const th = {
  textAlign: "left",
  padding: "12px 12px",
  fontSize: "0.8125rem",
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
  fontWeight: 600,
};

const td = {
  padding: "12px 12px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  color: "var(--text)",
  fontSize: "0.875rem",
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

const successStyle = {
  marginTop: 16,
  padding: "12px 16px",
  borderRadius: 10,
  background: "rgba(16, 185, 129, 0.1)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
  color: "#10b981",
  fontSize: "0.875rem",
  fontWeight: 500,
};
