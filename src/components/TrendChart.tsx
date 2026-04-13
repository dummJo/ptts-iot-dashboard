"use client";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Brush,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

// Granularity levels — mirrors DB query intervals (MySQL: GROUP BY FLOOR(UNIX/300), etc.)
const GRANULARITY = [
  { label: "5 MIN",  key: "5min",   },
  { label: "15 MIN", key: "15min",  },
  { label: "1 JAM",  key: "1hour",  },
  { label: "1 HARI", key: "daily",  },
  { label: "1 MGG",  key: "weekly", },
] as const;
type GranKey = typeof GRANULARITY[number]["key"];

function mockDensify(data: TrendPoint[], targetKey: GranKey): TrendPoint[] {
  if (!data.length) return data;
  if (targetKey === "5min" || targetKey === "15min") {
    const multi = targetKey === "5min" ? 12 : 4;
    return data.flatMap((d) =>
      Array.from({ length: multi }, (_, j) => ({
        time: `${d.time}:${String(j * (60 / multi)).padStart(2, "0")}`,
        temp: +(d.temp + (Math.random() - 0.5) * 1.5).toFixed(1),
        vib:  +(d.vib  + (Math.random() - 0.5) * 0.3).toFixed(2),
      }))
    );
  }
  return data;
}

export default function TrendChart({ trendData = [] }: { trendData?: TrendPoint[] }) {
  const [gran, setGran] = useState<GranKey>("1hour");
  const displayData = mockDensify(trendData, gran);

  return (
    <div className="scada-card flex flex-col w-full">
      <div className="scada-card-header">
        <span className="scada-label">TREND · TEMPERATURE &amp; VIBRATION</span>
        <div className="flex items-center gap-2">
          {GRANULARITY.map((g) => (
            <button key={g.key} onClick={() => setGran(g.key)}
              className="text-[9px] px-2 py-0.5 rounded-sm font-bold tracking-widest transition-all"
              style={gran === g.key
                ? { background: "var(--ptts)", color: "#fff" }
                : { color: "var(--text-faint)", border: "1px solid var(--border)" }}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={displayData} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis yAxisId="temp" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} unit="°" />
            <YAxis yAxisId="vib" orientation="right" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} unit="↕" />
            <ReferenceLine yAxisId="temp" y={60}  stroke="var(--fault)"   strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine yAxisId="vib"  y={3.5} stroke="var(--warning)" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 2, fontSize: 11, fontFamily: "inherit" }}
              labelStyle={{ color: "var(--text-muted)", fontWeight: 700 }}
              itemStyle={{ color: "var(--text)" }}
            />
            <Legend wrapperStyle={{ fontSize: 9, paddingTop: 8, fontFamily: "inherit", letterSpacing: "0.1em" }} />
            <Line yAxisId="temp" type="monotone" dataKey="temp" stroke="var(--warning)" strokeWidth={1.5}
              dot={false} name="TEMP °C" activeDot={{ r: 3 }} />
            <Line yAxisId="vib" type="monotone" dataKey="vib" stroke="var(--ptts-teal)" strokeWidth={1.5}
              dot={false} name="VIB mm/s" activeDot={{ r: 3 }} />
            <Brush
              dataKey="time"
              height={18}
              travellerWidth={6}
              stroke="var(--ptts)"
              fill="var(--surface-2)"
              onChange={(range) => {
                if (!range) return;
                const span = (range.endIndex ?? 0) - (range.startIndex ?? 0);
                if (span < 8)       setGran("5min");
                else if (span < 24) setGran("15min");
                else if (span < 72) setGran("1hour");
                else                setGran("daily");
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1 px-1">
          <span className="text-[9px] tracking-widest" style={{ color: "var(--text-faint)" }}>— — TEMP LIMIT: 60°C</span>
          <span className="text-[9px] tracking-widest" style={{ color: "var(--text-faint)" }}>— — VIB LIMIT: 3.5 mm/s</span>
          <span className="text-[9px] tracking-widest ml-auto" style={{ color: "var(--ptts-teal)" }}>↔ DRAG BRUSH TO ZOOM</span>
        </div>
      </div>
    </div>
  );
}
