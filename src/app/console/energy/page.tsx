"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { apiClient } from "@/lib/apiClient";
import type { EnergyRangeKey, EnergySummary } from "@/lib/types";
import { EMPTY_ENERGY } from "@/lib/types";
import {
  formatCompact,
  formatCurrency,
  formatLocalClock,
  formatLocalNumber,
} from "@/lib/utils";

/**
 * ENERGY MANAGEMENT CONSOLE
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads GET /api/energy. Every figure here is derived from the motor_kw column
 * of ptts_telemetry — see src/services/energyService.ts for the method and its
 * limits.
 *
 * Three honesty rails, because this screen shows money:
 *   · `simulated`      → the payload is generated, not measured
 *   · `tariff.isDefault` → the rate is a placeholder, so the rupiah is not real
 *   · `coveragePct`    → how much of the range actually reported
 * None of them are decorative. Removing one makes the console lie quietly.
 */

const RANGES: { key: EnergyRangeKey; label: string }[] = [
  { key: "today", label: "Hari ini" },
  { key: "7d", label: "7 hari" },
  { key: "30d", label: "30 hari" },
];

const AXIS_TICK = { fontSize: 11, fill: "var(--text-faint)" } as const;

function TooltipShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="panel-flat px-3 py-2 text-[13px]"
      style={{ boxShadow: "var(--elev-2)", background: "var(--surface)" }}
    >
      {children}
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  detail,
  delta,
  deltaGood,
}: {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
  delta?: string | null;
  deltaGood?: boolean;
}) {
  return (
    <div className="scada-card flex flex-col h-full">
      <div className="scada-card-header">
        <span className="scada-label">{label}</span>
      </div>
      <div className="px-5 py-4 flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="scada-value">{value}</span>
          {unit && <span className="scada-unit">{unit}</span>}
        </div>
        {detail && (
          <p className="text-[13px] leading-snug" style={{ color: "var(--text-muted)" }}>
            {detail}
          </p>
        )}
        {delta && (
          <p
            className="text-[13px] font-semibold"
            style={{ color: deltaGood ? "var(--online)" : "var(--fault)" }}
          >
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}

/** Legend key — a coloured mark beside text, never coloured text. */
function LegendKey({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
      <span
        aria-hidden="true"
        style={{ width: 10, height: 10, borderRadius: 3, background: color, flex: "none" }}
      />
      {label}
    </span>
  );
}

export default function EnergyManagementPage() {
  const [data, setData] = useState<EnergySummary>(EMPTY_ENERGY);
  const [range, setRange] = useState<EnergyRangeKey>("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState(60000);
  const [showTable, setShowTable] = useState(true);

  const fetchEnergy = useCallback(async () => {
    try {
      setError(null);
      const orgId =
        typeof window !== "undefined"
          ? localStorage.getItem("ptts-selected-org") || "demo-mode"
          : "demo-mode";
      const summary = await apiClient.getEnergy({ orgId, range });
      setData(summary);
    } catch (e) {
      console.error("[Energy] fetch failed", e);
      setError("Gagal memuat data energi. Periksa koneksi ke backend.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchEnergy();
  }, [fetchEnergy]);

  useEffect(() => {
    if (pollInterval <= 0) return;
    const id = setInterval(fetchEnergy, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, fetchEnergy]);

  const { totals, tariff, profile, assets, previous } = data;
  const offset = tariff.utcOffsetMinutes;

  const deltaKwh = useMemo(() => {
    if (!previous || previous.kwh <= 0) return null;
    const pct = ((totals.kwh - previous.kwh) / previous.kwh) * 100;
    return {
      text: `${pct >= 0 ? "+" : ""}${formatLocalNumber(pct, 1)}% vs periode sebelumnya`,
      // More energy for the same job is worse — this is a cost screen.
      good: pct < 0,
    };
  }, [previous, totals.kwh]);

  /** Contiguous WBP stretches in the profile, for the shaded peak-tariff bands. */
  const peakBands = useMemo(() => {
    const bands: { from: string; to: string }[] = [];
    let start: string | null = null;
    profile.forEach((p, i) => {
      if (p.window === "wbp" && start === null) start = p.label;
      const isLast = i === profile.length - 1;
      if (start !== null && (p.window !== "wbp" || isLast)) {
        bands.push({ from: start, to: p.label });
        start = null;
      }
    });
    return bands;
  }, [profile]);

  const tariffSplit = useMemo(
    () => [
      { name: "LWBP · luar beban puncak", value: totals.kwhLwbp, cost: totals.costLwbp, color: "var(--e-lwbp)" },
      { name: "WBP · beban puncak", value: totals.kwhWbp, cost: totals.costWbp, color: "var(--e-wbp)" },
    ],
    [totals],
  );

  const topConsumers = useMemo(() => assets.slice(0, 8), [assets]);

  const lowCoverage = totals.coveragePct < 80 && !data.simulated;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans" style={{ background: "var(--bg)" }}>
      <Sidebar pollInterval={pollInterval} />

      <main className="flex-1 flex flex-col min-w-0 h-screen relative" style={{ background: "var(--bg)" }}>
        <header className="flex-none z-30">
          <TopBar
            title="Energy Management"
            onRefresh={fetchEnergy}
            refreshing={loading}
            connected={!error}
            pollInterval={pollInterval}
            onPollChange={setPollInterval}
          />
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="console-canvas animate-fade-in">

            {/* ── Controls & data-trust banners ─────────────────────────── */}
            <section className="flex flex-wrap items-center gap-3">
              <div className="seg" role="group" aria-label="Rentang waktu">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    className="seg-item"
                    data-active={range === r.key}
                    aria-pressed={range === r.key}
                    onClick={() => setRange(r.key)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {data.range.from
                  ? `${formatLocalClock(data.range.from, offset)} → ${formatLocalClock(data.range.to, offset)} WIB`
                  : "Memuat rentang…"}
              </span>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {data.simulated && (
                  <span className="badge badge-warn" title="Belum ada telemetri pada rentang ini">
                    Data simulasi
                  </span>
                )}
                {tariff.isDefault && (
                  <span className="badge badge-warn" title="Tarif masih memakai nilai placeholder">
                    Tarif belum dikonfigurasi
                  </span>
                )}
                {lowCoverage && (
                  <span className="badge badge-warn" title="Sebagian jam tidak mengirim data">
                    Cakupan {totals.coveragePct}%
                  </span>
                )}
                {!data.simulated && !tariff.isDefault && !lowCoverage && !error && (
                  <span className="badge badge-ok">Data terukur</span>
                )}
              </div>
            </section>

            {(data.simulated || tariff.isDefault || error) && (
              <div
                className="panel-flat px-4 py-3 text-[13px] leading-relaxed"
                style={{ borderColor: "color-mix(in srgb, var(--warning) 35%, var(--border))" }}
              >
                {error && <p style={{ color: "var(--fault)" }}>{error}</p>}
                {data.simulated && (
                  <p style={{ color: "var(--text-muted)" }}>
                    Tidak ada telemetri <code>motor_kw</code> pada rentang ini. Angka di bawah
                    dibangkitkan sebagai contoh bentuk beban industri — <strong>bukan hasil pengukuran</strong>.
                  </p>
                )}
                {tariff.isDefault && (
                  <p style={{ color: "var(--text-muted)" }}>
                    Tarif memakai nilai placeholder ({formatCurrency(tariff.baseRatePerKwh, tariff.currency, false)}/kWh,
                    faktor K {formatLocalNumber(tariff.peakMultiplier, 2)}). Isi tarif dari tagihan PLN
                    di Settings sebelum angka rupiah dipakai untuk keputusan.
                  </p>
                )}
              </div>
            )}

            {/* ── KPI strip ─────────────────────────────────────────────── */}
            <section className="grid-12">
              <div className="col-span-1 md:col-span-3 xl:col-span-3">
                <StatTile
                  label="Konsumsi"
                  value={formatCompact(totals.kwh)}
                  unit="kWh"
                  detail={`Rata-rata ${formatLocalNumber(totals.avgKw, 1)} kW`}
                  delta={deltaKwh?.text}
                  deltaGood={deltaKwh?.good}
                />
              </div>
              <div className="col-span-1 md:col-span-3 xl:col-span-3">
                <StatTile
                  label="Biaya"
                  value={formatCurrency(totals.cost, tariff.currency)}
                  detail={`WBP ${formatCurrency(totals.costWbp, tariff.currency)} · LWBP ${formatCurrency(totals.costLwbp, tariff.currency)}`}
                />
              </div>
              <div className="col-span-1 md:col-span-3 xl:col-span-3">
                <StatTile
                  label="Beban puncak"
                  value={formatLocalNumber(totals.peakKw, 1)}
                  unit="kW"
                  detail={totals.peakAt ? `Tercatat ${formatLocalClock(totals.peakAt, offset)}` : "Belum tercatat"}
                />
              </div>
              <div className="col-span-1 md:col-span-3 xl:col-span-3">
                <StatTile
                  label="Load factor"
                  value={formatLocalNumber(totals.loadFactor * 100, 0)}
                  unit="%"
                  detail={
                    totals.loadFactor < 0.5
                      ? "Rendah — kapasitas jarang terpakai"
                      : "Profil beban relatif rata"
                  }
                />
              </div>
            </section>

            {/* ── Load profile — the reason this page exists, so it gets the
                 width and the height. Secondary facts sit on one line under it
                 rather than in four more cards. ──────────────────────────── */}
            <section>
              <div className="scada-card flex flex-col">
                  <div className="scada-card-header">
                    <span className="scada-label">Profil beban · kW</span>
                    <div className="flex items-center gap-4">
                      <LegendKey color="var(--e-lwbp)" label="Permintaan" />
                      <LegendKey color="var(--e-wbp)" label="Jendela WBP" />
                    </div>
                  </div>
                  <div className="p-4 pt-3">
                    <div style={{ width: "100%", height: "clamp(300px, 40vh, 560px)" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={profile} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="kwFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--e-lwbp)" stopOpacity={0.22} />
                              <stop offset="100%" stopColor="var(--e-lwbp)" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="var(--border-dim)" vertical={false} />
                          {peakBands.map((b, i) => (
                            <ReferenceArea
                              key={`${b.from}-${i}`}
                              x1={b.from}
                              x2={b.to}
                              fill="var(--e-wbp)"
                              fillOpacity={0.1}
                              stroke="none"
                            />
                          ))}
                          <XAxis
                            dataKey="label"
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                            minTickGap={48}
                          />
                          <YAxis
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            width={56}
                            tickFormatter={(v: number) => formatLocalNumber(v, 0)}
                          />
                          <Tooltip
                            cursor={{ stroke: "var(--border-bright)", strokeWidth: 1 }}
                            content={({ active, payload, label }) => {
                              if (!active || !payload?.length) return null;
                              const point = payload[0].payload as (typeof profile)[number];
                              return (
                                <TooltipShell>
                                  <p style={{ color: "var(--text-bright)", fontWeight: 600 }}>{label}</p>
                                  <p style={{ color: "var(--text-muted)" }}>
                                    {formatLocalNumber(point.kw, 1)} kW · {formatLocalNumber(point.kwh, 1)} kWh
                                  </p>
                                  <p style={{ color: "var(--text-muted)" }}>
                                    {point.window === "wbp" ? "Beban puncak (WBP)" : "Luar beban puncak (LWBP)"}
                                  </p>
                                </TooltipShell>
                              );
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="kw"
                            name="kW"
                            stroke="var(--e-lwbp)"
                            strokeWidth={2}
                            fill="url(#kwFill)"
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Secondary facts, one line. Each of these used to be its own
                      card or a paragraph of prose. */}
                  <div
                    className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-5 py-3 text-[13px]"
                    style={{ borderTop: "1px solid var(--border-dim)", color: "var(--text-muted)" }}
                  >
                    <span>
                      Porsi biaya WBP{" "}
                      <span className="num font-semibold" style={{ color: "var(--text-bright)" }}>
                        {totals.cost > 0 ? formatLocalNumber((totals.costWbp / totals.cost) * 100, 1) : "0,0"}%
                      </span>{" "}
                      · dibayar {formatLocalNumber(tariff.peakMultiplier, 2)}× tarif dasar pada jam{" "}
                      {tariff.peakStartHour}:00–{tariff.peakEndHour}:00
                    </span>
                    <span>
                      CO₂{" "}
                      <span className="num font-semibold" style={{ color: "var(--text-bright)" }}>
                        {formatCompact(totals.co2Kg)} kg
                      </span>
                    </span>
                    <span>
                      Cakupan data{" "}
                      <span className="num font-semibold" style={{ color: "var(--text-bright)" }}>
                        {totals.coveragePct}%
                      </span>
                      {totals.coveragePct < 100 && " — kWh di bawah 100% adalah ekstrapolasi"}
                    </span>
                  </div>
              </div>
            </section>

            {/* ── Top consumers + tariff mix ────────────────────────────── */}
            <section className="grid-12">
              <div className="col-span-1 md:col-span-6 xl:col-span-4">
                <div className="scada-card flex flex-col h-full">
                  <div className="scada-card-header">
                    <span className="scada-label">Bauran tarif</span>
                  </div>
                  <div className="p-4 flex flex-col gap-4">
                    <div style={{ width: "100%", height: 210 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tariffSplit}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="88%"
                            paddingAngle={2}
                            stroke="var(--surface)"
                            strokeWidth={2}
                            isAnimationActive={false}
                          >
                            {tariffSplit.map((s) => (
                              <Cell key={s.name} fill={s.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const s = payload[0].payload as (typeof tariffSplit)[number];
                              return (
                                <TooltipShell>
                                  <p style={{ color: "var(--text-bright)", fontWeight: 600 }}>{s.name}</p>
                                  <p style={{ color: "var(--text-muted)" }}>
                                    {formatCompact(s.value)} kWh · {formatCurrency(s.cost, tariff.currency)}
                                  </p>
                                </TooltipShell>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Values live here, not on the arcs — the ring stays readable
                        and the figures stay legible in both themes. */}
                    <div className="flex flex-col gap-2">
                      {tariffSplit.map((s) => {
                        const pct = totals.kwh > 0 ? (s.value / totals.kwh) * 100 : 0;
                        return (
                          <div key={s.name} className="flex items-center justify-between gap-3">
                            <LegendKey color={s.color} label={s.name} />
                            <span className="num text-[13px]" style={{ color: "var(--text)" }}>
                              {formatLocalNumber(pct, 1)}% · {formatCurrency(s.cost, tariff.currency)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-6 xl:col-span-8">
                <div className="scada-card flex flex-col h-full">
                  <div className="scada-card-header">
                    <span className="scada-label">Konsumen teratas · kWh</span>
                    <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                      {assets.length} aset
                    </span>
                  </div>
                  <div className="p-4 pt-3">
                    <div style={{ width: "100%", height: Math.max(240, topConsumers.length * 46) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={topConsumers}
                          layout="vertical"
                          margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
                          barCategoryGap="28%"
                        >
                          <CartesianGrid stroke="var(--border-dim)" horizontal={false} />
                          <XAxis
                            type="number"
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v: number) => formatCompact(v)}
                          />
                          <YAxis
                            type="category"
                            dataKey="id"
                            tick={AXIS_TICK}
                            tickLine={false}
                            axisLine={false}
                            width={84}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--surface-2)" }}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const a = payload[0].payload as (typeof assets)[number];
                              return (
                                <TooltipShell>
                                  <p style={{ color: "var(--text-bright)", fontWeight: 600 }}>{a.name}</p>
                                  <p style={{ color: "var(--text-muted)" }}>
                                    {formatCompact(a.kwh)} kWh · {formatCurrency(a.cost, tariff.currency)}
                                  </p>
                                  <p style={{ color: "var(--text-muted)" }}>
                                    {formatLocalNumber(a.sharePct, 1)}% dari total · puncak{" "}
                                    {formatLocalNumber(a.peakKw, 1)} kW
                                  </p>
                                </TooltipShell>
                              );
                            }}
                          />
                          <Bar
                            dataKey="kwh"
                            fill="var(--ch-1)"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={24}
                            isAnimationActive={false}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            {/* ── Per-asset table ───────────────────────────────────────── */}
            <section>
              <div className="scada-card flex flex-col">
                <div className="scada-card-header">
                  <span className="scada-label">Rincian biaya per aset</span>
                  <button type="button" className="btn" onClick={() => setShowTable((v) => !v)}>
                    {showTable ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>

                {showTable && (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th scope="col">Tag</th>
                          <th scope="col">Nama</th>
                          <th scope="col">Tipe</th>
                          <th scope="col">kWh</th>
                          <th scope="col">kWh WBP</th>
                          <th scope="col">kWh LWBP</th>
                          <th scope="col">Puncak kW</th>
                          <th scope="col">Biaya</th>
                          <th scope="col">Porsi</th>
                          <th scope="col">Cakupan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.length === 0 && (
                          <tr>
                            <td colSpan={10} style={{ color: "var(--text-faint)", textAlign: "center" }}>
                              {loading ? "Memuat…" : "Tidak ada aset dengan data daya pada rentang ini."}
                            </td>
                          </tr>
                        )}
                        {assets.map((a) => (
                          <tr key={a.id}>
                            <td className="num" style={{ color: "var(--text-muted)" }}>{a.id}</td>
                            <td style={{ color: "var(--text-bright)", fontWeight: 600 }}>{a.name}</td>
                            <td style={{ color: "var(--text-muted)" }}>{a.type}</td>
                            <td className="num">{formatLocalNumber(a.kwh, 1)}</td>
                            <td className="num" style={{ color: "var(--text-muted)" }}>{formatLocalNumber(a.kwhWbp, 1)}</td>
                            <td className="num" style={{ color: "var(--text-muted)" }}>{formatLocalNumber(a.kwhLwbp, 1)}</td>
                            <td className="num" style={{ color: "var(--text-muted)" }}>{formatLocalNumber(a.peakKw, 1)}</td>
                            <td className="num" style={{ color: "var(--text-bright)" }}>
                              {formatCurrency(a.cost, tariff.currency, false)}
                            </td>
                            <td className="num" style={{ color: "var(--text-muted)" }}>{formatLocalNumber(a.sharePct, 1)}%</td>
                            <td>
                              <span className={a.coveragePct >= 80 ? "badge badge-ok" : "badge badge-warn"}>
                                {a.coveragePct}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <footer
              className="pt-6 pb-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px]"
              style={{ borderTop: "1px solid var(--border-dim)", color: "var(--text-faint)" }}
            >
              <p>
                Sumber: <code>ptts_telemetry.motor_kw</code>
                {data.generatedAt ? ` · dihitung ${formatLocalClock(data.generatedAt, offset)} WIB` : ""}
              </p>
              <p>© 2026 PTTS · EdgeCore Energy</p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
