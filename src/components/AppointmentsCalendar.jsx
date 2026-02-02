import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// Icons
const Icons = {
  ChevronLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
};

function getStatusStyle(status) {
  const styles = {
    SCHEDULED: { background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", borderColor: "#3b82f6" },
    CONFIRMED: { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", borderColor: "#22c55e" },
    CANCELLED: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", borderColor: "#ef4444" },
    COMPLETED: { background: "rgba(107, 114, 128, 0.15)", color: "#6b7280", borderColor: "#6b7280" },
    NO_SHOW: { background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "#f59e0b" },
  };
  return styles[status] || styles.SCHEDULED;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  // Returns 0 (Sunday) to 6 (Saturday)
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isToday(date) {
  return isSameDay(date, new Date());
}

export default function AppointmentsCalendar({
  appointments,
  currentMonth,
  onMonthChange,
  onDayClick,
  onAppointmentClick,
}) {
  const { t, i18n } = useTranslation();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Day names - start with Monday for French locale, Sunday for English
  const dayNames = useMemo(() => {
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    const days = [];
    // Start from Monday (1) to Sunday (0)
    const startDay = i18n.language === "fr" ? 1 : 0; // Monday for FR, Sunday for EN
    for (let i = 0; i < 7; i++) {
      const dayIndex = (startDay + i) % 7;
      const date = new Date(2024, 0, dayIndex === 0 ? 7 : dayIndex); // Jan 2024 starts on Monday
      days.push(date.toLocaleDateString(locale, { weekday: "short" }));
    }
    return days;
  }, [i18n.language]);

  // Group appointments by date (YYYY-MM-DD)
  const appointmentsByDate = useMemo(() => {
    const map = new Map();
    for (const appt of appointments) {
      if (!appt.scheduled_at) continue;
      const date = new Date(appt.scheduled_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(appt);
    }
    // Sort appointments within each day by time
    for (const [key, appts] of map) {
      appts.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    }
    return map;
  }, [appointments]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, month);
    let firstDay = getFirstDayOfMonth(year, month);

    // Adjust for Monday start (French) vs Sunday start (English)
    if (i18n.language === "fr") {
      firstDay = firstDay === 0 ? 6 : firstDay - 1;
    }

    const days = [];

    // Previous month days (padding)
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(prevYear, prevMonth, daysInPrevMonth - i),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        date: new Date(year, month, day),
      });
    }

    // Next month days (padding to complete grid)
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        day,
        isCurrentMonth: false,
        date: new Date(nextYear, nextMonth, day),
      });
    }

    return days;
  }, [year, month, i18n.language]);

  function handlePrevMonth() {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  }

  function handleNextMonth() {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  }

  function handleToday() {
    onMonthChange(new Date());
  }

  function getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

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

  function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(i18n.language === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const monthYearLabel = currentMonth.toLocaleDateString(
    i18n.language === "fr" ? "fr-FR" : "en-US",
    { month: "long", year: "numeric" }
  );

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 16, background: "var(--card)", overflow: "hidden" }}>
      {/* Calendar Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--tableHead)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handlePrevMonth} style={navBtnStyle} title={t("appointments.previousMonth")}>
            <Icons.ChevronLeft />
          </button>
          <button onClick={handleNextMonth} style={navBtnStyle} title={t("appointments.nextMonth")}>
            <Icons.ChevronRight />
          </button>
          <button onClick={handleToday} style={{ ...navBtnStyle, padding: "6px 12px", fontSize: "0.8125rem" }}>
            {t("appointments.today")}
          </button>
        </div>
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 600, textTransform: "capitalize" }}>
          {monthYearLabel}
        </h3>
        <div style={{ width: 120 }} /> {/* Spacer for centering */}
      </div>

      {/* Day Names Header */}
      <div className="cf-calendar-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {dayNames.map((name, i) => (
          <div
            key={i}
            style={{
              padding: "10px 8px",
              textAlign: "center",
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted)",
            }}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="cf-calendar-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gridTemplateRows: "repeat(6, minmax(100px, auto))",
      }}>
        {calendarDays.map((dayInfo, i) => {
          const dateKey = getDateKey(dayInfo.date);
          const dayAppointments = appointmentsByDate.get(dateKey) || [];
          const todayClass = isToday(dayInfo.date);

          return (
            <div
              key={i}
              onClick={() => onDayClick(dayInfo.date, dayAppointments)}
              style={{
                padding: 8,
                borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border-light)" : "none",
                borderBottom: i < 35 ? "1px solid var(--border-light)" : "none",
                background: !dayInfo.isCurrentMonth ? "var(--surface)" : "transparent",
                cursor: dayAppointments.length > 0 ? "pointer" : "default",
                minHeight: 100,
                overflow: "hidden",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => {
                if (dayAppointments.length > 0) {
                  e.currentTarget.style.background = "var(--tableRowHover)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !dayInfo.isCurrentMonth ? "var(--surface)" : "transparent";
              }}
            >
              {/* Day Number */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 4,
              }}>
                <span style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  fontSize: "0.875rem",
                  fontWeight: todayClass ? 700 : 500,
                  color: !dayInfo.isCurrentMonth ? "var(--muted)" : todayClass ? "white" : "var(--text)",
                  background: todayClass ? "var(--accent)" : "transparent",
                }}>
                  {dayInfo.day}
                </span>
              </div>

              {/* Appointments */}
              <div style={{ display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
                {dayAppointments.slice(0, 2).map((appt) => {
                  const style = getStatusStyle(appt.status);
                  const patient = getPatientInfo(appt);
                  return (
                    <div
                      key={appt.id}
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: "0.6875rem",
                        fontWeight: 500,
                        background: style.background,
                        color: style.color,
                        borderLeft: `3px solid ${style.borderColor}`,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        lineHeight: "1.3",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {formatTime(appt.scheduled_at)}
                      </span>
                      {" "}
                      <span>
                        {patient.name}{appt.reason ? ` - ${appt.reason}` : ""}
                      </span>
                    </div>
                  );
                })}
                {dayAppointments.length > 2 && (
                  <div style={{
                    padding: "2px 6px",
                    fontSize: "0.6875rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}>
                    +{dayAppointments.length - 2} {t("common.more")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--text)",
  cursor: "pointer",
  transition: "all 150ms ease",
};
