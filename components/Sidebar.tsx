"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction } from "@/app/actions/auth";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const nav = [
  { href: "/dashboard",          label: "OVERVIEW",  icon: "▣" },
  { href: "/dashboard/assets",   label: "ASSETS",    icon: "◈" },
  { href: "/dashboard/alerts",   label: "ALARMS",    icon: "◬", badge: 3 },
  { href: "/dashboard/reports",  label: "TRENDS",    icon: "∿" },
  { href: "/dashboard/settings", label: "CONFIG",    icon: "⚙" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);

  useEffect(() => {
    // Get server startup time from sessionStorage or initialize
    const storageKey = "db-startup-time";
    let startTime = sessionStorage.getItem(storageKey);
    if (!startTime) {
      startTime = new Date().getTime().toString();
      sessionStorage.setItem(storageKey, startTime);
    }

    const updateUptime = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime!)) / 1000);
      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const secs = elapsed % 60;
      setUptime(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    updateUptime();
    const iv = setInterval(updateUptime, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside className="flex flex-col w-52 min-h-screen shrink-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}>

      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ border: "1.5px solid #005F8E50", background: "#0d1628" }}>
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-[.25em] text-[#00A3B4]">PTTS</p>
            <p className="text-[8px] tracking-widest" style={{ color: "var(--text-faint)" }}>IoT PLATFORM</p>
          </div>
        </div>
        {/* Live status */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm"
          style={{ background: "#00e67608", border: "1px solid #00e67620" }}>
          <span className="led led-online" style={{ width: 6, height: 6 }} />
          <span className="text-[9px] tracking-widest text-[#00e676]">LIVE · 60s</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-[11px] font-bold tracking-[.1em] transition-all"
              style={active
                ? { background: "#005F8E20", color: "#00A3B4", borderLeft: "2px solid #005F8E" }
                : { color: "var(--text-faint)" }}>
              <span className="w-4 text-center text-sm">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold"
                  style={{ background: "#CC000025", color: "#CC0000", border: "1px solid #CC000040" }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System info */}
      <div className="px-3 py-2 mx-2 mb-2 rounded-sm text-[9px] space-y-1"
        style={{ background: "var(--surface)", border: "1px solid var(--border-dim)" }}>
        <div className="flex justify-between">
          <span style={{ color: "var(--text-faint)" }}>UPTIME</span>
          <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>{uptime}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "var(--text-faint)" }}>TAGS</span>
          <span style={{ color: "var(--text-muted)" }}>147 / 200</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: "var(--text-faint)" }}>DB</span>
          <span className="text-[#00e676]">CONNECTED</span>
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 mx-2 mb-2 rounded-sm" style={{ background: "#005F8E15", border: "1px solid #005F8E30", borderTop: "2px solid #00a868" }}>
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "#005F8E40", color: "#00a868", border: "1.5px solid #00a868" }}>
            AM
          </div>
          <div>
            <p className="text-[10px] font-bold" style={{ color: "#fff" }}>Adam Muhammad</p>
            <p className="text-[8px] tracking-widest" style={{ color: "#00a868" }}>ENGINEER</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <LogoutButton />
          <button
            onClick={() => setShowSwitch(true)}
            className="flex items-center justify-center px-2 py-2 rounded-sm text-[9px] font-bold tracking-widest transition-all shrink-0"
            style={{ color: "#7a9ab8", background: "#1a2235", border: "1px solid #242d3f" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#00A3B4"; e.currentTarget.style.borderColor = "#00A3B440"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#7a9ab8"; e.currentTarget.style.borderColor = "#242d3f"; }}
            title="Switch Account"
          >
            ⇄
          </button>
        </div>
      </div>

      {/* Switch Account Modal */}
      {showSwitch && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start"
          style={{ background: "#00000080" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}
        >
          <div
            className="mx-2 mb-2 w-52 rounded-sm p-4 space-y-3"
            style={{ background: "#0d1628", border: "1px solid #005F8E60", borderTop: "2px solid #00A3B4" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold tracking-[.2em]" style={{ color: "#00A3B4" }}>SWITCH ACCOUNT</p>
              <button
                onClick={() => setShowSwitch(false)}
                className="text-[11px] leading-none"
                style={{ color: "#4a6a8a" }}
              >✕</button>
            </div>

            <form action={switchAction} className="space-y-2">
              <input
                name="username"
                type="text"
                placeholder="USERNAME"
                autoComplete="username"
                className="w-full px-2.5 py-2 text-[10px] rounded-sm outline-none tracking-widest"
                style={{ background: "#0b0e13", border: "1px solid #242d3f", color: "#d4e4f4" }}
              />
              <input
                name="password"
                type="password"
                placeholder="PASSWORD"
                autoComplete="current-password"
                className="w-full px-2.5 py-2 text-[10px] rounded-sm outline-none tracking-widest"
                style={{ background: "#0b0e13", border: "1px solid #242d3f", color: "#d4e4f4" }}
              />
              {switchState?.error && (
                <p className="text-[9px] tracking-widest" style={{ color: "#CC0000" }}>{switchState.error}</p>
              )}
              <button
                type="submit"
                disabled={switchPending}
                className="w-full py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all disabled:opacity-50"
                style={{ background: "#005F8E", color: "#fff", border: "1px solid #00A3B440" }}
              >
                {switchPending ? "AUTHENTICATING..." : "SWITCH →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
