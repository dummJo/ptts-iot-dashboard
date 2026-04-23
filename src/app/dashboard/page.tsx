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
 * PTTS OPERATIONS CONSOLE v2.0 — PROPRIETARY SYSTEM
 * Architecture: Monolithic Precision
 * Layout: High-Density Analytics Grid
 */

export default function DashboardPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [pollInterval, setPollInterval] = useState(60000);
  const [overrides, setOverrides] = useState<Record<string, {warning: number, fault: number}>>({});

  const handleOverridesChange = async (id: string, newOverrides: {warning: number, fault: number}) => {
    try {
      setOverrides(prev => ({ ...prev, [id]: newOverrides }));
      await apiClient.updateAssetThresholds(id, newOverrides.warning, newOverrides.fault);
      fetchDashboardData();
    } catch (err) { console.error(err); }
  };

  const fetchDashboardData = async () => {
    try {
      const data = await apiClient.getDashboardData();
      setDashboardData(data);
    } catch (e) { console.error(e); }
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
      label: "Node Population",
      value: (linkSummary.online + linkSummary.offline).toString(),
      unit: "REG",
      sub: `${linkSummary.offline} nodes currently static`,
      trend: "Nominal",
      trendUp: true,
      color: "var(--ptts-teal)",
      ledClass: "led-online",
    },
    {
      label: "System Alerts",
      value: (dynamicHealthSummary.warning + dynamicHealthSummary.fault).toString(),
      unit: "EVT",
      sub: `${dynamicHealthSummary.fault} Critical · ${dynamicHealthSummary.warning} Warning`,
      trend: "Evaluate",
      trendUp: false,
      color: "var(--fault)",
      ledClass: "led-fault",
    },
    ...kpiData.slice(2).map(k => ({...k, label: k.label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}))
  ];

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden font-sans">
      
      {/* Dynamic Shell Layer */}
      <Sidebar pollInterval={pollInterval} />

      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-black">
        
        {/* Superior Top Interface */}
        <header className="flex-none z-30">
          <TopBar 
            title="Consolidated Overview" 
            onRefresh={handleRefresh} 
            refreshing={refreshing} 
            connected={dashboardData?.system?.connected} 
            pollInterval={pollInterval} 
            onPollChange={setPollInterval} 
          />
        </header>

        {/* Clinical Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          <div className="max-w-[1700px] mx-auto p-6 lg:p-12 space-y-12 animate-fade-in">
            
            {/* Primary Metrics Layer (Monolith Layout) */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
              {dynamicKPIs.map((k: any) => (
                <div key={k.label} className="bg-black p-6">
                  <KPICard {...k} />
                </div>
              ))}
            </section>

            {/* Deep Analytics Layer */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-stretch">
              <div className="xl:col-span-8">
                <div className="h-full border border-[var(--border-dim)] bg-[#0a0a0a] p-1">
                  <TrendChart trendData={trendData} assets={topAssets} />
                </div>
              </div>
              <div className="xl:col-span-4 h-full">
                <div className="h-full border border-[var(--border-dim)] bg-[#0a0a0a] p-1">
                  <StatusDonut linkSummary={linkSummary} healthSummary={dynamicHealthSummary} />
                </div>
              </div>
            </section>

            {/* Logistical Inventory Layer */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-stretch">
              <div className="xl:col-span-8 order-2 xl:order-1">
                <AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} />
              </div>
              <div className="xl:col-span-4 order-1 xl:order-2">
                <VibrationBar vibrationData={vibrationBarData} />
              </div>
            </section>

            {/* Incident Repository Layer */}
            <section className="pt-8">
              <div className="flex items-center gap-4 mb-6 px-2">
                <span className="w-1 h-1 bg-[var(--fault)]" />
                <h2 className="text-[11px] font-bold tracking-[0.4em] text-[var(--text-muted)] uppercase">Incident Registry</h2>
              </div>
              <AlertsTable alerts={recentAlerts} />
            </section>

            {/* Professional Legal & Metadata Strip */}
            <footer className="pt-20 pb-12 opacity-30 border-t border-[var(--border-dim)]">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-[9px] tracking-[0.3em] font-bold uppercase transition-opacity hover:opacity-100 duration-500">
                <div className="flex items-center gap-8">
                  <p>System Build: <span className="text-white">v2.0.0-Stable</span></p>
                  <p>Host: <span className="text-white">Primary Cloud Instance</span></p>
                </div>
                <div className="flex items-center gap-8">
                  <p className="flex items-center gap-2 text-[var(--online)]">
                    <span className="w-1 h-1 bg-current" />
                    Secure Link Protocol
                  </p>
                  <p>© 2026 PTTS · By DummVinci</p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
