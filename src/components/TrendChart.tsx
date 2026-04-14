"use client";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Brush,
} from "recharts";
import type { TrendPoint } from "@/lib/types";

const GRANULARITY = [
  { label: "1 MIN",   key: "1min"    },
  { label: "5 MIN",   key: "5min"    },
  { label: "30 MIN",  key: "30min"   },
  { label: "HOURLY",  key: "1hour"   },
  { label: "DAILY",   key: "daily"   },
  { label: "WEEKLY",  key: "weekly"  },
  { label: "MONTHLY", key: "monthly" },
  { label: "YEARLY",  key: "yearly"  },
] as const;
type GranKey = typeof GRANULARITY[number]["key"];

function mockDensify(data: TrendPoint[], targetKey: GranKey): TrendPoint[] {
  if (!data.length) return data;
  let multi = 1;
  switch (targetKey) {
    case "1min":    multi = 60;   break;
    case "5min":    multi = 12;   break;
    case "30min":   multi = 2;    break;
    case "1hour":   multi = 1;    break;
    case "daily":   multi = 0.5;  break;
    case "weekly":  multi = 0.1;  break;
    case "monthly": multi = 0.05; break;
    case "yearly":  multi = 0.01; break;
    default:        multi = 1;
  }
  if (multi >= 1) {
    return data.flatMap((d) =>
      Array.from({ length: multi }, (_, j) => ({
        time: `${d.time}:${String(Math.floor(j * (60 / multi))).padStart(2, "0")}`,
        temp: +(d.temp + (Math.random() - 0.5) * 1.5).toFixed(1),
        vib:  +(d.vib  + (Math.random() - 0.5) * 0.3).toFixed(2),
      }))
    );
  } else {
    return data.filter((_, i) => i % (Math.ceil(1 / multi)) === 0);
  }
}

export default function TrendChart({ trendData = [] }: { trendData?: TrendPoint[] }) {
  const [gran, setGran]           = useState<GranKey>("1hour");
  const [tempLimit, setTempLimit] = useState(60);
  const [vibLimit,  setVibLimit]  = useState(3.5);
  const [editTemp,  setEditTemp]  = useState(false);
  const [editVib,   setEditVib]   = useState(false);
  const displayData = mockDensify(trendData, gran);

  return (
    <div className="scada-card flex flex-col w-full">
      <div className="scada-card-header">
        <span className="scada-label">TREND · TEMPERATURE &amp; VIBRATION</span>
        <div className="flex items-center gap-2">
          <label htmlFor="trend-granularity" className="sr-only">Time Granularity</label>
          <select
            id="trend-granularity"
            aria-label="Time Granularity"
            value={gran}
            onChange={(e) => setGran(e.target.value as GranKey)}
            className="text-[9px] px-2 py-1 rounded-sm font-bold tracking-widest outline-none cursor-pointer transition-all"
            style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            {GRANULARITY.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
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
            <ReferenceLine yAxisId="temp" y={tempLimit} stroke="var(--fault)"   strokeDasharray="4 4" strokeOpacity={0.6}
              label={{ value: `${tempLimit}°`, position: "insideTopLeft",  fontSize: 8, fill: "var(--fault)"   }} />
            <ReferenceLine yAxisId="vib"  y={vibLimit}  stroke="var(--warning)" strokeDasharray="4 4" strokeOpacity={0.6}
              label={{ value: `${vibLimit}`,   position: "insideTopRight", fontSize: 8, fill: "var(--warning)" }} />
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
              dataKey="time" height={18} travellerWidth={6}
              stroke="var(--ptts)" fill="var(--surface-2)"
              onChange={(range) => {
                if (!range) return;
                const span = (range.endIndex ?? 0) - (range.startIndex ?? 0);
                if      (span < 8)  setGran("1min");
                else if (span < 24) setGran("5min");
                else if (span < 48) setGran("30min");
                else if (span < 72) setGran("1hour");
                else                setGran("daily");
              }}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Editable limit legend */}
        <div className="flex gap-5 mt-2 px-1 items-center flex-wrap">

          {/* TEMP limit — click to edit */}
          <span className="flex items-center gap-1.5 text-[9px] tracking-widest" style={{ color: "var(--fault)" }}>
            <span className="opacity-70">— —</span>
            <span>TEMP LIMIT:</span>
            {editTemp ? (
              <input
                type="number" step={1} value={tempLimit} autoFocus
                onChange={(e) => setTempLimit(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditTemp(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditTemp(false)}
                className="w-14 px-1 py-0.5 text-[9px] font-black rounded-sm outline-none font-mono"
                style={{ background: "var(--surface-2)", border: "1px solid var(--fault)", color: "var(--fault)" }}
              />
            ) : (
              <button
                onClick={() => setEditTemp(true)}
                title="Click to adjust temperature limit"
                className="font-black underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--fault)", background: "none", border: "none", padding: 0 }}
              >
                {tempLimit}°C ✎
              </button>
            )}
          </span>

          {/* VIB limit — click to edit */}
          <span className="flex items-center gap-1.5 text-[9px] tracking-widest" style={{ color: "var(--warning)" }}>
            <span className="opacity-70">— —</span>
            <span>VIB LIMIT:</span>
            {editVib ? (
              <input
                type="number" step={0.1} value={vibLimit} autoFocus
                onChange={(e) => setVibLimit(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditVib(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditVib(false)}
                className="w-16 px-1 py-0.5 text-[9px] font-black rounded-sm outline-none font-mono"
                style={{ background: "var(--surface-2)", border: "1px solid var(--warning)", color: "var(--warning)" }}
              />
            ) : (
              <button
                onClick={() => setEditVib(true)}
                title="Click to adjust vibration limit"
                className="font-black underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--warning)", background: "none", border: "none", padding: 0 }}
              >
                {vibLimit} mm/s ✎
              </button>
            )}
          </span>

          <span className="text-[9px] tracking-widest ml-auto" style={{ color: "var(--ptts-teal)" }}>↔ DRAG BRUSH TO ZOOM</span>
        </div>
      </div>
    </div>
  );
}
