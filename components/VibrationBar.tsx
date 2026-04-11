"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { vibrationBarData } from "@/lib/mock-data";

export default function VibrationBar() {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">VIBRATION RANKING · RMS mm/s</span>
        <span className="text-[9px] font-bold" style={{ color:"#FFD700" }}>LIM: 3.5</span>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={155}>
          <BarChart data={vibrationBarData} layout="vertical" margin={{ left:0, right:28, top:0, bottom:0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="2 4" stroke="var(--border-dim)" />
            <XAxis type="number" tick={{ fontSize:9, fill:"var(--text-faint)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} unit=" mm/s" />
            <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:"var(--text-muted)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} width={88} />
            <ReferenceLine x={3.5} stroke="#FFD700" strokeDasharray="3 3" strokeOpacity={0.6} />
            <Tooltip
              contentStyle={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:2, fontSize:10, fontFamily:"inherit" }}
              itemStyle={{ color:"var(--text)" }}
            />
            <Bar dataKey="value" radius={[0,2,2,0]} barSize={12}>
              {vibrationBarData.map((e,i) => (
                <Cell key={i} fill={e.value>=3.5?"#CC0000":e.value>=2.5?"#FFD700":"#003DA5"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
