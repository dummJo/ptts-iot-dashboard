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
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6b6560] font-medium uppercase tracking-wider">{label}</p>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <p className="text-2xl font-bold text-[#1a1814] tracking-tight">{value}</p>
      <p className="text-xs text-[#6b6560]">{sub}</p>
      <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? "text-[#4caf7d]" : "text-[#ef4444]"}`}>
        <span>{trendUp ? "↑" : "↓"}</span>
        <span>{trend}</span>
      </div>
    </div>
  );
}
