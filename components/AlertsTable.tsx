import { recentAlerts } from "@/lib/mock-data";

const badge: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-[#CC0000]/10 border border-[#CC0000]/25", text: "text-[#CC0000]" },
  warning:  { bg: "bg-[#FFD700]/10 border border-[#FFD700]/25", text: "text-[#b89800]" },
  info:     { bg: "bg-[#003DA5]/10 border border-[#003DA5]/25", text: "text-[#003DA5]" },
};

export default function AlertsTable() {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Recent Alerts</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Today · action required</p>
        </div>
        <button className="text-xs font-medium hover:underline" style={{ color: "#00A3B4" }}>View all →</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {recentAlerts.map((alert) => {
          const b = badge[alert.severity] ?? badge.info;
          return (
            <div key={alert.id} className="p-3 rounded-lg border" style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${b.bg} ${b.text}`}>
                  {alert.severity}
                </span>
                <span className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>{alert.time}</span>
              </div>
              <p className="text-xs font-bold mb-0.5" style={{ color: "var(--text)" }}>{alert.asset}</p>
              <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>{alert.message}</p>
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-mono" style={{ color: "var(--text-faint)" }}>{alert.id}</p>
                <button className="text-[10px] px-2 py-0.5 rounded border font-medium transition-colors hover:border-[#005F8E] hover:text-[#00A3B4]"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  Review
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
