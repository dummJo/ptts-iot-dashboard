"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import KPICard from "@/components/KPICard";

/**
 * PTTS MONITORING SYSTEM — MULTIPUMP · ABB VSD INTEGRATION
 * Draft template — placeholder data only.
 * TODO: wire telemetry from ABB drives + process gateway.
 */

type RunState = "RUN" | "STBY" | "FAULT";

interface PumpUnit {
  id: string;
  vsdModel: string;
  state: RunState;
  freqHz: number;
  currentA: number;
  powerKW: number;
  runtimeH: number;
  role: "LEAD" | "LAG-1" | "LAG-2" | "STANDBY";
}

const PUMPS: PumpUnit[] = [
  { id: "P-01", vsdModel: "ABB ACS580-01", state: "RUN",   freqHz: 47.8, currentA: 62.1, powerKW: 28.4, runtimeH: 12480, role: "LEAD" },
  { id: "P-02", vsdModel: "ABB ACS580-01", state: "RUN",   freqHz: 42.1, currentA: 54.7, powerKW: 22.9, runtimeH: 11820, role: "LAG-1" },
  { id: "P-03", vsdModel: "ABB ACS880-01", state: "STBY",  freqHz: 0.0,  currentA: 0.0,  powerKW: 0.0,  runtimeH: 9560,  role: "LAG-2" },
  { id: "P-04", vsdModel: "ABB ACS880-01", state: "FAULT", freqHz: 0.0,  currentA: 0.0,  powerKW: 0.0,  runtimeH: 8210,  role: "STANDBY" },
];

const FAULT_CODES = [
  { code: "F0007", drive: "P-04 · ACS880", text: "Motor overtemperature",        severity: "CRITICAL", time: "08:42:11" },
  { code: "A2B03", drive: "P-04 · ACS880", text: "Earth fault (warning)",        severity: "WARNING",  time: "08:41:54" },
  { code: "A5A0",  drive: "P-02 · ACS580", text: "Motor overload (cleared)",     severity: "INFO",     time: "07:58:02" },
];

const stateColor: Record<RunState, string> = {
  RUN:   "var(--online)",
  STBY:  "var(--text-muted)",
  FAULT: "var(--fault)",
};
const stateLed: Record<RunState, string> = {
  RUN:   "led-online",
  STBY:  "led-warning",
  FAULT: "led-fault",
};
const severityColor: Record<string, string> = {
  CRITICAL: "var(--fault)",
  WARNING:  "var(--warning)",
  INFO:     "var(--ptts-teal)",
};

