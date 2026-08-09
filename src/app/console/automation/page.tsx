"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const FLOWS = [
  {
    name: "Pump Lead-Lag Rotator",
    desc: "Rotates lead pump every 168h based on runtime hours.",
    nodes: ["Timer", "Compare", "ABB Drive Cmd"],
    enabled: true,
    runs: 4128,
  },
  {
    name: "Energy Threshold Alarm",
    desc: "Triggers alert when feeder kW exceeds 250 for >30s.",
    nodes: ["Modbus Reader", "Threshold", "Telegram"],
    enabled: true,
    runs: 1812,
  },
  {
    name: "Vibration Predictive Trigger",
    desc: "Forwards FFT spike to AI Predict node and creates work order.",
    nodes: ["MQTT Topic", "AI Predict", "REST API"],
    enabled: false,
    runs: 0,
  },
];

const PALETTE = [
  { group: "INPUT",  items: ["Modbus Reader", "BACnet Reader", "OPC-UA Sub", "MQTT Topic", "REST Input"] },
  { group: "LOGIC",  items: ["Compare", "Timer", "Threshold", "PID", "Function", "AI Predict"] },
  { group: "OUTPUT", items: ["ABB Drive Cmd", "Email", "Telegram", "MQTT Publish", "SQL Insert", "REST API"] },
];

export default function AutomationPage() {
  const [pollInterval, setPollInterval] = useState(60000);

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="Automation Studio" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--r-sm)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[10px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · NODE WORKFLOW MOCK</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
            <aside className="p-5 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <h2 className="text-[11px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Node Palette</h2>
              {PALETTE.map(g => (
                <div key={g.group}>
                  <p className="text-[9px] tracking-[0.3em] font-bold uppercase mb-2" style={{ color: "var(--ptts-teal)" }}>{g.group}</p>
                  <ul className="space-y-1">
                    {g.items.map(it => (
                      <li key={it} className="px-2.5 py-1.5 text-[11px] font-medium cursor-grab transition-colors hover:bg-[var(--surface-2)]"
                          style={{ color: "var(--text-muted)", border: "1px solid var(--border-dim)" }}>
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </aside>

            <section className="space-y-4">
              {FLOWS.map(f => (
                <article key={f.name} className="p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[14px] font-bold tracking-tight" style={{ color: "var(--text-bright)" }}>{f.name}</h3>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] tracking-[0.3em] font-bold uppercase tabular-nums" style={{ color: "var(--text-faint)" }}>
                        {f.runs.toLocaleString()} runs
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                        style={{
                          color: f.enabled ? "var(--online)" : "var(--text-faint)",
                          border: `1px solid ${f.enabled ? "var(--online)" : "var(--border)"}`,
                        }}>
                        {f.enabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {f.nodes.map((n, i) => (
                      <div key={i} className="flex items-center gap-2 shrink-0">
                        <div className="px-3 py-2 text-[11px] font-bold tracking-tight whitespace-nowrap"
                          style={{ background: "var(--surface-2)", border: `1px solid var(--ptts-teal)`, color: "var(--text-bright)" }}>
                          {n}
                        </div>
                        {i < f.nodes.length - 1 && (
                          <span className="text-[var(--ptts-teal)] text-[14px]">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
