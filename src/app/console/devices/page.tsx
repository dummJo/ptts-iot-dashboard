"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AssetTable from "@/components/AssetTable";
import StatusDonut from "@/components/StatusDonut";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData, Asset } from "@/lib/types";
import { EMPTY_DASHBOARD } from "@/lib/types";
import { calculateMachineHealth } from "@/lib/utils";

/**
 * ASSET TOPOGRAPHY & REGISTRY — INDUSTRIAL GRADE
 * Paradigm: Monolithic Data Visualization
 */

export default function AssetsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [pollInterval, setPollInterval] = useState(60000);
  const [overrides, setOverrides] = useState<Record<string, {warning: number, fault: number}>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem('ptts-thresholds');
    if (saved) setOverrides(JSON.parse(saved));
  }, []);

  const handleOverridesChange = (id: string, newOverrides: {warning: number, fault: number}) => {
    const updated = { ...overrides, [id]: newOverrides };
    setOverrides(updated);
    sessionStorage.setItem('ptts-thresholds', JSON.stringify(updated));
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

  const dynamicAssets = dashboardData.topAssets?.map((a: Asset) => {
    const customThresholds = overrides[a.id] || a.vibrationThresholds;
    const newHealth = calculateMachineHealth(a.vib, a.powerKW, a.foundation, customThresholds);
    return { ...a, health: newHealth, vibrationThresholds: customThresholds };
  }) || [];

  const dynamicHealthSummary = {
    good: dynamicAssets.filter(a => a.health === 'good').length,
    warning: dynamicAssets.filter(a => a.health === 'warning').length,
    fault: dynamicAssets.filter(a => a.health === 'fault').length,
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg)] overflow-hidden">
      <Sidebar pollInterval={pollInterval} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-[var(--surface-inset)]">
        <header className="flex-none z-30">
          <TopBar 
            title="Device Fabric · Registry"
            onRefresh={() => setRefreshing(false)} 
            refreshing={refreshing} 
            connected={dashboardData?.system?.connected} 
            pollInterval={pollInterval} 
            onPollChange={setPollInterval} 
          />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="console-canvas animate-fade-in">
            
            {/* Primary Analysis Layer */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-stretch">
              <div className="xl:col-span-4">
                <div className="h-full border border-[var(--border-dim)] bg-[var(--surface-inset)] p-1">
                  <StatusDonut linkSummary={dashboardData.linkSummary} healthSummary={dynamicHealthSummary} />
                </div>
              </div>
              <div className="xl:col-span-8">
                <AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} />
              </div>
            </section>

            {/* HMI / Topography Layer */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <span className="w-1 h-1 bg-[var(--online)]" />
                <h2 className="text-[12px] font-bold tracking-[0.06em] text-[var(--text-muted)] uppercase">Spatial Topography View</h2>
              </div>
              <div className="border border-[var(--border-dim)] bg-[var(--surface-inset)] min-h-[400px] flex items-center justify-center">
                 <div className="flex flex-col items-center gap-6 opacity-20">
                    <span className="text-[40px] font-thin">⧉</span>
                    <p className="text-[12px] font-bold tracking-[0.06em] uppercase">HMI Mapping Module - Loading Interface</p>
                    <div className="w-48 h-px bg-[var(--border)] relative overflow-hidden">
                       <div className="absolute inset-0 bg-[var(--border-bright)] animate-[slide_2s_infinite]" style={{ transform: 'translateX(-100%)' }} />
                    </div>
                 </div>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
