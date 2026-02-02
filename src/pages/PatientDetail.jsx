// src/pages/PatientDetail.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPatient, updatePatient, archivePatient, restorePatient } from "../api/patients";
import { api } from "../api/client";
import { getProfile } from "../api/profile";
import { formatDate, formatTime, formatDateTime, formatDateLong } from "../utils/dateFormat";
import PatientFiles from "../components/PatientFiles";
import PatientPrescriptions from "../components/PatientPrescriptions";

// Icons
const Icons = {
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Edit: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
    </svg>
  ),
  Activity: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Phone: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  FileText: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
  ),
  Archive: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>
    </svg>
  ),
  Restore: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="m12 7 4 5-4 5"/>
    </svg>
  ),
};

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function LoadingSkeleton() {
  return (
    <div className="cf-animate-in" style={{ padding: 24 }}>
      <div className="cf-skeleton" style={{ height: 24, width: 100, borderRadius: 8, marginBottom: 24 }} />
      <div className="cf-main-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
        <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
        <div className="cf-skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [patient, setPatient] = useState(null);
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const locale = i18n.language === "fr" ? "fr-FR" : "en-GB";

  // edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    sex: "M",
    phone: "",
    date_of_birth: "",
    address: "",
  });

  // archive/restore state
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // Load user profile to check admin status
      try {
        const profile = await getProfile();
        setIsAdmin(profile?.profile?.role === "admin");
      } catch {
        setIsAdmin(false);
      }

      const data = await getPatient(id);
      setPatient(data);
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        sex: data.sex || "M",
        phone: data.phone || "",
        date_of_birth: data.date_of_birth || "",
        address: data.address || "",
      });

      // Load upcoming appointments for this patient
      try {
        const apptRes = await api.get("/api/appointments/", {
          params: { patient: id, upcoming: "true", page_size: 5 }
        });
        const apptData = apptRes.data;
        setAppointments(Array.isArray(apptData) ? apptData : (apptData.results || []));
      } catch {
        setAppointments([]);
      }
    } catch (err) {
      console.log("PATIENT DETAIL ERROR:", err?.response?.data || err);
      navigate("/patients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        sex: form.sex,
        phone: form.phone.trim(),
        date_of_birth: form.date_of_birth,
        address: form.address.trim(),
      };

      const updated = await updatePatient(id, payload);
      setPatient(updated);
      setEditing(false);
    } catch (err) {
      console.log("UPDATE PATIENT ERROR:", err?.response?.data || err);
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    try {
      await archivePatient(id);
      navigate("/patients");
    } catch (err) {
      console.log("ARCHIVE PATIENT ERROR:", err?.response?.data || err);
      setShowArchiveConfirm(false);
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore() {
    setArchiving(true);
    try {
      await restorePatient(id);
      // Reload patient data to reflect restored status
      await load();
    } catch (err) {
      console.log("RESTORE PATIENT ERROR:", err?.response?.data || err);
    } finally {
      setArchiving(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (!patient) return null;

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="cf-animate-in">
      {/* Back button */}
      <button
        onClick={() => navigate("/patients")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
          background: "var(--card)", color: "var(--text)", cursor: "pointer",
          fontWeight: 500, fontSize: "0.875rem", marginBottom: 20,
        }}
      >
        <Icons.ArrowLeft />
        {t("common.back")}
      </button>

      {/* Archived Banner */}
      {!patient.is_active && (
        <div style={{
          padding: "12px 16px", marginBottom: 20, borderRadius: 8,
          background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#d97706" }}>
            <Icons.Archive />
            <span style={{ fontWeight: 500 }}>{t("patients.archivedPatientBanner")}</span>
          </div>
          {isAdmin && (
            <button
              onClick={handleRestore}
              disabled={archiving}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                borderRadius: 8, border: "none", background: "#22c55e", color: "white",
                cursor: archiving ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.8125rem",
                opacity: archiving ? 0.7 : 1,
              }}
            >
              <Icons.Restore />
              {archiving ? t("common.loading") : t("patients.restorePatient")}
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: patient.sex === "M" ? "rgba(59, 130, 246, 0.1)" : "rgba(236, 72, 153, 0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: patient.sex === "M" ? "#3b82f6" : "#ec4899",
          }}>
            <Icons.User />
          </div>
          <div>
            <h1 style={{ marginBottom: 4 }}>{patient.first_name} {patient.last_name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--muted)", fontSize: "0.875rem" }}>
              <span style={{
                fontFamily: "monospace", background: "var(--surface)",
                padding: "4px 8px", borderRadius: 4,
              }}>
                {patient.patient_code || "-"}
              </span>
              {age !== null && (
                <span>{age} {t("patients.years")}</span>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 9999,
                fontSize: "0.75rem", fontWeight: 600,
                background: patient.sex === "M" ? "rgba(59, 130, 246, 0.1)" : "rgba(236, 72, 153, 0.1)",
                color: patient.sex === "M" ? "#3b82f6" : "#ec4899",
              }}>
                {patient.sex === "M" ? t("patients.male") : t("patients.female")}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {patient.is_active && (
            <>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                  borderRadius: 8, border: "none", background: "var(--accent)", color: "white",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}
              >
                <Icons.Edit />
                {t("patients.editPatient")}
              </button>
              <button
                onClick={() => setShowArchiveConfirm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                  borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}
              >
                <Icons.Archive />
                {t("patients.archivePatient")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Archive Confirmation Dialog */}
      {showArchiveConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="cf-modal-content" style={{
            background: "var(--card)", padding: 24, borderRadius: 16,
            maxWidth: 400, width: "90%", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}>
            <h3 style={{ margin: "0 0 12px 0" }}>{t("patients.archiveConfirmTitle")}</h3>
            <p style={{ color: "var(--muted)", margin: "0 0 20px 0", fontSize: "0.875rem" }}>
              {t("patients.archiveConfirmMessage", { name: `${patient.first_name} ${patient.last_name}` })}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                disabled={archiving}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--card)", color: "var(--text)", cursor: "pointer",
                  fontWeight: 500, fontSize: "0.875rem",
                }}
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleArchive}
                disabled={archiving}
                style={{
                  padding: "10px 20px", borderRadius: 8, border: "none",
                  background: "#ef4444", color: "white", cursor: archiving ? "not-allowed" : "pointer",
                  fontWeight: 600, fontSize: "0.875rem", opacity: archiving ? 0.7 : 1,
                }}
              >
                {archiving ? t("common.loading") : t("patients.archivePatient")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form (modal-style) */}
      {editing && (
        <form onSubmit={handleSave} style={{
          marginBottom: 24, padding: 24, border: "1px solid var(--border)",
          borderRadius: 16, background: "var(--card)", boxShadow: "var(--shadow)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>{t("patients.editPatient")}</h3>
            <button type="button" onClick={() => {
              setForm({
                first_name: patient.first_name || "",
                last_name: patient.last_name || "",
                sex: patient.sex || "M",
                phone: patient.phone || "",
                date_of_birth: patient.date_of_birth || "",
                address: patient.address || "",
              });
              setEditing(false);
            }} style={{
              background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.25rem", lineHeight: 1,
            }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <label style={labelStyle}>{t("patients.firstName")} *</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>{t("patients.lastName")} *</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>{t("patients.sex")} *</label>
              <select
                value={form.sex}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
                required
              >
                <option value="M">{t("patients.male")}</option>
                <option value="F">{t("patients.female")}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t("patients.dateOfBirth")} *</label>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>{t("patients.phone")}</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>{t("patients.address")} *</label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" disabled={saving} style={{
              padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--accent)",
              color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600,
              fontSize: "0.875rem", opacity: saving ? 0.7 : 1,
            }}>
              {saving ? t("common.saving") : t("common.save")}
            </button>
            <button type="button" onClick={() => {
              setForm({
                first_name: patient.first_name || "",
                last_name: patient.last_name || "",
                sex: patient.sex || "M",
                phone: patient.phone || "",
                date_of_birth: patient.date_of_birth || "",
                address: patient.address || "",
              });
              setEditing(false);
            }} style={{
              padding: "10px 24px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--text)", cursor: "pointer", fontWeight: 500, fontSize: "0.875rem",
            }}>
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Main content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
        {/* Left column - Patient info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Personal Information */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>{t("patients.personalInformation")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoRow label={t("patients.patientCode")} value={patient.patient_code || "-"} mono />
              <InfoRow label={t("patients.dateOfBirth")} value={formatDate(patient.date_of_birth)} />
              <InfoRow label={t("patients.age")} value={age !== null ? `${age} ${t("patients.years")}` : "-"} />
              <InfoRow label={t("patients.sex")} value={patient.sex === "M" ? t("patients.male") : t("patients.female")} />
            </div>
          </div>

          {/* Contact Information */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>{t("patients.contactInformation")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icons.Phone />
                <span>{patient.phone || "-"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <Icons.MapPin />
                <span>{patient.address || "-"}</span>
              </div>
            </div>
          </div>

          {/* Visit Info */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>{t("patients.medicalInfo")}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoRow
                label={t("patients.lastVisit")}
                value={formatDateTime(patient.last_visit_date)}
                linkTo={patient.last_visit_id ? `/patients/${id}/visits/${patient.last_visit_id}` : null}
              />
              <InfoRow label={t("patients.nextVisit")} value={formatDateTime(patient.next_visit_date)} />
              <InfoRow label={t("patients.weight")} value={patient.latest_weight_kg ? `${patient.latest_weight_kg} kg` : "-"} />
            </div>
          </div>
        </div>

        {/* Right column - Quick actions and activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Quick Actions */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>{t("patients.quickActions")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <Link to={`/patients/${id}/visits`} style={actionCardStyle}>
                <Icons.Activity />
                <span>{t("patients.viewVisits")}</span>
              </Link>
              <Link to={`/appointments`} style={actionCardStyle}>
                <Icons.Calendar />
                <span>{t("patients.newAppointment")}</span>
              </Link>
              <Link to={`/prescriptions?patient=${id}`} style={actionCardStyle}>
                <Icons.FileText />
                <span>{t("patients.createPrescription")}</span>
              </Link>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div style={cardStyle}>
            <h3 style={cardHeaderStyle}>{t("patients.upcomingAppointments")}</h3>
            {appointments.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
                {t("patients.noUpcomingAppointments")}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {appointments.map((appt) => {
                  const statusStyles = {
                    SCHEDULED: { background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" },
                    CONFIRMED: { background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" },
                    CANCELLED: { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
                    COMPLETED: { background: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
                    NO_SHOW: { background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
                    RESCHEDULED: { background: "rgba(249, 115, 22, 0.1)", color: "#f97316" },
                  };
                  const statusLabels = {
                    SCHEDULED: t("appointments.planned"),
                    CONFIRMED: t("appointments.confirmed"),
                    CANCELLED: t("appointments.cancelled"),
                    COMPLETED: t("appointments.completed"),
                    NO_SHOW: t("appointments.noShow"),
                    RESCHEDULED: t("appointments.rescheduled"),
                  };
                  const sStyle = statusStyles[appt.status] || statusStyles.SCHEDULED;
                  return (
                    <div key={appt.id} style={{
                      padding: 12, borderRadius: 8, background: "var(--surface)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {formatDateLong(appt.scheduled_at, locale)}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                          {formatTime(appt.scheduled_at)}
                          {appt.reason && ` - ${appt.reason}`}
                        </div>
                      </div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 9999,
                        fontSize: "0.75rem", fontWeight: 600,
                        ...sStyle,
                      }}>
                        {statusLabels[appt.status] || appt.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Prescriptions Section */}
      <PatientPrescriptions patientId={id} />

      {/* Patient Files Section */}
      <PatientFiles patientId={id} />
    </div>
  );
}

function InfoRow({ label, value, mono, linkTo }) {
  const valueStyle = {
    fontWeight: 500,
    fontFamily: mono ? "monospace" : "inherit",
    background: mono ? "var(--surface)" : "transparent",
    padding: mono ? "4px 8px" : 0,
    borderRadius: mono ? 4 : 0,
  };

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{label}</span>
      {linkTo ? (
        <Link
          to={linkTo}
          style={{
            ...valueStyle,
            color: "var(--accent)",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
        >
          {value}
        </Link>
      ) : (
        <span style={valueStyle}>
          {value}
        </span>
      )}
    </div>
  );
}

const labelStyle = {
  display: "block", marginBottom: 6, fontSize: "0.875rem", fontWeight: 500, color: "var(--text)",
};

const cardStyle = {
  padding: 20, borderRadius: 16, border: "1px solid var(--border)",
  background: "var(--card)",
};

const cardHeaderStyle = {
  margin: "0 0 16px 0", fontSize: "1rem", fontWeight: 600,
};

const actionCardStyle = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  gap: 8, padding: 16, borderRadius: 12, background: "var(--surface)",
  textDecoration: "none", color: "var(--text)", fontWeight: 500, fontSize: "0.8125rem",
  textAlign: "center", transition: "all 150ms ease",
};
