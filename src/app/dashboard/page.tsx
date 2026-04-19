"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import KPICard from "@/components/KPICard";
import TrendChart from "@/components/TrendChart";
import StatusDonut from "@/components/StatusDonut";
import VibrationBar from "@/components/VibrationBar";
import AssetTable from "@/components/AssetTable";
import AlertsTable from "@/components/AlertsTable";
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
      const updated = { ...overrides, [id]: newOverrides };
      setOverrides(updated);
      await apiClient.updateAssetThresholds(id, newOverrides.warning, newOverrides.fault);
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
    ...kpiData.slice(2)
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* ── Stable Menu Architecture (Standard Sidebar) ── */}
      <Sidebar pollInterval={pollInterval} />

      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* ── Top bar ── */}
        <TopBar 
          title="OVERVIEW" 
          onRefresh={handleRefresh} 
          refreshing={refreshing} 
          connected={dashboardData?.system?.connected} 
          pollInterval={pollInterval} 
          onPollChange={setPollInterval} 
        />

        {/* ── Scrollable Dashboard Content (Stable Re-implementation) ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 custom-scrollbar">
          
          {/* KPI grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {dynamicKPIs.map((k: any) => (
              <KPICard key={k.label} {...k} />
            ))}
          </section>

          {/* Metrics row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TrendChart trendData={trendData} assets={topAssets} />
            </div>
            <div>
              <StatusDonut linkSummary={linkSummary} healthSummary={dynamicHealthSummary} />
            </div>
          </div>

          {/* Asset intelligence row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} />
            </div>
            <div className="order-1 lg:order-2">
              <VibrationBar vibrationData={vibrationBarData} />
            </div>
          </div>

          {/* Alarm sequence */}
          <section>
            <AlertsTable alerts={recentAlerts} />
          </section>

          {/* Final footer info strip */}
          <footer className="pt-8 border-t border-[var(--border-dim)] flex flex-col md:flex-row items-center justify-between text-[10px] tracking-[.2em] text-[var(--text-faint)] font-bold gap-4">
            <div className="flex gap-6">
              <span>ENGINEERED BY DUMMVINCI · BUILD 1.3.0</span>
              <span>LIVE CLOUD INFRASTRUCTURE ACTIVE</span>
            </div>
            <div className="flex gap-6">
              <span>SCRYPT AES-256 SECURED</span>
              <span>NOMINAL SCADA LATENCY: 12MS</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
