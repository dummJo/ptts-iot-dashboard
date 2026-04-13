"use client";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface TopBarProps {
  title: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  connected?: boolean;
  pollInterval?: number;
  onPollChange?: (val: number) => void;
}

export default function TopBar({ title, onRefresh, refreshing, connected = true, pollInterval, onPollChange }: TopBarProps) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(now.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" }));
      setTimeStr(now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    };

    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2"
      style={{ background:"var(--sidebar-bg)", borderBottom:"1px solid var(--border)", minHeight:40 }}>
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2 text-[9px] tracking-widest font-bold">
        <span style={{ color:"var(--text-faint)" }}>PTTS</span>
        <span style={{ color:"var(--border)" }}>›</span>
        <span style={{ color:"var(--text-faint)" }}>SMARTSENSOR</span>
        <span style={{ color:"var(--border)" }}>›</span>
        <span style={{ color:"#00A3B4" }}>{title.toUpperCase()}</span>
      </div>

      {/* Center — timestamp */}
      <div className="flex items-center gap-3 text-[9px] font-mono">
        <span style={{ color:"var(--text-faint)" }}>{dateStr.toUpperCase()}</span>
        <span className="tabular-nums" style={{ color:"var(--text-muted)" }}>{timeStr}</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm" 
          style={{ background: connected ? "#00e67610" : "#CC000010", border: `1px solid ${connected ? "#00e67640" : "#CC000040"}` }}>
          <span className={`led ${connected ? "led-online" : "led-fault"}`} style={{ width:6, height:6 }} />
          <span style={{ color: connected ? "#00e676" : "#CC0000" }} className="tracking-widest font-bold">
            {connected ? "LIVE DEMO" : "OFFLINE (RETAINED DATA)"}
          </span>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {onPollChange && (
          <select value={pollInterval} onChange={(e) => onPollChange(Number(e.target.value))}
            className="text-[9px] px-2 py-1.5 rounded-sm font-bold tracking-widest transition-all outline-none"
            style={{ border:"1px solid var(--border)", color:"var(--text-muted)", background:"var(--surface)" }}>
            <option value={5000}>POLL: 5s</option>
            <option value={60000}>POLL: 1m</option>
            <option value={300000}>POLL: 5m</option>
            <option value={0}>POLL: OFF</option>
          </select>
        )}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing}
            className="text-[9px] px-2.5 py-1.5 rounded-sm font-bold tracking-widest transition-all disabled:opacity-50"
            style={{ border:"1px solid var(--border)", color:"var(--text-muted)", background:"var(--surface)" }}>
            {refreshing ? "◯ SYNCING..." : "⟳ REFRESH"}
          </button>
        )}
      </div>
    </div>
  );
}
