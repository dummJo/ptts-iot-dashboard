"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ptts-theme");
    const isDark = saved ? saved === "dark" : true;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ptts-theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all"
      style={{
        borderColor: "var(--border)",
        color: "var(--text-muted)",
        background: "var(--surface-2)",
      }}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span>{dark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
