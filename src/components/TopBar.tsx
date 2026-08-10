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
      // Short date only. The full "Senin, 10 Agustus 2026" spelled out the day of
      // the week next to a live clock and carried no operational information.
      setDateStr(now.toLocaleDateString("id-ID", { day:"2-digit", month:"short" }));
      setTimeStr(now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }));
    };

    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-5 py-2 backdrop-blur-xl transition-colors duration-250 responsive-container"
      style={{ background: "var(--topbar-glass)", borderBottom: "1px solid var(--border-dim)", minHeight: 44, boxShadow: "0 4px 30px rgba(0,0,0,0.05)" }}>
      {/* Left — page title. The old three-level "PTTS › SECTION › TITLE" crumb
          was not navigable, so it spent a third of the bar restating the sidebar. */}
      <h1 className="text-[14px] font-semibold truncate" style={{ color: "var(--text-bright)" }}>
        {title}
      </h1>

      {/* Right — status and controls, one group */}
      <div className="flex items-center gap-2">
        <span className="hidden lg:flex items-center gap-2 num text-[12px] mr-1" style={{ color: "var(--text-faint)" }}>
          {dateStr} {timeStr}
        </span>

        <span
          className={`badge ${connected ? "badge-ok" : "badge-fault"}`}
          title={connected ? "Live data link" : "Data link down"}
        >
          <span aria-hidden="true" className={`led ${connected ? "led-online" : "led-fault"}`} style={{ width: 6, height: 6 }} />
          {connected ? "Live" : "Offline"}
        </span>

        {onPollChange && (
          <>
            <label htmlFor="poll-interval" className="sr-only">Polling interval</label>
            <select
              id="poll-interval"
              value={pollInterval}
              onChange={(e) => onPollChange(Number(e.target.value))}
              className="hidden sm:block text-[13px] px-2 py-1.5 rounded-[var(--r-sm)] outline-none"
              style={{ border: "1px solid var(--border)", color: "var(--text)", background: "var(--surface)" }}
            >
              <option value={5000}>5s</option>
              <option value={60000}>1m</option>
              <option value={300000}>5m</option>
              <option value={0}>Off</option>
            </select>
          </>
        )}

        {onRefresh && (
          <button type="button" onClick={onRefresh} disabled={refreshing} className="btn" aria-label="Refresh data">
            <span aria-hidden="true">{refreshing ? "…" : "⟳"}</span>
          </button>
        )}

        <ThemeToggle />

        <button
          type="button"
          onClick={() => setShowChangelog(true)}
          className="btn"
          aria-label="System changelog"
          title="System changelog"
        >
          <span aria-hidden="true">ⓘ</span>
        </button>
      </div>

      <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
    </div>
  );
}
