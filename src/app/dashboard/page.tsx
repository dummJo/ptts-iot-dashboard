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
import { motion, AnimatePresence, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } // Apple macOS Spring ease-out
  }
};
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

      <div className="hidden lg:block">
        <Sidebar pollInterval={pollInterval} />
      </div>

      <main className="flex-1 overflow-auto flex flex-col relative z-10">
        {/* ── Top bar ── */}
        <TopBar title="OVERVIEW" onRefresh={handleRefresh} refreshing={refreshing} connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />

        {/* ── Content ── */}
        <motion.div 
          className="flex-1 p-4 md:p-6 pb-24 md:pb-6 space-y-6 responsive-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dynamicKPIs.map((k: any) => (
              <motion.div key={k.label} variants={itemVariants}>
                <KPICard {...k} />
              </motion.div>
            ))}
          </div>

          {/* Trend + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div className="lg:col-span-2" variants={itemVariants}>
              <TrendChart trendData={trendData} assets={topAssets} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatusDonut linkSummary={linkSummary} healthSummary={dynamicHealthSummary} />
            </motion.div>
          </div>

          {/* Asset table + Vib bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div className="lg:col-span-2 order-2 lg:order-1" variants={itemVariants}>
              <AssetTable assets={dynamicAssets} onOverridesChange={handleOverridesChange} />
            </motion.div>
            <motion.div className="order-1 lg:order-2" variants={itemVariants}>
              <VibrationBar vibrationData={vibrationBarData} />
            </motion.div>
          </div>

          {/* Alarms */}
          <motion.div variants={itemVariants}>
            <AlertsTable alerts={recentAlerts} />
          </motion.div>

          {/* Footer bar */}
          <motion.div 
            variants={itemVariants}
            className="hidden md:flex items-center justify-between px-2 py-1 text-sm tracking-[.15em] border-t border-border-dim mt-2"
            style={{ color:"var(--text-faint)" }}
          >
            <div className="flex gap-4">
              <span>Engineered by DummVinci · v1.3.0</span>
              <span>LIVE CLOUD · MQTT LINK ACTIVE</span>
            </div>
            <div className="flex gap-4">
              <span>SESSION: 60 MIN · SCRYPT · JWT</span>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Mobile Navigation Bar (iPhone 17 Pro Standard) ── */}
      <nav className="mobile-nav flex lg:hidden">
        <button className="mobile-nav-item active">
          <span className="mobile-nav-icon">▤</span>
          <span>DASHBOARD</span>
        </button>
        <button className="mobile-nav-item">
          <span className="mobile-nav-icon">⛃</span>
          <span>ASSETS</span>
        </button>
        <button className="mobile-nav-item">
          <span className="mobile-nav-icon">⚠</span>
          <span>ALARMS</span>
        </button>
        <button className="mobile-nav-item">
          <span className="mobile-nav-icon">⚙</span>
          <span>SETTINGS</span>
        </button>
      </nav>
    </div>
  );
}
