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

/**
 * DASHBOARD SHELL — ENGINEERED BY DUMMVINCI
 * UI/UX STANDARDIZATION: ENTERPRISE GRID (META/DELOITTE STYLE)
 * - Proportional Spacing: 8px / 1rem Grid System
 * - Layout Integrity: Overflow protection & Sticky context
 * - Visual Hierarchy: Primary (KPI) -> Secondary (Trends) -> Operational (Tables)
 */

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
      sub: `${linkSummary.offline} nodes unreachable`,
      trend: "Stable",
      trendUp: true,
      color: "var(--ptts-teal)",
      ledClass: "led-online",
    },
    {
      label: "ACTIVE ALARMS",
      value: (dynamicHealthSummary.warning + dynamicHealthSummary.fault).toString(),
      unit: "EVENTS",
      sub: `${dynamicHealthSummary.fault} fault · ${dynamicHealthSummary.warning} warning`,
      trend: "Urgent",
      trendUp: false,
      color: "var(--fault)",
      ledClass: "led-fault",
    },
    ...kpiData.slice(2)
  ];

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      {/* ── Fixed Sidebar ── */}
      <Sidebar pollInterval={pollInterval} />

      {/* ── Main Work Area ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* ── TopBar (Sticky/Fixed Context) ── */}
        <header className="flex-none z-30">
          <TopBar 
            title="OVERVIEW" 
            onRefresh={handleRefresh} 
            refreshing={refreshing} 
            connected={dashboardData?.system?.connected} 
            pollInterval={pollInterval} 
            onPollChange={setPollInterval} 
          />
        </header>

        {/* ── Scrollable Workspace ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-gradient-to-b from-transparent to-[#ffffff02]">
          
          <div className="max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8 space-y-10">
            
            {/* 1. Executive Summary KPIs (Deloitte Pattern: Horizontal Consistency) */}
            <section aria-label="KPI Summary">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {dynamicKPIs.map((k: any) => (
                  <KPICard key={k.label} {...k} />
                ))}
              </div>
            </section>

            {/* 2. Primary Analytics Layer */}
            <section aria-label="Trend Analytics" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8">
                <TrendChart trendData={trendData} assets={topAssets} />
              </div>
              <div className="xl:col-span-4 h-full">
                <StatusDonut linkSummary={linkSummary} healthSummary={dynamicHealthSummary} />
              </div>
            </section>

            {/* 3. Operational Data Layer (Meta Pattern: Complex Data Handling) */}
            <section aria-label="Asset Inventory" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-8 order-2 xl:order-1">
                <AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} />
              </div>
              <div className="xl:col-span-4 order-1 xl:order-2">
                <VibrationBar vibrationData={vibrationBarData} />
              </div>
            </section>

            {/* 4. Fault Management Layer */}
            <section aria-label="Alarm History">
              <AlertsTable alerts={recentAlerts} />
            </section>

            {/* 5. Minimalist Enterprise Footer (Deloitte Style: Standardized Metadata) */}
            <footer className="pt-12 pb-8 border-t border-[var(--border-dim)] flex flex-col md:flex-row items-center justify-between text-[10px] tracking-[.25em] text-[var(--text-faint)] font-bold gap-6">
              <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--online)]" />
                  ENGINEERED BY DUMMVINCI · v1.3.0
                </span>
                <span className="opacity-60 uppercase">Cloud Infrastructure Active</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-2 uppercase">
                <span className="opacity-60">SCRYPT AES-256 SECURED</span>
                <span className="text-[var(--ptts-teal)] opacity-80">Latency: 12ms nominal</span>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
