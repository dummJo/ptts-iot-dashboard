"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { trendData } from "@/lib/mock-data";

export default function TrendChart() {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1814]">Sensor Trend — Today</h3>
          <p className="text-xs text-[#6b6560] mt-0.5">Temperature & Vibration · 24h</p>
        </div>
        <div className="flex gap-1">
          <button className="text-xs px-3 py-1 rounded-md bg-[#c9a96e]/10 text-[#c9a96e] font-medium">24h</button>
          <button className="text-xs px-3 py-1 rounded-md text-[#6b6560] hover:bg-gray-50">7d</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0efed" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#9a9390" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: "#9a9390" }} tickLine={false} axisLine={false} unit="°C" />
          <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 10, fill: "#9a9390" }} tickLine={false} axisLine={false} unit=" mm/s" />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid #e8e2d6", borderRadius: 8, background: "#fff" }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temperature (°C)" />
          <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="#4a90d9" strokeWidth={2} dot={false} name="Vibration (mm/s)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
