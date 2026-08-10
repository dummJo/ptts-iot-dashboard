"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import LogoutButton from "./LogoutButton";
import { loginAction, getCurrentSessionAction } from "@/app/actions/auth";
import { syncCiamAction } from "@/app/actions/ciam";

const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";

type NavEntry =
  | { type: "link"; href: string; label: string; icon: string; isAlarm?: boolean; adminOnly?: boolean }
  | { type: "rule" };

/**
 * Four section headings for fourteen links made the sidebar taller than the
 * content it navigates. Same destinations, shorter labels, grouped by hairline
 * rules instead of shouted eyebrow text.
 */
const navItems: NavEntry[] = [
  { type: "link", href: "/console/operations", label: "Operations", icon: "⚡" },
  { type: "link", href: "/console/condition",  label: "Condition",  icon: "◈" },
  { type: "link", href: "/console/energy",     label: "Energy",     icon: "⌁" },
  { type: "link", href: "/console/analytics",  label: "Analytics",  icon: "∿" },

  { type: "rule" },
  { type: "link", href: "/console/devices",   label: "Devices",  icon: "⊞" },
  { type: "link", href: "/console/topology",  label: "Topology", icon: "⌘" },
  { type: "link", href: "/console/events",    label: "Events",   icon: "◬", isAlarm: true },

  { type: "rule" },
  { type: "link", href: "/console/automation", label: "Automation", icon: "⚙" },
  { type: "link", href: "/console/historian",  label: "Historian",  icon: "⏱" },
  { type: "link", href: "/console/ai",         label: "AI Engine",  icon: "✦" },
  { type: "link", href: "/console/plugins",    label: "Plugins",    icon: "⊕" },

  { type: "rule" },
  { type: "link", href: "/console/system",   label: "System",   icon: "◯" },
  { type: "link", href: "/console/settings", label: "Settings", icon: "⚙", adminOnly: true },
  { type: "link", href: "/select-mode",      label: "Switch domain", icon: "⇆" },
];

