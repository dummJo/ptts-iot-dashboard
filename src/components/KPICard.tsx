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
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="scada-card-header">
        <span className="scada-label">{label}</span>
        <span className={`led ${ledClass}`} />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="scada-value" style={{ color }}>{value}</span>
          {unit && <span className="scada-unit pb-1">{unit}</span>}
        </div>
        <p className="text-base" style={{ color: "var(--text-muted)" }}>{sub}</p>
        <div className="flex items-center gap-1.5 text-base font-bold tracking-wide"
          style={{ color: trendUp ? "var(--online)" : "var(--fault)" }}>
          <span>{trendUp ? "▲" : "▼"}</span>
          <span>{trend}</span>
        </div>
      </div>
    </motion.div>
  );
}
