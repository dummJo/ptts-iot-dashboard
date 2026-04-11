interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  trend: string;
  trendUp: boolean;
  color: string;
}

export default function KPICard({ label, value, sub, trend, trendUp, color }: KPICardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2 hover:shadow-lg transition-all border"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: trendUp ? "#22c55e" : "#CC0000" }}>
        <span>{trendUp ? "↑" : "↓"}</span>
        <span>{trend}</span>
      </div>
    </div>
  );
}
