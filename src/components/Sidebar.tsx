"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction, autoLogoutAction } from "@/app/actions/auth";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const navItems = [
  { href: "/dashboard",          label: "Dashboard",  icon: "〣" },
  { href: "/dashboard/assets",   label: "Asset Map",   icon: "⊞" },
  { href: "/dashboard/alerts",   label: "Alarms",     icon: "◬", isAlarm: true },
  { href: "/dashboard/reports",  label: "Deep Trends", icon: "∿" },
  { href: "/dashboard/settings", label: "Kernel Config", icon: "⚙" },
];

/**
 * ELITE SIDEBAR — CLAUDE/DELOITTE GRADE
 * Design: Monolithic Minimalism
 */

export default function Sidebar({ pollInterval = 60000 }: { pollInterval?: number }) {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);

  const [selectedOrg, setSelectedOrg] = useState("demo-mode");
  const [organizations, setOrganizations] = useState<{id: string, name: string, type: string}[]>([
    { id: 'demo-mode', name: 'Live Demo Mode', type: 'Demo' }
  ]);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await getCurrentSessionAction();
      if (session.success && session.username && session.role) {
        setCurrentUser({ username: session.username, role: session.role });
      }
    };
    
    const fetchOrgs = async () => {
      try {
        const res = await fetch("/api/organizations");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.organizations) {
            setOrganizations(data.organizations);
            // Restore selection from localStorage if available, otherwise default to demo-mode
            const savedOrg = localStorage.getItem("ptts-selected-org");
            if (savedOrg && data.organizations.some((o: any) => o.id === savedOrg)) {
              setSelectedOrg(savedOrg);
            } else {
              setSelectedOrg("demo-mode");
              localStorage.setItem("ptts-selected-org", "demo-mode");
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch organizations", e);
      }
    };

    const fetchAlarmsCount = async () => {
      try {
        const savedOrg = localStorage.getItem("ptts-selected-org") || "demo-mode";
        const res = await fetch(`/api/dashboard?orgId=${savedOrg}`);
        if (res.ok) {
          const data = await res.json();
          setAlarmCount((data.healthSummary?.warning || 0) + (data.healthSummary?.fault || 0));
        }
      } catch (e) {}
    };

    fetchSession();
    fetchOrgs();
    fetchAlarmsCount();
    
    let alarmIv: NodeJS.Timeout;
    if (pollInterval > 0) alarmIv = setInterval(fetchAlarmsCount, pollInterval);

    const storageKey = "db-startup-time";
    let startTime = sessionStorage.getItem(storageKey);
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem(storageKey, startTime);
    }

    const updateUptime = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime!)) / 1000);
      const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
      const s = String(elapsed % 60).padStart(2, "0");
      setUptime(`${h}:${m}:${s}`);
    };

    updateUptime();
    const iv = setInterval(updateUptime, 1000);

    return () => {
      clearInterval(iv);
      if (alarmIv) clearInterval(alarmIv);
    };
  }, [pollInterval]);

  return (
    <aside className="relative flex flex-col w-52 min-h-screen shrink-0 z-40 bg-[var(--sidebar-bg)] border-r border-[var(--border)] font-sans antialiased">

      {/* Corporate Identity */}
      <div className="px-6 py-8 border-b border-[var(--border-dim)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-none bg-white/5 border border-white/10 flex items-center justify-center">
            <img src={LOGO} alt="P" className="w-5 h-5 object-contain brightness-0 invert opacity-80" />
          </div>
          <div className="leading-none">
            <p className="text-[14px] font-bold tracking-tight text-[var(--text-bright)]">PTTS</p>
            <p className="text-[10px] font-medium tracking-widest text-[var(--text-muted)] uppercase mt-0.5">Industrial OS</p>
          </div>
        </div>
        
        {/* Core Status */}
        <div className="inline-flex items-center gap-2 group cursor-help">
          <span className={`w-1.5 h-1.5 rounded-full ${pollInterval === 0 ? "bg-[var(--offline)]" : "bg-[var(--online)]"}`} />
          <span className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {pollInterval === 0 ? "KERNEL: STANDBY" : "KERNEL: OPERATIONAL"}
          </span>
        </div>
      </div>

      {/* Navigation Layer */}
      <nav className="flex-1 px-4 py-8 space-y-1">
        {navItems
          .filter(item => !(item.href.includes("settings") && currentUser?.role !== "admin"))
          .map((item) => {
            const active = pathname === item.href;
            const badge = item.isAlarm ? alarmCount : null;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 transition-all group"
                style={active ? { color: "var(--text-bright)" } : { color: "var(--text-muted)" }}>
                <span className={`text-[15px] ${active ? "opacity-100" : "opacity-40 group-hover:opacity-80 transition-opacity"}`}>{item.icon}</span>
                <span className={`text-[13px] font-medium tracking-tight ${active ? "translate-x-0" : "-translate-x-1 group-hover:translate-x-0 transition-transform"}`}>
                  {item.label}
                </span>
                {badge && badge > 0 && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 font-bold bg-[var(--fault)] text-white flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* System Registry Info */}
      <div className="px-5 py-6 space-y-4 border-t border-[var(--border-dim)] bg-[#0a0a0a]">
        <div className="space-y-1">
          <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Chronos Uptime</p>
          <p className="text-[12px] font-mono font-medium text-[var(--text-muted)]">{uptime}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Registry Nodes</p>
          <p className="text-[12px] font-medium text-[var(--text-muted)]">147 <span className="text-[var(--text-faint)]">/ 200</span></p>
        </div>
      </div>

      {/* Organization Scope */}
      <div className="px-5 py-6 space-y-3 border-t border-[var(--border-dim)] bg-[#0a0a0a]">
        <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Select Organization</p>
        <select 
          value={selectedOrg}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedOrg(val);
            localStorage.setItem("ptts-selected-org", val);
            // Reload to force all dashboard components to pick up the new organization scope
            window.location.reload();
          }}
          className="w-full bg-black border border-[var(--border-dim)] text-[11px] font-bold text-[var(--text-muted)] p-2 outline-none focus:border-[var(--ptts)] cursor-pointer transition-colors"
        >
          {organizations.map(org => (
            <option key={org.id} value={org.id} className="bg-black text-[var(--text-muted)]">
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* Authenticated Entity */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-3 cursor-pointer group" onClick={() => setShowSwitch(true)}>
          <div className="w-7 h-7 bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-[var(--online)]">
            {currentUser?.username?.substring(0,2).toUpperCase() || "ID"}
          </div>
          <div className="overflow-hidden">
            <p className="text-[12px] font-bold text-[var(--text-bright)] truncate leading-none">{currentUser?.username || "Guest Entity"}</p>
            <p className="text-[9px] font-bold tracking-widest text-[var(--online)] uppercase mt-1">{currentUser?.role || "Pending..."}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-auto px-5 py-6 opacity-20 hover:opacity-100 transition-opacity duration-500">
        <p className="text-[8px] tracking-[0.4em] font-bold text-[var(--text-faint)] uppercase text-center">
          Dev: By DummVinci
        </p>
      </div>


      {/* Identity Switch Modal */}
      {showSwitch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
             onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}>
          <div className="w-80 p-6 bg-[var(--surface-2)] border border-[var(--border)] animate-fade-in shadow-elite">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-bold tracking-[0.3em] text-[var(--text-muted)] uppercase">Kernel Access Overlay</p>
              <button onClick={() => setShowSwitch(false)} className="text-[var(--text-faint)] hover:text-white">✕</button>
            </div>
            <form action={switchAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">Entity UID</label>
                <input name="username" type="text" placeholder="Access Code"
                  className="w-full bg-black border border-[var(--border)] px-3 py-2 text-[13px] outline-none focus:border-[var(--ptts)] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">Encryption Key</label>
                <input name="password" type="password" placeholder="Key Token"
                  className="w-full bg-black border border-[var(--border)] px-3 py-2 text-[13px] outline-none focus:border-[var(--ptts)] transition-all" />
              </div>
              {switchState?.error && <p className="text-[10px] font-bold text-[var(--fault)] uppercase tracking-widest">{switchState.error}</p>}
              <button type="submit" disabled={switchPending}
                className="w-full py-3 bg-[var(--text-muted)] text-black text-[10px] font-bold tracking-[0.4em] uppercase hover:bg-white transition-all disabled:opacity-50">
                {switchPending ? "Authorizing..." : "Engage Protocol →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
