"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

type Health = "ONLINE" | "DEGRADED" | "OFFLINE";

const PROTOCOLS = [
  { name: "Modbus TCP",  latency: 8,   throughput: "12.4k/s", health: "ONLINE"   as Health },
  { name: "BACnet/IP",   latency: 14,  throughput: "3.2k/s",  health: "ONLINE"   as Health },
  { name: "OPC-UA",      latency: 22,  throughput: "8.1k/s",  health: "DEGRADED" as Health },
  { name: "MQTT",        latency: 6,   throughput: "21.7k/s", health: "ONLINE"   as Health },
  { name: "EtherNet/IP", latency: 11,  throughput: "5.6k/s",  health: "ONLINE"   as Health },
  { name: "Profinet",    latency: 0,   throughput: "0",       health: "OFFLINE"  as Health },
];

const NODES = [
  { id: "PLC-01",   x:  90, y: 120, label: "PLC · Siemens",     proto: "Profinet" },
  { id: "VSD-01",   x: 290, y:  70, label: "ABB ACS580",        proto: "Modbus TCP" },
  { id: "VSD-02",   x: 290, y: 170, label: "ABB ACS880",        proto: "Modbus TCP" },
  { id: "PUMP-01",  x: 490, y:  40, label: "Pump P-01",         proto: "—" },
  { id: "PUMP-02",  x: 490, y: 100, label: "Pump P-02",         proto: "—" },
  { id: "PUMP-03",  x: 490, y: 200, label: "Pump P-03",         proto: "—" },
  { id: "SENSOR-A", x: 290, y: 280, label: "Smart Sensor",      proto: "MQTT" },
  { id: "BACNET-1", x:  90, y: 280, label: "HVAC Controller",   proto: "BACnet/IP" },
  { id: "METER-1",  x: 490, y: 300, label: "Energy Meter",      proto: "OPC-UA" },
];

const EDGES: [string, string][] = [
  ["PLC-01","VSD-01"], ["PLC-01","VSD-02"], ["PLC-01","BACNET-1"],
  ["VSD-01","PUMP-01"], ["VSD-01","PUMP-02"], ["VSD-02","PUMP-03"],
  ["PLC-01","SENSOR-A"], ["SENSOR-A","METER-1"],
];

const healthColor: Record<Health, string> = {
  ONLINE:   "var(--online)",
  DEGRADED: "var(--warning)",
  OFFLINE:  "var(--fault)",
};

export default function TopologyPage() {
  const [pollInterval, setPollInterval] = useState(60000);

  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="flex-none z-30">
          <TopBar title="Live Topology" connected={true} pollInterval={pollInterval} onPollChange={setPollInterval} />
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center gap-3 px-3 py-2" style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "var(--r-sm)" }}>
            <span className="w-2 h-2" style={{ background: "var(--ptts-teal)" }} />
            <span className="text-[10px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>DRAFT TEMPLATE · TOPOLOGY MOCK</span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            <section className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[11px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Edge Network · Live Map</h2>
                <span className="text-[9px] tracking-[0.3em] font-bold uppercase" style={{ color: "var(--text-faint)" }}>{NODES.length} nodes · {EDGES.length} links</span>
              </div>

              <div className="relative w-full overflow-x-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-dim)" }}>
                <svg viewBox="0 0 600 360" className="w-full h-[360px]" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="link" x1="0" x2="1">
                      <stop offset="0%" stopColor="var(--ptts-teal)" stopOpacity="0.1"/>
                      <stop offset="50%" stopColor="var(--ptts-teal)" stopOpacity="0.7"/>
                      <stop offset="100%" stopColor="var(--ptts-teal)" stopOpacity="0.1"/>
                    </linearGradient>
                  </defs>
                  {EDGES.map(([from, to], i) => {
                    const a = nodeMap[from]; const b = nodeMap[to];
                    return (
                      <g key={i}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border)" strokeWidth="1" />
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="url(#link)" strokeWidth="2" strokeDasharray="4 8" >
                          <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.4s" repeatCount="indefinite"/>
                        </line>
                      </g>
                    );
                  })}
                  {NODES.map(n => (
                    <g key={n.id}>
                      <rect x={n.x - 42} y={n.y - 16} width="84" height="32" fill="var(--surface)" stroke="var(--ptts-teal)" strokeOpacity="0.6"/>
                      <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text-bright)" letterSpacing="1">{n.id}</text>
                      <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize="7" fill="var(--text-faint)" letterSpacing="0.5">{n.proto}</text>
                      <circle cx={n.x + 36} cy={n.y - 10} r="2.5" fill="var(--online)">
                        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.6s" repeatCount="indefinite"/>
                      </circle>
                    </g>
                  ))}
                </svg>
              </div>
            </section>

            <aside className="p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <h2 className="text-[11px] tracking-[0.4em] font-bold uppercase" style={{ color: "var(--text-bright)" }}>Protocol Runtime</h2>
              <ul className="space-y-2">
                {PROTOCOLS.map(p => (
                  <li key={p.name} className="px-3 py-2.5 flex items-center justify-between" style={{ background: "var(--surface-2)", border: "1px solid var(--border-dim)" }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-1.5 h-1.5" style={{ background: healthColor[p.health] }} />
                      <span className="text-[11px] font-bold" style={{ color: "var(--text-bright)" }}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] tracking-widest font-bold uppercase tabular-nums" style={{ color: "var(--text-faint)" }}>
                      <span>{p.latency}ms</span>
                      <span style={{ color: healthColor[p.health] }}>{p.health}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
