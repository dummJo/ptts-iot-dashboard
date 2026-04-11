import Sidebar from "@/components/Sidebar";
import KPICard from "@/components/KPICard";
import TrendChart from "@/components/TrendChart";
import StatusDonut from "@/components/StatusDonut";
import VibrationBar from "@/components/VibrationBar";
import AlertsTable from "@/components/AlertsTable";
import AssetTable from "@/components/AssetTable";
import ThemeToggle from "@/components/ThemeToggle";
import { kpiData } from "@/lib/mock-data";

export default function DashboardPage() {
  const now = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-sm px-7 py-4 flex items-center justify-between border-b"
          style={{
            background: "color-mix(in srgb, var(--bg) 85%, transparent)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--text)" }}>
              Dashboard
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{now}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-4 w-px" style={{ background: "var(--border)" }} />
            <div className="flex gap-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#CC0000]/15 text-[#CC0000]">ABB</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#FFD700]/15 text-[#b89800]">FLUKE</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-[#003DA5]/15 text-[#003DA5]">SKF</span>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-4 gap-4">
            {kpiData.map((k) => (
              <KPICard key={k.label} {...k} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><TrendChart /></div>
            <div><StatusDonut /></div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2"><AssetTable /></div>
            <div><VibrationBar /></div>
          </div>

          {/* Alerts */}
          <AlertsTable />

          <p className="text-center text-[10px] pb-2" style={{ color: "var(--text-faint)" }}>
            PTTS SmartSensor Dashboard · Mock data — live API pending · v0.1.0
          </p>
        </div>
      </main>
    </div>
  );
}
