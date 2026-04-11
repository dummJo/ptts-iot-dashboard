import { recentAlerts } from "@/lib/mock-data";

const badge: Record<string, string> = {
  critical: "bg-[#ef4444]/10 text-[#ef4444]",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b]",
  info: "bg-[#4a90d9]/10 text-[#4a90d9]",
};

export default function AlertsTable() {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1814]">Recent Alerts</h3>
          <p className="text-xs text-[#6b6560] mt-0.5">Today · requires attention</p>
        </div>
        <button className="text-xs text-[#c9a96e] hover:underline font-medium">View all</button>
      </div>
      <div className="space-y-3">
        {recentAlerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#f8f7f5] border border-[#f0efed]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${badge[alert.severity]}`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] text-[#9a9390]">{alert.time}</span>
              </div>
              <p className="text-xs font-semibold text-[#1a1814] truncate">{alert.asset}</p>
              <p className="text-[11px] text-[#6b6560] mt-0.5">{alert.message}</p>
              <p className="text-[10px] text-[#9a9390] mt-0.5">{alert.type} · {alert.id}</p>
            </div>
            <button className="shrink-0 text-[11px] px-2.5 py-1 rounded-md border border-[#e8e2d6] text-[#6b6560] hover:text-[#1a1814] hover:border-[#c9a96e] transition-colors font-medium">
              Review
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
