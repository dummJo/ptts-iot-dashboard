"use client";
import { useState } from "react";
import type { Alarm } from "@/lib/types";
import { truncate } from "@/lib/utils";

import { apiClient } from "@/lib/apiClient";

const SEV: Record<string, { led: string; color: string; bg: string; label: string }> = {
  critical: { led: "led-fault",   color: "var(--fault)",   bg: "var(--badge-fault-bg)",   label: "CRITICAL" },
  warning:  { led: "led-warning", color: "var(--warning)", bg: "var(--badge-warning-bg)", label: "WARNING"  },
  info:     { led: "led-online",  color: "var(--online)",  bg: "var(--badge-online-bg)",  label: "INFO"     },
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
        return <strong key={i} className="font-black text-text-bright">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ACTIVE ALARMS · TODAY</span>
        <div className="flex items-center gap-2">
          <span className="led led-fault" style={{ width: 6, height: 6 }} />
          <button
            className="text-[9px] font-bold tracking-widest transition-all px-3 py-1.5 rounded-sm shadow-sm disabled:opacity-40"
            style={{ 
              color: "var(--bg)", 
              background: "var(--ptts-teal)",
              border: "1px solid var(--ptts-teal)"
            }}
            disabled={loading || alerts.length === 0}
            onClick={handleAckAll}
          >
            {loading ? "PROCESSING..." : "ACKNOWLEDGE ALL"}
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        {alerts.map((a) => {
          const s = SEV[a.severity] ?? SEV.info;
          const isAcked = acknowledged.has(a.id);

          return (
            <div
              key={a.id}
              className="rounded-sm p-3 flex flex-col gap-2 transition-opacity"
              style={{
                background: s.bg,
                border: `1px solid ${isAcked ? "var(--border)" : s.color + "40"}`,
                opacity: isAcked ? 0.5 : 1,
              }}
            >
              {/* Header row — severity + time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`led ${isAcked ? "led-offline" : s.led}`} style={{ width: 7, height: 7 }} />
                  <span
                    className="text-[9px] font-bold tracking-[.15em]"
                    style={{ color: isAcked ? "var(--text-faint)" : s.color }}
                  >
                    {s.label}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: "var(--text-faint)" }}>
                  {a.time}
                </span>
              </div>

              {/* Asset name — bold */}
              <p className="text-[11px] font-bold leading-snug" style={{ color: "var(--text-bright)" }}>
                {truncate(a.asset, 28)}
              </p>

              {/* Message — normal weight, readable */}
              <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {formatMessage(truncate(a.message, 120))}
              </p>

              {/* Footer row — alarm ID + ACK button */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono italic" style={{ color: "var(--text-faint)" }}>
                  {a.id}
                </span>
                <button
                  onClick={() => handleAck(a.id)}
                  disabled={isAcked}
                  className="text-[9px] px-2.5 py-1 rounded-sm font-bold tracking-widest transition-all disabled:opacity-40 disabled:cursor-default"
                  style={{
                    border: `1px solid ${isAcked ? "var(--border)" : s.color}`,
                    color: isAcked ? "var(--text-faint)" : s.color,
                    background: isAcked ? "transparent" : "var(--bg)",
                  }}
                >
                  {isAcked ? "ACKNOWLEDGED" : "ACKNOWLEDGE"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
