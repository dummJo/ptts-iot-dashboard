"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { trendData } from "@/lib/mock-data";

export default function TrendChart() {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Sensor Trend — Today</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Temperature (FLUKE) · Vibration (SKF) · 24h
          </p>
        </div>
        <div className="flex gap-1">
          <button className="text-xs px-3 py-1 rounded-md font-medium text-white" style={{ background: "#005F8E" }}>24h</button>
          <button className="text-xs px-3 py-1 rounded-md" style={{ color: "var(--text-muted)" }}>7d</button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--text-faint)" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: "var(--text-faint)" }} tickLine={false} axisLine={false} unit="°C" />
          <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 10, fill: "var(--text-faint)" }} tickLine={false} axisLine={false} unit=" mm/s" />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--surface)",
              color: "var(--text)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          {/* Temperature — FLUKE Yellow */}
          <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#FFD700" strokeWidth={2} dot={false} name="Temperature °C" />
          {/* Vibration — SKF Blue */}
          <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="#003DA5" strokeWidth={2} dot={false} name="Vibration mm/s" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
