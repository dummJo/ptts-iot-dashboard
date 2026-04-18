"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction, autoLogoutAction } from "@/app/actions/auth";
import { motion, AnimatePresence } from "framer-motion";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const navItems = [
  { href: "/dashboard",          label: "OVERVIEW",  icon: "▣" },
  { href: "/dashboard/assets",   label: "ASSETS",    icon: "◈" },
  { href: "/dashboard/alerts",   label: "ALARMS",    icon: "◬", isAlarm: true },
  { href: "/dashboard/reports",  label: "TRENDS",    icon: "∿" },
  { href: "/dashboard/settings", label: "CONFIG",    icon: "⚙" },
];


export default function Sidebar({ pollInterval = 60000 }: { pollInterval?: number }) {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);

  useEffect(() => {
    // Fetch current session on mount
    const fetchSession = async () => {
      const session = await getCurrentSessionAction();
      if (session.success && session.username && session.role) {
        setCurrentUser({ username: session.username, role: session.role });
      }
    };
    const fetchAlarmsCount = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          const warnings = data.healthSummary?.warning || 0;
          const faults = data.healthSummary?.fault || 0;
          setAlarmCount(warnings + faults);
        }
      } catch (e) {}
    };

    fetchSession();
    fetchAlarmsCount();
    
    // Refresh count periodically if not off
    let alarmIv: NodeJS.Timeout;
    if (pollInterval > 0) {
      alarmIv = setInterval(fetchAlarmsCount, pollInterval);
    }

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
      if (alarmIv) clearInterval(alarmIv);
      clearTimeout(inactivityTimer);
      events.forEach(e => window.removeEventListener(e, resetInactivity));
    };
  }, []);

  return (
    <aside className="relative flex flex-col w-52 min-h-screen shrink-0 z-40 transition-colors duration-250"
      style={{ background: "var(--sidebar-glass)", borderRight: "1px solid var(--border-dim)", backdropFilter: "blur(20px)", boxShadow: "5px 0 20px rgba(0,0,0,0.1)" }}>

      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0"
            style={{ border: "1.5px solid var(--border)", background: "var(--surface-2)" }}>
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-0.5" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[.25em] text-ptts-teal" style={{ color: "var(--ptts-teal)" }}>PTTS</p>
            <p className="text-sm tracking-widest" style={{ color: "var(--text-faint)" }}>IoT PLATFORM</p>
          </div>
        </div>
        {/* Live status */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm transition-all"
          style={{
            background: pollInterval === 0 ? "var(--surface-2)" : "var(--badge-online-bg)",
            border: pollInterval === 0 ? "1px solid var(--border)" : "1px solid var(--online)",
          }}>
          <span className={`led ${pollInterval === 0 ? "led-offline" : "led-online"}`} style={{ width: 5, height: 5 }} />
          <span className="text-xs tracking-widest font-black" style={{ color: pollInterval === 0 ? "var(--text-muted)" : "var(--online)" }}>
            {pollInterval === 0 ? "POLL: OFF" : `LIVE · ${pollInterval >= 60000 ? pollInterval / 60000 + "M" : pollInterval / 1000 + "S"}`}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const badge = item.isAlarm ? alarmCount : null;
          return (
            <motion.div
              key={item.href}
              initial={false}
              whileHover={{ x: 6, scale: 1.02, backgroundColor: active ? "var(--ptts-glow)" : "var(--surface-3)", transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-bold tracking-[.1em]"
                style={active
                  ? { background: "#005F8E20", color: "#00c8e0", borderLeft: "2px solid #00A3B4" }
                  : { color: "var(--text-muted)", borderLeft: "2px solid transparent" }}>
                <span className="w-4 text-center text-sm">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge && badge > 0 ? (
                  <span className="text-xs px-1.5 py-0.5 rounded-sm font-bold"
                    style={{ background: "var(--badge-fault-bg)", color: "var(--fault)", border: "1px solid var(--fault)" }}>
                    {badge}
                  </span>
                ) : null}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* System info */}
      <div className="px-3 py-2 mx-2 mb-2 rounded-sm text-xs space-y-1"
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
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--surface-2)", color: "var(--online)", border: "1.5px solid var(--online)" }}>
            {currentUser?.username?.substring(0,2).toUpperCase() || "..."}
          </div>
          <div>
            <p className="text-base font-bold" style={{ color: "var(--text-bright)" }}>{currentUser?.username || "..."}</p>
            <p className="text-sm tracking-widest" style={{ color: "var(--online)" }}>{currentUser?.role?.toUpperCase() || "..."}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <LogoutButton />
        </div>
      </div>

      {/* Trademark Signature */}
      <div className="mt-auto mb-5 w-full text-center opacity-30 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[10px] tracking-[0.15em] font-bold uppercase" style={{ color: "var(--text-muted)" }}>
          Engineered by <span className="capitalize" style={{ color: "var(--ptts-teal)", fontFamily: "var(--font-serif)", fontSize: "14px", fontStyle: "italic", letterSpacing: "0.02em" }}>dummJo</span>
        </p>
      </div>



      {/* Switch Account Modal */}
      <AnimatePresence>
        {showSwitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "#00000080" }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-72 rounded-sm p-4 space-y-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid #00A3B4" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-[.2em]" style={{ color: "#00A3B4" }}>SWITCH ACCOUNT</p>
                <button
                  onClick={() => setShowSwitch(false)}
                  className="text-sm leading-none"
                  style={{ color: "#4a6a8a" }}
                >✕</button>
              </div>

              <form action={switchAction} className="space-y-2">
                <input
                  name="username"
                  type="text"
                  placeholder="USERNAME"
                  autoComplete="username"
                  className="w-full px-2.5 py-2 text-base rounded-sm outline-none tracking-widest"
                  style={{ background: "#0b0e13", border: "1px solid #242d3f", color: "#d4e4f4" }}
                />
                <input
                  name="password"
                  type="password"
                  placeholder="PASSWORD"
                  autoComplete="current-password"
                  className="w-full px-2.5 py-2 text-base rounded-sm outline-none tracking-widest"
                  style={{ background: "#0b0e13", border: "1px solid #242d3f", color: "#d4e4f4" }}
                />
                {switchState?.error && (
                  <p className="text-xs tracking-widest" style={{ color: "var(--fault)" }}>{switchState.error}</p>
                )}
                <button
                  type="submit"
                  disabled={switchPending}
                  className="w-full py-2 text-xs font-bold tracking-widest rounded-sm transition-all disabled:opacity-50"
                  style={{ background: "var(--ptts)", color: "var(--text-bright)", border: "1px solid var(--border)" }}
                >
                  {switchPending ? "AUTHENTICATING..." : "SWITCH →"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
