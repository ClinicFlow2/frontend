import { Link } from "react-router-dom";

function Card({ title, description, to }) {
  return (
    <Link
      to={to}
      style={{
        textDecoration: "none",
        color: "inherit",
        border: "1px solid #eee",
        borderRadius: 14,
        padding: 16,
        display: "block",
        background: "white",
      }}
    >
      <h3 style={{ margin: "0 0 6px" }}>{title}</h3>
      <p style={{ margin: 0, color: "#555" }}>{description}</p>
    </Link>
  );
}

export default function Dashboard() {
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <p style={{ color: "#555" }}>Welcome 👋 Pick a module from the sidebar.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginTop: 16,
        }}
      >
        <Card title="Patients" description="Create and manage patients" to="/patients" />
        <Card title="Visits" description="Consultation workflow" to="/visits" />
        <Card title="Prescriptions" description="Templates + items" to="/prescriptions" />
        <Card title="Appointments" description="Scheduling + agenda (next)" to="/appointments" />
      </div>
    </div>
  );
}
