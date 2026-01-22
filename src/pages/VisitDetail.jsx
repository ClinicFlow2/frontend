// src/pages/VisitDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPatient } from "../api/patients";
import { createVitals, getVisit, getVitals, updateVisit, downloadPrescriptionPdf } from "../api/visits";
import { getPrescriptions, unwrapListResults } from "../api/prescriptions";
import { formatDateTime } from "../utils/dateFormat";

export default function VisitDetail() {
  const { id, visitId } = useParams(); // id = patientId
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split("-")[0] || "fr";

  const visitIdNum = useMemo(() => Number(visitId), [visitId]);

  const [patient, setPatient] = useState(null);
  const [visit, setVisit] = useState(null);

  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit mode for visit details
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    visit_type: "",
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
      setRxError(t("visitDetail.rxLoadError"));
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
    setError("");
    try {
      const [p, v, vit] = await Promise.all([
        getPatient(id),
        getVisit(visitId),
        getVitals({ visitId }), // GET /api/visits/vitals/?visit=<id>
      ]);

      setPatient(p);
      setVisit(v);
      setVitals(normalizeVitals(vit));

      // Populate edit form with visit data
      setEditForm({
        visit_type: v.visit_type || "CONSULTATION",
        chief_complaint: v.chief_complaint || "",
        medical_history: v.medical_history || "",
        history_of_present_illness: v.history_of_present_illness || "",
        physical_exam: v.physical_exam || "",
        complementary_exam: v.complementary_exam || "",
        assessment: v.assessment || "",
        plan: v.plan || "",
        treatment: v.treatment || "",
        notes: v.notes || "",
      });

      await loadPrescriptions();
    } catch (err) {
      console.log("VISIT DETAIL LOAD ERROR:", err?.response?.data || err);
      setError(t("visitDetail.loadError"));
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
    setError("");
    setSuccess("");

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
      setSuccess(t("visitDetail.vitalsSuccess"));
      await load();
    } catch (err) {
      console.log("CREATE VITALS ERROR:", err?.response?.data || err);
      setError(t("visitDetail.vitalsError"));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateVisit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        visit_type: editForm.visit_type,
        chief_complaint: editForm.chief_complaint.trim(),
        medical_history: editForm.medical_history.trim(),
        history_of_present_illness: editForm.history_of_present_illness.trim(),
        physical_exam: editForm.physical_exam.trim(),
        complementary_exam: editForm.complementary_exam.trim(),
        assessment: editForm.assessment.trim(),
        plan: editForm.plan.trim(),
        treatment: editForm.treatment.trim(),
        notes: editForm.notes.trim(),
      };

      await updateVisit(visitId, payload);
      setSuccess(t("visitDetail.updateSuccess"));
      setEditMode(false);
      await load();
    } catch (err) {
      console.log("UPDATE VISIT ERROR:", err?.response?.data || err);
      setError(t("visitDetail.updateError"));
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
      await downloadPrescriptionPdf(rxId, currentLang);
    } catch (err) {
      console.log("PDF DOWNLOAD ERROR:", err?.response?.data || err);
      setError(t("visitDetail.pdfError"));
    } finally {
      setRxDownloadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="cf-animate-in" style={{ padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="cf-skeleton" style={{ height: 32, width: 200 }} />
          <div className="cf-skeleton" style={{ height: 20, width: 300 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
            <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!visit || !patient) return null;

  return (
    <div className="cf-animate-in" style={{ padding: 20, background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 1100, margin: "0 auto" }}>
        <button onClick={() => navigate(`/patients/${id}/visits`)} style={btn}>
          ← {t("visitDetail.backToVisits")}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={goCreatePrescriptionLinked} style={btnPrimary}>
            + {t("visitDetail.createPrescription")}
          </button>

          <Link to={`/patients/${id}`} style={{ ...btn, textDecoration: "none" }}>
            {t("visitDetail.patientDetails")}
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      {/* Header */}
      <div style={{ marginTop: 14, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 26, color: "var(--text)" }}>
              {t("visitDetail.visitNumber", { id: visit.id })} — {patient.first_name} {patient.last_name}
            </h2>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>
              {t("patients.patientCode")}: <b>{patient.patient_code || "-"}</b> · {t("visitDetail.visitDate")}: <b>{formatDateTime(visit.visit_date)}</b>
            </div>
          </div>

          <button onClick={load} style={btn} title={t("common.refresh")}>
            {t("common.refresh")}
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
          <Card
            title={t("visitDetail.visitDetails")}
            right={
              !editMode ? (
                <button onClick={() => setEditMode(true)} style={btn}>
                  {t("common.edit")}
                </button>
              ) : null
            }
          >
            {editMode ? (
              <form onSubmit={handleUpdateVisit}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={label}>{t("patientVisits.visitType")}</label>
                    <select
                      value={editForm.visit_type}
                      onChange={(e) => setEditForm((f) => ({ ...f, visit_type: e.target.value }))}
                      style={input}
                    >
                      <option value="CONSULTATION">{t("patientVisits.consultation")}</option>
                      <option value="FOLLOW_UP">{t("patientVisits.followUp")}</option>
                    </select>
                  </div>

                  <div>
                    <label style={label}>{t("visits.chiefComplaint")}</label>
                    <input
                      value={editForm.chief_complaint}
                      onChange={(e) => setEditForm((f) => ({ ...f, chief_complaint: e.target.value }))}
                      style={input}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.medicalHistory")}</label>
                    <textarea
                      value={editForm.medical_history}
                      onChange={(e) => setEditForm((f) => ({ ...f, medical_history: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.historyOfPresentIllness")}</label>
                    <textarea
                      value={editForm.history_of_present_illness}
                      onChange={(e) => setEditForm((f) => ({ ...f, history_of_present_illness: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.physicalExam")}</label>
                    <textarea
                      value={editForm.physical_exam}
                      onChange={(e) => setEditForm((f) => ({ ...f, physical_exam: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.complementaryExam")}</label>
                    <textarea
                      value={editForm.complementary_exam}
                      onChange={(e) => setEditForm((f) => ({ ...f, complementary_exam: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.assessment")}</label>
                    <textarea
                      value={editForm.assessment}
                      onChange={(e) => setEditForm((f) => ({ ...f, assessment: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.plan")}</label>
                    <textarea
                      value={editForm.plan}
                      onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("patientVisits.treatment")}</label>
                    <textarea
                      value={editForm.treatment}
                      onChange={(e) => setEditForm((f) => ({ ...f, treatment: e.target.value }))}
                      style={textarea}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label style={label}>{t("visits.notes")}</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      style={textarea}
                      rows={3}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                  <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 1 }}>
                    {saving ? t("common.saving") : t("common.save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      // Reset form to original visit data
                      setEditForm({
                        visit_type: visit.visit_type || "CONSULTATION",
                        chief_complaint: visit.chief_complaint || "",
                        medical_history: visit.medical_history || "",
                        history_of_present_illness: visit.history_of_present_illness || "",
                        physical_exam: visit.physical_exam || "",
                        complementary_exam: visit.complementary_exam || "",
                        assessment: visit.assessment || "",
                        plan: visit.plan || "",
                        treatment: visit.treatment || "",
                        notes: visit.notes || "",
                      });
                    }}
                    style={btn}
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={kv}><b>{t("patientVisits.type")}:</b> {formatVisitType(visit.visit_type, t)}</div>
                    <div style={kv}><b>{t("visits.chiefComplaint")}:</b> {visit.chief_complaint || "-"}</div>
                  </div>

                  <div>
                    <b>{t("patientVisits.medicalHistory")}:</b>
                    <div style={box}>{visit.medical_history || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <b>{t("visitDetail.hpi")}:</b>
                    <div style={box}>{visit.history_of_present_illness || "-"}</div>
                  </div>
                  <div>
                    <b>{t("patientVisits.physicalExam")}:</b>
                    <div style={box}>{visit.physical_exam || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <b>{t("patientVisits.complementaryExam")}:</b>
                    <div style={box}>{visit.complementary_exam || "-"}</div>
                  </div>
                  <div>
                    <b>{t("patientVisits.assessment")}:</b>
                    <div style={box}>{visit.assessment || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <b>{t("patientVisits.plan")}:</b>
                    <div style={box}>{visit.plan || "-"}</div>
                  </div>
                  <div>
                    <b>{t("patientVisits.treatment")}:</b>
                    <div style={box}>{visit.treatment || "-"}</div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <b>{t("visits.notes")}:</b>
                  <div style={box}>{visit.notes || "-"}</div>
                </div>
              </>
            )}
          </Card>

          {/* Prescriptions */}
          <Card
            title={t("prescriptions.title")}
            right={
              <button onClick={loadPrescriptions} style={btn} disabled={rxLoading}>
                {rxLoading ? t("common.loading") : t("common.refresh")}
              </button>
            }
            subtitle={t("visitDetail.prescriptionCount", { count: prescriptions.length })}
          >
            {rxError ? <p style={{ color: "#ff6b6b", marginTop: 10 }}>{rxError}</p> : null}

            {!rxLoading && prescriptions.length === 0 ? (
              <p style={{ color: "var(--muted)", marginTop: 10 }}>{t("visitDetail.noPrescriptions")}</p>
            ) : null}

            {prescriptions.length > 0 ? (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {prescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    style={{
                      padding: 12,
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      background: "var(--surface)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      color: "var(--text)",
                    }}
                  >
                    <div>
                      <b>{t("visitDetail.prescriptionNumber", { id: rx.id })}</b>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                        {t("visitDetail.created")}: {formatDateTime(rx.created_at)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadPdf(rx.id)}
                      disabled={rxDownloadingId === rx.id}
                      style={{ ...btnPrimary, whiteSpace: "nowrap" }}
                      title={t("visitDetail.downloadPdf")}
                    >
                      {rxDownloadingId === rx.id ? t("visitDetail.downloading") : "PDF"}
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
            title={t("visits.vitals")}
            subtitle={latestVitals?.measured_at ? `${t("visitDetail.latest")}: ${formatDateTime(latestVitals.measured_at)}` : t("visitDetail.noVitalsRecorded")}
            right={
              <button onClick={() => setShowVitalsForm((s) => !s)} style={btn}>
                {showVitalsForm ? t("common.close") : t("visitDetail.addVitals")}
              </button>
            }
          >
            {!latestVitals ? (
              <div style={{ color: "var(--muted)" }}>{t("visitDetail.noVitalsYet")}</div>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 6 }}>
                <VitalsRow label={t("visits.temperature")} value={latestVitals.temperature_c != null ? `${latestVitals.temperature_c} °C` : "-"} />
                <VitalsRow
                  label={t("visits.bloodPressure")}
                  value={
                    latestVitals.bp_systolic != null && latestVitals.bp_diastolic != null
                      ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}`
                      : "-"
                  }
                />
                <VitalsRow label={t("visits.heartRate")} value={latestVitals.heart_rate_bpm != null ? `${latestVitals.heart_rate_bpm} bpm` : "-"} />
                <VitalsRow label={t("visitDetail.respRate")} value={latestVitals.respiratory_rate_rpm != null ? `${latestVitals.respiratory_rate_rpm} rpm` : "-"} />
                <VitalsRow label="SpO2" value={latestVitals.oxygen_saturation_pct != null ? `${latestVitals.oxygen_saturation_pct}%` : "-"} />
                <VitalsRow label={t("visits.weight")} value={latestVitals.weight_kg != null ? `${latestVitals.weight_kg} kg` : "-"} />
                <VitalsRow label={t("visits.height")} value={latestVitals.height_cm != null ? `${latestVitals.height_cm} cm` : "-"} />
                <VitalsRow
                  label={t("visitDetail.headCircumference")}
                  value={latestVitals.head_circumference_cm != null ? `${latestVitals.head_circumference_cm} cm` : "-"}
                />
              </div>
            )}

            {showVitalsForm ? (
              <form onSubmit={handleCreateVitals} style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                  <div>
                    <label style={label}>{t("visitDetail.measuredAt")}</label>
                    <input
                      type="datetime-local"
                      value={form.measured_at}
                      onChange={(e) => setForm((f) => ({ ...f, measured_at: e.target.value }))}
                      style={input}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText={t("visitDetail.temperatureC")} value={form.temperature_c} onChange={(v) => setForm((f) => ({ ...f, temperature_c: v }))} placeholder="38.5" />
                    <Field labelText={t("visitDetail.oxygenSat")} value={form.oxygen_saturation_pct} onChange={(v) => setForm((f) => ({ ...f, oxygen_saturation_pct: v }))} placeholder="98" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText={t("visitDetail.weightKg")} value={form.weight_kg} onChange={(v) => setForm((f) => ({ ...f, weight_kg: v }))} placeholder="70" />
                    <Field labelText={t("visitDetail.heightCm")} value={form.height_cm} onChange={(v) => setForm((f) => ({ ...f, height_cm: v }))} placeholder="175" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText={t("visitDetail.bpSystolic")} value={form.bp_systolic} onChange={(v) => setForm((f) => ({ ...f, bp_systolic: v }))} placeholder="120" />
                    <Field labelText={t("visitDetail.bpDiastolic")} value={form.bp_diastolic} onChange={(v) => setForm((f) => ({ ...f, bp_diastolic: v }))} placeholder="80" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field labelText={t("visitDetail.heartRateBpm")} value={form.heart_rate_bpm} onChange={(v) => setForm((f) => ({ ...f, heart_rate_bpm: v }))} placeholder="85" />
                    <Field labelText={t("visitDetail.respRateRpm")} value={form.respiratory_rate_rpm} onChange={(v) => setForm((f) => ({ ...f, respiratory_rate_rpm: v }))} placeholder="18" />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                    <Field
                      labelText={t("visitDetail.headCircumferenceCm")}
                      value={form.head_circumference_cm}
                      onChange={(v) => setForm((f) => ({ ...f, head_circumference_cm: v }))}
                      placeholder="47"
                    />
                    <Field labelText={t("visits.notes")} value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} placeholder={t("patientVisits.notesPlaceholder")} />
                  </div>
                </div>

                <button type="submit" disabled={saving} style={{ ...btnPrimary, width: "100%", marginTop: 12 }}>
                  {saving ? t("common.saving") : t("visitDetail.saveVitals")}
                </button>
              </form>
            ) : null}
          </Card>

          {/* Vitals history */}
          <Card title={t("visitDetail.vitalsHistory")} subtitle={t("visitDetail.recordCount", { count: vitalsSorted.length })}>
            {vitalsSorted.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>{t("visitDetail.noVitalsRecordedYet")}</div>
            ) : (
              <div style={{ marginTop: 8, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--surface)" }}>
                      <th style={th}>{t("visitDetail.measured")}</th>
                      <th style={th}>{t("visitDetail.temp")}</th>
                      <th style={th}>BP</th>
                      <th style={th}>HR</th>
                      <th style={th}>SpO2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsSorted.slice(0, 8).map((x) => (
                      <tr key={x.id} style={{ borderTop: "1px solid var(--border)" }}>
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
                  <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 12 }}>
                    {t("visitDetail.showingLatest8")}
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
          <div style={{ fontWeight: 600, fontSize: 16, color: "var(--text)" }}>{title}</div>
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
      <div style={{ color: "var(--muted)", fontWeight: 500, fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: 600, color: "var(--text)" }}>{value}</div>
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

function formatVisitType(value, t) {
  if (!value) return "-";
  if (value === "CONSULTATION") return t("patientVisits.consultation");
  if (value === "FOLLOW_UP") return t("patientVisits.followUp");
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

const label = {
  display: "block",
  fontSize: 12,
  color: "var(--muted)",
  marginBottom: 6,
  fontWeight: 500,
};

const input = {
  width: "100%",
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  outline: "none",
  background: "var(--inputBg)",
  color: "var(--inputText)",
  fontSize: "0.875rem",
};

const textarea = {
  width: "100%",
  padding: 11,
  border: "1px solid var(--border)",
  borderRadius: 10,
  outline: "none",
  background: "var(--inputBg)",
  color: "var(--inputText)",
  fontSize: "0.875rem",
  resize: "vertical",
};

const th = {
  textAlign: "left",
  padding: "10px 10px",
  fontSize: 12,
  color: "var(--muted)",
  borderBottom: "1px solid var(--border)",
  whiteSpace: "nowrap",
  fontWeight: 600,
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

const errorStyle = {
  marginTop: 16,
  padding: "12px 16px",
  borderRadius: 10,
  background: "rgba(239, 68, 68, 0.1)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
  color: "#ef4444",
  fontSize: "0.875rem",
  fontWeight: 500,
  maxWidth: 1100,
  marginLeft: "auto",
  marginRight: "auto",
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
  maxWidth: 1100,
  marginLeft: "auto",
  marginRight: "auto",
};
