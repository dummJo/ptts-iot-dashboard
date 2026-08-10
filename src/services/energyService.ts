import prisma from '@/lib/prisma';
import type {
  AssetEnergyRow,
  EnergyPoint,
  EnergySummary,
  TariffConfig,
  TariffWindow,
} from '@/lib/types';

/**
 * ENERGY SERVICE — kWh, cost and CO₂ derived from drive telemetry
 * ─────────────────────────────────────────────────────────────────────────────
 * The `motor_kw` column in ptts_telemetry has always been an instantaneous
 * demand reading. Everything below turns that into billable energy.
 *
 * Two deliberate constraints:
 *
 * 1. Aggregation happens in Postgres, never by streaming rows into Node.
 *    ARCHITECTURE.md §7 requires bounded queries; a year of 1-minute telemetry
 *    across 50 assets is ~26M rows.
 *
 * 2. Nothing is presented as measured unless it was measured. Coverage is
 *    tracked and returned, and the synthetic fallback is flagged `simulated`.
 */

// ── Tariff ───────────────────────────────────────────────────────────────────

/**
 * Placeholder tariff. These are NOT quoted PLN rates — they are shape-correct
 * stand-ins so the page renders before anyone has configured anything, and every
 * response built from them carries `isDefault: true` so the UI can say so.
 *
 * Replace via Settings → the values land in SystemConfig.settings.energy.
 *
 * co2FactorKgPerKwh: grid emission factors for the Jawa–Bali system are commonly
 * cited in the 0.79–0.87 kgCO₂/kWh band depending on source and year. 0.85 is a
 * mid-band placeholder; PTTS should set the figure its reporting standard requires.
 */
export const DEFAULT_TARIFF: TariffConfig = {
  currency: 'IDR',
  baseRatePerKwh: 1114.74,
  peakMultiplier: 1.5,
  peakStartHour: 18,
  peakEndHour: 22,
  utcOffsetMinutes: 420, // WIB
  co2FactorKgPerKwh: 0.85,
  isDefault: true,
};

/** Longest range accepted, so a bad `from` can't turn into an unbounded scan. */
export const MAX_RANGE_DAYS = 400;

/** Chart buckets. Bounded so the payload stays flat regardless of range. */
const MAX_PROFILE_BUCKETS = 240;

/**
 * Coerces a Postgres scalar to a number.
 *
 * Postgres hands back NUMERIC as a string and COUNT()/BIGINT as a JS BigInt.
 * `Number.isFinite(1n)` is false, so a naive guard silently turned every
 * COUNT-derived value into the fallback — which is how coverage first shipped
 * reading 0% on a fully-populated range.
 */
