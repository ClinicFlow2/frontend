import { useState } from "react";
import Login from "./pages/Login";
import Patients from "./pages/Patients";
import { isLoggedIn, logout } from "./api/auth";

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn());

  if (!authed) {
    return <Login onLoggedIn={() => setAuthed(true)} />;
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>ClinicFlowHQ ✅</h1>
      <p>You are logged in successfully.</p>

      <button
        style={{ marginTop: 10, padding: "10px 16px", cursor: "pointer" }}
        onClick={() => {
          logout();
          setAuthed(false);
          alert("✅ Logged out!");
        }}
      >
        Logout
      </button>

      <hr style={{ margin: "20px 0" }} />

      <Patients />
    </div>
  );
}