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
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.2, ease: "easeOut" } }}
    >
      <div className="scada-card-header">
        <span className="scada-label">{label}</span>
        <span className={`led ${ledClass}`} />
      </div>
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between gap-1 md:gap-2">
        <div className="flex items-end gap-1 flex-wrap">
          <span className="scada-value text-2xl md:text-4xl" style={{ color }}>{value}</span>
          <span className="scada-unit pb-1 text-[10px] md:text-[15px]">{unit}</span>
        </div>
        <p className="text-[11px] md:text-sm leading-tight mt-1" style={{ color: "var(--text-muted)", minHeight: 34 }}>{sub}</p>
        <div className="flex items-center gap-1.5 text-xs md:text-sm font-bold tracking-wide mt-auto pt-2"
          style={{ color: trendUp ? "var(--online)" : "var(--fault)" }}>
          <span className="text-[10px] md:text-xs">{trendUp ? "▲" : "▼"}</span>
          <span className="truncate">{trend}</span>
        </div>
      </div>
    </motion.div>
  );
}
