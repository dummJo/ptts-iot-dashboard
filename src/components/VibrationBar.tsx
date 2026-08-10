"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import type { VibrationEntry } from '@/lib/types';
import { formatLocalNumber } from "@/lib/utils";

export default function VibrationBar({ vibrationData = [] }: { vibrationData?: VibrationEntry[] }) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">VIBRATION RANKING · RMS mm/s</span>
        <span className="text-[12px] font-semibold num" style={{ color:"var(--warning)" }}>LIM: {formatLocalNumber(3.5, 1)}</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={vibrationData} layout="vertical" margin={{ left:0, right:28, top:0, bottom:0 }}>
            <CartesianGrid horizontal={false} stroke="var(--border-dim)" />
            <XAxis type="number" tick={{ fontSize:11, fill:"var(--text-faint)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} unit=" mm/s" tickFormatter={(v) => formatLocalNumber(v, 1)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:"var(--text-muted)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} width={104} />
            <ReferenceLine x={3.5} stroke="var(--warning)" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Tooltip
              contentStyle={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:"var(--r-sm)", fontSize:12, fontFamily:"inherit" }}
              itemStyle={{ color:"var(--text)" }}
              formatter={(val: any) => [formatLocalNumber(val, 2) + " mm/s", "Vibration"]}
            />
            <Bar dataKey="value" radius={[0, 2, 2, 0]} barSize={12}>
              {vibrationData.map((e,i) => (
                <Cell key={i} fill={e.value >= 3.5 ? "var(--fault)" : e.value >= 2.5 ? "var(--warning)" : "var(--ptts-teal)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
