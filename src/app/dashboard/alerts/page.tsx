"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AlertsTable from "@/components/AlertsTable";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData } from "@/lib/types";

export default function AlarmsPage() {
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

  return (
    <div className="flex min-h-screen" style={{ background:"var(--bg)" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <TopBar title="ALARMS" onRefresh={handleRefresh} refreshing={refreshing} connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />
        
        <div className="flex-1 p-4 space-y-3">
          <div className="flex gap-2">
            <button className="text-[9px] px-3 py-1.5 rounded-sm font-bold tracking-widest transition-all" style={{ background:"var(--surface-2)", color:"#00e676", border:"1px solid #00e67640" }}>
              ✓ ACKNOWLEDGE ALL
            </button>
            <button className="text-[9px] px-3 py-1.5 rounded-sm font-bold tracking-widest transition-all" style={{ background:"var(--surface-2)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>
              ↓ EXPORT LOG
            </button>
          </div>
          <AlertsTable alerts={dashboardData.recentAlerts} />
          {/* Extended alarm history placeholder */}
          <div className="scada-card p-4 min-h-[300px]">
             <span className="scada-label mb-4">HISTORICAL ALARM LOGS</span>
             <div className="flex items-center justify-center p-8 bg-black/20 border border-dashed rounded-sm mt-4" style={{ borderColor:"var(--border-dim)" }}>
               <span className="text-[9px] tracking-widest" style={{ color:"var(--text-faint)" }}>NO HISTORICAL ALARMS IN CURRENT SHIFT</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
