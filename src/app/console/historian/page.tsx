"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

const SERIES = [
  { tag: "pump.p01.flow",        backend: "TimescaleDB", points: 8_640_000, retention: "365d", lastWrite: "2s ago" },
  { tag: "pump.p01.pressure",    backend: "TimescaleDB", points: 8_640_000, retention: "365d", lastWrite: "2s ago" },
  { tag: "pump.p02.energy_kw",   backend: "InfluxDB",    points: 2_160_000, retention: "180d", lastWrite: "5s ago" },
  { tag: "vsd.acs880.freq",      backend: "TimescaleDB", points: 4_320_000, retention: "365d", lastWrite: "3s ago" },
  { tag: "sensor.bearing.rms",   backend: "InfluxDB",    points: 1_080_000, retention: "90d",  lastWrite: "8s ago" },
  { tag: "hvac.zone3.temp",      backend: "PostgreSQL",  points:   720_000, retention: "30d",  lastWrite: "1m ago" },
  { tag: "meter.feeder1.kwh",    backend: "TimescaleDB", points: 1_200_000, retention: "10y",  lastWrite: "10s ago" },
];

const sparkline = (seed: number) => {
  const pts: number[] = [];
  for (let i = 0; i < 48; i++) {
    pts.push(50 + 30 * Math.sin(i * 0.4 + seed) + 8 * Math.cos(i * 0.9 + seed * 2));
  }
  return pts.map((y, i) => `${(i / 47) * 100},${100 - y}`).join(" ");
};

const backendColor: Record<string, string> = {
  TimescaleDB: "#3aa9ff",
  InfluxDB: "#ff7a59",
  PostgreSQL: "#84cc16",
};

export default function HistorianPage() {
  const [pollInterval, setPollInterval] = useState(60000);
  const [search, setSearch] = useState("");

  const filtered = SERIES.filter(s => s.tag.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="Historian" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--r-sm)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[12px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · TIME SERIES BROWSER</span>
          </div>

          <section className="p-5 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <div>
                <label className="text-[11px] tracking-[0.06em] font-bold uppercase mb-1.5 block" style={{ color: "var(--text-faint)" }}>Tag Search</label>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="pump.p01.*"
                  className="w-full px-3 py-2 text-[12px] font-mono outline-none transition-colors"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-bright)" }} />
              </div>
              <div>
                <label className="text-[11px] tracking-[0.06em] font-bold uppercase mb-1.5 block" style={{ color: "var(--text-faint)" }}>Range</label>
                <select className="px-3 py-2 text-[11px] font-bold tracking-widest" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                  <option>LAST 1H</option><option>LAST 24H</option><option>LAST 7D</option><option>LAST 30D</option><option>CUSTOM</option>
                </select>
              </div>
              <button className="px-4 py-2 text-[12px] font-bold tracking-[0.06em] uppercase transition-colors"
                style={{ background: "var(--ptts-teal)", color: "var(--bg)" }}>QUERY</button>
            </div>
          </section>

          <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <h2 className="text-[12px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Stored Series</h2>
              <span className="text-[11px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>{filtered.length} of {SERIES.length}</span>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] tracking-[0.06em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
                  <th className="px-5 py-3">TAG</th>
                  <th className="px-5 py-3">BACKEND</th>
                  <th className="px-5 py-3 text-right">POINTS</th>
                  <th className="px-5 py-3">RETENTION</th>
                  <th className="px-5 py-3">PREVIEW (24H)</th>
                  <th className="px-5 py-3">LAST WRITE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.tag} className="text-[11px]" style={{ borderTop: "1px solid var(--border-dim)" }}>
                    <td className="px-5 py-3 font-mono font-bold" style={{ color: "var(--text-bright)" }}>{s.tag}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded-[var(--r-pill)] text-[11px] font-semibold uppercase tracking-[0.06em]"
                        style={{ color: backendColor[s.backend], border: `1px solid ${backendColor[s.backend]}40` }}>
                        {s.backend}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{s.points.toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--text-muted)" }}>{s.retention}</td>
                    <td className="px-5 py-3">
                      <svg viewBox="0 0 100 100" className="w-32 h-8" preserveAspectRatio="none">
                        <polyline points={sparkline(i)} fill="none" stroke="var(--ptts-teal)" strokeWidth="2" />
                      </svg>
                    </td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--text-faint)" }}>{s.lastWrite}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  );
}
