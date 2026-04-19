"use client";
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Brush,
} from "recharts";
import type { TrendPoint, Asset } from "@/lib/types";
import { formatLocalNumber } from "@/lib/utils";
import { assetTrends } from "@/lib/mock-data";

// ── Granularity options ───────────────────────────────────────────────
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

// ── Available metric channels ─────────────────────────────────────────
type MetricKey = "vib" | "temp" | "rms" | "powerKW" | "freq" | "velocity" | "current";

const METRICS: {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  yAxisId: string;
}[] = [
  { key: "vib",      label: "Vibration",  unit: "mm/s", color: "var(--metric-vib)",      yAxisId: "left"  },
  { key: "temp",     label: "Temperature",unit: "°C",   color: "var(--metric-temp)",     yAxisId: "right" },
  { key: "rms",      label: "RMS",        unit: "mm/s", color: "var(--metric-rms)",      yAxisId: "left"  },
  { key: "powerKW",  label: "Motor kW",   unit: "kW",   color: "var(--metric-power)",    yAxisId: "right" },
  { key: "freq",     label: "Frequency",  unit: "Hz",   color: "var(--metric-freq)",     yAxisId: "right" },
  { key: "velocity", label: "Velocity",   unit: "mm/s", color: "var(--metric-velocity)", yAxisId: "left"  },
  { key: "current",  label: "Current",    unit: "A",    color: "var(--metric-current)",  yAxisId: "right" },
];

// ── Data densification ───────────────────────────────────────────────
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
        ...d,
        time:     `${d.time}:${String(Math.floor(j * (60 / multi))).padStart(2, "0")}`,
        temp:     +(d.temp     + (Math.random() - 0.5) * 1.5).toFixed(1),
        vib:      +(d.vib      + (Math.random() - 0.5) * 0.3).toFixed(2),
        rms:      +(( d.rms      ?? d.vib * 0.92) + (Math.random() - 0.5) * 0.2).toFixed(2),
        powerKW:  +(( d.powerKW  ?? 30)  + (Math.random() - 0.5) * 3).toFixed(1),
        freq:     +(( d.freq     ?? 50)  + (Math.random() - 0.5) * 1).toFixed(1),
        velocity: +(( d.velocity ?? d.vib * 1.3) + (Math.random() - 0.5) * 0.2).toFixed(2),
        current:  +(( d.current  ?? 80)  + (Math.random() - 0.5) * 5).toFixed(1),
      }))
    );
  } else {
    return data.filter((_, i) => i % Math.ceil(1 / multi) === 0);
  }
}

// ── Component ────────────────────────────────────────────────────────
interface TrendChartProps {
  trendData?: TrendPoint[];
  assets?: Asset[];
}

