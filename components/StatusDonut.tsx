"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { statusData } from "@/lib/mock-data";

export default function StatusDonut() {
  const total = statusData.reduce((s, d) => s + d.value, 0);
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Asset Status</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{total} sensors total</p>
      </div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={3} dataKey="value">
              {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", color: "var(--text)" }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{total}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Total</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {statusData.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.name}</span>
            <span className="text-xs font-bold ml-auto" style={{ color: "var(--text)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
