import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// Icons
const Icons = {
  X: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18"/><path d="M6 6l12 12"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

function getStatusStyle(status) {
  const styles = {
    SCHEDULED: { background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" },
    CONFIRMED: { background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" },
    CANCELLED: { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
    COMPLETED: { background: "rgba(107, 114, 128, 0.1)", color: "#6b7280" },
    NO_SHOW: { background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" },
    RESCHEDULED: { background: "rgba(249, 115, 22, 0.1)", color: "#f97316" },
  };
  return styles[status] || styles.SCHEDULED;
}

export default function DayAppointmentsModal({
  date,
  appointments,
  onClose,
  onAppointmentClick,
}) {
  const { t, i18n } = useTranslation();

  if (!date) return null;

  const dateLabel = date.toLocaleDateString(
    i18n.language === "fr" ? "fr-FR" : "en-US",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );

  function getPatientInfo(appt) {
    if (appt.patient && typeof appt.patient === "object") {
      const first = appt.patient.first_name || "";
      const last = appt.patient.last_name || "";
      return {
        id: appt.patient.id,
        name: `${first} ${last}`.trim() || `Patient #${appt.patient.id}`,
      };
    }
    return {
      id: appt.patient,
      name: `Patient #${appt.patient}`,
    };
  }

  function getDoctorName(appt) {
    if (appt.doctor_details) {
      return appt.doctor_details.full_name ||
        `${appt.doctor_details.first_name || ""} ${appt.doctor_details.last_name || ""}`.trim() ||
        appt.doctor_details.username;
    }
    return appt.doctor ? `Doctor #${appt.doctor}` : "-";
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(i18n.language === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusLabel(status) {
    const labels = {
      SCHEDULED: t("appointments.planned"),
      CONFIRMED: t("appointments.confirmed"),
      CANCELLED: t("appointments.cancelled"),
      COMPLETED: t("appointments.completed"),
      NO_SHOW: t("appointments.noShow"),
      RESCHEDULED: t("appointments.rescheduled"),
    };
    return labels[status] || status;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="cf-modal-content"
        style={{
          background: "var(--card)",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: 500,
          width: "100%",
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, textTransform: "capitalize" }}>
              {dateLabel}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.8125rem", color: "var(--muted)" }}>
              {appointments.length === 0
                ? t("appointments.noAppointmentsOnDay")
                : `${appointments.length} ${appointments.length === 1 ? t("appointments.appointment") : t("appointments.appointmentsPlural")}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--muted)";
            }}
          >
            <Icons.X />
          </button>
        </div>

        {/* Appointments List */}
        <div style={{ flex: 1, overflow: "auto", padding: appointments.length > 0 ? 12 : 20 }}>
          {appointments.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
              <p style={{ margin: 0 }}>{t("appointments.noAppointmentsOnDay")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {appointments.map((appt) => {
                const statusStyle = getStatusStyle(appt.status);
                const patient = getPatientInfo(appt);
                return (
                  <div
                    key={appt.id}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Time and Status */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}>
                      <div
                        onClick={() => onAppointmentClick(appt)}
                        style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text)", cursor: "pointer" }}
                      >
                        <Icons.Clock />
                        <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                          {formatTime(appt.scheduled_at)}
                        </span>
                      </div>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 9999,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        ...statusStyle,
                      }}>
                        {getStatusLabel(appt.status)}
                      </span>
                    </div>

                    {/* Patient */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Icons.User />
                      <Link
                        to={`/patients/${patient.id}`}
                        style={{
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          color: "var(--accent)",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                      >
                        {patient.name}
                      </Link>
                    </div>

                    {/* Doctor */}
                    <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {t("appointments.doctor")}: {getDoctorName(appt)}
                    </div>

                    {/* Reason */}
                    {appt.reason && (
                      <div style={{
                        marginTop: 8,
                        padding: "6px 8px",
                        borderRadius: 6,
                        background: "var(--card)",
                        fontSize: "0.8125rem",
                        color: "var(--text)",
                      }}>
                        {appt.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
