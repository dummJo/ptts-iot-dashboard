"use client";

interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  trend: string;
  trendUp: boolean;
  color: string;
  ledClass: string;
}

import { motion } from "framer-motion";

export default function KPICard({ label, value, unit, sub, trend, trendUp, color, ledClass }: KPICardProps) {
  return (
    <motion.div
      className="scada-card flex flex-col h-full"
      // A 6px lift plus a 2% scale re-rasterised the text on every hover across a
      // grid of these. Lift only, and less of it.
      whileHover={{ y: -2, transition: { duration: 0.18, ease: "easeOut" } }}
      whileTap={{ scale: 0.995, transition: { duration: 0.12, ease: "easeOut" } }}
    >
      <div className="scada-card-header">
        <span className="scada-label">{label}</span>
        <span aria-hidden="true" className={`led ${ledClass}`} />
      </div>
      <div className="px-5 py-4 flex-1 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          {/* Size comes from .scada-value's clamp; the old text-2xl md:text-4xl
              overrode it and reintroduced the wrapping it was meant to prevent. */}
          <span className="scada-value" style={{ color }}>{value}</span>
          <span className="scada-unit">{unit}</span>
        </div>
        <p className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>{sub}</p>
        <div className="flex items-center gap-1.5 text-[13px] font-semibold mt-auto pt-2"
          style={{ color: trendUp ? "var(--online)" : "var(--fault)" }}>
          <span aria-hidden="true" className="text-[11px]">{trendUp ? "▲" : "▼"}</span>
          <span className="truncate">{trend}</span>
        </div>
      </div>
    </motion.div>
  );
}
