"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { vibrationBarData } from "@/lib/mock-data";

export default function VibrationBar() {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Vibration Ranking</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>SKF · RMS mm/s · limit 3.5</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={vibrationBarData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-faint)" }} tickLine={false} axisLine={false} unit=" mm/s" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={90} />
          <Tooltip contentStyle={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {vibrationBarData.map((e, i) => (
              <Cell key={i} fill={e.value >= 3.5 ? "#CC0000" : e.value >= 2.5 ? "#FFD700" : "#003DA5"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-3">
        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-sm bg-[#CC0000]" /> Fault (ABB)
        </span>
        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-sm bg-[#FFD700]" /> Warn (FLUKE)
        </span>
        <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-sm bg-[#003DA5]" /> OK (SKF)
        </span>
      </div>
    </div>
  );
}
