"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TrendChart from "@/components/TrendChart";
import VibrationBar from "@/components/VibrationBar";
import { apiClient } from "@/lib/apiClient";
import type { DashboardData, ReportPeriod, ReportSummary, AssetReportRow } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  daily:     "HARIAN (1 HARI)",
  weekly:    "MINGGUAN (7 HARI)",
  monthly:   "BULANAN (30 HARI)",
  "3months": "3 BULAN",
  "6months": "6 BULAN",
  "12months":"12 BULAN / TAHUNAN",
};

const statusColor: Record<string, string> = {
  online: "#00e676", warning: "#FFD700", fault: "#CC0000", offline: "#6b7280",
};

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
    ["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG GETARAN","MAX GETARAN","UPTIME (%)","JML ALARM","STATUS"],
    ...report.assets.map((a) => [
      a.id, a.name, a.type, a.avgTemp, a.maxTemp, a.avgVib, a.maxVib, a.uptime, a.alarmCount, a.status.toUpperCase()
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
          <div style={{ fontSize:11, color:"#555" }}>Jl. Contoh No.1, Jakarta · Telp: +62 21 XXXXXXX</div>
          <div style={{ fontSize:10, color:"#888", marginTop:2 }}>Powered by PTTS SmartSensor IoT Platform</div>
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
              ["ALARM KRITIS",  report.criticalAlarms, "#CC0000"],
              ["ALARM WARNING", report.warningAlarms,  "#D97706"],
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
            {["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG VIB","MAX VIB","UPTIME","ALARM","STATUS"].map((h) => (
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
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", color: a.avgTemp > 55 ? "#CC0000" : a.avgTemp > 50 ? "#D97706" : "#16a34a" }}>{a.avgTemp}°C</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontWeight:700, color: a.maxTemp > 60 ? "#CC0000" : "#333" }}>{a.maxTemp}°C</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", color: a.avgVib > 3 ? "#D97706" : "#16a34a" }}>{a.avgVib}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontWeight:700, color: a.maxVib > 3.5 ? "#CC0000" : "#333" }}>{a.maxVib}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center" }}>{a.uptime}%</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontWeight:700, color: a.alarmCount > 0 ? "#CC0000" : "#16a34a" }}>{a.alarmCount}</td>
              <td style={{ padding:"6px 8px", border:"1px solid #e0e8f0", textAlign:"center", fontSize:9, fontWeight:700, color: statusColor[a.status] }}>{a.status.toUpperCase()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Notes */}
      <div style={{ fontSize:9, color:"#888", borderTop:"1px solid #ccc", paddingTop:10, marginTop:8 }}>
        <b>Catatan:</b> Laporan ini dibuat secara otomatis oleh sistem PTTS SmartSensor. Batas suhu normal: &lt;60°C. Batas getaran normal (ISO 10816-3): &lt;3.5 mm/s RMS. Data bersumber dari unit ABB SmartSensor & RONDS SmartSensor.
      </div>
      <div style={{ fontSize:9, color:"#888", marginTop:8, display:"flex", justifyContent:"space-between" }}>
        <span>PTTS SmartSensor IoT Platform · v0.6.0</span>
        <span>Dokumen ini adalah laporan otomatis — bukan pengganti inspeksi manual</span>
      </div>
    </div>
  );
}

// ─── Main Reports Page ─────────────────────────────────────────────────────────

export default function TrendsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [pollInterval, setPollInterval] = useState(60000);

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

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
      const data = await apiClient.getReport(period);
      setReport(data);
    } catch (e) {
      setReportError("Gagal mengambil data laporan. Periksa koneksi API.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => window.print();

  if (!dashboardData) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4"
        style={{ background: "var(--bg)", color: "var(--text-bright)" }}>
        <div className="text-[11px] font-mono tracking-[0.2em] flex items-center gap-3">
          <span className="led led-warning shadow-[0_0_8px_#FFD700]" style={{ width: 8, height: 8 }} />
          CONNECTING TO DATALINK...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-only template */}
      {report && <PrintTemplate report={report} />}

      <div className="flex min-h-screen print:hidden" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <main className="flex-1 overflow-auto flex flex-col">
          <TopBar title="REPORTS" onRefresh={handleRefresh} refreshing={refreshing}
            connected={dashboardData?.system?.connected} pollInterval={pollInterval} onPollChange={setPollInterval} />

          <div className="flex-1 p-4 flex flex-col gap-3">

            {/* Live trends row */}
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3 flex"><TrendChart trendData={dashboardData.trendData} /></div>
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

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold tracking-widest" style={{ color:"var(--text-faint)" }}>PILIH PERIODE</span>
                  <div className="flex gap-2 flex-wrap">
                    {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((p) => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className="text-[9px] px-3 py-1.5 rounded-sm font-bold tracking-widest transition-all"
                        style={{
                          background: period === p ? "#005F8E" : "var(--surface-2)",
                          color: period === p ? "#fff" : "var(--text-muted)",
                          border: period === p ? "1px solid #00A3B4" : "1px solid var(--border)",
                        }}>
                        {PERIOD_LABELS[p].split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="ml-auto flex gap-2">
                  <button onClick={handleGenerateReport} disabled={loadingReport}
                    className="text-[9px] px-4 py-2 rounded-sm font-bold tracking-widest transition-all disabled:opacity-50"
                    style={{ background:"#005F8E", color:"#fff", border:"1px solid #00A3B4" }}>
                    {loadingReport ? "◯ FETCHING..." : "⬇ GENERATE REPORT"}
                  </button>

                  {report && (
                    <>
                      <button onClick={handlePrint}
                        className="text-[9px] px-4 py-2 rounded-sm font-bold tracking-widest transition-all"
                        style={{ background:"#003DA5", color:"#fff", border:"1px solid #2563eb" }}>
                        ✦ EXPORT PDF
                      </button>
                      <button onClick={() => csvExport(report)}
                        className="text-[9px] px-4 py-2 rounded-sm font-bold tracking-widest transition-all"
                        style={{ background:"#065F46", color:"#fff", border:"1px solid #00e676" }}>
                        ↓ EXPORT CSV
                      </button>
                    </>
                  )}
                </div>
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
                      { label:"TOTAL NODE",     val:`${report.totalNodes}`,        color:"#00A3B4" },
                      { label:"AVG UPTIME",     val:`${report.avgUptime}%`,        color:"#00e676" },
                      { label:"AVG SUHU",       val:`${report.avgTemp}°C`,         color:"#FFD700" },
                      { label:"AVG GETARAN",    val:`${report.avgVib} mm/s`,       color:"#003DA5" },
                      { label:"TOTAL ALARM",    val:`${report.totalAlarms}`,       color: report.totalAlarms > 5 ? "#CC0000" : "#FFD700" },
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
                          {["TAG ID","NAMA ASET","TIPE","AVG SUHU","MAX SUHU","AVG VIB","MAX VIB","UPTIME","ALARM","STATUS"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[9px] font-bold tracking-widest"
                              style={{ color:"var(--text-faint)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.assets.map((a: AssetReportRow, i: number) => {
                          const tempC = a.avgTemp > 55 ? "#CC0000" : a.avgTemp > 50 ? "#FFD700" : "var(--text)";
                          const vibC  = a.avgVib  > 3  ? "#FFD700" : "var(--text)";
                          return (
                            <tr key={a.id} style={{
                              borderBottom:"1px solid var(--border-dim)",
                              background: i % 2 === 0 ? "transparent" : "var(--surface-2)",
                            }}>
                              <td className="px-3 py-2.5 font-mono text-[9px]" style={{ color:"var(--text-faint)" }}>{a.id}</td>
                              <td className="px-3 py-2.5 font-bold" style={{ color:"var(--text)" }}>{a.name}</td>
                              <td className="px-3 py-2.5 text-[9px]" style={{ color:"var(--text-muted)" }}>{a.type}</td>
                              <td className="px-3 py-2.5 font-mono tabular-nums" style={{ color:tempC }}>{a.avgTemp}°C</td>
                              <td className="px-3 py-2.5 font-mono font-bold tabular-nums" style={{ color: a.maxTemp > 60 ? "#CC0000" : "var(--text)" }}>{a.maxTemp}°C</td>
                              <td className="px-3 py-2.5 font-mono tabular-nums" style={{ color:vibC }}>{a.avgVib}</td>
                              <td className="px-3 py-2.5 font-mono font-bold tabular-nums" style={{ color: a.maxVib > 3.5 ? "#CC0000" : "var(--text)" }}>{a.maxVib}</td>
                              <td className="px-3 py-2.5 font-bold text-[#00e676]">{a.uptime}%</td>
                              <td className="px-3 py-2.5 font-bold tabular-nums" style={{ color: a.alarmCount > 0 ? "#FFD700" : "var(--text-faint)" }}>{a.alarmCount}</td>
                              <td className="px-3 py-2.5">
                                <span className="text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-sm"
                                  style={{ color: statusColor[a.status], background:`${statusColor[a.status]}15`, border:`1px solid ${statusColor[a.status]}40` }}>
                                  {a.status.toUpperCase()}
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
                    * Laporan otomatis — batas suhu normal &lt;60°C · batas getaran ISO 10816-3 &lt;3.5 mm/s RMS. Data bersumber dari unit ABB & RONDS.
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
