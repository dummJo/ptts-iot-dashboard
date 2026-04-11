"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { vibrationBarData } from "@/lib/mock-data";

export default function VibrationBar() {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#1a1814]">Top Assets — Vibration</h3>
        <p className="text-xs text-[#6b6560] mt-0.5">RMS mm/s · threshold: 3.5</p>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={vibrationBarData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "#9a9390" }} tickLine={false} axisLine={false} unit=" mm/s" />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#6b6560" }} tickLine={false} axisLine={false} width={90} />
          <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e8e2d6", borderRadius: 8 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {vibrationBarData.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 3.5 ? "#ef4444" : entry.value >= 2.5 ? "#f59e0b" : "#4caf7d"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
