"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

type SvcStatus = "RUNNING" | "DEGRADED" | "STOPPED";

const SERVICES: { name: string; uptime: string; throughput: string; status: SvcStatus; desc: string }[] = [
  { name: "Protocol Engine",     uptime: "14d 06:22:11", throughput: "21.7k msg/s", status: "RUNNING",  desc: "Modbus / OPC-UA / BACnet / MQTT driver runtime." },
  { name: "Event Bus",           uptime: "14d 06:22:11", throughput: "18.4k evt/s", status: "RUNNING",  desc: "NATS + Redis Streams pub/sub fabric." },
  { name: "Live UI Engine",      uptime: "14d 06:22:11", throughput: "612 ws conn", status: "RUNNING",  desc: "WebSocket sync layer for SCADA renderer." },
  { name: "Automation Engine",   uptime: "14d 06:21:08", throughput: "412 trig/m",  status: "RUNNING",  desc: "Workflow execution and node logic runtime." },
  { name: "Historian Writer",    uptime: "14d 06:22:09", throughput: "9.8k pts/s",  status: "DEGRADED", desc: "TimescaleDB / InfluxDB ingest pipeline." },
  { name: "AI Inference",        uptime: "0d 00:00:00",  throughput: "—",            status: "STOPPED",  desc: "Model serving for predictive modules." },
];

const GATEWAYS = [
  { id: "EDGE-01", site: "Plant North · Pump House",   ip: "10.20.1.11", health: "ONLINE",  cpu: 22, mem: 38 },
  { id: "EDGE-02", site: "Plant North · Compressor",   ip: "10.20.1.12", health: "ONLINE",  cpu: 41, mem: 52 },
  { id: "EDGE-03", site: "Plant South · Utility Hall", ip: "10.20.2.11", health: "DEGRADED", cpu: 78, mem: 81 },
  { id: "EDGE-04", site: "Plant South · HVAC Loop",    ip: "10.20.2.12", health: "OFFLINE", cpu: 0,  mem: 0  },
];

const statusColor: Record<SvcStatus, string> = {
  RUNNING:  "var(--online)",
  DEGRADED: "var(--warning)",
  STOPPED:  "var(--fault)",
};
const healthColor: Record<string, string> = {
  ONLINE:   "var(--online)",
  DEGRADED: "var(--warning)",
  OFFLINE:  "var(--fault)",
};

export default function SystemControlPage() {
  const [pollInterval, setPollInterval] = useState(60000);

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="System Control" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[10px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · RUNTIME OPERATIONS</span>
          </div>

          <section style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <h2 className="text-[11px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Runtime Services</h2>
            </div>
            <div className="divide-y divide-[var(--border-dim)]">
              {SERVICES.map(s => (
                <div key={s.name} className="px-5 py-4 grid grid-cols-1 md:grid-cols-[200px_1fr_140px_140px_120px] gap-4 items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5" style={{ background: statusColor[s.status] }} />
                    <span className="text-[12px] font-bold" style={{ color: "var(--text-bright)" }}>{s.name}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                  <p className="text-[10px] font-mono tabular-nums" style={{ color: "var(--text-faint)" }}>{s.uptime}</p>
                  <p className="text-[10px] font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{s.throughput}</p>
                  <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase justify-self-start"
                    style={{ color: statusColor[s.status], border: `1px solid ${statusColor[s.status]}40` }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <h2 className="text-[11px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Edge Gateways</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] tracking-[0.3em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">SITE</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3 text-right">CPU</th>
                  <th className="px-5 py-3 text-right">MEM</th>
                  <th className="px-5 py-3">HEALTH</th>
                </tr>
              </thead>
              <tbody>
                {GATEWAYS.map(g => (
                  <tr key={g.id} className="text-[11px]" style={{ borderTop: "1px solid var(--border-dim)" }}>
                    <td className="px-5 py-3 font-mono font-bold" style={{ color: "var(--text-bright)" }}>{g.id}</td>
                    <td className="px-5 py-3" style={{ color: "var(--text-muted)" }}>{g.site}</td>
                    <td className="px-5 py-3 font-mono" style={{ color: "var(--text-faint)" }}>{g.ip}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{g.cpu}%</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{g.mem}%</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase"
                        style={{ color: healthColor[g.health], border: `1px solid ${healthColor[g.health]}40` }}>
                        {g.health}
                      </span>
                    </td>
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
