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

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily:     "HARIAN (1 HARI)",
  weekly:    "MINGGUAN (7 HARI)",
  monthly:   "BULANAN (30 HARI)",
  "3months": "3 BULAN",
  "6months": "6 BULAN",
  "12months":"12 BULAN / TAHUNAN",
};

const PERIOD_OPTIONS: { key: ReportPeriod; label: string; sub: string; days: number }[] = [
  { key: "daily",    label: "Harian",   sub: "1 hari terakhir",   days: 1   },
  { key: "weekly",   label: "Mingguan", sub: "7 hari terakhir",   days: 7   },
  { key: "monthly",  label: "Bulanan",  sub: "30 hari terakhir",  days: 30  },
  { key: "3months",  label: "3 Bulan",  sub: "90 hari terakhir",  days: 90  },
  { key: "6months",  label: "6 Bulan",  sub: "180 hari terakhir", days: 180 },
  { key: "12months", label: "Tahunan",  sub: "365 hari terakhir", days: 365 },
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

function csvExport(report: ReportSummary) {
  const rows = [
    ["PTTS SMARTSENSOR – SUMMARY REPORT"],
    [`Periode: ${PERIOD_LABELS[report.period]}`],
    [`Tanggal: ${report.dateRange.from} – ${report.dateRange.to}`],
    [`Dibuat: ${new Date(report.generatedAt).toLocaleString("id-ID")}`],
    [],
    ["RINGKASAN SISTEM"],
    ["Total Node", report.totalNodes],
    ["Rata-rata Uptime (%)", report.avgUptime],
    ["Total Alarm", report.totalAlarms],
    ["Alarm Kritis", report.criticalAlarms],
    ["Alarm Peringatan", report.warningAlarms],
    ["Avg Suhu (°C)", report.avgTemp],
    ["Avg Getaran (mm/s)", report.avgVib],
    [],
    ["KONDISI ASET"],
    ["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG GETARAN","MAX GETARAN","UPTIME (%)","JML ALARM","LINK","HEALTH"],
    ...report.assets.map((a) => [
      a.id, a.name, a.type, a.avgTemp, a.maxTemp, a.avgVib, a.maxVib, a.uptime, a.alarmCount, a.link.toUpperCase(), a.health.toUpperCase()
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PTTS_Report_${report.period}_${report.dateRange.to.replace(/ /g,"_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print-only Report Template ────────────────────────────────────────────────

function PrintTemplate({ report }: { report: ReportSummary }) {
  const LOGO = "https://www.ptts.co.id/uploads/1/3/3/7/133745061/logo-ptts_3.png";
  return (
    <div id="print-report" className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-10"
      style={{ fontFamily: "Arial, sans-serif", fontSize: 11 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", borderBottom:"2px solid #003DA5", paddingBottom:12, marginBottom:16 }}>
        <img src={LOGO} alt="PTTS" style={{ width:64, height:64, objectFit:"contain" }} />
        <div style={{ marginLeft:16 }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#003DA5", letterSpacing:2 }}>PT PRIMA TEKINDO TIRTA SEJAHTERA</div>
          <div style={{ fontSize:10, color:"#555" }}>Jl. Pangeran Jayakarta, Ruko 141 Blok A1 No. 11, Jembatan Merah, Jakarta Pusat, 10730</div>
          <div style={{ fontSize:9, color:"#888", marginTop:2 }}>Tel: (021) 629 3028 · Email: info@ptts.co.id · Web: www.ptts.co.id</div>
        </div>
        <div style={{ marginLeft:"auto", textAlign:"right" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#003DA5" }}>EQUIPMENT CONDITION REPORT</div>
          <div style={{ fontSize:10, color:"#555" }}>Periode: {PERIOD_LABELS[report.period]}</div>
          <div style={{ fontSize:10, color:"#555" }}>{report.dateRange.from} – {report.dateRange.to}</div>
          <div style={{ fontSize:9, color:"#888", marginTop:2 }}>Dibuat: {new Date(report.generatedAt).toLocaleString("id-ID")}</div>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ fontSize:11, fontWeight:700, color:"#003DA5", marginBottom:8, letterSpacing:1 }}>RINGKASAN SISTEM</div>
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:20 }}>
        <tbody>
          <tr style={{ background:"#f0f4fa" }}>
            {[
              ["TOTAL NODE",         report.totalNodes,         "unit"],
              ["RATA-RATA UPTIME",   `${report.avgUptime}%`,    ""],
              ["TOTAL ALARM",        report.totalAlarms,         "event"],
              ["AVG SUHU",           `${report.avgTemp} °C`,    ""],
              ["AVG GETARAN",        `${report.avgVib} mm/s`,   ""],
            ].map(([label, val]) => (
              <td key={String(label)} style={{ padding:"10px 14px", border:"1px solid #d0d9ed", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:1 }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#003DA5", marginTop:4 }}>{val}</div>
              </td>
            ))}
          </tr>
          <tr>
            {[
              ["ALARM KRITIS",  report.criticalAlarms, "#dc2626"],
              ["ALARM WARNING", report.warningAlarms,  "#d97706"],
            ].map(([label, val, color]) => (
              <td key={String(label)} colSpan={2} style={{ padding:"10px 14px", border:"1px solid #d0d9ed", textAlign:"center" }}>
                <div style={{ fontSize:9, color:"#555", letterSpacing:1 }}>{label as string}</div>
                <div style={{ fontSize:16, fontWeight:700, color: color as string, marginTop:4 }}>{val as number}</div>
              </td>
            ))}
            <td colSpan={1} style={{ padding:"10px 14px", border:"1px solid #d0d9ed", textAlign:"center", fontSize:9, color:"#888" }}>
              — (lihat detail alarm di bawah)
            </td>
          </tr>
        </tbody>
      </table>

      {/* Asset table */}
      <div style={{ fontSize:11, fontWeight:700, color:"#003DA5", marginBottom:8, letterSpacing:1 }}>KONDISI ASET PER PERIODE</div>
      <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:20 }}>
        <thead>
          <tr style={{ background:"#003DA5", color:"white" }}>
            {["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG VIB","MAX VIB","LINK","HEALTH"].map((h) => (
              <th key={h} style={{ padding:"6px 8px", fontSize:9, textAlign:"center", letterSpacing:0.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.assets.map((a: AssetReportRow, i: number) => (
            <tr key={a.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8faff" }}>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", fontFamily:"monospace", fontSize:9 }}>{a.id}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", fontWeight:600 }}>{a.name}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", fontSize:9, color:"#666" }}>{a.type}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", color: a.avgTemp > 55 ? "#dc2626" : a.avgTemp > 50 ? "#d97706" : "#059669" }}>{a.avgTemp}°C</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontWeight:700, color: a.maxTemp > 60 ? "#dc2626" : "#333" }}>{a.maxTemp}°C</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", color: a.avgVib > 3 ? "#d97706" : "#059669" }}>{a.avgVib}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontWeight:700, color: a.maxVib > 3.5 ? "#dc2626" : "#333" }}>{a.maxVib}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontSize:8, fontWeight:700, color: a.link === 'online' ? "#059669" : "#64748b" }}>{a.link.toUpperCase()}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontSize:9, fontWeight:700, color: a.health === 'fault' ? "#dc2626" : a.health === 'warning' ? "#d97706" : "#059669" }}>{a.health.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      <div style={{ fontSize:9, color:"#888", borderTop:"1px solid #ccc", paddingTop:10, marginTop:8 }}>
        <b>Catatan:</b> Laporan ini dibuat secara otomatis oleh sistem PTTS SmartSensor. Batas suhu normal: &lt;60°C. Batas getaran normal (ISO 10816-3): &lt;3.5 mm/s RMS. Data bersumber dari unit PTTS SmartSensor & RONDS SmartSensor.
      </div>
      <div style={{ fontSize:9, color:"#888", marginTop:8, display:"flex", justifyContent:"space-between" }}>
        <span>PTTS SmartSensor IoT Platform · v1.3.0 (LIVE DEMO)</span>
        <span>Dokumen ini adalah data simulasi — bukan pengganti inspeksi manual</span>
      </div>
    </div>
  );
}

// ─── Main Reports Page ─────────────────────────────────────────────────────────

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
      console.error("Failed to fetch dashboard data:", e);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    if (pollInterval > 0) {
      const id = setInterval(fetchDashboardData, pollInterval);
      return () => clearInterval(id);
    }
  }, [pollInterval, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

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
      setReportError("Gagal mengambil data laporan. Periksa koneksi API.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <>
      {/* Print-only template */}
      {report && <PrintTemplate report={report} />}

      <div className="flex min-h-screen print:hidden" style={{ background: "var(--bg)" }}>
        <Sidebar pollInterval={pollInterval} />
        <main className="flex-1 overflow-auto flex flex-col">
          <TopBar title="REPORTS" onRefresh={handleRefresh} refreshing={refreshing}
            connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />

          <div className="flex-1 p-4 flex flex-col gap-3">

            {/* Live trends row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 flex"><TrendChart trendData={dashboardData.trendData} assets={dashboardData.topAssets} /></div>
              <div className="col-span-1 flex"><VibrationBar vibrationData={dashboardData.vibrationBarData} /></div>
            </div>

            {/* ── Report Generator Panel ── */}
            <div className="scada-card p-4 flex flex-col gap-4">
              <div className="scada-card-header">
                <span className="scada-label">REPORT GENERATOR · PT PRIMA TEKINDO TIRTA SEJAHTERA</span>
                <div className="flex items-center gap-1.5">
                  <span className="led led-online" style={{ width:6, height:6 }} />
                  <span className="text-[9px] font-bold tracking-widest text-[#00e676]">READY</span>
                </div>
              </div>

              {/* ── Compact controls bar ── */}
              <div className="flex items-center gap-3 flex-wrap">

                {/* Period popout trigger */}
                <div className="relative" ref={popoutRef}>
                  <button onClick={() => setPopoutOpen(!popoutOpen)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[10px] font-bold tracking-widest transition-all rounded-sm"
                    style={{
                      background: popoutOpen ? "#005F8E" : "var(--surface-2)",
                      color: popoutOpen ? "#fff" : "var(--text-muted)",
                      border: `1px solid ${popoutOpen ? "#00A3B4" : "var(--border)"}`,
                    }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    {mode === "custom"
                      ? `${customFrom} – ${customTo}`
                      : PERIOD_OPTIONS.find(o => o.key === period)?.label ?? period}
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: popoutOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Popout dropdown */}
                  {popoutOpen && (
                    <div className="absolute left-0 top-full mt-1 z-50 animate-fade-up rounded-sm shadow-xl"
                      style={{
                        width: 320,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderTop: "2px solid #00A3B4",
                      }}>

                      {/* Mode tabs */}
                      <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
                        {(["preset","custom"] as const).map(m => (
                          <button key={m} onClick={() => setMode(m)}
                            className="flex-1 py-2 text-[9px] font-bold tracking-widest transition-all"
                            style={{
                              background: mode === m ? "#00A3B415" : "transparent",
                              color: mode === m ? "#00A3B4" : "var(--text-faint)",
                              borderBottom: mode === m ? "2px solid #00A3B4" : "2px solid transparent",
                            }}>
                            {m === "preset" ? "PERIODE STANDAR" : "RENTANG TANGGAL"}
                          </button>
                        ))}
                      </div>

                      {/* Preset list */}
                      {mode === "preset" && (
                        <div className="py-1">
                          {PERIOD_OPTIONS.map(opt => {
                            const active = period === opt.key;
                            return (
                              <button key={opt.key}
                                onClick={() => { setPeriod(opt.key); setPopoutOpen(false); }}
                                className="flex items-center w-full px-4 py-2.5 gap-3 transition-all text-left"
                                style={{
                                  background: active ? "#00A3B412" : "transparent",
                                  borderLeft: active ? "3px solid #00A3B4" : "3px solid transparent",
                                }}>
                                <div className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center"
                                  style={{
                                    border: `1.5px solid ${active ? "#00A3B4" : "var(--border)"}`,
                                    background: active ? "#00A3B4" : "transparent",
                                  }}>
                                  {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div className="flex-1">
                                  <span className="text-[11px] font-bold" style={{ color: active ? "#00A3B4" : "var(--text)" }}>
                                    {opt.label}
                                  </span>
                                  <span className="text-[9px] ml-2" style={{ color: "var(--text-faint)" }}>
                                    {opt.sub}
                                  </span>
                                </div>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm"
                                  style={{
                                    background: active ? "#00A3B415" : "var(--surface-2)",
                                    color: active ? "#00A3B4" : "var(--text-faint)",
                                    border: `1px solid ${active ? "#00A3B430" : "var(--border-dim)"}`,
                                  }}>
                                  {opt.days}d
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Custom date range */}
                      {mode === "custom" && (
                        <div className="p-4 flex flex-col gap-3">
                          <div className="flex gap-3">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[9px] font-bold tracking-widest" style={{ color: "var(--text-faint)" }}>DARI</label>
                              <input type="date" value={customFrom} max={customTo}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="w-full px-2 py-1.5 text-[11px] rounded-sm outline-none font-mono"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[9px] font-bold tracking-widest" style={{ color: "var(--text-faint)" }}>SAMPAI</label>
                              <input type="date" value={customTo} min={customFrom} max={today}
                                onChange={e => setCustomTo(e.target.value)}
                                className="w-full px-2 py-1.5 text-[11px] rounded-sm outline-none font-mono"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono" style={{ color: "var(--text-faint)" }}>
                              {dateDiffDays(customFrom, customTo)} hari ·{" "}
                              <span style={{ color: "#00A3B4" }}>
                                {PERIOD_OPTIONS.find(o => o.key === mapDaysToPeriod(dateDiffDays(customFrom, customTo)))?.label}
                              </span>
                            </span>
                            <button onClick={() => setPopoutOpen(false)}
                              className="text-[9px] px-3 py-1 font-bold tracking-widest rounded-sm"
                              style={{ background: "#00A3B4", color: "#fff" }}>
                              TERAPKAN
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Generate button */}
                <button onClick={handleGenerateReport} disabled={loadingReport}
                  className="text-[9px] px-5 py-2 rounded-sm font-bold tracking-widest transition-all disabled:opacity-50"
                  style={{ background:"#005F8E", color:"#fff", border:"1px solid #00A3B4" }}>
                  {loadingReport ? "◯ MEMUAT..." : "⬇ GENERATE"}
                </button>

                {/* Export buttons — only when report exists */}
                {report && (
                  <>
                    <button onClick={handlePrint}
                      className="text-[9px] px-4 py-2 rounded-sm font-bold tracking-widest transition-all"
                      style={{ background:"#003DA5", color:"#fff", border:"1px solid #2563eb" }}>
                      ✦ PDF
                    </button>
                    <button onClick={() => csvExport(report)}
                      className="text-[9px] px-4 py-2 rounded-sm font-bold tracking-widest transition-all"
                      style={{ background:"#065F46", color:"#fff", border:"1px solid #00e676" }}>
                      ↓ CSV
                    </button>
                  </>
                )}
              </div>

              {reportError && (
                <div className="text-[10px] px-3 py-2 rounded-sm font-bold"
                  style={{ background:"#CC000015", border:"1px solid #CC000040", color:"#CC0000" }}>
                  ⚠ {reportError}
                </div>
              )}

              {/* ── Report Preview ── */}
              {report && (
                <div className="flex flex-col gap-4 animate-fade-up">

                  {/* Header info strip */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-sm"
                    style={{ background:"var(--surface-2)", border:"1px solid var(--border)" }}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold tracking-widest text-[#00A3B4]">
                        EQUIPMENT CONDITION REPORT · {PERIOD_LABELS[report.period]}
                      </span>
                      <span className="text-[9px]" style={{ color:"var(--text-faint)" }}>
                        {report.dateRange.from} – {report.dateRange.to}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono" style={{ color:"var(--text-faint)" }}>
                      GENERATED: {new Date(report.generatedAt).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* KPI summary strip */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label:"TOTAL NODE",     val:`${report.totalNodes}`,        color:"var(--ptts-teal)" },
                      { label:"AVG UPTIME",     val:`${report.avgUptime}%`,        color:"var(--online)" },
                      { label:"AVG SUHU",       val:`${report.avgTemp}°C`,         color:"var(--warning)" },
                      { label:"AVG GETARAN",    val:`${report.avgVib} mm/s`,       color:"var(--ptts-teal)" },
                      { label:"TOTAL ALARM",    val:`${report.totalAlarms}`,       color: report.totalAlarms > 5 ? "var(--fault)" : "var(--warning)" },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="flex flex-col gap-1 px-3 py-3 rounded-sm"
                        style={{ background:"var(--surface-2)", border:`1px solid ${color}30` }}>
                        <span className="text-[8px] tracking-widest font-bold" style={{ color:"var(--text-faint)" }}>{label}</span>
                        <span className="text-[18px] font-bold tabular-nums leading-none" style={{ color }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Asset condition table */}
                  <div className="overflow-x-auto rounded-sm" style={{ border:"1px solid var(--border)" }}>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr style={{ background:"var(--surface-2)", borderBottom:"1px solid var(--border)" }}>
                          {["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG VIB","MAX VIB","UPTIME","LINK","HEALTH"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[9px] font-bold tracking-widest"
                              style={{ color:"var(--text-faint)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.assets.map((a: AssetReportRow, i: number) => {
                          const hColor = getHealthColor(a.health);
                          const lColor = getLinkColor(a.link);
                          const tempC = a.avgTemp > 55 ? "var(--fault)" : a.avgTemp > 50 ? "var(--warning)" : "var(--text)";
                          const vibC  = a.avgVib  > 3  ? "var(--warning)" : "var(--text)";
                          return (
                            <tr key={a.id} style={{
                              borderBottom:"1px solid var(--border-dim)",
                              background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                            }}>
                              <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color:"var(--text-faint)" }}>{a.id}</td>
                              <td className="px-3 py-2.5 font-bold" style={{ color:"var(--text)" }}>{a.name}</td>
                              <td className="px-3 py-2.5 text-[9px]" style={{ color:"var(--text-muted)" }}>{a.type}</td>
                              <td className="px-3 py-2.5 font-mono tabular-nums" style={{ color:tempC }}>{a.avgTemp}°C</td>
                              <td className="px-3 py-2.5 font-mono font-bold tabular-nums" style={{ color: a.maxTemp > 60 ? "var(--fault)" : "var(--text)" }}>{a.maxTemp}°C</td>
                              <td className="px-3 py-2.5 font-mono tabular-nums" style={{ color:vibC }}>{a.avgVib}</td>
                              <td className="px-3 py-2.5 font-mono font-bold tabular-nums" style={{ color: a.maxVib > 3.5 ? "var(--fault)" : "var(--text)" }}>{a.maxVib}</td>
                              <td className="px-3 py-2.5 font-bold text-[9px]" style={{ color: lColor }}>{a.link.toUpperCase()}</td>
                              <td className="px-3 py-2.5">
                                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-sm"
                                  style={{ color: hColor, background:`${hColor}15`, border:`1px solid ${hColor}40` }}>
                                  {a.health.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer note */}
                  <div className="text-[9px] tracking-wide px-1" style={{ color:"var(--text-faint)" }}>
                    * Laporan otomatis — batas suhu normal &lt;60°C · batas getaran ISO 10816-3 &lt;3.5 mm/s RMS. Data bersumber dari unit PTTS & RONDS SmartSensor.
                  </div>
                </div>
              )}

              {!report && !loadingReport && (
                <div className="flex items-center justify-center py-12 border border-dashed rounded-sm"
                  style={{ borderColor:"var(--border-dim)", background:"var(--surface-2)" }}>
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-[28px] opacity-20">📊</span>
                    <span className="text-[10px] font-bold tracking-widest" style={{ color:"var(--text-faint)" }}>
                      PILIH PERIODE DAN KLIK "GENERATE REPORT"
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
