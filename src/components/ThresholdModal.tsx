"use client";
import { useState } from "react";
import type { Asset } from "@/lib/types";
import { getISO10816Thresholds, formatLocalNumber } from "@/lib/utils";

// ISO class label based on power
function getISOClass(powerKW?: number) {
  if (!powerKW || powerKW < 15) return "Class I  (< 15 kW)";
  if (powerKW <= 75) return "Class II  (15 – 75 kW)";
  return "Class III / IV  (> 75 kW)";
}

// Visual range bar: shows where current value sits vs warning/fault
function RangeBar({ value, warning, fault, max }: { value: number; warning: number; fault: number; max: number }) {
  const pct = (v: number) => Math.min(100, (v / max) * 100).toFixed(1) + "%";
  const valueColor = value >= fault ? "#ff6666" : value >= warning ? "#ffdd00" : "#5dffb0";

  return (
    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
      {/* Good zone */}
      <div className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: pct(warning), background: "#5dffb030" }} />
      {/* Warning zone */}
      <div className="absolute inset-y-0" style={{ left: pct(warning), width: `calc(${pct(fault)} - ${pct(warning)})`, background: "#ffdd0030" }} />
      {/* Fault zone */}
      <div className="absolute inset-y-0 right-0" style={{ left: pct(fault), background: "#ff666630" }} />
      {/* Warning line */}
      <div className="absolute inset-y-0 w-px" style={{ left: pct(warning), background: "#ffdd00" }} />
      {/* Fault line */}
      <div className="absolute inset-y-0 w-px" style={{ left: pct(fault), background: "#ff6666" }} />
      {/* Current value marker */}
      <div
        className="absolute top-0 bottom-0 w-1 rounded-sm transition-all"
        style={{ left: `calc(${pct(value)} - 2px)`, background: valueColor, boxShadow: `0 0 6px ${valueColor}` }}
      />
    </div>
  );
}

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
  const isoDefaults = getISO10816Thresholds(asset.powerKW, asset.foundation);
  const [warning, setWarning] = useState(asset.vibrationThresholds?.warning ?? isoDefaults.warning);
  const [fault, setFault]     = useState(asset.vibrationThresholds?.fault   ?? isoDefaults.fault);
  const [hasChange, setHasChange] = useState(false);

  const sliderMax = Math.max(isoDefaults.fault * 2.5, 25);

  const handleWarning = (v: number) => {
    const clamped = Math.min(v, fault - 0.1);
    setWarning(parseFloat(clamped.toFixed(1)));
    setHasChange(true);
  };
  const handleFault = (v: number) => {
    const clamped = Math.max(v, warning + 0.1);
    setFault(parseFloat(clamped.toFixed(1)));
    setHasChange(true);
  };
  const handleReset = () => {
    setWarning(isoDefaults.warning);
    setFault(isoDefaults.fault);
    setHasChange(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-[32px] md:rounded-2xl shadow-2xl animate-fade-up"
        style={{ 
          background: "var(--surface)", 
          border: "1px solid var(--border)", 
          borderTop: "1px solid rgba(255,255,255,0.2)",
          paddingBottom: "env(safe-area-inset-bottom, 20px)" 
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
          <div>
            <p className="text-xs font-bold tracking-[.25em]" style={{ color: "var(--ptts-teal)" }}>
              VIBRATION THRESHOLD CONFIGURATION
            </p>
            <p className="text-[15px] font-black text-white mt-1">{asset.name}</p>
            <p className="text-xs tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>
              {asset.id}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-base leading-none mt-1 transition-colors"
            style={{ color: "var(--text-faint)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-faint)")}
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">

          {/* Motor Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { label: "Motor Power", value: asset.powerKW ? `${asset.powerKW} kW` : "Not set" },
              { label: "Foundation", value: asset.foundation ? asset.foundation.charAt(0).toUpperCase() + asset.foundation.slice(1) : "Rigid" },
              { label: "ISO Class", value: getISOClass(asset.powerKW) },
            ].map(({ label, value }, i) => (
              <div key={label} className={`rounded-xl px-3 py-2`} 
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-dim)" }}>
                <p className="text-[10px] md:text-sm tracking-widest font-bold" style={{ color: "var(--text-faint)" }}>{label.toUpperCase()}</p>
                <p className="text-sm md:text-base font-bold mt-0.5" style={{ color: "var(--text)" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* ISO Baseline */}
          <div className="rounded-sm px-4 py-3 space-y-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border-dim)" }}>
            <p className="text-xs font-bold tracking-widest" style={{ color: "var(--text-faint)" }}>
              ISO 10816 BASELINE  —  Read only
            </p>
            <div className="flex gap-6 text-base">
              <span>Warning: <strong className="font-black" style={{ color: "#ffdd00" }}>{formatLocalNumber(isoDefaults.warning, 1)} mm/s</strong></span>
              <span>Fault: <strong className="font-black" style={{ color: "#ff6666" }}>{formatLocalNumber(isoDefaults.fault, 1)} mm/s</strong></span>
            </div>
          </div>

          {/* Visual range bar */}
          <div>
            <p className="text-xs font-bold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              CURRENT LIVE READING
            </p>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--text-faint)" }}>
              <span>0</span>
              <span className="font-black" style={{ color: "#fff" }}>{formatLocalNumber(asset.vib, 2)} mm/s</span>
              <span>{formatLocalNumber(sliderMax, 0)}</span>
            </div>
            <RangeBar value={asset.vib} warning={warning} fault={fault} max={sliderMax} />
            <div className="flex justify-between mt-1.5 text-sm" style={{ color: "var(--text-faint)" }}>
              <span style={{ color: "#5dffb0" }}>GOOD</span>
              <span style={{ color: "#ffdd00" }}>WARNING</span>
              <span style={{ color: "#ff6666" }}>FAULT</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-widest" style={{ color: "var(--text-muted)" }}>
              MANUAL OVERRIDE {readOnly ? "— Restricted (Admin / Engineer only)" : "— Adjust per motor"}
            </p>

            {/* Warning slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-widest" style={{ color: "#ffdd00" }}>
                  Warning Threshold
                </label>
                <span className="text-sm font-black font-mono tabular-nums" style={{ color: "#ffdd00" }}>
                  {formatLocalNumber(warning, 1)} mm/s
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={sliderMax}
                step={0.1}
                value={warning}
                disabled={readOnly}
                onChange={(e) => handleWarning(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  accentColor: "#ffdd00",
                  background: readOnly ? "var(--surface-3)" : `linear-gradient(to right, #ffdd00 ${(warning / sliderMax * 100).toFixed(1)}%, var(--surface-3) 0%)`,
                }}
              />
                {/* Presets - Larger for touch */}
                <div className="flex gap-2 mt-2">
                  {[isoDefaults.warning, isoDefaults.warning * 0.75, isoDefaults.warning * 1.25].map((preset) => (
                    <button
                      key={preset}
                      disabled={readOnly}
                      onClick={() => handleWarning(parseFloat(preset.toFixed(1)))}
                      className="text-xs md:text-sm px-3 py-1.5 rounded-xl font-bold tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                      style={{ border: "1px solid #ffdd0040", color: "#ffdd00", background: "rgba(255,204,0,0.05)" }}
                    >
                      {formatLocalNumber(preset, 1)}
                    </button>
                  ))}
                </div>
            </div>

            {/* Fault slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold tracking-widest" style={{ color: "#ff6666" }}>
                  Fault Threshold
                </label>
                <span className="text-sm font-black font-mono tabular-nums" style={{ color: "#ff6666" }}>
                  {formatLocalNumber(fault, 1)} mm/s
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={sliderMax}
                step={0.1}
                value={fault}
                disabled={readOnly}
                onChange={(e) => handleFault(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  accentColor: "#ff6666",
                  background: readOnly ? "var(--surface-3)" : `linear-gradient(to right, #ff6666 ${(fault / sliderMax * 100).toFixed(1)}%, var(--surface-3) 0%)`,
                }}
              />
                {/* Presets - Larger for touch */}
                <div className="flex gap-2 mt-2">
                  {[isoDefaults.fault, isoDefaults.fault * 0.75, isoDefaults.fault * 1.25].map((preset) => (
                    <button
                      key={preset}
                      disabled={readOnly}
                      onClick={() => handleFault(parseFloat(preset.toFixed(1)))}
                      className="text-xs md:text-sm px-3 py-1.5 rounded-xl font-bold tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                      style={{ border: "1px solid #ff666640", color: "#ff6666", background: "rgba(255,102,102,0.05)" }}
                    >
                      {formatLocalNumber(preset, 1)}
                    </button>
                  ))}
                </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border-dim)" }}>
          <button
            onClick={handleReset}
            disabled={readOnly || !hasChange}
            className="text-xs font-bold tracking-widest transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ color: "var(--text-muted)" }}
          >
            Reset to ISO defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-bold tracking-widest rounded-sm transition-colors"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (!readOnly) { onSave(asset.id, { warning, fault }); onClose(); } }}
              disabled={readOnly || !hasChange}
              className="px-4 py-1.5 text-xs font-black tracking-widest rounded-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: "var(--ptts-teal)", color: "#000" }}
            >
              {readOnly ? "Restricted" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
