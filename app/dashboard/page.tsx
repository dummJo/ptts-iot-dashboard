import Sidebar from "@/components/Sidebar";
import KPICard from "@/components/KPICard";
import TrendChart from "@/components/TrendChart";
import StatusDonut from "@/components/StatusDonut";
import VibrationBar from "@/components/VibrationBar";
import AlertsTable from "@/components/AlertsTable";
import AssetTable from "@/components/AssetTable";
import { kpiData } from "@/lib/mock-data";

export default function DashboardPage() {
  const now = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-[#f0efed]">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#f0efed]/90 backdrop-blur-sm border-b border-[#e8e2d6] px-7 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-[#1a1814]">Dashboard</h1>
            <p className="text-xs text-[#6b6560] mt-0.5">{now}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[#4caf7d] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4caf7d] animate-pulse" />
              Live · updates every 60s
            </span>
            <div className="h-4 w-px bg-[#e8e2d6]" />
            <span className="text-xs text-[#6b6560]">ABB + RONDS</span>
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
            <div className="col-span-2">
              <TrendChart />
            </div>
            <div>
              <StatusDonut />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <AssetTable />
            </div>
            <div className="space-y-4">
              <VibrationBar />
            </div>
          </div>

          {/* Alerts */}
          <AlertsTable />

          {/* Footer */}
          <p className="text-center text-[10px] text-[#9a9390] pb-2">
            PTTS SmartSensor Dashboard · PT Prima Tekindo Tirta Sejahtera · Mock data — live API pending
          </p>
        </div>
      </main>
    </div>
  );
}
