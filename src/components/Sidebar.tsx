"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction, autoLogoutAction } from "@/app/actions/auth";

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
    
    let alarmIv: NodeJS.Timeout;
    if (pollInterval > 0) {
      alarmIv = setInterval(fetchAlarmsCount, pollInterval);
    }

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

    let inactivityTimer: NodeJS.Timeout;
    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        autoLogoutAction();
      }, 60 * 60 * 1000); // 60 minutes
    };

    resetInactivity();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivity));

    return () => {
      clearInterval(iv);
      if (alarmIv) clearInterval(alarmIv);
      clearTimeout(inactivityTimer);
      events.forEach(e => window.removeEventListener(e, resetInactivity));
    };
  }, [pollInterval]);

  return (
    <aside className="relative flex flex-col w-56 min-h-screen shrink-0 z-40 bg-[var(--sidebar-bg)] border-r border-[#ffffff10]">

      {/* Header */}
      <div className="px-5 py-6 border-b border-[#ffffff08]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#ffffff15] bg-[#00000020]">
            <img src={LOGO} alt="PTTS" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-[.3em] text-[#00c8e0]">PTTS</p>
            <p className="text-sm tracking-widest text-[#86868b]">IoT PLATFORM</p>
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#00c8e010] border border-[#00c8e030]">
          <span className={`led ${pollInterval === 0 ? "led-offline" : "led-online"}`} style={{ width: 6, height: 6 }} />
          <span className="text-[10px] tracking-widest font-bold text-[#00c8e0]">
            {pollInterval === 0 ? "POLLING: OFF" : `SYSTEM: LIVE · ${pollInterval >= 60000 ? pollInterval / 60000 + "M" : pollInterval / 1000 + "S"}`}
          </span>
        </div>
      </div>

      {/* Navigation Menu (Reverted to Stable Architecture) */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems
          .filter(item => !(item.href.includes("settings") && currentUser?.role !== "admin"))
          .map((item) => {
            const active = pathname === item.href;
            const badge = item.isAlarm ? alarmCount : null;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-bold tracking-widest transition-all hover:bg-[#ffffff05]"
                style={active
                  ? { background: "#00c8e015", color: "#00c8e0", borderLeft: "3px solid #00c8e0" }
                  : { color: "#a1a1a6", borderLeft: "3px solid transparent" }}>
                <span className="w-5 text-center text-[16px]">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {badge && badge > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-bold bg-[#ff3b3020] text-[#ff3b30] border border-[#ff3b3040]">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* System Metrics Strip */}
      <div className="px-4 py-3 mx-3 mb-4 rounded-sm bg-[#ffffff03] border border-[#ffffff08] text-[10px] space-y-2">
        <div className="flex justify-between">
          <span className="text-[#86868b]">SYSTEM UPTIME</span>
          <span className="text-[#f5f5f7] font-mono">{uptime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86868b]">CONNECTED NODES</span>
          <span className="text-[#f5f5f7]">147 / 200</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86868b]">STATUS</span>
          <span className="text-[#00c8e0]">NOMINAL</span>
        </div>
      </div>

      {/* User Section (Reverted to Stable) */}
      <div className="mx-3 mb-6 p-4 rounded-sm bg-[#00c8e010] border border-[#00c8e020] border-t-2 border-t-[#34c759]">
        <div className="flex items-center gap-3 mb-3 cursor-pointer group" onClick={() => setShowSwitch(true)}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#34c759] text-[#34c759] bg-[#00000020] group-hover:scale-105 transition-transform">
            {currentUser?.username?.substring(0,2).toUpperCase() || "..."}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-[#f5f5f7] truncate">{currentUser?.username || "..."}</p>
            <p className="text-[10px] tracking-widest text-[#34c759] uppercase">{currentUser?.role || "..."}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Fixed Trademark Signature */}
      <div className="pb-6 text-center">
        <p className="text-[9px] tracking-[.3em] font-bold text-[#86868b] uppercase">
          ENGINEERED BY <span className="text-[#00c8e0]">DUMMVINCI</span>
        </p>
      </div>

      {/* Switch Account Modal (Simple Overlay) */}
      {showSwitch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
             onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}>
          <div className="w-80 p-6 rounded-sm bg-[#1c1c1e] border border-[#ffffff15] border-t-2 border-t-[#00c8e0]">
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-bold tracking-[.3em] text-[#00c8e0]">SWITCH IDENTITY</p>
              <button onClick={() => setShowSwitch(false)} className="text-[#86868b] hover:text-white transition-colors">✕</button>
            </div>
            <form action={switchAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase">User Access UID</label>
                <input name="username" type="text" placeholder="UID" autoComplete="username"
                  className="w-full px-4 py-3 bg-black/40 border border-[#ffffff10] text-sm text-[#f5f5f7] rounded-sm focus:border-[#00c8e0] outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest text-[#86868b] uppercase">Security Key</label>
                <input name="password" type="password" placeholder="KEY" autoComplete="current-password"
                  className="w-full px-4 py-3 bg-black/40 border border-[#ffffff10] text-sm text-[#f5f5f7] rounded-sm focus:border-[#00c8e0] outline-none transition-all" />
              </div>
              {switchState?.error && <p className="text-[10px] text-[#ff3b30] font-bold tracking-widest">{switchState.error}</p>}
              <button type="submit" disabled={switchPending}
                className="w-full py-3 bg-[#00c8e015] border border-[#00c8e040] text-[#00c8e0] text-xs font-bold tracking-[.4em] rounded-sm hover:bg-[#00c8e025] transition-all disabled:opacity-50">
                {switchPending ? "VALIDATING..." : "AUTHENTICATE →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
