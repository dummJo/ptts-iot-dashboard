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

export default function KPICard({ label, value, unit, sub, trend, trendUp, color, ledClass }: KPICardProps) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">{label}</span>
        <span className={`led ${ledClass}`} />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-2">
        <div className="flex items-end gap-1">
          <span className="scada-value" style={{ color }}>{value}</span>
          {unit && <span className="scada-unit pb-1">{unit}</span>}
        </div>
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{sub}</p>
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wide"
          style={{ color: trendUp ? "#4dff9a" : "#ff6666" }}>
          <span>{trendUp ? "▲" : "▼"}</span>
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}
