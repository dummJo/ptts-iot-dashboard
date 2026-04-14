"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AssetTable from "@/components/AssetTable";
import StatusDonut from "@/components/StatusDonut";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData } from "@/lib/types";
import { EMPTY_DASHBOARD } from "@/lib/types";

export default function AssetsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
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


  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg)" }}>
      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 overflow-auto flex flex-col">
        <TopBar title="ASSETS" onRefresh={handleRefresh} refreshing={refreshing} connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />
        
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1"><StatusDonut linkSummary={dashboardData.linkSummary} healthSummary={dashboardData.healthSummary} /></div>
            <div className="col-span-3 flex"><AssetTable assets={dashboardData.topAssets} /></div>
          </div>
          <div className="scada-card p-4 flex flex-col flex-1 min-h-[200px]">
             <span className="scada-label mb-4">ASSET TOPOGRAPHY MAP (PLACEHOLDER)</span>
             <div className="flex-1 border border-dashed rounded-sm flex items-center justify-center" style={{ borderColor:"var(--border-dim)", background:"var(--surface-2)" }}>
               <span className="text-[10px] tracking-widest" style={{ color:"var(--text-faint)" }}>SCADA HMI GRAPHIC VIEW NOT CONFIGURED</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