function finiteOr(value: unknown, fallback: number): number {
  if (typeof value === 'bigint') return Number(value);
  const n = typeof value === 'string' ? parseFloat(value) : (value as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(finiteOr(value, NaN));
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

/**
 * Reads tariff settings out of the SystemConfig.settings JSON blob, rejecting
 * anything malformed rather than letting a bad value silently distort a bill.
 * A partially-valid blob still counts as configured only if the money fields
 * are usable — otherwise it stays flagged as default.
 */
export function resolveTariff(settings: unknown): TariffConfig {
  const raw = (settings as Record<string, unknown> | null)?.energy as
    | Record<string, unknown>
    | undefined;

  if (!raw || typeof raw !== 'object') return { ...DEFAULT_TARIFF };

  const baseRate = finiteOr(raw.baseRatePerKwh, NaN);
  const configured = Number.isFinite(baseRate) && baseRate > 0;

  const peakStartHour = clampInt(raw.peakStartHour, 0, 23, DEFAULT_TARIFF.peakStartHour);
  const peakEndHour = clampInt(raw.peakEndHour, 1, 24, DEFAULT_TARIFF.peakEndHour);

  return {
    currency: typeof raw.currency === 'string' && raw.currency ? raw.currency : DEFAULT_TARIFF.currency,
    baseRatePerKwh: configured ? baseRate : DEFAULT_TARIFF.baseRatePerKwh,
    peakMultiplier: Math.max(1, finiteOr(raw.peakMultiplier, DEFAULT_TARIFF.peakMultiplier)),
    // An inverted window would silently classify every hour as off-peak.
    peakStartHour: peakStartHour < peakEndHour ? peakStartHour : DEFAULT_TARIFF.peakStartHour,
    peakEndHour: peakStartHour < peakEndHour ? peakEndHour : DEFAULT_TARIFF.peakEndHour,
    utcOffsetMinutes: clampInt(raw.utcOffsetMinutes, -720, 840, DEFAULT_TARIFF.utcOffsetMinutes),
    co2FactorKgPerKwh: Math.max(0, finiteOr(raw.co2FactorKgPerKwh, DEFAULT_TARIFF.co2FactorKgPerKwh)),
    isDefault: !configured,
  };
}

// ── Pure calculations ────────────────────────────────────────────────────────

/** Local hour-of-day at `date`, in the tariff's timezone. */
export function localHour(date: Date, tariff: TariffConfig): number {
  return new Date(date.getTime() + tariff.utcOffsetMinutes * 60_000).getUTCHours();
}

export function classifyWindow(date: Date, tariff: TariffConfig): TariffWindow {
  const h = localHour(date, tariff);
  return h >= tariff.peakStartHour && h < tariff.peakEndHour ? 'wbp' : 'lwbp';
}

/**
 * Hours falling in each tariff window across [from, to).
 *
 * Stepped at 15 minutes rather than at UTC hour boundaries: a whole-hour offset
 * like WIB never straddles one, but offsets such as UTC+5:30 do, and an
 * hour-aligned walk would misfile the straddling hour entirely.
 */
export function windowHours(
  from: Date,
  to: Date,
  tariff: TariffConfig,
): { wbp: number; lwbp: number; total: number } {
  const STEP_MS = 15 * 60_000;
  const end = to.getTime();
  let cursor = from.getTime();
  let wbp = 0;
  let lwbp = 0;

  while (cursor < end) {
    const segEnd = Math.min(cursor + STEP_MS, end);
    const hours = (segEnd - cursor) / 3_600_000;
    if (classifyWindow(new Date(cursor), tariff) === 'wbp') wbp += hours;
    else lwbp += hours;
    cursor = segEnd;
  }

  return { wbp, lwbp, total: wbp + lwbp };
}

export function computeCost(
  kwhWbp: number,
  kwhLwbp: number,
  tariff: TariffConfig,
): { costWbp: number; costLwbp: number; cost: number } {
  const costLwbp = kwhLwbp * tariff.baseRatePerKwh;
  const costWbp = kwhWbp * tariff.baseRatePerKwh * tariff.peakMultiplier;
  return { costWbp, costLwbp, cost: costWbp + costLwbp };
}

export function computeCo2(kwh: number, tariff: TariffConfig): number {
  return kwh * tariff.co2FactorKgPerKwh;
}

/**
 * Load factor — average demand over peak demand. Low values mean the site pays
 * for capacity it rarely uses, which is exactly the case a VSD retrofit answers.
 */
export function loadFactor(avgKw: number, peakKw: number): number {
  if (!Number.isFinite(peakKw) || peakKw <= 0) return 0;
  return Math.min(1, avgKw / peakKw);
}

/** kWh per m³ pumped. Null — not zero — when flow data is absent. */
export function specificEnergy(kwh: number, volumeM3: number | null | undefined): number | null {
  if (volumeM3 == null || !Number.isFinite(volumeM3) || volumeM3 <= 0) return null;
  return kwh / volumeM3;
}

// ── Synthetic fallback ───────────────────────────────────────────────────────

/** Deterministic hash → [0,1). Keeps the demo profile stable across refreshes. */
function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Stand-in load profile for an empty database. Shaped like a real industrial
 * duty cycle (day shift heavy, night base load) so the layout can be judged,
 * but every response carrying it is flagged `simulated: true`.
 */
export function syntheticProfile(from: Date, to: Date, bucketMs: number, tariff: TariffConfig): EnergyPoint[] {
  const points: EnergyPoint[] = [];
  const bucketHours = bucketMs / 3_600_000;

  for (let t = from.getTime(); t < to.getTime(); t += bucketMs) {
    const at = new Date(t);
    const hour = localHour(at, tariff);
    // Base load plus a day-shift hump, plus bounded deterministic jitter.
    const shift = Math.max(0, Math.sin(((hour - 5) / 24) * Math.PI * 2)) * 46;
    const kw = 34 + shift + seededUnit(Math.floor(t / bucketMs)) * 9;
    points.push({
      t: at.toISOString(),
      label: formatBucketLabel(at, bucketMs, tariff),
      kw: round(kw, 2),
      kwh: round(kw * bucketHours, 3),
      window: classifyWindow(at, tariff),
    });
  }

  return points;
}

// ── Formatting helpers ───────────────────────────────────────────────────────

function round(value: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function formatBucketLabel(date: Date, bucketMs: number, tariff: TariffConfig): string {
  const local = new Date(date.getTime() + tariff.utcOffsetMinutes * 60_000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  const dd = String(local.getUTCDate()).padStart(2, '0');
  const mon = String(local.getUTCMonth() + 1).padStart(2, '0');

  if (bucketMs >= 86_400_000) return `${dd}/${mon}`;
  if (bucketMs >= 3_600_000) return `${dd}/${mon} ${hh}:00`;
  return `${hh}:${mm}`;
}

/** Bucket width that keeps the profile under MAX_PROFILE_BUCKETS points. */
export function chooseBucketMs(from: Date, to: Date): number {
  const spanMs = Math.max(to.getTime() - from.getTime(), 60_000);
  const LADDER = [
    5 * 60_000, 15 * 60_000, 30 * 60_000,
    3_600_000, 2 * 3_600_000, 6 * 3_600_000,
    86_400_000, 7 * 86_400_000,
  ];
  return LADDER.find((ms) => spanMs / ms <= MAX_PROFILE_BUCKETS) ?? LADDER[LADDER.length - 1];
}

// ── Data access ──────────────────────────────────────────────────────────────

interface WindowAggRow {
  asset_id: string;
  tag_id: string;
  name: string;
  type: string;
  window: TariffWindow;
  avg_kw: string | number | null;
  max_kw: string | number | null;
  covered_hours: string | number | null;
}

interface BucketAggRow {
  bucket: Date;
  avg_kw: string | number | null;
}

interface PeakRow {
  motor_kw: string | number | null;
  timestamp: Date;
}

export class EnergyService {
  /**
   * Builds the full energy summary for one organization over [from, to).
   *
   * Energy is estimated as `mean demand × hours in that tariff window`, per
   * asset, per window. This deliberately does not integrate raw samples: with
   * irregular telemetry the trapezoid rule happily bridges a six-hour outage and
   * reports it as full production. Mean × hours has the same blind spot, so
   * `coveragePct` is returned alongside every figure — at 40% coverage the kWh
   * is an extrapolation and the UI must say so.
   */
  static async getSummary(params: {
    orgId: string;
    from: Date;
    to: Date;
    tariff: TariffConfig;
    label: string;
  }): Promise<EnergySummary> {
    const { orgId, from, to, tariff, label } = params;

    const hours = windowHours(from, to, tariff);
    const bucketMs = chooseBucketMs(from, to);

    const [rows, buckets, peak] = await Promise.all([
      this.queryWindowAggregates(orgId, from, to, tariff),
      this.queryProfileBuckets(orgId, from, to, bucketMs),
      this.queryPeak(orgId, from, to),
    ]);

    if (rows.length === 0) {
      return this.syntheticSummary({ from, to, tariff, label, bucketMs });
    }

    const totalRangeHours = Math.max(hours.total, 1 / 60);

    // Fold the per-asset/per-window rows into one row per asset.
    const byAsset = new Map<string, AssetEnergyRow & { coveredHours: number }>();

    for (const row of rows) {
      const avgKw = finiteOr(row.avg_kw, 0);
      const maxKw = finiteOr(row.max_kw, 0);
      const coveredHours = finiteOr(row.covered_hours, 0);
      const windowSpan = row.window === 'wbp' ? hours.wbp : hours.lwbp;
      const kwh = avgKw * windowSpan;

      const existing = byAsset.get(row.asset_id) ?? {
        id: row.tag_id,
        name: row.name,
        type: row.type,
        kwh: 0, kwhWbp: 0, kwhLwbp: 0,
        cost: 0, sharePct: 0, peakKw: 0, coveragePct: 0,
        coveredHours: 0,
      };

      existing.kwh += kwh;
      if (row.window === 'wbp') existing.kwhWbp += kwh;
      else existing.kwhLwbp += kwh;
      existing.peakKw = Math.max(existing.peakKw, maxKw);
      existing.coveredHours += coveredHours;

      byAsset.set(row.asset_id, existing);
    }

    const assets: AssetEnergyRow[] = [];
    let kwhWbp = 0;
    let kwhLwbp = 0;
    let coveredHoursTotal = 0;

    for (const entry of byAsset.values()) {
      const { costWbp, costLwbp } = computeCost(entry.kwhWbp, entry.kwhLwbp, tariff);
      kwhWbp += entry.kwhWbp;
      kwhLwbp += entry.kwhLwbp;
      coveredHoursTotal += entry.coveredHours;

      assets.push({
        id: entry.id,
        name: entry.name,
        type: entry.type,
        kwh: round(entry.kwh, 1),
        kwhWbp: round(entry.kwhWbp, 1),
        kwhLwbp: round(entry.kwhLwbp, 1),
        cost: round(costWbp + costLwbp, 0),
        sharePct: 0, // filled once the total is known
        peakKw: round(entry.peakKw, 1),
        coveragePct: round(Math.min(100, (entry.coveredHours / totalRangeHours) * 100), 0),
      });
    }

    const kwh = kwhWbp + kwhLwbp;
    for (const a of assets) {
      a.sharePct = kwh > 0 ? round((a.kwh / kwh) * 100, 1) : 0;
    }
    assets.sort((a, b) => b.kwh - a.kwh);

    const { cost, costWbp, costLwbp } = computeCost(kwhWbp, kwhLwbp, tariff);
    const peakKw = finiteOr(peak?.motor_kw, 0);
    const avgKw = kwh / totalRangeHours;

    const bucketHours = bucketMs / 3_600_000;
    const profile: EnergyPoint[] = buckets.map((b) => {
      const kw = finiteOr(b.avg_kw, 0);
      return {
        t: b.bucket.toISOString(),
        label: formatBucketLabel(b.bucket, bucketMs, tariff),
        kw: round(kw, 2),
        kwh: round(kw * bucketHours, 3),
        window: classifyWindow(b.bucket, tariff),
      };
    });

    // Same-length window immediately before, for the period-over-period delta.
    const previous = await this.queryPreviousTotals(orgId, from, to, tariff);

    return {
      range: { from: from.toISOString(), to: to.toISOString(), label },
      simulated: false,
      tariff,
      totals: {
        kwh: round(kwh, 1),
        kwhWbp: round(kwhWbp, 1),
        kwhLwbp: round(kwhLwbp, 1),
        cost: round(cost, 0),
        costWbp: round(costWbp, 0),
        costLwbp: round(costLwbp, 0),
        co2Kg: round(computeCo2(kwh, tariff), 1),
        peakKw: round(peakKw, 1),
        peakAt: peak?.timestamp ? peak.timestamp.toISOString() : null,
        avgKw: round(avgKw, 1),
        loadFactor: round(loadFactor(avgKw, peakKw), 3),
        // Coverage across the fleet: covered asset-hours over possible asset-hours.
        coveragePct: round(
          Math.min(100, (coveredHoursTotal / (totalRangeHours * Math.max(byAsset.size, 1))) * 100),
          0,
        ),
        // No flow instrumentation exists in the schema yet, so this stays null
        // rather than inventing a denominator.
        specificEnergy: null,
      },
      previous,
      profile,
      assets,
      generatedAt: new Date().toISOString(),
    };
  }

  /** Mean/max demand and covered hours, grouped by asset and tariff window. */
  private static async queryWindowAggregates(
    orgId: string,
    from: Date,
    to: Date,
    tariff: TariffConfig,
  ): Promise<WindowAggRow[]> {
    const offsetMinutes = tariff.utcOffsetMinutes;

    return prisma.$queryRaw<WindowAggRow[]>`
      SELECT
        t.asset_id                                        AS asset_id,
        a.tag_id                                          AS tag_id,
        a.name                                            AS name,
        a.type                                            AS type,
        CASE
          WHEN EXTRACT(
                 HOUR FROM (t."timestamp" + (${offsetMinutes}::int * interval '1 minute'))
               ) >= ${tariff.peakStartHour}::int
           AND EXTRACT(
                 HOUR FROM (t."timestamp" + (${offsetMinutes}::int * interval '1 minute'))
               ) < ${tariff.peakEndHour}::int
          THEN 'wbp' ELSE 'lwbp'
        END                                               AS window,
        AVG(t.motor_kw)                                   AS avg_kw,
        MAX(t.motor_kw)                                   AS max_kw,
        COUNT(DISTINCT date_trunc('hour', t."timestamp")) AS covered_hours
      FROM ptts_telemetry t
      JOIN ptts_assets a ON a.id = t.asset_id
      WHERE a.organization_id = ${orgId}
        AND t."timestamp" >= ${from}
        AND t."timestamp"  < ${to}
        AND t.motor_kw IS NOT NULL
        AND t.motor_kw > 0
      GROUP BY 1, 2, 3, 4, 5
    `;
  }

  /** Site-wide demand profile, pre-bucketed in Postgres. */
  private static async queryProfileBuckets(
    orgId: string,
    from: Date,
    to: Date,
    bucketMs: number,
  ): Promise<BucketAggRow[]> {
    const bucketSeconds = Math.round(bucketMs / 1000);

    // Site demand is the SUM of per-asset means, not the mean of all rows:
    // averaging raw rows would let a chattier sensor dominate the profile and
    // would report site demand as roughly one asset's worth.
    return prisma.$queryRaw<BucketAggRow[]>`
      SELECT bucket, SUM(asset_avg_kw) AS avg_kw
      FROM (
        SELECT
          to_timestamp(
            floor(extract(epoch FROM t."timestamp") / ${bucketSeconds}::int) * ${bucketSeconds}::int
          )                AS bucket,
          t.asset_id       AS asset_id,
          AVG(t.motor_kw)  AS asset_avg_kw
        FROM ptts_telemetry t
        JOIN ptts_assets a ON a.id = t.asset_id
        WHERE a.organization_id = ${orgId}
          AND t."timestamp" >= ${from}
          AND t."timestamp"  < ${to}
          AND t.motor_kw IS NOT NULL
          AND t.motor_kw > 0
        GROUP BY 1, 2
      ) per_asset
      GROUP BY bucket
      ORDER BY bucket ASC
    `;
  }

  /**
   * Peak SITE demand — the highest simultaneous total across all assets, on a
   * 15-minute demand interval (the interval utilities actually bill on).
   *
   * Not `MAX(motor_kw)`: that returns the largest reading from any single
   * asset, so on a three-pump site the "peak" came back smaller than the site
   * average and load factor pinned to 100%.
   */
  private static async queryPeak(orgId: string, from: Date, to: Date): Promise<PeakRow | null> {
    const DEMAND_INTERVAL_SECONDS = 900;

    const rows = await prisma.$queryRaw<PeakRow[]>`
      SELECT bucket AS timestamp, SUM(asset_avg_kw) AS motor_kw
      FROM (
        SELECT
          to_timestamp(
            floor(extract(epoch FROM t."timestamp") / ${DEMAND_INTERVAL_SECONDS}::int)
            * ${DEMAND_INTERVAL_SECONDS}::int
          )               AS bucket,
          t.asset_id      AS asset_id,
          AVG(t.motor_kw) AS asset_avg_kw
        FROM ptts_telemetry t
        JOIN ptts_assets a ON a.id = t.asset_id
        WHERE a.organization_id = ${orgId}
          AND t."timestamp" >= ${from}
          AND t."timestamp"  < ${to}
          AND t.motor_kw IS NOT NULL
          AND t.motor_kw > 0
        GROUP BY 1, 2
      ) per_asset
      GROUP BY bucket
      ORDER BY SUM(asset_avg_kw) DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  /** Totals for the equally-sized window immediately preceding [from, to). */
  private static async queryPreviousTotals(
    orgId: string,
    from: Date,
    to: Date,
    tariff: TariffConfig,
  ): Promise<{ kwh: number; cost: number; co2Kg: number } | null> {
    const spanMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - spanMs);
    const rows = await this.queryWindowAggregates(orgId, prevFrom, from, tariff);
    if (rows.length === 0) return null;

    const hours = windowHours(prevFrom, from, tariff);
    let kwhWbp = 0;
    let kwhLwbp = 0;

    for (const row of rows) {
      const avgKw = finiteOr(row.avg_kw, 0);
      if (row.window === 'wbp') kwhWbp += avgKw * hours.wbp;
      else kwhLwbp += avgKw * hours.lwbp;
    }

    const kwh = kwhWbp + kwhLwbp;
    const { cost } = computeCost(kwhWbp, kwhLwbp, tariff);

    return {
      kwh: round(kwh, 1),
      cost: round(cost, 0),
      co2Kg: round(computeCo2(kwh, tariff), 1),
    };
  }

  /**
   * Everything below is generated, not measured. Returned only when the range
   * holds no telemetry at all, and always with `simulated: true`.
   */
  private static syntheticSummary(params: {
    from: Date;
    to: Date;
    tariff: TariffConfig;
    label: string;
    bucketMs: number;
  }): EnergySummary {
    const { from, to, tariff, label, bucketMs } = params;

    const profile = syntheticProfile(from, to, bucketMs, tariff);
    const hours = windowHours(from, to, tariff);
    const totalRangeHours = Math.max(hours.total, 1 / 60);

    let kwhWbp = 0;
    let kwhLwbp = 0;
    let peakKw = 0;
    let peakAt: string | null = null;

    for (const p of profile) {
      if (p.window === 'wbp') kwhWbp += p.kwh;
      else kwhLwbp += p.kwh;
      if (p.kw > peakKw) {
        peakKw = p.kw;
        peakAt = p.t;
      }
    }

    const kwh = kwhWbp + kwhLwbp;
    const { cost, costWbp, costLwbp } = computeCost(kwhWbp, kwhLwbp, tariff);
    const avgKw = kwh / totalRangeHours;

    // Four illustrative units matching the multipump draft on /console/operations.
    const SHARES = [
      { id: 'P-01', name: 'Pump 01 · ACS580', type: 'Pump', share: 0.34 },
      { id: 'P-02', name: 'Pump 02 · ACS580', type: 'Pump', share: 0.28 },
      { id: 'P-03', name: 'Pump 03 · ACS880', type: 'Pump', share: 0.23 },
      { id: 'P-04', name: 'Pump 04 · ACS880', type: 'Pump', share: 0.15 },
    ];

    const assets: AssetEnergyRow[] = SHARES.map((s) => {
      const aWbp = kwhWbp * s.share;
      const aLwbp = kwhLwbp * s.share;
      const { cost: aCost } = computeCost(aWbp, aLwbp, tariff);
      return {
        id: s.id,
        name: s.name,
        type: s.type,
        kwh: round(aWbp + aLwbp, 1),
        kwhWbp: round(aWbp, 1),
        kwhLwbp: round(aLwbp, 1),
        cost: round(aCost, 0),
        sharePct: round(s.share * 100, 1),
        peakKw: round(peakKw * s.share * 1.6, 1),
        coveragePct: 100,
      };
    });

    return {
      range: { from: from.toISOString(), to: to.toISOString(), label },
      simulated: true,
      tariff,
      totals: {
        kwh: round(kwh, 1),
        kwhWbp: round(kwhWbp, 1),
        kwhLwbp: round(kwhLwbp, 1),
        cost: round(cost, 0),
        costWbp: round(costWbp, 0),
        costLwbp: round(costLwbp, 0),
        co2Kg: round(computeCo2(kwh, tariff), 1),
        peakKw: round(peakKw, 1),
        peakAt,
        avgKw: round(avgKw, 1),
        loadFactor: round(loadFactor(avgKw, peakKw), 3),
        coveragePct: 100,
        specificEnergy: null,
      },
      // A fabricated period-over-period delta would be pure theatre.
      previous: null,
      profile,
      assets,
      generatedAt: new Date().toISOString(),
    };
  }
}
