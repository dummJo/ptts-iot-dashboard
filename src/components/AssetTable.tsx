"use client";
import type { Asset } from '@/lib/types';

const statusMap: Record<string, { cls: string; label: string }> = {
  online:  { cls: "led-online",  label: "ONLINE"  },
  warning: { cls: "led-warning", label: "WARN"    },
  fault:   { cls: "led-fault",   label: "FAULT"   },
  offline: { cls: "led-offline", label: "OFFLINE" },
};

export default function AssetTable({ assets = [] }: { assets?: Asset[] }) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ASSET TAG LIST · LIVE READINGS</span>
        <button className="text-[9px] font-bold tracking-widest transition-all"
          style={{ color:"#00A3B4" }}>ALL →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border-dim)", background:"var(--surface-2)" }}>
              {["TAG ID","ASSET","TYPE","TEMP","VIBRATION","STATUS"].map((h,i) => (
                <th key={h} className={`px-3 py-2 font-bold tracking-[.12em] text-[9px]
                  ${i>=3?"text-right":"text-left"} ${i===5?"text-left pl-4":""}`}
                  style={{ color:"var(--text-faint)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => {
              const st = statusMap[a.status];
              const tempColor = a.temp > 60 ? "#CC0000" : a.temp > 55 ? "#FFD700" : "var(--text)";
              const vibColor  = a.vib > 3.5 ? "#CC0000" : a.vib > 2.5 ? "#FFD700" : "#003DA5";
              return (
                <tr key={a.id}
                  className="transition-colors cursor-pointer"
                  style={{
                    borderBottom:"1px solid var(--border-dim)",
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#005F8E10")}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "var(--surface-2)")}>
                  <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color:"var(--text-faint)" }}>{a.id}</td>
                  <td className="px-3 py-2.5 font-bold" style={{ color:"var(--text)" }}>{a.name}</td>
                  <td className="px-3 py-2.5 text-[9px] tracking-wide" style={{ color:"var(--text-muted)" }}>
                    {a.type.replace("ABB ","").replace("RONDS ","").toUpperCase()}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums"
                    style={{ color: tempColor }}>{a.temp}°C</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums"
                    style={{ color: vibColor }}>{a.vib} mm/s</td>
                  <td className="px-3 py-2.5 pl-4">
                    <span className="flex items-center gap-1.5">
                      <span className={`led ${st.cls}`} style={{ width:7, height:7 }} />
                      <span className="text-[9px] tracking-widest font-bold" style={{ color:"var(--text-muted)" }}>
                        {st.label}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
