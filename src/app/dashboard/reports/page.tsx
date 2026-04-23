"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TrendChart from "@/components/TrendChart";
import VibrationBar from "@/components/VibrationBar";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData, ReportPeriod, ReportSummary, AssetReportRow } from "@/lib/types";
import { EMPTY_DASHBOARD } from "@/lib/types";
import { getHealthColor, getLinkColor } from "@/lib/utils";

/**
 * DEEP ANALYTICS & INTELLIGENCE REPORTS — PTTS PROPRIETARY
 * Standard: Multinational Monolithic Console
 */

const PERIOD_OPTIONS: { key: ReportPeriod; label: string; sub: string; days: number }[] = [
  { key: "daily",    label: "Daily",     sub: "Last 24 hours",     days: 1   },
  { key: "weekly",   label: "Weekly",    sub: "Last 7 days",       days: 7   },
  { key: "monthly",  label: "Monthly",   sub: "Last 30 days",      days: 30  },
  { key: "3months",  label: "Quarterly", sub: "Last 90 days",      days: 90  },
  { key: "6months",  label: "Semi-Annual", sub: "Last 180 days",   days: 180 },
  { key: "12months", label: "Annual",    sub: "Full fiscal year",  days: 365 },
];

function dateDiffDays(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

function mapDaysToPeriod(days: number): ReportPeriod {
  if (days <= 1)   return "daily";
  if (days <= 7)   return "weekly";
  if (days <= 30)  return "monthly";
  if (days <= 90)  return "3months";
  if (days <= 180) return "6months";
  return "12months";
}

function PrintTemplate({ report }: { report: ReportSummary }) {
  const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";
  return (
    <div id="print-report" className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-12"
      style={{ fontFamily: "'Inter', sans-serif", fontSize: 10 }}>
      <div style={{ display:"flex", alignItems:"center", borderBottom:"1px solid #000", paddingBottom:20, marginBottom:30 }}>
        <img src={LOGO} alt="PTTS" style={{ width:40, height:40, objectFit:"contain", filter: "grayscale(100%)" }} />
        <div style={{ marginLeft:24 }}>
          <div style={{ fontSize:14, fontWeight:700, letterSpacing:4 }}>PTTS</div>
          <div style={{ fontSize:8, color:"#666", marginTop:4 }}>INDUSTRIAL SYSTEMS AUDIT · PROPERTY OF PTTS SMART SENSOR</div>
        </div>
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          <div style={{ fontSize:12, fontWeight:700 }}>CONDITION REPORT</div>
          <div style={{ fontSize:8, color:"#666" }}>PERIOD: {report.period.toUpperCase()}</div>
          <div style={{ fontSize:8, color:"#666" }}>{report.dateRange.from} – {report.dateRange.to}</div>
        </div>
      </div>
      {/* (Table and details would go here in monolithic style) */}
      <p style={{ marginTop: 20 }}>Detailed report structure adheres to ISO 10816-3 clinical standards.</p>
    </div>
  );
}

export default function TrendsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [pollInterval, setPollInterval] = useState(60000);

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [popoutOpen, setPopoutOpen] = useState(false);
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const today = new Date().toISOString().slice(0, 10);
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(today);
  const popoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (popoutRef.current && !popoutRef.current.contains(e.target as Node)) setPopoutOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const data = await apiClient.getDashboardData();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (pollInterval > 0) {
      const id = setInterval(fetchDashboardData, pollInterval);
      return () => clearInterval(id);
    }
  }, [pollInterval, fetchDashboardData]);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setReportError(null);
    try {
      const activePeriod = mode === "custom"
        ? mapDaysToPeriod(dateDiffDays(customFrom, customTo))
        : period;
      const data = await apiClient.getReport(activePeriod);
      setReport(data);
    } catch (e) {
      setReportError("Fault in data retrieval. Verify link status.");
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden">
      {report && <PrintTemplate report={report} />}
      
      <Sidebar pollInterval={pollInterval} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative bg-black">
        <header className="flex-none z-30">
          <TopBar 
            title="Deep Analytics & Intelligence" 
            onRefresh={() => setRefreshing(false)} 
            refreshing={refreshing} 
            connected={dashboardData?.system?.connected} 
            pollInterval={pollInterval} 
            onPollChange={setPollInterval} 
          />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="max-w-[1700px] mx-auto p-6 lg:p-12 space-y-12 animate-fade-in">
            
            {/* 1. Real-time Telemetry Overlay */}
            <section className="grid grid-cols-1 xl:grid-cols-12 gap-px bg-[var(--border-dim)] border border-[var(--border-dim)]">
              <div className="xl:col-span-9 bg-black p-4">
                <TrendChart trendData={dashboardData.trendData} assets={dashboardData.topAssets} />
              </div>
              <div className="xl:col-span-3 bg-black p-4">
                <VibrationBar vibrationData={dashboardData.vibrationBarData} />
              </div>
            </section>

            {/* 2. Intelligence Report Engine */}
            <section className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <span className="w-1 h-1 bg-[var(--online)]" />
                <h2 className="text-[11px] font-bold tracking-[0.4em] text-[var(--text-muted)] uppercase">Report Engine</h2>
              </div>

              <div className="border border-[var(--border-dim)] bg-[#0a0a0a]">
                <div className="p-6 border-b border-[var(--border-dim)] flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {/* Period Selector Popout */}
                    <div className="relative" ref={popoutRef}>
                      <button onClick={() => setPopoutOpen(!popoutOpen)}
                        className="flex items-center gap-4 px-5 py-3 bg-black border border-[var(--border)] text-[12px] font-bold tracking-[0.1em] text-[var(--text-bright)] hover:border-[var(--text-muted)] transition-all">
                        <span>PERIOD: {mode === "custom" ? "Custom Range" : PERIOD_OPTIONS.find(o => o.key === period)?.label.toUpperCase()}</span>
                        <span className={`opacity-40 transition-transform ${popoutOpen ? 'rotate-180' : ''}`}>▼</span>
                      </button>

                      {popoutOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-72 bg-[#121212] border border-[var(--border)] shadow-elite animate-fade-in">
                          <div className="flex border-b border-[var(--border-dim)]">
                            <button onClick={() => setMode("preset")} className={`flex-1 py-3 text-[10px] font-bold tracking-widest ${mode === "preset" ? "bg-white/5 text-white" : "text-white/40"}`}>PRESETS</button>
                            <button onClick={() => setMode("custom")} className={`flex-1 py-3 text-[10px] font-bold tracking-widest ${mode === "custom" ? "bg-white/5 text-white" : "text-white/40"}`}>CUSTOM</button>
                          </div>
                          <div className="p-2">
                            {mode === "preset" && PERIOD_OPTIONS.map(opt => (
                              <button key={opt.key} onClick={() => { setPeriod(opt.key); setPopoutOpen(false); }}
                                className="w-full px-4 py-3 text-left text-[11px] font-medium hover:bg-white/5 text-[var(--text-muted)] hover:text-white transition-colors">
                                {opt.label} · <span className="opacity-40">{opt.sub}</span>
                              </button>
                            ))}
                            {mode === "custom" && (
                              <div className="p-4 space-y-4">
                                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="w-full bg-black border border-[var(--border)] p-2 text-[11px] outline-none" />
                                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="w-full bg-black border border-[var(--border)] p-2 text-[11px] outline-none" />
                                <button onClick={() => setPopoutOpen(false)} className="w-full py-2 bg-white text-black text-[10px] font-bold tracking-widest uppercase">Apply</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={handleGenerateReport} disabled={loadingReport}
                      className="px-6 py-3 bg-white text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--text-muted)] transition-all disabled:opacity-30">
                      {loadingReport ? "Executing..." : "Extract Data"}
                    </button>
                  </div>

                  {report && (
                    <div className="flex gap-4">
                      <button onClick={() => window.print()} className="px-4 py-2 border border-[var(--border)] text-[10px] font-bold tracking-widest text-[var(--text-muted)] hover:text-white transition-all uppercase">PDF</button>
                      <button className="px-4 py-2 border border-[var(--border)] text-[10px] font-bold tracking-widest text-[var(--text-muted)] hover:text-white transition-all uppercase">Export Raw</button>
                    </div>
                  )}
                </div>

                {/* Report Context Display */}
                {report ? (
                  <div className="p-0 animate-fade-in">
                    {/* Metrics Strip */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[var(--border-dim)] border-b border-[var(--border-dim)]">
                      {[
                        { label: "Population", val: report.totalNodes, unit: "Nodes" },
                        { label: "Stability", val: `${report.avgUptime}%`, unit: "Uptime" },
                        { label: "Avg Thermal", val: `${report.avgTemp}°C`, unit: "Celsius" },
                        { label: "Avg Kinetic", val: `${report.avgVib}mm/s`, unit: "Velocity" },
                        { label: "Total Alarms", val: report.totalAlarms, unit: "Events" },
                      ].map(m => (
                        <div key={m.label} className="bg-black p-6">
                          <p className="text-[9px] font-bold tracking-[0.3em] text-[var(--text-faint)] uppercase mb-2">{m.label}</p>
                          <p className="text-[20px] font-mono font-medium text-[var(--text-bright)]">{m.val} <span className="text-[10px] text-[var(--text-faint)]">{m.unit}</span></p>
                        </div>
                      ))}
                    </div>

                    {/* Data Registry Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#0a0a0a] border-b border-[var(--border-dim)]">
                            {["UID","Name","Type","Avg Thermal","Max Thermal","Avg Kinetic","Max Kinetic","Health"].map(h => (
                               <th key={h} className="px-6 py-4 text-left text-[9px] font-bold tracking-[0.2em] text-[var(--text-faint)] uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-black">
                          {report.assets.map((a: AssetReportRow) => (
                            <tr key={a.id} className="border-b border-[var(--border-dim)] hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-5 text-[11px] font-mono text-[var(--text-muted)]">{a.id}</td>
                              <td className="px-6 py-5 text-[12px] font-bold text-[var(--text-bright)]">{a.name}</td>
                              <td className="px-6 py-5 text-[11px] text-[var(--text-faint)] uppercase tracking-widest">{a.type}</td>
                              <td className="px-6 py-5 text-[12px] font-mono text-[var(--text-muted)]">{a.avgTemp}°C</td>
                              <td className="px-6 py-5 text-[12px] font-mono font-bold text-[var(--text-bright)]">{a.maxTemp}°C</td>
                              <td className="px-6 py-5 text-[12px] font-mono text-[var(--text-muted)]">{a.avgVib}</td>
                              <td className="px-6 py-5 text-[12px] font-mono font-bold text-[var(--text-bright)]">{a.maxVib}</td>
                              <td className="px-6 py-5">
                                <span className="text-[9px] font-bold tracking-[0.2em] uppercase px-2 py-1 bg-white/5 border border-white/10"
                                      style={{ color: getHealthColor(a.health) }}>{a.health}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 flex flex-col items-center justify-center gap-4 opacity-20">
                    <span className="text-[40px]">≗</span>
                    <p className="text-[11px] font-bold tracking-[0.4em] uppercase">Engine Standby - Filter Selection Required</p>
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
