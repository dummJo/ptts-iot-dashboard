"use client";
import { useState } from "react";
import type { Alarm } from "@/lib/types";
import { truncate } from "@/lib/utils";

import { apiClient } from "@/lib/apiClient";

// `warning` previously pointed at var(--badge-warning-bg); the token is called
// --badge-warn-bg, so warning-severity cards rendered with no tint — the one
// severity where the colour cue matters most for triage.
const SEV: Record<string, { led: string; color: string; bg: string; badge: string; label: string }> = {
  critical: { led: "led-fault",   color: "var(--fault)",   bg: "var(--badge-fault-bg)",  badge: "badge-fault", label: "CRITICAL" },
  warning:  { led: "led-warning", color: "var(--warning)", bg: "var(--badge-warn-bg)",   badge: "badge-warn",  label: "WARNING"  },
  info:     { led: "led-online",  color: "var(--online)",  bg: "var(--badge-online-bg)", badge: "badge-ok",    label: "INFO"     },
};

export default function AlertsTable({ alerts = [] }: { alerts?: Alarm[] }) {
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleAck = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAcknowledged((prev) => new Set([...prev, id]));
    await apiClient.acknowledgeAlarm(id).catch(console.error);
  };

  const handleAckAll = async () => {
    setLoading(true);
    setAcknowledged(new Set(alerts.map((a) => a.id)));
    await Promise.all(alerts.map(a => apiClient.acknowledgeAlarm(a.id))).catch(console.error);
    setLoading(false);
  };

  // Light formatter to strip markdown-like symbols and apply better styling
  const formatMessage = (msg: string) => {
    // Strip headers (###)
    let cleaned = msg.replace(/###\s?/g, "");
    // Extract bold bits (**text**)
    const parts = cleaned.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-semibold text-text-bright">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleExportLog = () => {
    if (!alerts || alerts.length === 0) {
      alert("No active alarms to export.");
      return;
    }
    const headers = ["ID", "Asset", "Severity", "Message", "Time"];
    const rows = alerts.map(a => 
      [a.id, a.asset, a.severity, `"${a.message.replace(/"/g, '""')}"`, a.time].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ptts_ptw_active_alarms_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ACTIVE ALARMS · TODAY</span>
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="led led-fault" style={{ width: 6, height: 6 }} />
          <button type="button" onClick={handleExportLog} disabled={alerts.length === 0} className="btn">
            Export log
          </button>
          <button
            type="button"
            onClick={handleAckAll}
            disabled={loading || alerts.length === 0}
            className="btn btn-primary"
          >
            {loading ? "Processing…" : "Acknowledge all"}
          </button>
        </div>
      </div>

      {alerts.length === 0 && (
        <p className="px-5 py-8 text-[13px] text-center" style={{ color: "var(--text-faint)" }}>
          No active alarms.
        </p>
      )}

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
        {alerts.map((a) => {
          const s = SEV[a.severity] ?? SEV.info;
          const isAcked = acknowledged.has(a.id);

          return (
            <div
              key={a.id}
              className="p-3.5 flex flex-col gap-2.5 transition-opacity"
              style={{
                background: s.bg,
                border: `1px solid ${isAcked ? "var(--border)" : s.color + "40"}`,
                borderRadius: "var(--r-md)",
                opacity: isAcked ? 0.55 : 1,
              }}
            >
              {/* Header row — severity + time */}
              <div className="flex items-center justify-between gap-2">
                <span className={`badge ${isAcked ? "" : s.badge}`}>
                  <span aria-hidden="true" className={`led ${isAcked ? "led-offline" : s.led}`} style={{ width: 7, height: 7 }} />
                  {s.label}
                </span>
                <span className="num text-[12px]" style={{ color: "var(--text-faint)" }}>
                  {a.time}
                </span>
              </div>

              {/* Asset name */}
              <p className="text-[14px] font-semibold leading-snug" style={{ color: "var(--text-bright)" }}>
                {truncate(a.asset, 28)}
              </p>

              {/* Message */}
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {formatMessage(truncate(a.message, 120))}
              </p>

              {/* Footer row — alarm ID + ACK button */}
              <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                <span className="num text-[12px] truncate" style={{ color: "var(--text-faint)" }}>
                  {a.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleAck(a.id)}
                  disabled={isAcked}
                  className="btn shrink-0"
                  style={
                    isAcked
                      ? undefined
                      : { borderColor: s.color, color: s.color, background: "var(--bg)" }
                  }
                >
                  {isAcked ? "Acknowledged" : "Acknowledge"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
