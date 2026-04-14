"use client";
import { useState } from "react";
import type { Asset } from "@/lib/types";
import { getISO10816Thresholds } from "@/lib/utils";

export default function ThresholdModal({
  asset,
  onClose,
  onSave,
  readOnly = true,
}: {
  asset: Asset;
  onClose: () => void;
  onSave: (assetId: string, thresholds: { warning: number; fault: number }) => void;
  readOnly?: boolean;
}) {
  const defaultIso = getISO10816Thresholds(asset.powerKW, asset.foundation);
  const [warning, setWarning] = useState(asset.vibrationThresholds?.warning ?? defaultIso.warning);
  const [fault, setFault] = useState(asset.vibrationThresholds?.fault ?? defaultIso.fault);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm rounded-sm p-4 space-y-4 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "2px solid var(--ptts-teal)" }}>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[.2em]" style={{ color: "var(--ptts-teal)" }}>THRESHOLD CONFIG</p>
            <p className="text-[14px] font-black text-white mt-1">{asset.name}</p>
            <p className="text-[9px] tracking-widest" style={{ color: "var(--text-faint)" }}>
              {asset.powerKW ? `${asset.powerKW} kW` : "N/A kW"} • {asset.foundation?.toUpperCase() || "RIGID"} FOUNDATION
            </p>
          </div>
          <button onClick={onClose} className="text-[12px] leading-none text-gray-400 hover:text-white pb-6">✕</button>
        </div>

        <div className="space-y-3">
          <div className="p-3 rounded-sm space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border-dim)" }}>
             <p className="text-[9px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>ISO 10816 BASELINE (READ-ONLY)</p>
             <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex justify-between">
                  <span style={{ color:"var(--warning)" }}>WARNING</span>
                  <span className="font-mono font-bold text-white">{defaultIso.warning} mm/s</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color:"var(--fault)" }}>FAULT</span>
                  <span className="font-mono font-bold text-white">{defaultIso.fault} mm/s</span>
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[9px] font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
              MANUAL OVERRIDE {readOnly ? "(RESTRICTED)" : ""}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] tracking-widest mb-1" style={{ color:"var(--warning)" }}>WARNING LIMIT (mm/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={warning}
                  onChange={(e) => setWarning(parseFloat(e.target.value))}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-[11px] font-mono font-bold rounded-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", ...readOnly ? { opacity: 0.5 } : {} }}
                />
              </div>
              <div>
                <label className="block text-[8px] tracking-widest mb-1" style={{ color:"var(--fault)" }}>FAULT LIMIT (mm/s)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fault}
                  onChange={(e) => setFault(parseFloat(e.target.value))}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-[11px] font-mono font-bold rounded-sm outline-none"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", ...readOnly ? { opacity: 0.5 } : {} }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
           <button onClick={onClose} className="px-3 py-1.5 text-[9px] font-bold tracking-widest rounded-sm" style={{ color:"var(--text-muted)" }}>
             CANCEL
           </button>
           <button 
             onClick={() => {
                if(!readOnly) {
                   onSave(asset.id, { warning, fault });
                   onClose();
                }
             }} 
             disabled={readOnly}
             className="px-4 py-1.5 text-[9px] font-bold tracking-widest rounded-sm transition-opacity disabled:opacity-30 disabled:cursor-not-allowed" 
             style={{ background:"var(--ptts-teal)", color:"#fff" }}
           >
             {readOnly ? "LOCKED" : "SAVE OVERRIDE"}
           </button>
        </div>
      </div>
    </div>
  );
}
