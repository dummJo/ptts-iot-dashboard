"use client";
import { useEffect, useState } from "react";
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
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(now.toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" }));
      setTimeStr(now.toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", second:"2-digit" }));
    };

    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate database refresh
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg)" }}>
      <Sidebar />

      <main className="flex-1 overflow-auto flex flex-col">
        {/* ── Top bar ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-2"
          style={{ background:"var(--sidebar-bg)", borderBottom:"1px solid var(--border)", minHeight:40 }}>
          {/* Left — breadcrumb */}
          <div className="flex items-center gap-2 text-[9px] tracking-widest font-bold">
            <span style={{ color:"var(--text-faint)" }}>PTTS</span>
            <span style={{ color:"var(--border)" }}>›</span>
            <span style={{ color:"var(--text-faint)" }}>SMARTSENSOR</span>
            <span style={{ color:"var(--border)" }}>›</span>
            <span style={{ color:"#00A3B4" }}>OVERVIEW</span>
          </div>

          {/* Center — timestamp */}
          <div className="flex items-center gap-3 text-[9px] font-mono">
            <span style={{ color:"var(--text-faint)" }}>{dateStr.toUpperCase()}</span>
            <span className="tabular-nums" style={{ color:"var(--text-muted)" }}>{timeStr}</span>
            <span className="flex items-center gap-1.5">
              <span className="led led-online" style={{ width:6, height:6 }} />
              <span style={{ color:"#00e676" }}>LIVE</span>
            </span>
          </div>

          {/* Right — controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleRefresh} disabled={refreshing}
              className="text-[9px] px-2.5 py-1.5 rounded-sm font-bold tracking-widest transition-all disabled:opacity-50"
              style={{ border:"1px solid var(--border)", color:"var(--text-muted)", background:"var(--surface)" }}>
              {refreshing ? "◯ SYNCING..." : "⟳ REFRESH"}
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-4 space-y-3">

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {kpiData.map((k) => <KPICard key={k.label} {...k} />)}
          </div>

          {/* Trend + Donut */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><TrendChart /></div>
            <div><StatusDonut /></div>
          </div>

          {/* Asset table + Vib bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><AssetTable /></div>
            <div><VibrationBar /></div>
          </div>

          {/* Alarms */}
          <AlertsTable />

          {/* Footer bar */}
          <div className="flex items-center justify-between px-2 py-1 text-[9px] tracking-widest"
            style={{ color:"var(--text-faint)" }}>
            <span>PTTS SMARTSENSOR IoT PLATFORM · v0.3.0</span>
            <span>MOCK DATA · LIVE API PENDING</span>
            <span>SESSION: 60 MIN · JWT HS256</span>
          </div>
        </div>
      </main>
    </div>
  );
}
