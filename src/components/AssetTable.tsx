import type { Asset } from '@/lib/types';
import { formatTemp, formatVib, getHealthColor, getLinkColor } from '@/lib/utils';

export default function AssetTable({ assets = [] }: { assets?: Asset[] }) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ASSET TAG LIST · LIVE READINGS</span>
        <button className="text-[9px] font-bold tracking-widest transition-all"
          style={{ color: "var(--ptts-teal)" }}>ALL →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-dim)", background: "var(--surface-2)" }}>
              {["TAG ID", "ASSET", "TYPE", "TEMP", "VIBRATION", "LINK", "HEALTH"].map((h, i) => (
                <th key={h} className={`px-3 py-2 font-bold tracking-[.12em] text-[9px]
                  ${i >= 3 && i <= 4 ? "text-right" : "text-left"}`}
                  style={{ color: "var(--text-faint)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => {
              const hp = a.health.toUpperCase();
              const hColor = getHealthColor(a.health);
              const lColor = getLinkColor(a.link);
              
              // Dynamic colors for values based on health
              const tempColor = a.health === 'fault' ? "var(--fault)" : a.health === 'warning' ? "var(--warning)" : "var(--text)";
              const vibColor  = a.health === 'fault' ? "var(--fault)" : a.health === 'warning' ? "var(--warning)" : "var(--ptts-teal)";

              return (
                <tr key={a.id}
                  className="transition-colors cursor-pointer"
                  style={{
                    borderBottom: "1px solid var(--border-dim)",
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
                  }}
                >
                  <td className="px-3 py-3 font-mono text-[9px]" style={{ color: "var(--text-faint)" }}>{a.id}</td>
                  <td className="px-3 py-3 font-bold" style={{ color: "var(--text)" }}>{a.name}</td>
                  <td className="px-3 py-3 text-[9px] tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {a.type.replace("PTTS ", "").replace("RONDS ", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold tabular-nums"
                    style={{ color: tempColor }}>{formatTemp(a.temp)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold tabular-nums"
                    style={{ color: vibColor }}>{formatVib(a.vib)}</td>
                  
                  {/* LINK STATUS (Connectivity) */}
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="led" style={{ width: 6, height: 6, background: lColor, boxShadow: a.link === 'online' ? `0 0 6px ${lColor}` : 'none' }} />
                      <span className="text-[9px] font-black tracking-widest" style={{ color: lColor }}>
                        {a.link.toUpperCase()}
                      </span>
                    </span>
                  </td>

                  {/* HEALTH STATUS (Condition) */}
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-sm border"
                      style={{ 
                        background: `${hColor}15`, 
                        borderColor: `${hColor}40`,
                        color: hColor
                      }}>
                      <span className="text-[9px] font-black tracking-[0.15em]">{hp}</span>
                    </div>
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
