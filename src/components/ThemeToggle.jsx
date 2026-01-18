// src/components/ThemeToggle.jsx
import { useTheme } from "../theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="cf-btn"
      style={{
        width: "100%",
        background: "transparent",
        borderColor: "rgba(255,255,255,0.15)",
        color: "var(--sidebar-text)",
      }}
      title="Toggle dark/light mode"
    >
      {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
    </button>
  );
}
