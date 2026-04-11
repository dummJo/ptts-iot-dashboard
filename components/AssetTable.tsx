import { topAssets } from "@/lib/mock-data";

const statusDot: Record<string, string> = {
  online:  "bg-[#22c55e]",
  warning: "bg-[#FFD700]",
  fault:   "bg-[#CC0000]",
  offline: "bg-[#6b7280]",
};
const statusLabel: Record<string, string> = {
  online: "Online", warning: "Warning", fault: "Fault", offline: "Offline",
};

export default function AssetTable() {
  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Asset Overview</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Live sensor readings</p>
        </div>
        <button className="text-xs font-medium hover:underline" style={{ color: "#00A3B4" }}>All assets →</button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b" style={{ borderColor: "var(--border)" }}>
            {["Asset", "Source", "Temp", "Vibration", "Status"].map((h) => (
              <th key={h} className={`pb-2 font-semibold ${h === "Temp" || h === "Vibration" ? "text-right" : "text-left"}`}
                style={{ color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
          {topAssets.map((a) => (
            <tr key={a.id} className="hover:opacity-80 transition-opacity">
              <td className="py-2.5">
                <p className="font-semibold" style={{ color: "var(--text)" }}>{a.name}</p>
                <p className="text-[10px] font-mono" style={{ color: "var(--text-faint)" }}>{a.id}</p>
              </td>
              <td className="py-2.5">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  a.type.startsWith("ABB")
                    ? "bg-[#CC0000]/10 text-[#CC0000]"
                    : "bg-[#003DA5]/10 text-[#003DA5]"
                }`}>
                  {a.type.startsWith("ABB") ? "ABB" : "RONDS"}
                </span>
              </td>
              <td className="py-2.5 text-right font-mono font-semibold"
                style={{ color: a.temp > 58 ? "#CC0000" : a.temp > 53 ? "#b89800" : "var(--text)" }}>
                {a.temp}°C
              </td>
              <td className="py-2.5 text-right font-mono font-semibold"
                style={{ color: a.vib > 3.5 ? "#CC0000" : a.vib > 2.5 ? "#b89800" : "#003DA5" }}>
                {a.vib} mm/s
              </td>
              <td className="py-2.5">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[a.status]}`} />
                  <span style={{ color: "var(--text-muted)" }}>{statusLabel[a.status]}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
