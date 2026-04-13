import type { Alarm } from '@/lib/types';

const sev: Record<string, { led:string; color:string; bg:string }> = {
  critical: { led:"led-fault",   color:"#CC0000", bg:"#CC000012" },
  warning:  { led:"led-warning", color:"#FFD700", bg:"#FFD70010" },
  info:     { led:"led-online",  color:"#00e676", bg:"#00e67608" },
};

export default function AlertsTable({ alerts = [] }: { alerts?: Alarm[] }) {
  return (
    <div className="scada-card flex flex-col">
      <div className="scada-card-header">
        <span className="scada-label">ACTIVE ALARMS · TODAY</span>
        <div className="flex items-center gap-2">
          <span className="led led-fault" style={{ width:6, height:6 }} />
          <button className="text-[9px] font-bold tracking-widest transition-all" style={{ color:"#00A3B4" }}>
            ALL ALARMS →
          </button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3">
        {alerts.map((a) => {
          const s = sev[a.severity] ?? sev.info;
          return (
            <div key={a.id} className="rounded-sm p-3 flex flex-col gap-2"
              style={{ background:s.bg, border:`1px solid ${s.color}30` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`led ${s.led}`} style={{ width:7, height:7 }} />
                  <span className="text-[9px] font-bold tracking-[.15em]" style={{ color:s.color }}>
                    {a.severity.toUpperCase()}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color:"var(--text-faint)" }}>{a.time}</span>
              </div>
              <p className="text-[11px] font-bold" style={{ color:"var(--text-bright)" }}>{a.asset}</p>
              <p className="text-[10px] leading-relaxed" style={{ color:"var(--text-muted)" }}>{a.message}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono" style={{ color:"var(--text-faint)" }}>{a.id}</span>
                <button className="text-[9px] px-2 py-1 rounded-sm font-bold tracking-widest transition-all"
                  style={{ border:`1px solid ${s.color}40`, color:s.color }}>
                  ACK
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
