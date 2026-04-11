import { topAssets } from "@/lib/mock-data";

const statusStyle: Record<string, { dot: string; label: string }> = {
  online: { dot: "bg-[#4caf7d]", label: "Online" },
  warning: { dot: "bg-[#f59e0b]", label: "Warning" },
  fault: { dot: "bg-[#ef4444]", label: "Fault" },
  offline: { dot: "bg-[#6b6560]", label: "Offline" },
};

export default function AssetTable() {
  return (
    <div className="bg-white rounded-xl border border-[#e8e2d6] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1814]">Asset Overview</h3>
          <p className="text-xs text-[#6b6560] mt-0.5">Live sensor readings</p>
        </div>
        <button className="text-xs text-[#c9a96e] hover:underline font-medium">All assets →</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[#9a9390] border-b border-[#f0efed]">
              <th className="text-left pb-2 font-medium">Asset</th>
              <th className="text-left pb-2 font-medium">Type</th>
              <th className="text-right pb-2 font-medium">Temp</th>
              <th className="text-right pb-2 font-medium">Vib</th>
              <th className="text-left pb-2 pl-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8f7f5]">
            {topAssets.map((a) => {
              const s = statusStyle[a.status];
              return (
                <tr key={a.id} className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-2.5">
                    <p className="font-semibold text-[#1a1814]">{a.name}</p>
                    <p className="text-[10px] text-[#9a9390]">{a.id}</p>
                  </td>
                  <td className="py-2.5 text-[#6b6560]">{a.type}</td>
                  <td className={`py-2.5 text-right font-mono font-semibold ${a.temp > 58 ? "text-[#ef4444]" : a.temp > 53 ? "text-[#f59e0b]" : "text-[#1a1814]"}`}>
                    {a.temp}°C
                  </td>
                  <td className={`py-2.5 text-right font-mono font-semibold ${a.vib > 3.5 ? "text-[#ef4444]" : a.vib > 2.5 ? "text-[#f59e0b]" : "text-[#1a1814]"}`}>
                    {a.vib} mm/s
                  </td>
                  <td className="py-2.5 pl-4">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      <span className="text-[#6b6560]">{s.label}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
