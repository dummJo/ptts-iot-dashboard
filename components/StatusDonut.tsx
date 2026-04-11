"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { statusData } from "@/lib/mock-data";

export default function StatusDonut() {
  const total = statusData.reduce((sum, d) => sum + d.value, 0);
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#1a1814]">Asset Status</h3>
        <p className="text-xs text-[#6b6560] mt-0.5">Distribution across {total} sensors</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {statusData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e8e2d6", borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1a1814]">{total}</p>
            <p className="text-[10px] text-[#6b6560]">Total</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {statusData.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-[#6b6560]">{d.name}</span>
            <span className="text-xs font-semibold text-[#1a1814] ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
