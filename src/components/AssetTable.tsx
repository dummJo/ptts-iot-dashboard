import { useState, useEffect } from 'react';
import type { Asset } from '@/lib/types';
import { formatTemp, formatVib, getHealthColor, getLinkColor, calculateMachineHealth } from '@/lib/utils';
import ThresholdModal from './ThresholdModal';
import { getCurrentSessionAction } from '@/app/actions/auth';

export default function AssetTable({ assets = [], onOverridesChange }: { assets?: Asset[], onOverridesChange?: (id: string, overrides: { warning: number, fault: number }) => void }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [userRole, setUserRole] = useState<string>("operator");

  useEffect(() => {
    getCurrentSessionAction().then(session => {
      if (session.success && session.role) {
        setUserRole(session.role.toLowerCase());
      }
    });
  }, []);

  const canEdit = userRole === 'admin' || userRole === 'engineer';

  const handleSaveOverride = (assetId: string, thresholds: { warning: number; fault: number }) => {
    if (onOverridesChange) {
      onOverridesChange(assetId, thresholds);
    }
  };

  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ASSET TAG LIST · LIVE READINGS</span>
        <button className="text-xs font-bold tracking-widest transition-all"
          style={{ color: "var(--ptts-teal)" }}>ALL →</button>
      </div>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[700px] lg:min-w-0">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-dim)", background: "var(--surface-2)" }}>
              {["TAG ID", "ASSET NAME", "TYPE", "TEMP", "VIBRATION", "LINK", "HEALTH", "CFG"].map((h, i) => (
                <th key={h} className={`px-3 py-2.5 font-black tracking-[.2em] text-sm
                  ${i >= 3 && i <= 4 ? "text-right" : i === 7 ? "text-center" : "text-left"}`}
                  style={{ color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((a, idx) => {
              // Recalculate health dynamically based on ISO or overrides
              const currentHealth = calculateMachineHealth(a.vib, a.powerKW, a.foundation, a.vibrationThresholds);
              const hp = currentHealth.toUpperCase();
              const hColor = getHealthColor(currentHealth);
              const lColor = getLinkColor(a.link);
              
              // Dynamic colors for values based on health
              const tempColor = currentHealth === 'fault' ? "var(--fault)" : currentHealth === 'warning' ? "var(--warning)" : "var(--text)";
              const vibColor  = currentHealth === 'fault' ? "var(--fault)" : currentHealth === 'warning' ? "var(--warning)" : "var(--ptts-teal)";

              return (
                <tr key={a.id}
                  className="transition-colors cursor-pointer hover:bg-white/5 active:scale-[0.99] transition-transform duration-200"
                  style={{
                    borderBottom: "1px solid var(--border-dim)",
                    background: idx % 2 === 0 ? "transparent" : "var(--surface-2)",
                  }}
                  onClick={() => setSelectedAsset(a)}
                >
                  <td className="px-3 py-3.5 font-mono text-xs tracking-tighter" style={{ color: "var(--text-faint)" }}>
                    <span style={{ color: "var(--ptts-teal)", opacity: 0.6 }}>TAG-</span>{a.id.substring(0, 8)}
                  </td>
                  <td className="px-3 py-3.5 font-black text-sm" style={{ color: "var(--text-bright)" }}>{a.name.toUpperCase()}</td>
                  <td className="px-3 py-3.5 text-sm font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    {a.type.replace("PTTS ", "").replace("RONDS ", "").toUpperCase()}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono font-black text-sm tabular-nums"
                    style={{ color: tempColor }}>{formatTemp(a.temp)}</td>
                  <td className="px-3 py-3.5 text-right font-mono font-black text-sm tabular-nums"
                    style={{ color: vibColor }}>{formatVib(a.vib)}</td>
                  
                  {/* LINK STATUS (Connectivity) */}
                  <td className="px-3 py-3">
                    <span className="flex items-center gap-1.5">
                      <span className="led" style={{ width: 6, height: 6, background: lColor, boxShadow: a.link === 'online' ? `0 0 6px ${lColor}` : 'none' }} />
                      <span className="text-xs font-black tracking-widest" style={{ color: lColor, textShadow: '0 0 8px currentColor' }}>
                        {a.link.toUpperCase()}
                      </span>
                    </span>
                  </td>

                  {/* HEALTH STATUS (Condition) */}
                  <td className="px-3 py-3">
                    <div className="inline-flex items-center px-2 py-0.5 rounded-sm border"
                      style={{
                        background: currentHealth === 'fault' ? 'var(--badge-fault-bg)' : currentHealth === 'warning' ? 'var(--badge-warning-bg)' : 'var(--badge-online-bg)',
                        borderColor: `var(--${currentHealth === 'fault' ? 'fault' : currentHealth === 'warning' ? 'warning' : 'online'})`,
                        color: hColor
                      }}>
                      <span className="text-xs font-black tracking-[0.15em]">{hp}</span>
                    </div>
                  </td>
                  
                  {/* CONFIG BUTTON */}
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAsset(a); }}
                      aria-label={canEdit ? "Configure Thresholds" : "View Thresholds"}
                      className="text-[14px] leading-none transition-opacity hover:opacity-100"
                      style={{ color: canEdit ? "var(--ptts-teal)" : "var(--text-muted)", opacity: canEdit ? 0.85 : 0.6 }}
                      title={canEdit ? "Configure Thresholds" : "View Thresholds"}
                    >
                      ⚙
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedAsset && (
        <ThresholdModal 
          asset={selectedAsset} 
          onClose={() => setSelectedAsset(null)} 
          onSave={handleSaveOverride}
          readOnly={!canEdit}
        />
      )}
    </div>
  );
}
