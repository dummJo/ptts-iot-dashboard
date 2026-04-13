"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

export default function TrendChart({ trendData = [] }: { trendData?: any[] }) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">TREND · TEMPERATURE & VIBRATION · 24H</span>
        <div className="flex gap-1">
          {["24H","7D","30D"].map((t,i) => (
            <button key={t} className="text-[9px] px-2 py-0.5 rounded-sm font-bold tracking-widest transition-all"
              style={i===0
                ? { background:"#005F8E", color:"#fff" }
                : { color:"var(--text-faint)", border:"1px solid var(--border)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={trendData} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
            <XAxis dataKey="time" tick={{ fontSize:9, fill:"var(--text-faint)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} />
            <YAxis yAxisId="temp" tick={{ fontSize:9, fill:"var(--text-faint)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} unit="°" />
            <YAxis yAxisId="vib" orientation="right" tick={{ fontSize:9, fill:"var(--text-faint)", fontFamily:"inherit" }}
              tickLine={false} axisLine={false} unit="↕" />
            {/* warning threshold lines */}
            <ReferenceLine yAxisId="temp" y={60} stroke="#CC0000" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine yAxisId="vib" y={3.5} stroke="#FFD700" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{ background:"var(--surface-2)", border:"1px solid var(--border)", borderRadius:2, fontSize:11, fontFamily:"inherit" }}
              labelStyle={{ color:"var(--text-muted)", fontWeight:700 }}
              itemStyle={{ color:"var(--text)" }}
            />
            <Legend wrapperStyle={{ fontSize:9, paddingTop:8, fontFamily:"inherit", letterSpacing:"0.1em" }} />
            <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="#FFD700" strokeWidth={1.5}
              dot={false} name="TEMP °C" activeDot={{ r:3, fill:"#FFD700" }} />
            <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="#003DA5" strokeWidth={1.5}
              dot={false} name="VIB mm/s" activeDot={{ r:3, fill:"#003DA5" }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 px-1">
          <span className="text-[9px] tracking-widest" style={{ color:"var(--text-faint)" }}>
            — — TEMP LIMIT: 60°C
          </span>
          <span className="text-[9px] tracking-widest" style={{ color:"var(--text-faint)" }}>
            — — VIB LIMIT: 3.5 mm/s
          </span>
        </div>
      </div>
    </div>
  );
}
