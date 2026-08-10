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
        <button type="button" className="btn">ALL →</button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="data-table min-w-[760px] lg:min-w-0">
          <thead>
            <tr>
              {["TAG ID", "ASSET NAME", "TYPE", "TEMP", "VIBRATION", "LINK", "HEALTH", "CFG"].map((h, i) => (
                <th key={h} scope="col"
                  className={i >= 3 && i <= 4 ? "!text-right" : i === 7 ? "!text-center" : undefined}>
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
                  className="cursor-pointer"
                  style={{ background: idx % 2 === 0 ? "transparent" : "var(--surface-2)" }}
                  onClick={() => setSelectedAsset(a)}
                >
                  <td className="num" style={{ color: "var(--text-faint)" }}>
                    <span style={{ color: "var(--ptts-teal)", opacity: 0.7 }}>TAG-</span>{a.id.substring(0, 8)}
                  </td>
                  <td className="font-semibold" style={{ color: "var(--text-bright)" }}>{a.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {a.type.replace("PTTS ", "").replace("RONDS ", "")}
                  </td>
                  <td className="num !text-right" style={{ color: tempColor }}>{formatTemp(a.temp)}</td>
                  <td className="num !text-right" style={{ color: vibColor }}>{formatVib(a.vib)}</td>

                  {/* LINK STATUS (Connectivity) */}
                  <td>
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="led" style={{ width: 6, height: 6, background: lColor }} />
                      <span className="text-[13px] font-semibold" style={{ color: lColor }}>
                        {a.link.toUpperCase()}
                      </span>
                    </span>
                  </td>

                  {/* HEALTH STATUS (Condition) */}
                  <td>
                    {/* Was styled inline against var(--badge-warning-bg), a token that
                        does not exist — warning rows rendered with no tint at all. */}
                    <span className={`badge ${currentHealth === 'fault' ? 'badge-fault' : currentHealth === 'warning' ? 'badge-warn' : 'badge-ok'}`}>
                      {hp}
                    </span>
                  </td>

                  {/* CONFIG BUTTON */}
                  <td className="!text-center">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedAsset(a); }}
                      aria-label={canEdit ? `Configure thresholds for ${a.name}` : `View thresholds for ${a.name}`}
                      className="text-[16px] leading-none transition-opacity hover:opacity-100"
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
