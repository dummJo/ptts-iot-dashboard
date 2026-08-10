"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const PLUGINS = [
  { name: "ABB Drive Toolkit",      version: "2.4.1", category: "Protocol",   status: "INSTALLED", desc: "Native ACS580/ACS880 driver pack with parameter sync." },
  { name: "Energy Analytics",       version: "1.8.0", category: "Analytics",  status: "INSTALLED", desc: "kWh accounting, power factor and demand peak analysis." },
  { name: "SmartSensor Pack",       version: "3.0.2", category: "Telemetry",  status: "INSTALLED", desc: "Vibration, RMS and FFT runtime widgets for the Console." },
  { name: "HVAC BACnet Suite",      version: "1.2.4", category: "Protocol",   status: "AVAILABLE", desc: "BACnet/IP discovery, point browser and schedule editor." },
  { name: "Predictive Maintenance", version: "0.9.0", category: "AI",         status: "AVAILABLE", desc: "Bearing-life prediction and anomaly forecasting models." },
  { name: "Power Quality Analyzer", version: "1.1.0", category: "Analytics",  status: "AVAILABLE", desc: "Harmonics, sag/swell and IEEE-519 reporting." },
];

const categoryColor: Record<string, string> = {
  Protocol:  "#3aa9ff",
  Analytics: "var(--ptts-teal)",
  Telemetry: "#84cc16",
  AI:        "#9b88ff",
};

export default function PluginsPage() {
  const [pollInterval, setPollInterval] = useState(60000);

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="Plugin Marketplace" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--r-sm)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[12px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · PLUGIN ECOSYSTEM</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {PLUGINS.map(p => {
              const installed = p.status === "INSTALLED";
              return (
                <article key={p.name} className="p-5 flex flex-col" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[11px] font-semibold uppercase tracking-[0.06em]"
                      style={{ color: categoryColor[p.category], border: `1px solid ${categoryColor[p.category]}40` }}>
                      {p.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[11px] font-semibold uppercase tracking-[0.06em]"
                      style={{
                        color: installed ? "var(--online)" : "var(--text-faint)",
                        border: `1px solid ${installed ? "var(--online)" : "var(--border)"}`,
                      }}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-bright)" }}>{p.name}</h3>
                  <p className="text-[12px] tracking-[0.06em] uppercase font-bold mt-0.5" style={{ color: "var(--text-faint)" }}>v{p.version}</p>
                  <p className="text-[12px] mt-3 leading-relaxed flex-1" style={{ color: "var(--text-muted)" }}>{p.desc}</p>

                  <button className="mt-4 py-2.5 text-[12px] font-bold tracking-[0.06em] uppercase transition-colors"
                    style={{
                      background: installed ? "var(--surface-2)" : "var(--ptts-teal)",
                      color: installed ? "var(--text-muted)" : "var(--bg)",
                      border: installed ? "1px solid var(--border)" : "none",
                    }}>
                    {installed ? "Manage" : "Install"}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
