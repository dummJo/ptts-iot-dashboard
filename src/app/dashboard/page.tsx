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
import type { DashboardData, Asset } from "@/lib/types";
import { EMPTY_DASHBOARD } from "@/lib/types";
import { calculateMachineHealth } from "@/lib/utils";

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [pollInterval, setPollInterval] = useState(60000);
  const [overrides, setOverrides] = useState<Record<string, {warning: number, fault: number}>>({});

  const handleOverridesChange = async (id: string, newOverrides: {warning: number, fault: number}) => {
    try {
      // 1. Update local state for immediate UI feedback
      const updated = { ...overrides, [id]: newOverrides };
      setOverrides(updated);
      
      // 2. Persist to PostgreSQL
      await apiClient.updateAssetThresholds(id, newOverrides.warning, newOverrides.fault);
      
      // 3. Trigger a background refresh to ensure all derived logic (alarms, etc) is updated
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to persist thresholds:", err);
    }
  };

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



  const { kpiData, trendData, topAssets, recentAlerts, vibrationBarData, linkSummary } = dashboardData;

  // Apply overrides and recalculate health based on ISO 10816 standards
  const dynamicAssets = topAssets?.map((a: Asset) => {
    const customThresholds = overrides[a.id] || a.vibrationThresholds;
    const newHealth = calculateMachineHealth(a.vib, a.powerKW, a.foundation, customThresholds);
    return { ...a, health: newHealth, vibrationThresholds: customThresholds };
  }) || [];

  const dynamicHealthSummary = {
    good: dynamicAssets.filter(a => a.health === 'good').length,
    warning: dynamicAssets.filter(a => a.health === 'warning').length,
    fault: dynamicAssets.filter(a => a.health === 'fault').length,
  };

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
      value: (dynamicHealthSummary.warning + dynamicHealthSummary.fault).toString(),
      unit: "EVENTS",
      sub: `${dynamicHealthSummary.fault} fault · ${dynamicHealthSummary.warning} warning`,
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
            <div className="col-span-2"><TrendChart trendData={trendData} assets={topAssets} /></div>
            <div><StatusDonut linkSummary={linkSummary} healthSummary={dynamicHealthSummary} /></div>
          </div>

          {/* Asset table + Vib bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} /></div>
            <div><VibrationBar vibrationData={vibrationBarData} /></div>
          </div>

          {/* Alarms */}
          <AlertsTable alerts={recentAlerts} />

          {/* Footer bar */}
          <div className="flex items-center justify-between px-2 py-1 text-[8px] tracking-[.15em] border-t border-border-dim mt-2"
            style={{ color:"var(--text-faint)" }}>
            <div className="flex gap-4">
              <span>PTTS SMARTSENSOR IoT PLATFORM · v1.1.0</span>
              <span>LIVE DEMO · SIMULATED DATALINK</span>
            </div>
            <div className="flex gap-4">
              <span>SESSION: 60 MIN · JWT HS256</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
