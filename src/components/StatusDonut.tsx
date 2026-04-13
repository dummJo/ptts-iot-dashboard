"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { StatusSegment } from '@/lib/types';

export default function StatusDonut({ statusData = [] }: { statusData?: StatusSegment[] }) {
  const total = statusData.reduce((s, d) => s + d.value, 0);
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ASSET STATUS DISTRIBUTION</span>
        <span className="text-[9px] font-bold tracking-widest" style={{ color:"var(--text-muted)" }}>
          {total} NODES
        </span>
      </div>
      <div className="p-4">
        <div className="relative">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={48} outerRadius={64}
                paddingAngle={2} dataKey="value" strokeWidth={0}>
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:2, fontSize:10, fontFamily:"inherit" }}
                itemStyle={{ color:"var(--text)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-bold" style={{ color:"var(--text-bright)" }}>{total}</span>
            <span className="text-[9px] tracking-widest" style={{ color:"var(--text-faint)" }}>TOTAL</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
          {statusData.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="led shrink-0" style={{ background:d.color, width:8, height:8 }} />
              <span className="text-[10px] flex-1" style={{ color:"var(--text-muted)" }}>{d.name}</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color:"var(--text-bright)" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
