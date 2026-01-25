// src/pages/Appointments.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { formatDateTime } from "../utils/dateFormat";
import AppointmentsCalendar from "../components/AppointmentsCalendar";
import DayAppointmentsModal from "../components/DayAppointmentsModal";

// Icons
const Icons = {
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14"/><path d="M5 12h14"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  List: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/>
      <line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  ),
};

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function TableSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <div className="cf-skeleton" style={{ height: 20, width: "10%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "20%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "15%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "15%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "10%", borderRadius: 4 }} />
          <div className="cf-skeleton" style={{ height: 20, width: "15%", borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}

export default function Appointments() {
  const { t } = useTranslation();

  const STATUS_OPTIONS = [
    { value: "SCHEDULED", label: t("appointments.scheduled") },
    { value: "CONFIRMED", label: t("appointments.confirmed") },
    { value: "CANCELLED", label: t("appointments.cancelled") },
    { value: "COMPLETED", label: t("appointments.completed") },
    { value: "NO_SHOW", label: t("appointments.noShow") },
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  // View mode: "list" or "calendar"
  const [viewMode, setViewMode] = useState("list");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarAppointments, setCalendarAppointments] = useState([]);

  // Day detail modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState([]);

  // Filters
  const [filterPatient, setFilterPatient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUpcoming, setFilterUpcoming] = useState(true);

  // Form visibility
  const [showForm, setShowForm] = useState(false);

  // Create form
  const [form, setForm] = useState(() => {
    const nowPlus1h = new Date(Date.now() + 60 * 60 * 1000);
    return {
      patient: "",
      doctor: "",
      scheduled_at: toLocalInputValue(nowPlus1h),
      status: "SCHEDULED",
      reason: "",
      notes: "",
      visit: "",
    };
  });

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const patientById = useMemo(() => {
    const map = new Map();
    for (const p of patients) map.set(String(p.id), p);
    return map;
  }, [patients]);

  const doctorById = useMemo(() => {
    const map = new Map();
    for (const d of doctors) map.set(String(d.id), d);
    return map;
  }, [doctors]);

  async function loadPatients() {
    setPatientsLoading(true);
    try {
      const res = await api.get("/api/patients/", { params: { page: 1, page_size: 200 } });
      setPatients(unwrapList(res.data));
    } catch (e) {
      console.log("LOAD PATIENTS ERROR:", e?.response?.data || e);
    } finally {
      setPatientsLoading(false);
    }
  }

  async function loadDoctors() {
    setDoctorsLoading(true);
    try {
      const res = await api.get("/api/appointments/doctors/");
      setDoctors(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.log("LOAD DOCTORS ERROR:", e?.response?.data || e);
    } finally {
      setDoctorsLoading(false);
    }
  }

  async function loadAppointments() {
    setLoading(true);
    setError("");
    try {
      const params = { page: 1, page_size: 200 };
      if (filterPatient) params.patient = filterPatient;
      if (filterStatus) params.status = filterStatus;
      if (filterUpcoming) params.upcoming = "true";

      const res = await api.get("/api/appointments/", { params });
      setItems(unwrapList(res.data));
    } catch (e) {
      console.log("LOAD APPOINTMENTS ERROR:", e?.response?.data || e);
      setError(t("appointments.endpointFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarAppointments(monthDate) {
    setLoading(true);
    setError("");
    try {
      // Get first and last day of the month (with some padding for display)
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const startDate = new Date(year, month - 1, 1); // Include prev month for padding
      const endDate = new Date(year, month + 2, 0); // Include next month for padding

      const params = {
        page: 1,
        page_size: 500,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };
      if (filterPatient) params.patient = filterPatient;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get("/api/appointments/", { params });
      setCalendarAppointments(unwrapList(res.data));
    } catch (e) {
      console.log("LOAD CALENDAR APPOINTMENTS ERROR:", e?.response?.data || e);
      setError(t("appointments.endpointFailed"));
      setCalendarAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  function handleDayClick(date, appointments) {
    if (appointments.length > 0) {
      setSelectedDay(date);
      setSelectedDayAppointments(appointments);
    }
  }

  function handleCalendarAppointmentClick(appt) {
    setSelectedDay(null);
    setSelectedDayAppointments([]);
    beginEdit(appt);
  }

  function handleMonthChange(newMonth) {
    setCurrentMonth(newMonth);
  }

  useEffect(() => {
    loadPatients();
    loadDoctors();
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load calendar appointments when view mode changes or month changes
  useEffect(() => {
    if (viewMode === "calendar") {
      loadCalendarAppointments(currentMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, currentMonth, filterPatient, filterStatus]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        patient_id: Number(form.patient),
        doctor: form.doctor ? Number(form.doctor) : null,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        status: form.status,
        reason: form.reason || "",
        notes: form.notes || "",
        visit: form.visit ? Number(form.visit) : null,
      };

      if (!payload.patient_id || Number.isNaN(payload.patient_id)) {
        setError(t("appointments.selectPatientError"));
        setSaving(false);
        return;
      }

      await api.post("/api/appointments/", payload);

      const keepPatient = form.patient;
      const keepDoctor = form.doctor;
      const next = new Date(Date.now() + 60 * 60 * 1000);
      setForm((f) => ({
        ...f,
        patient: keepPatient,
        doctor: keepDoctor,
        scheduled_at: toLocalInputValue(next),
        status: "SCHEDULED",
        reason: "",
        notes: "",
        visit: "",
      }));
      setShowForm(false);
      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("CREATE APPOINTMENT ERROR:", detail || e);
      if (detail && typeof detail === "object") {
        // Parse validation errors into readable messages
        const messages = [];
        for (const [field, errors] of Object.entries(detail)) {
          const errorList = Array.isArray(errors) ? errors : [errors];
          for (const err of errorList) {
            if (field === "scheduled_at" && err.includes("past")) {
              messages.push(t("appointments.cannotBeInPast"));
            } else {
              messages.push(`${field}: ${err}`);
            }
          }
        }
        setError(messages.join("\n") || t("appointments.createFailed"));
      } else {
        setError(t("appointments.createFailed"));
      }
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(appt) {
    setEditingId(appt.id);
    setEditForm({
      patient: String(appt.patient?.id ?? appt.patient ?? ""),
      doctor: String(appt.doctor_details?.id ?? appt.doctor ?? ""),
      scheduled_at: appt.scheduled_at ? toLocalInputValue(new Date(appt.scheduled_at)) : "",
      status: appt.status || "SCHEDULED",
      reason: appt.reason || "",
      notes: appt.notes || "",
      visit: appt.visit ? String(appt.visit?.id ?? appt.visit) : "",
    });
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    setSaving(true);
    setError("");

    try {
      const payload = {
        patient_id: Number(editForm.patient),
        doctor: editForm.doctor ? Number(editForm.doctor) : null,
        scheduled_at: editForm.scheduled_at ? new Date(editForm.scheduled_at).toISOString() : null,
        status: editForm.status,
        reason: editForm.reason || "",
        notes: editForm.notes || "",
        visit: editForm.visit ? Number(editForm.visit) : null,
      };

      await api.patch(`/api/appointments/${editingId}/`, payload);
      setEditingId(null);
      setEditForm(null);
      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("UPDATE APPOINTMENT ERROR:", detail || e);
      if (detail && typeof detail === "object") {
        const messages = [];
        for (const [field, errors] of Object.entries(detail)) {
          const errorList = Array.isArray(errors) ? errors : [errors];
          for (const err of errorList) {
            if (field === "scheduled_at" && err.includes("past")) {
              messages.push(t("appointments.cannotBeInPast"));
            } else {
              messages.push(`${field}: ${err}`);
            }
          }
        }
        setError(messages.join("\n") || t("appointments.updateFailed"));
      } else {
        setError(t("appointments.updateFailed"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteAppointment(id) {
    if (!window.confirm(t("appointments.deleteConfirm"))) return;
    setSaving(true);
    setError("");

    try {
      await api.delete(`/api/appointments/${id}/`);
      await loadAppointments();
    } catch (e) {
      const detail = e?.response?.data;
      console.log("DELETE APPOINTMENT ERROR:", detail || e);
      setError(detail ? JSON.stringify(detail, null, 2) : t("appointments.deleteFailed"));
    } finally {
      setSaving(false);
    }
  }

  function getPatientInfo(appt) {
    const pObj = appt.patient && typeof appt.patient === "object" ? appt.patient : null;
    if (pObj) {
      return {
        id: pObj.id,
        name: `${pObj.first_name || ""} ${pObj.last_name || ""}`.trim() || `Patient #${pObj.id}`,
      };
    }

    const pid = appt.patient != null ? String(appt.patient) : "";
    const p = pid ? patientById.get(pid) : null;
    if (p) {
      return {
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
      };
    }
    return { id: pid || null, name: pid ? `Patient #${pid}` : "-" };
  }

  function renderDoctorLabel(appt) {
    // If API returns doctor_details object
    if (appt.doctor_details) {
      return appt.doctor_details.full_name || `${appt.doctor_details.first_name || ""} ${appt.doctor_details.last_name || ""}`.trim() || appt.doctor_details.username;
    }
    // Fallback to doctor ID
    const did = appt.doctor != null ? String(appt.doctor) : "";
    const d = did ? doctorById.get(did) : null;
    if (d) return d.full_name || `${d.first_name} ${d.last_name}`;
    return did ? `Doctor #${did}` : "-";
  }

  function getStatusStyle(status) {
    const styles = {
      SCHEDULED: { background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" },
      CONFIRMED: { background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" },
      CANCELLED: { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
      COMPLETED: { background: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
      NO_SHOW: { background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
    };
    return styles[status] || styles.SCHEDULED;
  }

  function getStatusLabel(status) {
    const labels = {
      SCHEDULED: t("appointments.scheduled"),
      CONFIRMED: t("appointments.confirmed"),
      CANCELLED: t("appointments.cancelled"),
      COMPLETED: t("appointments.completed"),
      NO_SHOW: t("appointments.noShow"),
    };
    return labels[status] || status;
  }

  return (
    <div className="cf-animate-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{t("appointments.title")}</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            {t("appointments.subtitle")}
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
          {t("appointments.newAppointment")}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          marginBottom: 24, padding: 24, border: "1px solid var(--border)",
          borderRadius: 16, background: "var(--card)", boxShadow: "var(--shadow)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>{t("appointments.newAppointment")}</h3>
            <button type="button" onClick={() => setShowForm(false)} style={{
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1,
            }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelStyle}>{t("appointments.patient")} *</label>
              <select
                value={form.patient}
                onChange={(e) => setForm((f) => ({ ...f, patient: e.target.value }))}
                required
                disabled={patientsLoading}
              >
                <option value="">{t("appointments.selectPatient")}</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} (#{p.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>{t("appointments.doctor")}</label>
              <select
                value={form.doctor}
                onChange={(e) => setForm((f) => ({ ...f, doctor: e.target.value }))}
                disabled={doctorsLoading}
              >
                <option value="">{t("appointments.selectDoctor")}</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.full_name || `${d.first_name} ${d.last_name}`} {d.role && `(${t(`profile.roles.${d.role}`)})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>{t("appointments.scheduledAt")} *</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                required
              />
              <div style={{ marginTop: 4, color: "var(--muted)", fontSize: "0.75rem" }}>
                {t("appointments.backendRejectsPast")}
              </div>
            </div>

            <div>
              <label style={labelStyle}>{t("appointments.status")}</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>{t("appointments.reason")}</label>
              <input value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>

            <div>
              <label style={labelStyle}>{t("appointments.notes")}</label>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={{
              padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)",
              color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600,
              fontSize: "0.875rem", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? t("common.saving") : t("appointments.createAppointment")}
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

      {/* View Toggle */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("list")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "8px 0 0 8px",
            border: "1px solid var(--border)",
            borderRight: "none",
            background: viewMode === "list" ? "var(--accent)" : "var(--card)",
            color: viewMode === "list" ? "white" : "var(--text)",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 150ms ease",
          }}
        >
          <Icons.List />
          {t("appointments.listView")}
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "0 8px 8px 0",
            border: "1px solid var(--border)",
            background: viewMode === "calendar" ? "var(--accent)" : "var(--card)",
            color: viewMode === "calendar" ? "white" : "var(--text)",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.875rem",
            transition: "all 150ms ease",
          }}
        >
          <Icons.Calendar />
          {t("appointments.calendarView")}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>{t("appointments.filterByPatient")}</label>
          <select
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            disabled={patientsLoading}
          >
            <option value="">{t("appointments.allPatients")}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ minWidth: 160 }}>
          <label style={labelStyle}>{t("appointments.filterByStatus")}</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">{t("appointments.allStatuses")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {viewMode === "list" && (
          <div style={{ minWidth: 140 }}>
            <label style={labelStyle}>{t("appointments.upcomingOnly")}</label>
            <select value={filterUpcoming ? "yes" : "no"} onChange={(e) => setFilterUpcoming(e.target.value === "yes")}>
              <option value="yes">{t("common.yes")}</option>
              <option value="no">{t("common.no")}</option>
            </select>
          </div>
        )}

        <button
          onClick={() => viewMode === "calendar" ? loadCalendarAppointments(currentMonth) : loadAppointments()}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)",
            cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, fontSize: "0.875rem",
          }}
        >
          <Icons.Refresh />
          {loading ? t("common.loading") : t("common.refresh")}
        </button>

        {(filterPatient || filterStatus) && (
          <button onClick={() => { setFilterPatient(""); setFilterStatus(""); }} style={{
            padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--muted)", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
          }}>
            {t("common.clear")}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: 20, padding: 16, borderRadius: 12,
          background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444", fontSize: "0.875rem", whiteSpace: "pre-wrap",
        }}>
          {error}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <>
          <AppointmentsCalendar
            appointments={calendarAppointments}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            onDayClick={handleDayClick}
            onAppointmentClick={handleCalendarAppointmentClick}
          />
          {selectedDay && (
            <DayAppointmentsModal
              date={selectedDay}
              appointments={selectedDayAppointments}
              onClose={() => {
                setSelectedDay(null);
                setSelectedDayAppointments([]);
              }}
              onAppointmentClick={handleCalendarAppointmentClick}
            />
          )}
        </>
      )}

      {/* Appointments Table (List View) */}
      {viewMode === "list" && (
      <div style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
        {loading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: "var(--surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", color: "var(--muted)",
            }}>
              <Icons.Calendar />
            </div>
            <p style={{ color: "var(--muted)", margin: 0 }}>{t("appointments.noAppointments")}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--tableHead)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>{t("appointments.patient")}</th>
                  <th style={thStyle}>{t("appointments.doctor")}</th>
                  <th style={thStyle}>{t("appointments.scheduledAt")}</th>
                  <th style={thStyle}>{t("appointments.status")}</th>
                  <th style={thStyle}>{t("appointments.reason")}</th>
                  <th style={thStyle}>{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => {
                  const isEditing = editingId === a.id;

                  if (isEditing) {
                    return (
                      <tr key={a.id} style={{ background: "var(--surface)" }}>
                        <td colSpan={7} style={{ padding: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                            <h4 style={{ margin: 0 }}>{t("appointments.editAppointment")} #{a.id}</h4>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => { setEditingId(null); setEditForm(null); }} disabled={saving} style={actionBtnStyle}>
                                {t("common.cancel")}
                              </button>
                              <button onClick={saveEdit} disabled={saving} style={{ ...actionBtnStyle, background: "var(--accent)", color: "white", border: "none" }}>
                                {saving ? t("common.saving") : t("common.save")}
                              </button>
                            </div>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            <div>
                              <label style={labelStyle}>{t("appointments.patient")}</label>
                              <select
                                value={editForm.patient}
                                onChange={(e) => setEditForm((f) => ({ ...f, patient: e.target.value }))}
                              >
                                <option value="">{t("appointments.selectPatient")}</option>
                                {patients.map((p) => (
                                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>{t("appointments.doctor")}</label>
                              <select
                                value={editForm.doctor}
                                onChange={(e) => setEditForm((f) => ({ ...f, doctor: e.target.value }))}
                              >
                                <option value="">{t("appointments.selectDoctor")}</option>
                                {doctors.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.full_name || `${d.first_name} ${d.last_name}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>{t("appointments.scheduledAt")}</label>
                              <input
                                type="datetime-local"
                                value={editForm.scheduled_at}
                                onChange={(e) => setEditForm((f) => ({ ...f, scheduled_at: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>{t("appointments.status")}</label>
                              <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>{t("appointments.reason")}</label>
                              <input value={editForm.reason} onChange={(e) => setEditForm((f) => ({ ...f, reason: e.target.value }))} />
                            </div>
                            <div>
                              <label style={labelStyle}>{t("appointments.notes")}</label>
                              <input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={a.id}
                      style={{ transition: "background 150ms ease" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--tableRowHover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.8125rem", background: "var(--surface)", padding: "4px 8px", borderRadius: 4 }}>
                          {a.id}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {(() => {
                          const patient = getPatientInfo(a);
                          return patient.id ? (
                            <Link
                              to={`/patients/${patient.id}`}
                              style={{
                                fontWeight: 600,
                                color: "var(--accent)",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                              onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                            >
                              {patient.name}
                            </Link>
                          ) : (
                            <span style={{ fontWeight: 600 }}>{patient.name}</span>
                          );
                        })()}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Icons.User />
                          <span>{renderDoctorLabel(a)}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {formatDateTime(a.scheduled_at)}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 9999,
                          fontSize: "0.75rem", fontWeight: 600,
                          ...getStatusStyle(a.status),
                        }}>
                          {getStatusLabel(a.status)}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {a.reason || "-"}
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => beginEdit(a)} style={actionBtnStyle}>{t("common.edit")}</button>
                          <button
                            onClick={() => deleteAppointment(a.id)}
                            disabled={saving}
                            style={{ ...actionBtnStyle, borderColor: "rgba(239, 68, 68, 0.3)", color: "#ef4444" }}
                          >
                            {t("common.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)",
};

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
