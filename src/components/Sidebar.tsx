"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction, autoLogoutAction } from "@/app/actions/auth";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const nav = [
  { href: "/dashboard",          label: "OVERVIEW",  icon: "▣" },
  { href: "/dashboard/assets",   label: "ASSETS",    icon: "◈" },
  { href: "/dashboard/alerts",   label: "ALARMS",    icon: "◬", badge: 3 },
  { href: "/dashboard/reports",  label: "TRENDS",    icon: "∿" },
  { href: "/dashboard/settings", label: "CONFIG",    icon: "⚙" },
];

const VERSION = "v0.8.0-industrial";

export default function Sidebar({ pollInterval = 60000 }: { pollInterval?: number }) {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    // Fetch current session on mount
    const fetchSession = async () => {
      const session = await getCurrentSessionAction();
      if (session.success && session.username && session.role) {
        setCurrentUser({ username: session.username, role: session.role });
      }
    };
    fetchSession();

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

    // Auto Logout Setup (60 minutes inactivity)
    let inactivityTimer: NodeJS.Timeout;
    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        autoLogoutAction();
      }, 60 * 60 * 1000); // 60 minutes
    };

    resetInactivity(); // Init
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivity));

    return () => {
      clearInterval(iv);
      clearTimeout(inactivityTimer);
      events.forEach(e => window.removeEventListener(e, resetInactivity));
    };
  }, []);

  return (
    <aside className="flex flex-col w-52 min-h-screen shrink-0"
      style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}>

      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}>
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-[.25em] text-ptts-teal" style={{ color: "var(--ptts-teal)" }}>PTTS</p>
            <p className="text-[8px] tracking-widest" style={{ color: "var(--text-faint)" }}>IoT PLATFORM</p>
          </div>
        </div>
        {/* Live status */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm transition-all"
          style={{
            background: pollInterval === 0 ? "var(--surface-2)" : "var(--badge-online-bg)",
            border: pollInterval === 0 ? "1px solid var(--border)" : "1px solid var(--online)",
          }}>
          <span className={`led ${pollInterval === 0 ? "led-offline" : "led-online"}`} style={{ width: 5, height: 5 }} />
          <span className="text-[9px] tracking-widest font-black" style={{ color: pollInterval === 0 ? "var(--text-muted)" : "var(--online)" }}>
            {pollInterval === 0 ? "POLL: OFF" : `LIVE · ${pollInterval >= 60000 ? pollInterval / 60000 + "M" : pollInterval / 1000 + "S"}`}
          </span>
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
                ? { background: "#005F8E20", color: "#00c8e0", borderLeft: "2px solid #00A3B4" }
                : { color: "var(--text-muted)" }}>
              <span className="w-4 text-center text-sm">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold"
                  style={{ background: "var(--badge-fault-bg)", color: "var(--fault)", border: "1px solid var(--fault)" }}>
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
          <span style={{ color: "var(--text-faint)" }}>DATA</span>
          <span className="text-ptts-teal">SIMULATED</span>
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-3 mx-2 mb-2 rounded-sm" style={{ background: "var(--badge-ptts-bg)", border: "1px solid var(--border)", borderTop: "2px solid var(--online)" }}>
        <div
          className="flex items-center gap-2 px-2 mb-2 rounded-sm cursor-pointer transition-all"
          style={{ background: "transparent" }}
          onClick={() => setShowSwitch(true)}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--badge-online-bg)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ background: "var(--surface-2)", color: "var(--online)", border: "1.5px solid var(--online)" }}>
            {currentUser?.username?.substring(0,2).toUpperCase() || "..."}
          </div>
          <div>
            <p className="text-[10px] font-bold" style={{ color: "var(--text-bright)" }}>{currentUser?.username || "..."}</p>
            <p className="text-[8px] tracking-widest" style={{ color: "var(--online)" }}>{currentUser?.role?.toUpperCase() || "..."}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <LogoutButton />
        </div>
      </div>

      {/* Footer / Version */}
      <div className="px-4 py-2 mt-auto" style={{ borderTop: "1px solid var(--border-dim)" }}>
      </div>

      {/* Switch Account Modal */}
      {showSwitch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "#00000080" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}
        >
          <div
            className="w-72 rounded-sm p-4 space-y-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid #00A3B4" }}
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
                <p className="text-[9px] tracking-widest" style={{ color: "var(--fault)" }}>{switchState.error}</p>
              )}
              <button
                type="submit"
                disabled={switchPending}
                className="w-full py-2 text-[9px] font-bold tracking-widest rounded-sm transition-all disabled:opacity-50"
                style={{ background: "var(--ptts)", color: "var(--text-bright)", border: "1px solid var(--border)" }}
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
