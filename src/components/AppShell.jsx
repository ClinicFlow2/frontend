import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function AppShell() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh" }}>
      <aside className="cf-card" style={{ margin: 14, padding: 14, position: "sticky", top: 14, height: "calc(100vh - 28px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {/* Replace with your real logo image if you have one */}
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,var(--primary),var(--primary2))" }} />
          <div>
            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>ClinicFlowHQ</div>
            <div className="cf-muted" style={{ fontSize: 12 }}>Hospital workflow</div>
          </div>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <SideLink to="/dashboard" label="Dashboard" />
          <SideLink to="/patients" label="Patients" />
          <SideLink to="/visits" label="Visits" />
          <SideLink to="/prescriptions" label="Prescriptions" />
          <SideLink to="/appointments" label="Appointments" />
        </nav>

        <div style={{ marginTop: "auto", display: "grid", gap: 10, paddingTop: 14 }}>
          <ThemeToggle />
          {/* keep your existing logout button wherever it is in your app */}
        </div>
      </aside>

      <main style={{ padding: 18 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SideLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: "none",
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid var(--border)`,
        background: isActive ? "rgba(37,99,235,0.14)" : "transparent",
        color: "var(--text)",
        fontWeight: 700,
      })}
    >
      {label}
    </NavLink>
  );
}
