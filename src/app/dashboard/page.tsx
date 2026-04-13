"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KPICard from "@/components/KPICard";
import TrendChart from "@/components/TrendChart";
import StatusDonut from "@/components/StatusDonut";
import VibrationBar from "@/components/VibrationBar";
import AssetTable from "@/components/AssetTable";
import AlertsTable from "@/components/AlertsTable";
import ThemeToggle from "@/components/ThemeToggle";
import TopBar from "@/components/TopBar";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData } from "@/lib/types";

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pollInterval, setPollInterval] = useState(60000);

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboardData();
      setDashboardData(data);
    } catch (e) {
      console.error("Failed to fetch dashboard data:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (pollInterval > 0) {
      const intervalId = setInterval(fetchDashboardData, pollInterval);
      return () => clearInterval(intervalId);
    }
  }, [pollInterval]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  if (!dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4" style={{ background:"var(--bg)", color:"var(--text-bright)" }}>
        <div className="text-[11px] font-mono tracking-[0.2em] flex items-center gap-3">
          <span className="led led-warning shadow-[0_0_8px_#FFD700]" style={{ width: 8, height: 8 }} />
          CONNECTING TO DATALINK...
        </div>
      </div>
    );
  }

  const { kpiData, trendData, topAssets, recentAlerts, vibrationBarData, linkSummary, healthSummary } = dashboardData;

  const dynamicKPIs = [
    {
      label: "TOTAL NODES",
      value: (linkSummary.online + linkSummary.offline).toString(),
      unit: "/ 200",
      sub: `${linkSummary.offline} nodes currently unreachable`,
      trend: "Within capacity",
      trendUp: true,
      color: "var(--ptts-teal)",
      ledClass: "led-online",
    },
    {
      label: "ACTIVE ALARMS",
      value: (healthSummary.warning + healthSummary.fault).toString(),
      unit: "EVENTS",
      sub: `${healthSummary.fault} fault · ${healthSummary.warning} warning`,
      trend: "Priority: HIGH",
      trendUp: false,
      color: "var(--fault)",
      ledClass: "led-fault",
    },
    ...kpiData.slice(2) // Keep the other 2 KPIs (Temp/Vib) from mock for now
  ];

  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg)" }}>
      <Sidebar pollInterval={pollInterval} />

      <main className="flex-1 overflow-auto flex flex-col">
        {/* ── Top bar ── */}
        <TopBar title="OVERVIEW" onRefresh={handleRefresh} refreshing={refreshing} connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />

        {/* ── Content ── */}
        <div className="flex-1 p-4 space-y-3">

          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            {dynamicKPIs.map((k: any) => <KPICard key={k.label} {...k} />)}
          </div>

          {/* Trend + Donut */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><TrendChart trendData={trendData} /></div>
            <div><StatusDonut linkSummary={linkSummary} healthSummary={healthSummary} /></div>
          </div>

          {/* Asset table + Vib bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><AssetTable assets={topAssets} /></div>
            <div><VibrationBar vibrationData={vibrationBarData} /></div>
          </div>

          {/* Alarms */}
          <AlertsTable alerts={recentAlerts} />

          {/* Footer bar */}
          <div className="flex items-center justify-between px-2 py-1 text-[9px] tracking-widest"
            style={{ color:"var(--text-faint)" }}>
            <span>PTTS SMARTSENSOR IoT PLATFORM · v1.1.0</span>
            <span>LIVE DEMO · SIMULATED DATALINK</span>
            <span>SESSION: 60 MIN · JWT HS256</span>
          </div>
        </div>
      </main>
    </div>
  );
}