export default function TrendChart({ trendData = [], assets = [] }: TrendChartProps) {
  const [gran,      setGran]      = useState<GranKey>("1hour");
  const [tempLimit, setTempLimit] = useState(60);
  const [vibLimit,  setVibLimit]  = useState(3.5);
  const [editTemp,  setEditTemp]  = useState(false);
  const [editVib,   setEditVib]   = useState(false);
  const [assetId,   setAssetId]   = useState<string>("ALL");
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(new Set(["vib", "temp"]));

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } // keep at least one
      else next.add(key);
      return next;
    });
  };

  // Resolve trend source: per-asset if available, else global
  const rawData = useMemo(() => {
    if (assetId === "ALL") return trendData;
    return assetTrends[assetId] ?? trendData;
  }, [assetId, trendData]);

  const displayData = useMemo(() => mockDensify(rawData, gran), [rawData, gran]);

  // Build asset list for selector
  const assetOptions = [
    { id: "ALL", name: "All Assets (Fleet Average)" },
    ...assets.map((a) => ({ id: a.id, name: `${a.id} · ${a.name}` })),
  ];

  const activeMetricDefs = METRICS.filter((m) => activeMetrics.has(m.key));

  return (
    <div className="scada-card flex flex-col w-full">
      <div className="scada-card-header">
        <span className="scada-label">TREND · SENSOR DATA</span>

        {/* Controls row */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Asset selector */}
          <label htmlFor="asset-select" className="sr-only">Select Asset</label>
          <select
            id="asset-select"
            aria-label="Select Asset"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            className="text-[10px] md:text-xs px-2 py-1.5 md:py-1 rounded-sm font-bold tracking-widest outline-none cursor-pointer transition-all max-w-[140px] md:max-w-[180px] truncate"
            style={{ background: "var(--surface-2)", color: "var(--ptts-teal)", border: "1px solid var(--border)" }}
          >
            {assetOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Granularity selector */}
          <label htmlFor="trend-granularity" className="sr-only">Time Granularity</label>
          <select
            id="trend-granularity"
            aria-label="Time Granularity"
            value={gran}
            onChange={(e) => setGran(e.target.value as GranKey)}
            className="text-[10px] md:text-xs px-2 py-1.5 md:py-1 rounded-sm font-bold tracking-widest outline-none cursor-pointer transition-all"
            style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            {GRANULARITY.map((g) => (
              <option key={g.key} value={g.key}>{g.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric toggle chips */}
      <div className="flex flex-wrap gap-1.5 px-4 pt-3 pb-1">
        {METRICS.map((m) => {
          const on = activeMetrics.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-bold tracking-widest transition-all"
              style={{
                background: on ? "var(--bg)" : "var(--surface-2)",
                border: `1px solid ${on ? m.color : "var(--border)"}`,
                color: on ? m.color : "var(--text-faint)",
              }}
            >
              <span
                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full inline-block"
                style={{ background: on ? m.color : "var(--border)" }}
              />
              {m.label}
              <span className="hidden sm:inline" style={{ opacity: on ? 0.7 : 0.4 }}>{m.unit}</span>
            </button>
          );
        })}
        <span className="hidden md:inline text-[10px] md:text-sm self-center ml-1" style={{ color: "var(--text-faint)" }}>
          Click to toggle metrics
        </span>
      </div>

      <div className="p-2 md:p-4 md:pt-2 w-full max-w-full overflow-hidden">
        <div style={{ width: "100%", height: 220, touchAction: "pan-x" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--border-dim)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} tickFormatter={(v) => formatLocalNumber(v, 1)} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: "var(--text-faint)", fontFamily: "inherit" }}
              tickLine={false} axisLine={false} tickFormatter={(v) => formatLocalNumber(v, 0)} />
            {activeMetrics.has("temp") && (
              <ReferenceLine yAxisId="right" y={tempLimit} stroke="var(--fault)" strokeDasharray="4 4" strokeOpacity={0.6}
                label={{ value: `${formatLocalNumber(tempLimit, 0)}°`, position: "insideTopLeft", fontSize: 8, fill: "var(--fault)" }} />
            )}
            {activeMetrics.has("vib") && (
              <ReferenceLine yAxisId="left" y={vibLimit} stroke="var(--warning)" strokeDasharray="4 4" strokeOpacity={0.6}
                label={{ value: `${formatLocalNumber(vibLimit, 1)}`, position: "insideTopRight", fontSize: 8, fill: "var(--warning)" }} />
            )}
            <Tooltip
              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 2, fontSize: 11, fontFamily: "inherit" }}
              labelStyle={{ color: "var(--text-muted)", fontWeight: 700 }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(val: any, name: any) => [formatLocalNumber(val, 2), name]}
            />
            <Legend wrapperStyle={{ fontSize: 9, paddingTop: 8, fontFamily: "inherit", letterSpacing: "0.1em" }} />
            {activeMetricDefs.map((m) => (
              <Line
                key={m.key}
                yAxisId={m.yAxisId}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1.5}
                dot={false}
                name={`${m.label} (${m.unit})`}
                activeDot={{ r: 3 }}
              />
            ))}
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
        </div>

        {/* Editable limit legend */}
        <div className="flex gap-2 md:gap-5 mt-2 md:mt-4 px-1 items-center flex-wrap">
          <span className="flex items-center gap-1.5 text-[10px] md:text-xs tracking-widest" style={{ color: "var(--fault)" }}>
            <span className="opacity-70 hidden sm:inline">— —</span>
            <span className="hidden sm:inline">TEMP LIMIT:</span>
            <span className="sm:hidden">TEMP:</span>
            {editTemp ? (
              <input type="number" step={1} value={tempLimit} autoFocus
                onChange={(e) => setTempLimit(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditTemp(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditTemp(false)}
                className="w-14 px-1 py-0.5 text-xs font-black rounded-sm outline-none font-mono"
                style={{ background: "var(--surface-2)", border: "1px solid var(--fault)", color: "var(--fault)" }}
              />
            ) : (
              <button onClick={() => setEditTemp(true)} title="Click to adjust"
                className="font-black underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--fault)", background: "none", border: "none", padding: 0 }}>
                {formatLocalNumber(tempLimit, 0)}°C ✎
              </button>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] md:text-xs tracking-widest" style={{ color: "var(--warning)" }}>
            <span className="opacity-70 hidden sm:inline">— —</span>
            <span className="hidden sm:inline">VIB LIMIT:</span>
            <span className="sm:hidden">VIB:</span>
            {editVib ? (
              <input type="number" step={0.1} value={vibLimit} autoFocus
                onChange={(e) => setVibLimit(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditVib(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditVib(false)}
                className="w-16 px-1 py-0.5 text-xs font-black rounded-sm outline-none font-mono"
                style={{ background: "var(--surface-2)", border: "1px solid var(--warning)", color: "var(--warning)" }}
              />
            ) : (
              <button onClick={() => setEditVib(true)} title="Click to adjust"
                className="font-black underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70"
                style={{ color: "var(--warning)", background: "none", border: "none", padding: 0 }}>
                {formatLocalNumber(vibLimit, 1)} mm/s ✎
              </button>
            )}
          </span>
          <span className="hidden sm:inline text-[10px] md:text-xs tracking-widest ml-auto mt-2 sm:mt-0" style={{ color: "var(--ptts-teal)" }}>
            ↔ DRAG BRUSH TO ZOOM
          </span>
        </div>
      </div>
    </div>
  );
}
