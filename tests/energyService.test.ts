/**
 * Unit tests for the energy calculation layer.
 *
 * Pure functions only — no database. Run with: npm test
 * (Node's built-in test runner via tsx; no extra dependency.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_TARIFF,
  chooseBucketMs,
  classifyWindow,
  computeCo2,
  computeCost,
  loadFactor,
  resolveTariff,
  specificEnergy,
  windowHours,
} from '../src/services/energyService';
import type { TariffConfig } from '../src/lib/types';

/** WIB (UTC+7), peak 18:00–22:00 local. */
const T: TariffConfig = { ...DEFAULT_TARIFF, baseRatePerKwh: 1000, peakMultiplier: 1.5 };

/** Builds a UTC Date from a WIB wall-clock hour on 2026-01-01. */
function wib(hour: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 0, 1, hour - 7, minute));
}

test('classifyWindow: peak window is start-inclusive and end-exclusive', () => {
  assert.equal(classifyWindow(wib(17, 59), T), 'lwbp');
  assert.equal(classifyWindow(wib(18, 0), T), 'wbp', '18:00 must be inside the peak window');
  assert.equal(classifyWindow(wib(21, 59), T), 'wbp');
  assert.equal(classifyWindow(wib(22, 0), T), 'lwbp', '22:00 must be outside the peak window');
  assert.equal(classifyWindow(wib(3, 0), T), 'lwbp');
});

test('classifyWindow: honours a non-whole-hour UTC offset', () => {
  // UTC+5:30. 18:00 local is 12:30 UTC.
  const ist: TariffConfig = { ...T, utcOffsetMinutes: 330 };
  assert.equal(classifyWindow(new Date(Date.UTC(2026, 0, 1, 12, 29)), ist), 'lwbp');
  assert.equal(classifyWindow(new Date(Date.UTC(2026, 0, 1, 12, 30)), ist), 'wbp');
});

test('windowHours: a full day splits into 4 peak hours and 20 off-peak', () => {
  const from = wib(0);
  const to = new Date(from.getTime() + 24 * 3_600_000);
  const h = windowHours(from, to, T);
  assert.equal(h.wbp, 4);
  assert.equal(h.lwbp, 20);
  assert.equal(h.total, 24);
});

test('windowHours: a partial range entirely inside the peak window', () => {
  const h = windowHours(wib(19), wib(21), T);
  assert.equal(h.wbp, 2);
  assert.equal(h.lwbp, 0);
});

test('windowHours: seven days scale linearly', () => {
  const from = wib(0);
  const to = new Date(from.getTime() + 7 * 86_400_000);
  const h = windowHours(from, to, T);
  assert.equal(h.wbp, 28);
  assert.equal(h.lwbp, 140);
});

test('computeCost: K=1 collapses to a flat rate', () => {
  const flat: TariffConfig = { ...T, peakMultiplier: 1 };
  const { cost } = computeCost(100, 400, flat);
  assert.equal(cost, 500 * flat.baseRatePerKwh);
});

test('computeCost: peak energy is billed at K times the base rate', () => {
  const { costWbp, costLwbp, cost } = computeCost(100, 400, T);
  assert.equal(costLwbp, 400 * 1000);
  assert.equal(costWbp, 100 * 1000 * 1.5);
  assert.equal(cost, costWbp + costLwbp);
});

test('computeCo2: scales linearly with the grid factor', () => {
  assert.equal(computeCo2(1000, { ...T, co2FactorKgPerKwh: 0.85 }), 850);
  assert.equal(computeCo2(0, T), 0);
});

test('loadFactor: ratio of average to peak, clamped and zero-safe', () => {
  assert.equal(loadFactor(50, 100), 0.5);
  assert.equal(loadFactor(0, 100), 0);
  assert.equal(loadFactor(100, 0), 0, 'an unknown peak must not divide by zero');
  assert.equal(loadFactor(150, 100), 1, 'must never exceed 1');
});

test('specificEnergy: null rather than a fabricated number when flow is missing', () => {
  assert.equal(specificEnergy(100, null), null);
  assert.equal(specificEnergy(100, undefined), null);
  assert.equal(specificEnergy(100, 0), null);
  assert.equal(specificEnergy(100, 50), 2);
});

test('resolveTariff: missing config falls back and stays flagged as default', () => {
  const t = resolveTariff(null);
  assert.equal(t.isDefault, true);
  assert.equal(t.baseRatePerKwh, DEFAULT_TARIFF.baseRatePerKwh);
});

test('resolveTariff: a real base rate clears the isDefault flag', () => {
  const t = resolveTariff({ energy: { baseRatePerKwh: 1444.7, peakMultiplier: 1.4 } });
  assert.equal(t.isDefault, false);
  assert.equal(t.baseRatePerKwh, 1444.7);
  assert.equal(t.peakMultiplier, 1.4);
});

test('resolveTariff: garbage values fall back instead of distorting a bill', () => {
  const t = resolveTariff({
    energy: { baseRatePerKwh: 'free', peakMultiplier: -3, co2FactorKgPerKwh: -1 },
  });
  assert.equal(t.isDefault, true, 'an unusable rate must not read as configured');
  assert.equal(t.baseRatePerKwh, DEFAULT_TARIFF.baseRatePerKwh);
  assert.ok(t.peakMultiplier >= 1, 'a peak multiplier below 1 would make peak energy cheaper');
  assert.ok(t.co2FactorKgPerKwh >= 0);
});

test('resolveTariff: an inverted peak window is rejected', () => {
  // 22:00–06:00 would otherwise classify every hour as off-peak.
  const t = resolveTariff({ energy: { baseRatePerKwh: 1200, peakStartHour: 22, peakEndHour: 6 } });
  assert.equal(t.peakStartHour, DEFAULT_TARIFF.peakStartHour);
  assert.equal(t.peakEndHour, DEFAULT_TARIFF.peakEndHour);
});

test('chooseBucketMs: profile stays bounded as the range grows', () => {
  const MAX_POINTS = 240;
  for (const days of [1, 7, 30, 90, 365]) {
    const span = days * 86_400_000;
    const bucket = chooseBucketMs(new Date(0), new Date(span));
    assert.ok(
      span / bucket <= MAX_POINTS,
      `${days}d range produced ${Math.round(span / bucket)} points`,
    );
  }
});
