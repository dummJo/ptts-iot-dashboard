"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface StatusDonutProps {
  linkSummary?: { online: number, offline: number };
  healthSummary?: { good: number, warning: number, fault: number };
}

export default function StatusDonut({ linkSummary, healthSummary }: StatusDonutProps) {
  const healthData = [
    { name: "GOOD",    value: healthSummary?.good || 0,    color: "var(--online)" },
    { name: "WARNING", value: healthSummary?.warning || 0, color: "var(--warning)" },
    { name: "FAULT",   value: healthSummary?.fault || 0,   color: "var(--fault)" },
  ];

  const totalLink = (linkSummary?.online || 0) + (linkSummary?.offline || 0);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Connectivity Card ── */}
      <div className="scada-card p-3">
        <div className="scada-card-header mb-2 text-xs">
           <span className="scada-label">NETWORK CONNECTIVITY</span>
           <span className="text-text-muted">{totalLink} NODES</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
           <div className="flex items-center justify-between p-2 rounded-sm bg-bg border border-border-dim">
              <div className="flex items-center gap-2">
                 <span className="led led-online" style={{ width:6, height:6 }} />
                 <span className="text-xs font-bold text-text-muted">ONLINE</span>
              </div>
              <span className="text-[14px] font-black text-online">{linkSummary?.online || 0}</span>
           </div>
           <div className="flex items-center justify-between p-2 rounded-sm bg-bg border border-border-dim">
              <div className="flex items-center gap-2">
                 <span className="led led-fault" style={{ width:6, height:6 }} />
                 <span className="text-xs font-bold text-text-muted">OFFLINE</span>
              </div>
              <span className="text-[14px] font-black text-fault">{linkSummary?.offline || 0}</span>
           </div>
        </div>
      </div>

      {/* ── Health Donut Card ── */}
      <div className="scada-card flex flex-col">
        <div className="scada-card-header">
          <span className="scada-label">MACHINE HEALTH (CONDITION)</span>
          <span className="text-xs font-bold tracking-widest text-[#00e676]">
            {healthSummary?.good || 0} HEALTHY
          </span>
        </div>
        <div className="p-4">
          <div className="relative">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={healthData} cx="50%" cy="50%" innerRadius={40} outerRadius={56}
                  paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {healthData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:2, fontSize:10, fontFamily:"inherit" }}
                  itemStyle={{ color:"var(--text)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold" style={{ color:"var(--text-bright)" }}>
                {Math.round(((healthSummary?.good || 0) / (totalLink || 1)) * 100)}%
              </span>
              <span className="text-sm tracking-widest" style={{ color:"var(--text-faint)" }}>GOOD</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {healthData.map((d) => (
              <div key={d.name} className="flex flex-col items-center p-1 rounded-sm border border-border-dim bg-bg/50">
                <span className="text-base font-bold text-text-faint mb-0.5 tracking-tighter">{d.name}</span>
                <span className="text-[15px] font-black leading-none" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
