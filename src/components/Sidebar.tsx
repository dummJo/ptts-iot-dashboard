"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction } from "@/app/actions/auth";
import { syncCiamAction } from "@/app/actions/ciam";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

const navItems = [
  { href: "/dashboard",          label: "Dashboard",  icon: "〣" },
  { href: "/dashboard/assets",   label: "Asset Map",   icon: "⊞" },
  { href: "/dashboard/alerts",   label: "Alarms",     icon: "◬", isAlarm: true },
  { href: "/dashboard/reports",  label: "Deep Trends", icon: "∿" },
  { href: "/dashboard/settings", label: "Kernel Config", icon: "⚙" },
];

export default function Sidebar({ pollInterval = 60000 }: { pollInterval?: number }) {
  const pathname = usePathname();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);

  const [selectedOrg, setSelectedOrg] = useState("demo-mode");
  const [ciamConnected, setCiamConnected] = useState(true);
  const [ciamError, setCiamError] = useState<string | null>(null);
  const [ciamPending, setCiamPending] = useState(false);
  const [organizations, setOrganizations] = useState<{id: string, name: string, type: string}[]>([
    { id: 'demo-mode', name: 'Live Demo Mode', type: 'Demo' }
  ]);

  const handleCiamSync = async () => {
    setCiamPending(true);
    try {
      const res = await syncCiamAction();
      if (res.success) {
        window.location.reload();
      } else {
        alert(`Sync Failed: ${res.error}`);
      }
    } catch (e) {
      alert("System error during handshake.");
    } finally {
      setCiamPending(false);
    }
  };

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
            setCiamConnected(data.system?.connected ?? true);
            setCiamError(data.system?.error || null);
            
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
        setCiamConnected(false);
        setCiamError("Connection lost");
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
        
        <div className="inline-flex items-center gap-2 group cursor-help">
          <span className={`w-1.5 h-1.5 rounded-full ${pollInterval === 0 ? "bg-[var(--offline)]" : "bg-[var(--online)]"}`} />
          <span className="text-[9px] font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {pollInterval === 0 ? "KERNEL: STANDBY" : "KERNEL: OPERATIONAL"}
          </span>
        </div>
      </div>

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

      <div className="px-5 py-6 space-y-3 border-t border-[var(--border-dim)] bg-[#0a0a0a]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase">Scope</p>
          {!ciamConnected && (
            <div className="flex items-center gap-2">
              <div className="group relative">
                <span className="text-[8px] font-bold text-[var(--fault)] animate-pulse cursor-help uppercase tracking-tighter">OFFLINE</span>
                {ciamError && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 border border-red-500/30 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <p className="text-[9px] text-red-400 leading-tight">{ciamError}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={handleCiamSync}
                disabled={ciamPending}
                className="text-[8px] px-2 py-0.5 border border-[var(--fault)] text-[var(--fault)] hover:bg-[var(--fault)] hover:text-white transition-all font-bold uppercase disabled:opacity-50"
              >
                {ciamPending ? "..." : "SYNC"}
              </button>
            </div>
          )}
        </div>
        <select 
          value={selectedOrg}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedOrg(val);
            localStorage.setItem("ptts-selected-org", val);
            window.location.reload();
          }}
          className={`w-full bg-black border ${!ciamConnected ? 'border-[var(--fault)]' : 'border-[var(--border-dim)]'} text-[11px] font-bold text-[var(--text-muted)] p-2 outline-none focus:border-[var(--ptts)] cursor-pointer transition-colors`}
        >
          {organizations.map(org => (
            <option key={org.id} value={org.id} className="bg-black text-[var(--text-muted)]">{org.name}</option>
          ))}
        </select>
      </div>

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
        <p className="text-[8px] tracking-[0.4em] font-bold text-[var(--text-faint)] uppercase text-center">By DummVinci</p>
      </div>

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
