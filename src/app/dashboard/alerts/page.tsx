"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AlertsTable from "@/components/AlertsTable";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData } from "@/lib/types";
import { EMPTY_DASHBOARD } from "@/lib/types";

export default function AlarmsPage() {
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


  const handleAcknowledgeAll = async () => {
    if (!dashboardData.recentAlerts || dashboardData.recentAlerts.length === 0) return;
    setRefreshing(true);
    try {
      // Create a promise for each alarm to acknowledge
      await Promise.all(dashboardData.recentAlerts.map(a => apiClient.acknowledgeAlarm(a.id)));
    } catch (e) {
      console.error("Failed to acknowledge all alarms", e);
    }
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleExportLog = () => {
    if (!dashboardData.recentAlerts || dashboardData.recentAlerts.length === 0) {
      alert("No active alarms to export.");
      return;
    }
    
    // Build CSV content
    const headers = ["ID", "Asset", "Severity", "Message", "Time"];
    const rows = dashboardData.recentAlerts.map(a => 
      [a.id, a.asset, a.severity, `"${a.message.replace(/"/g, '""')}"`, a.time].join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    
    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ptts_ptw_active_alarms_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden" style={{ background:"var(--bg)" }}>
      {/* ── Dashboard Subtle Background ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.02]"
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, var(--ptts-teal) 1px, transparent 0)`,
               backgroundSize: '24px 24px'
             }} />
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full blur-[100px] opacity-[0.03] bg-[var(--ptts-teal)]" />
      </div>

      <Sidebar pollInterval={pollInterval} />
      <main className="flex-1 overflow-auto flex flex-col relative z-10">
        <TopBar title="ALARMS" onRefresh={handleRefresh} refreshing={refreshing} connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />
        
        <div className="flex-1 p-6 space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={handleAcknowledgeAll}
              disabled={refreshing || dashboardData.recentAlerts.length === 0}
              className="text-xs px-3 py-1.5 rounded-none font-bold tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-40" 
              style={{ background:"rgba(0, 230, 118, 0.1)", color:"#00e676", border:"1px solid #00e67640" }}>
              {refreshing ? "PROCESSING..." : "✓ ACKNOWLEDGE ALL"}
            </button>
            <button 
              onClick={handleExportLog}
              disabled={dashboardData.recentAlerts.length === 0}
              className="text-xs px-3 py-1.5 rounded-none font-bold tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-40 hover:bg-surface-3" 
              style={{ background:"var(--surface-2)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>
              ↓ EXPORT LOG
            </button>
          </div>
          <AlertsTable alerts={dashboardData.recentAlerts} />
          {/* Extended alarm history placeholder */}
          <div className="scada-card p-4 min-h-[300px]">
             <span className="scada-label mb-4">HISTORICAL ALARM LOGS</span>
             <div className="flex items-center justify-center p-8 bg-black/20 border border-dashed rounded-none mt-4" style={{ borderColor:"var(--border-dim)" }}>
               <span className="text-xs tracking-widest" style={{ color:"var(--text-faint)" }}>NO HISTORICAL ALARMS IN CURRENT SHIFT</span>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
