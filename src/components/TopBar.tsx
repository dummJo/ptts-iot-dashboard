"use client";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import ChangelogModal from "@/components/ChangelogModal";

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
  const [showChangelog, setShowChangelog] = useState(false);

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
    <div className="sticky top-0 z-50 flex items-center justify-between px-5 py-2 backdrop-blur-xl"
      style={{ background: "rgba(5, 7, 10, 0.65)", borderBottom: "1px solid var(--border-dim)", minHeight: 44, boxShadow: "0 4px 30px rgba(0,0,0,0.2)" }}>
      {/* Left — breadcrumb */}
      <div className="flex items-center gap-2 text-xs tracking-widest font-bold">
        <span style={{ color:"var(--text-muted)" }}>PTTS</span>
        <span style={{ color:"var(--text-faint)" }}>›</span>
        <span style={{ color:"var(--text-muted)" }}>SMARTSENSOR</span>
        <span style={{ color:"var(--text-faint)" }}>›</span>
        <span style={{ color:"var(--ptts-teal)" }}>{title.toUpperCase()}</span>
      </div>

      {/* Center — timestamp */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span style={{ color:"var(--text-faint)" }}>{dateStr.toUpperCase()}</span>
        <span className="tabular-nums" style={{ color:"var(--text-muted)" }}>{timeStr}</span>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm"
          style={{ 
            background: connected ? "var(--badge-online-bg)" : "var(--badge-fault-bg)", 
            border: `1px solid ${connected ? "var(--online)" : "var(--fault)"}` 
          }}>
          <span className={`led ${connected ? "led-online" : "led-fault"}`} style={{ width:6, height:6 }} />
          <span style={{ color: connected ? "var(--online)" : "var(--fault)" }} className="tracking-widest font-bold">
            {connected ? "LIVE DEMO" : "OFFLINE (RETAINED DATA)"}
          </span>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowChangelog(true)}
          className="w-8 h-8 flex items-center justify-center rounded-sm text-[15px] font-bold transition-all border border-border bg-surface hover:bg-surface-2"
          title="System Logs"
          style={{ color: "var(--ptts-teal)" }}
        >
          ⓘ
        </button>
        <ThemeToggle />
        {onPollChange && (
          <>
            <label htmlFor="poll-interval" className="sr-only">Polling Interval</label>
            <select id="poll-interval" aria-label="Polling Interval" value={pollInterval} onChange={(e) => onPollChange(Number(e.target.value))}
              className="text-xs px-2 py-1.5 rounded-sm font-bold tracking-widest transition-all outline-none"
              style={{ border:"1px solid var(--border)", color:"var(--text)", background:"var(--surface)" }}>
              <option value={5000}>POLL: 5s</option>
              <option value={60000}>POLL: 1m</option>
              <option value={300000}>POLL: 5m</option>
              <option value={0}>POLL: OFF</option>
            </select>
          </>
        )}
        {onRefresh && (
          <button onClick={onRefresh} disabled={refreshing}
            className="text-xs px-2.5 py-1.5 rounded-sm font-bold tracking-widest transition-all disabled:opacity-50"
            style={{ border:"1px solid var(--border)", color:"var(--text-muted)", background:"var(--surface)" }}>
            {refreshing ? "◯ SYNCING..." : "⟳ REFRESH"}
          </button>
        )}
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}