export default function MonitoringDashboardPage() {
  // Visual-only controls (not wired to backend)
  const [auto, setAuto] = useState(true);
  const [setpoint, setSetpoint] = useState(4.5);

  const activeCount = PUMPS.filter((p) => p.state === "RUN").length;
  const totalPowerKW = PUMPS.reduce((s, p) => s + p.powerKW, 0);

  const kpis = [
    {
      label: "System Pressure",
      value: "4.42",
      unit: "bar",
      sub: `Setpoint ${setpoint.toFixed(2)} bar · stable`,
      trend: "Within band",
      trendUp: true,
      color: "var(--ptts-teal)",
      ledClass: "led-online",
    },
    {
      label: "Total Flow",
      value: "318",
      unit: "m³/h",
      sub: "Header line aggregated",
      trend: "+4.1% vs prev hr",
      trendUp: true,
      color: "var(--online)",
      ledClass: "led-online",
    },
    {
      label: "Energy Use",
      value: totalPowerKW.toFixed(1),
      unit: "kW",
      sub: "Live combined drive draw",
      trend: "-2.3% vs prev hr",
      trendUp: true,
      color: "#007aff",
      ledClass: "led-online",
    },
    {
      label: "Active Pumps",
      value: `${activeCount}/${PUMPS.length}`,
      unit: "UNITS",
      sub: "1 fault · 1 standby",
      trend: "Sequence nominal",
      trendUp: activeCount >= 2,
      color: activeCount >= 2 ? "var(--online)" : "var(--warning)",
      ledClass: activeCount >= 2 ? "led-online" : "led-warning",
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-[var(--bg)]">
        <header className="flex-none z-30">
          <TopBar title="Multipump · VSD ABB" connected={true} />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="max-w-[1700px] mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">

            {/* DRAFT BANNER */}
            <div
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}
            >
              <span className="w-1.5 h-1.5 bg-[var(--warning)] animate-pulse" />
              <span className="text-[10px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--warning)" }}>
                DRAFT TEMPLATE
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                · Placeholder data — live ABB VSD telemetry pending integration
              </span>
            </div>

            {/* KPI ROW */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
              {kpis.map((k) => (
                <div key={k.label} className="bg-[var(--bg)] p-6">
                  <KPICard {...k} />
                </div>
              ))}
            </section>

            {/* MULTIPUMP GRID */}
            <section>
              <div className="flex items-center gap-4 mb-4 px-2">
                <span className="w-1 h-1 bg-[var(--ptts-teal)]" />
                <h2 className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: "var(--text-muted)" }}>
                  Multipump Array · ABB Drive Tier
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {PUMPS.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2"
                      style={{ borderBottom: "1px solid var(--border-dim)", background: "var(--surface-2,var(--surface))" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`led ${stateLed[p.state]}`} />
                        <span className="text-xs font-bold tracking-[0.3em]" style={{ color: "var(--text-bright)" }}>
                          {p.id}
                        </span>
                      </div>
                      <span className="text-[9px] tracking-[0.3em] font-bold uppercase" style={{ color: stateColor[p.state] }}>
                        {p.state}
                      </span>
                    </div>

                    <div className="p-4 flex flex-col gap-3">
                      <div>
                        <p className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                          VSD MODEL
                        </p>
                        <p className="text-xs font-bold tracking-wide" style={{ color: "var(--text)" }}>
                          {p.vsdModel}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <p className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                            FREQ
                          </p>
                          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-bright)" }}>
                            {p.freqHz.toFixed(1)}<span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>Hz</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                            CURRENT
                          </p>
                          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-bright)" }}>
                            {p.currentA.toFixed(1)}<span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>A</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                            POWER
                          </p>
                          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-bright)" }}>
                            {p.powerKW.toFixed(1)}<span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>kW</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                            RUNTIME
                          </p>
                          <p className="text-lg font-semibold tabular-nums" style={{ color: "var(--text-bright)" }}>
                            {(p.runtimeH / 1000).toFixed(1)}<span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>kh</span>
                          </p>
                        </div>
                      </div>

                      <div
                        className="mt-1 px-2 py-1 text-center text-[9px] tracking-[0.4em] font-bold uppercase"
                        style={{
                          background: "var(--bg)",
                          border: "1px solid var(--border-dim)",
                          color: p.role === "LEAD" ? "var(--ptts-teal)" : "var(--text-muted)",
                        }}
                      >
                        {p.role}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SEQUENCE + CONTROL PANEL */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div
                className="xl:col-span-7 p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3 className="text-[11px] font-bold tracking-[0.4em] uppercase mb-4" style={{ color: "var(--text-muted)" }}>
                  Lead-Lag Sequence
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {PUMPS.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div
                        className="px-3 py-2 flex flex-col items-center min-w-[88px]"
                        style={{
                          background: "var(--bg)",
                          border: `1px solid ${p.state === "RUN" ? "var(--online)" : p.state === "FAULT" ? "var(--fault)" : "var(--border)"}`,
                        }}
                      >
                        <span className="text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>
                          {p.role}
                        </span>
                        <span className="text-sm font-bold tracking-[0.2em]" style={{ color: "var(--text-bright)" }}>
                          {p.id}
                        </span>
                      </div>
                      {i < PUMPS.length - 1 && (
                        <span className="text-lg" style={{ color: "var(--text-faint)" }}>›</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] tracking-[0.3em] uppercase font-bold mt-4" style={{ color: "var(--text-faint)" }}>
                  Rotation interval: 168h · auto-balance ON
                </p>
              </div>

              <div
                className="xl:col-span-5 p-5 flex flex-col gap-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h3 className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: "var(--text-muted)" }}>
                  Process Control
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
                    MODE
                  </span>
                  <div className="flex" style={{ border: "1px solid var(--border)" }}>
                    {(["MANUAL", "AUTO"] as const).map((m) => {
                      const on = (m === "AUTO") === auto;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setAuto(m === "AUTO")}
                          className="px-3 py-1.5 text-[10px] tracking-[0.3em] font-bold uppercase transition-colors"
                          style={{
                            background: on ? "var(--ptts-teal)" : "transparent",
                            color: on ? "var(--bg)" : "var(--text-muted)",
                          }}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
                      Pressure Setpoint
                    </span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: "var(--ptts-teal)" }}>
                      {setpoint.toFixed(2)} bar
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={0.05}
                    value={setpoint}
                    onChange={(e) => setSetpoint(parseFloat(e.target.value))}
                    aria-label="Pressure setpoint"
                    className="w-full accent-[var(--ptts-teal)]"
                  />
                  <div className="flex justify-between text-[9px] tracking-[0.3em] uppercase font-bold mt-1" style={{ color: "var(--text-faint)" }}>
                    <span>2.0</span><span>5.0</span><span>8.0</span>
                  </div>
                </div>

                <p className="text-[9px] tracking-[0.3em] uppercase font-bold pt-2" style={{ color: "var(--text-faint)" }}>
                  Visual only · setpoint not propagated to drives in this draft
                </p>
              </div>
            </section>

            {/* ABB VSD DIAGNOSTICS */}
            <section>
              <div className="flex items-center gap-4 mb-4 px-2">
                <span className="w-1 h-1 bg-[var(--fault)]" />
                <h2 className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: "var(--text-muted)" }}>
                  ABB VSD Diagnostics
                </h2>
              </div>
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-dim)" }}>
                      <th className="text-left px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Code</th>
                      <th className="text-left px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Drive</th>
                      <th className="text-left px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Description</th>
                      <th className="text-left px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Severity</th>
                      <th className="text-right px-4 py-2 text-[9px] tracking-[0.3em] uppercase font-bold" style={{ color: "var(--text-faint)" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FAULT_CODES.map((f, idx) => (
                      <tr key={idx} style={{ borderBottom: idx < FAULT_CODES.length - 1 ? "1px solid var(--border-dim)" : "none" }}>
                        <td className="px-4 py-3 font-mono font-bold" style={{ color: "var(--text-bright)" }}>{f.code}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{f.drive}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text)" }}>{f.text}</td>
                        <td className="px-4 py-3 text-[10px] tracking-[0.3em] font-bold uppercase" style={{ color: severityColor[f.severity] }}>{f.severity}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums" style={{ color: "var(--text-faint)" }}>{f.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <footer className="pt-10 pb-6 opacity-30 border-t border-[var(--border-dim)]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[9px] tracking-[0.3em] font-bold uppercase">
                <p>Module: <span style={{ color: "var(--text-bright)" }}>Monitoring System · Multipump Draft</span></p>
                <p>© 2026 PTTS · By DummVinci</p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