export default function Sidebar({ pollInterval = 60000 }: { pollInterval?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [uptime, setUptime] = useState("00:00:00");
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchState, switchAction, switchPending] = useActionState(loginAction, null);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [alarmCount, setAlarmCount] = useState(0);

  // Collapsed rail. Persisted so the choice survives navigation between the
  // console pages, each of which mounts its own Sidebar instance.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("ptts-sidebar-collapsed") === "1");
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ptts-sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  };

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
        router.refresh();
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
        const res = await fetch(`/api/alarms/count?orgId=${savedOrg}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAlarmCount((data.data?.warning || 0) + (data.data?.critical || 0));
          }
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
    <aside
      className={`relative flex flex-col min-h-screen shrink-0 z-40 bg-[var(--sidebar-bg)] border-r border-[var(--border)] font-sans antialiased transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Brand row doubles as the collapse control — one affordance, not two. */}
      <div className={`flex items-center gap-2.5 border-b border-[var(--border-dim)] ${collapsed ? "px-2 py-3 justify-center" : "px-3 py-3"}`}>
        <div className="w-8 h-8 rounded-[var(--r-sm)] bg-[var(--avatar-bg)] border border-[var(--avatar-border)] flex items-center justify-center shrink-0">
          <img src={LOGO} alt="PTTS" className="w-4.5 h-4.5 object-contain logo-adaptive opacity-80" />
        </div>
        {!collapsed && (
          <p className="text-[14px] font-semibold text-[var(--text-bright)] truncate flex-1">EdgeCore</p>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-7 h-7 flex items-center justify-center rounded-[var(--r-sm)] text-[var(--text-faint)] hover:text-[var(--text-bright)] hover:bg-[var(--surface-2)] transition-colors ${collapsed ? "absolute right-1 top-14" : ""}`}
        >
          <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
        </button>
      </div>

      <nav className={`flex-1 py-2 space-y-px overflow-y-auto custom-scrollbar ${collapsed ? "px-2" : "px-2"}`}>
        {navItems
          .filter(item => !(item.type === "link" && item.adminOnly && currentUser?.role !== "admin"))
          .map((item, i) => {
            if (item.type === "rule") {
              return <div key={`r-${i}`} className="my-2 mx-2 h-px" style={{ background: "var(--border-dim)" }} />;
            }
            const active = pathname === item.href;
            const badge = item.isAlarm ? alarmCount : null;
            return (
              <Link key={item.href} href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-3 py-2 rounded-[var(--r-sm)] transition-colors ${
                  collapsed ? "px-0 justify-center" : "px-3"
                } ${active ? "bg-[var(--surface-2)]" : "hover:bg-[var(--surface-2)]"}`}
                style={active ? { color: "var(--text-bright)" } : { color: "var(--text-muted)" }}>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r"
                    style={{ background: "var(--ptts-teal)" }}
                  />
                )}
                <span aria-hidden="true" className={`text-[15px] w-4 text-center ${active ? "opacity-100" : "opacity-55"}`}>{item.icon}</span>
                {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                {badge && badge > 0 && (
                  <span
                    className={`text-[11px] font-semibold flex items-center justify-center bg-[var(--fault)] text-[var(--text-bright)] rounded-[var(--r-pill)] ${
                      collapsed
                        ? "absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1"
                        : "ml-auto min-w-[20px] h-5 px-1.5"
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      <div
        className="px-5 py-5 space-y-3 border-t border-[var(--border-dim)] bg-[var(--surface-inset)]"
        hidden={collapsed}
      >
        {/* Scope picker. The uptime counter and scope tally that used to sit in
            their own blocks moved to one muted line below — they are reference
            values, not controls, and were taking three stacked panels. */}
        <div className="flex items-center gap-2">
          <select
            value={selectedOrg}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedOrg(val);
              localStorage.setItem("ptts-selected-org", val);
              router.refresh();
            }}
            aria-label="Organization scope"
            className={`flex-1 min-w-0 bg-[var(--surface-input)] border rounded-[var(--r-sm)] ${!ciamConnected ? 'border-[var(--fault)]' : 'border-[var(--border)]'} text-[13px] text-[var(--text)] px-2.5 py-2 outline-none focus:border-[var(--ptts)] cursor-pointer transition-colors`}
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          {!ciamConnected && (
            <button
              type="button"
              onClick={handleCiamSync}
              disabled={ciamPending}
              className="btn shrink-0"
              style={{ borderColor: "var(--fault)", color: "var(--fault)" }}
              title={ciamError || "Directory offline — retry handshake"}
            >
              {ciamPending ? "…" : "Sync"}
            </button>
          )}
        </div>

        <p className="num text-[11px]" style={{ color: "var(--text-faint)" }}>
          {uptime} · {organizations.length} scope{organizations.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className={`bg-[var(--surface)] border-t border-[var(--border)] ${collapsed ? "p-2" : "px-3 py-2.5"}`}>
        <div className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}>
          <button
            type="button"
            onClick={() => setShowSwitch(true)}
            title={currentUser?.username ? `${currentUser.username} — switch user` : "Switch user"}
            className={`flex items-center gap-2.5 min-w-0 rounded-[var(--r-sm)] p-1 hover:bg-[var(--surface-2)] transition-colors ${collapsed ? "" : "flex-1"}`}
          >
            <span className="w-7 h-7 shrink-0 rounded-[var(--r-sm)] bg-[var(--avatar-bg)] border border-[var(--avatar-border)] flex items-center justify-center text-[12px] font-semibold text-[var(--online)]">
              {currentUser?.username?.substring(0, 2).toUpperCase() || "ID"}
            </span>
            {!collapsed && (
              <span className="min-w-0 text-left">
                <span className="block text-[13px] font-medium text-[var(--text-bright)] truncate leading-tight">
                  {currentUser?.username || "Guest"}
                </span>
                <span className="block text-[11px] text-[var(--text-muted)] truncate">
                  {currentUser?.role || "…"}
                </span>
              </span>
            )}
          </button>
          {!collapsed && <LogoutButton />}
        </div>
      </div>

      {showSwitch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--surface-input)]/90 backdrop-blur-sm"
             onClick={(e) => { if (e.target === e.currentTarget) setShowSwitch(false); }}>
          <div className="w-80 p-6 bg-[var(--surface-2)] border border-[var(--border)] animate-fade-in shadow-elite">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[12px] font-bold tracking-[0.06em] text-[var(--text-muted)] uppercase">Kernel Access Overlay</p>
              <button onClick={() => setShowSwitch(false)} className="text-[var(--text-faint)] hover:text-[var(--text-bright)]">✕</button>
            </div>
            <form action={switchAction} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold tracking-[0.06em] text-[var(--text-faint)] uppercase">Entity UID</label>
                <input name="username" type="text" placeholder="Access Code"
                  className="w-full bg-[var(--surface-input)] border border-[var(--border)] px-3 py-2 text-[13px] outline-none focus:border-[var(--ptts)] transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold tracking-[0.06em] text-[var(--text-faint)] uppercase">Encryption Key</label>
                <input name="password" type="password" placeholder="Key Token"
                  className="w-full bg-[var(--surface-input)] border border-[var(--border)] px-3 py-2 text-[13px] outline-none focus:border-[var(--ptts)] transition-all" />
              </div>
              {switchState?.error && <p className="text-[10px] font-bold text-[var(--fault)] uppercase tracking-widest">{switchState.error}</p>}
              <button type="submit" disabled={switchPending}
                className="w-full py-3 bg-[var(--text-muted)] text-[var(--text-inverse)] text-[12px] font-bold tracking-[0.06em] uppercase hover:bg-[var(--text-bright)] transition-all disabled:opacity-50">
                {switchPending ? "Authorizing..." : "Engage Protocol →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
