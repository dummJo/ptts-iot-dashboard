"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TrendChart from "@/components/TrendChart";
import VibrationBar from "@/components/VibrationBar";
import { apiClient } from "@/lib/apiClient";

export default function TrendsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

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
    const intervalId = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(intervalId);
  }, []);

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

  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <TopBar title="TRENDS" onRefresh={handleRefresh} refreshing={refreshing} />
        
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3 flex"><TrendChart trendData={dashboardData.trendData} /></div>
            <div className="col-span-1 flex"><VibrationBar vibrationData={dashboardData.vibrationBarData} /></div>
          </div>
          <div className="scada-card p-4 flex-1">
             <span className="scada-label mb-4">LONG-TERM ANALYTICS (30 DAYS)</span>
             <div className="w-full h-full min-h-[300px] flex items-center justify-center border border-dashed rounded-sm mt-2" style={{ borderColor:"var(--border-dim)", background:"var(--surface-2)" }}>
               <span className="text-[10px] tracking-widest font-bold" style={{ color:"var(--text-faint)" }}>CLOUD ANALYTICS MODULE NOT LICENSED</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
