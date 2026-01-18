// src/layouts/DashboardLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { logout } from "../api/auth";

import logo from "../assets/logo.png";

const navItem = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 12,
  textDecoration: "none",
  color: "var(--sidebar-text)",
  background: isActive ? "var(--sidebar-active)" : "transparent",
  fontWeight: 800,
});

export default function DashboardLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          padding: 16,
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Logo (ONLY the image) */}
        <div style={{ padding: "6px 8px 14px" }}>
          <img
            src={logo}
            alt="ClinicFlowHQ"
            style={{
              width: "100%",
              maxWidth: 210,
              height: "auto",
              display: "block",
              borderRadius: 10,
            }}
          />
        </div>

        <nav style={{ display: "grid", gap: 8, marginTop: 6 }}>
          <NavLink to="/dashboard" style={navItem}>
            Dashboard
          </NavLink>
          <NavLink to="/patients" style={navItem}>
            Patients
          </NavLink>
          <NavLink to="/visits" style={navItem}>
            Visits
          </NavLink>
          <NavLink to="/prescriptions" style={navItem}>
            Prescriptions
          </NavLink>
          <NavLink to="/appointments" style={navItem}>
            Appointments
          </NavLink>
        </nav>

        <div style={{ marginTop: 14 }}>
          <ThemeToggle />
        </div>

        <div style={{ marginTop: 14, color: "var(--sidebar-muted)", fontSize: 12, lineHeight: 1.5 }}>
          Tip: Use Prescriptions from a Visit to auto-link the Visit ID.
        </div>

        <button
          onClick={handleLogout}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "var(--sidebar-text)",
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="cf-page">
        <Outlet />
      </main>
    </div>
  );
}
