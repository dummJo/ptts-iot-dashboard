"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const MODULES = [
  { name: "Predictive Failure Detection", desc: "Bearing, motor and pump degradation forecasting from FFT + RMS streams.", confidence: 94, lastRun: "12s ago",  enabled: true },
  { name: "Anomaly Detection",            desc: "Unsupervised drift detection across telemetry tags with rolling baselines.", confidence: 88, lastRun: "47s ago",  enabled: true },
  { name: "Energy Optimization",          desc: "Adaptive setpoint suggestions for VSD speed vs flow demand.",                confidence: 81, lastRun: "3m ago",   enabled: true },
  { name: "Adaptive PID",                 desc: "Online PID auto-tuning loop for pressure / temperature control.",            confidence: 76, lastRun: "11m ago",  enabled: false },
  { name: "Alarm Reduction",              desc: "Suppress correlated alarm storms via Bayesian root-cause clustering.",       confidence: 90, lastRun: "1m ago",   enabled: true },
  { name: "Digital Twin Sync",            desc: "Continuously aligns model state with live runtime stream.",                  confidence: 67, lastRun: "Pending",  enabled: false },
];

export default function AIEnginePage() {
  const [pollInterval, setPollInterval] = useState(60000);

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="AI Engine" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--r-sm)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[12px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · INTELLIGENCE LAYER</span>
          </div>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Active Models",     value: "4 / 6",   color: "var(--online)" },
              { label: "Inferences · 24h",  value: "184.2k",  color: "var(--ptts-teal)" },
              { label: "Avg Confidence",    value: "82.6%",   color: "var(--text-bright)" },
              { label: "Pending Reviews",   value: "7",       color: "var(--warning)" },
            ].map(s => (
              <div key={s.label} className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                <p className="text-[11px] tracking-[0.06em] font-bold uppercase mb-2" style={{ color: "var(--text-faint)" }}>{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {MODULES.map(m => (
              <article key={m.name} className="p-5 flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[14px] font-bold tracking-tight pr-4" style={{ color: "var(--text-bright)" }}>{m.name}</h3>
                  <button className="shrink-0 w-9 h-5 relative transition-colors"
                    style={{ background: m.enabled ? "var(--ptts-teal)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <span className="absolute top-0.5 w-3.5 h-3.5 transition-all"
                      style={{ left: m.enabled ? "calc(100% - 18px)" : "2px", background: m.enabled ? "var(--bg)" : "var(--text-faint)" }} />
                  </button>
                </div>
                <p className="text-[12px] leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>{m.desc}</p>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
                    <span>Confidence</span>
                    <span className="tabular-nums" style={{ color: "var(--text-bright)" }}>{m.confidence}%</span>
                  </div>
                  <div className="h-[3px] w-full" style={{ background: "var(--border-dim)" }}>
                    <div className="h-full transition-all" style={{ width: `${m.confidence}%`, background: "var(--ptts-teal)" }} />
                  </div>
                  <p className="text-[11px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
                    Last run · <span style={{ color: "var(--text-muted)" }}>{m.lastRun}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
