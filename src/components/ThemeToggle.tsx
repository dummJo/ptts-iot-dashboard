"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ptts-theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("ptts-theme", next ? "dark" : "light");
  }

  return (
    <button onClick={toggle}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-none font-bold tracking-widest transition-all"
      style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}>
      <span>{dark ? "☀" : "☾"}</span>
      <span>{dark ? "LIGHT" : "DARK"}</span>
    </button>
  );
}
