// src/layouts/DashboardLayout.jsx
import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../components/ThemeToggle";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { logout } from "../api/auth";
import logo from "../assets/logo.png";

// Icons as simple SVG components
const Icons = {
  Dashboard: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Patients: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Visits: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  Prescriptions: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  ),
  Appointments: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Profile: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

const navItems = [
  { to: "/dashboard", labelKey: "nav.dashboard", Icon: Icons.Dashboard },
  { to: "/patients", labelKey: "nav.patients", Icon: Icons.Patients },
  { to: "/visits", labelKey: "nav.visits", Icon: Icons.Visits },
  { to: "/prescriptions", labelKey: "nav.prescriptions", Icon: Icons.Prescriptions },
  { to: "/appointments", labelKey: "nav.appointments", Icon: Icons.Appointments },
];

const navItemStyle = ({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  textDecoration: "none",
  color: isActive ? "#10b981" : "var(--sidebar-text)",
  background: isActive ? "var(--sidebar-active)" : "transparent",
  fontWeight: isActive ? 600 : 500,
  fontSize: "0.9375rem",
  transition: "all 150ms ease",
});

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  // Close sidebar on navigation (mobile)
  function handleNavClick() {
    setSidebarOpen(false);
  }

  return (
    <div
      className="cf-layout"
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        minHeight: "100vh",
        background: "var(--bg)"
      }}
    >
      {/* Hamburger button (visible only on mobile via CSS) */}
      <button
        className="cf-hamburger"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop (visible only on mobile when sidebar is open) */}
      <div
        className={`cf-sidebar-backdrop${sidebarOpen ? " cf-sidebar-backdrop--visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`cf-sidebar${sidebarOpen ? " cf-sidebar--open" : ""}`}
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "auto",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "4px 8px 24px" }}>
          <Link to="/dashboard">
            <img
              src={logo}
              alt="ClinicFlowHQ"
              style={{
                width: "100%",
                maxWidth: 180,
                height: "auto",
                display: "block",
                borderRadius: 8,
                cursor: "pointer",
              }}
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
          {navItems.map(({ to, labelKey, Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={navItemStyle}
              onClick={handleNavClick}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.background = "var(--sidebar-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains("active")) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <Icon />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "16px",
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {/* Profile Link */}
          <NavLink
            to="/profile"
            style={navItemStyle}
            onClick={handleNavClick}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "var(--sidebar-hover)";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains("active")) {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <Icons.Profile />
            {t("nav.profile")}
          </NavLink>

          {/* Language Switcher */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <LanguageSwitcher />
          </div>

          <ThemeToggle />

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "var(--sidebar-text)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "0.9375rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
              e.currentTarget.style.color = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "var(--sidebar-text)";
            }}
          >
            <Icons.Logout />
            {t("auth.logout")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="cf-page cf-animate-in">
        <Outlet />
      </main>
    </div>
  );
}
