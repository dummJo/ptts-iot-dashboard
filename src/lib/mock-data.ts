export const kpiData = [
  {
    label:    "ACTIVE SENSORS",
    value:    "24",
    unit:     "/ 30",
    sub:      "6 nodes offline or unreachable",
    trend:    "+2 this week",
    trendUp:  true,
    color:    "var(--online)",
    ledClass: "led-online",
  },
  {
    label:    "ACTIVE ALARMS",
    value:    "3",
    unit:     "",
    sub:      "1 critical · 2 warning",
    trend:    "1 unacknowledged",
    trendUp:  false,
    color:    "var(--fault)",
    ledClass: "led-fault",
  },
  {
    label:    "AVG TEMPERATURE",
    value:    "52,4",
    unit:     "°C",
    sub:      "Limit: 60°C · Across all nodes",
    trend:    "+1,2°C vs yesterday",
    trendUp:  false,
    color:    "var(--warning)",
    ledClass: "led-warning",
  },
  {
    label:    "AVG VIBRATION",
    value:    "2,8",
    unit:     "mm/s",
    sub:      "RMS overall · Limit: 3.5 mm/s",
    trend:    "Within threshold",
    trendUp:  true,
    color:    "var(--online)",
    ledClass: "led-online",
  },
];

export const trendData = [
  { time:"00:00", temp:49.2, vib:2.4 },
  { time:"02:00", temp:50.1, vib:2.5 },
  { time:"04:00", temp:51.3, vib:2.6 },
  { time:"06:00", temp:52.8, vib:2.9 },
  { time:"08:00", temp:54.1, vib:3.1 },
  { time:"10:00", temp:53.6, vib:2.8 },
  { time:"12:00", temp:52.9, vib:2.7 },
  { time:"14:00", temp:53.4, vib:2.9 },
  { time:"16:00", temp:54.0, vib:3.0 },
  { time:"18:00", temp:52.4, vib:2.8 },
  { time:"20:00", temp:51.8, vib:2.6 },
  { time:"22:00", temp:50.9, vib:2.5 },
];

export const statusData = [
  { name: "GOOD",    value: 20, color: "var(--online)"  },
  { name: "WARNING", value:  3, color: "var(--warning)" },
  { name: "FAULT",   value:  2, color: "var(--fault)"   },
];

import type { Asset } from './types';

export const topAssets: Asset[] = [
  { id:"PTS-001", name:"Pump Motor #1",   type:"PTTS SmartSensor",  temp:58.2, vib:3.8, link:"online",  health:"warning", powerKW: 22,  foundation: "rigid"    },
  { id:"PTS-002", name:"Crane Drive A",   type:"PTTS SmartSensor",  temp:61.5, vib:4.2, link:"online",  health:"fault",   powerKW: 90,  foundation: "flexible" },
  { id:"RND-003", name:"Compressor Unit", type:"RONDS SmartSensor", temp:55.1, vib:2.9, link:"online",  health:"warning", powerKW: 55,  foundation: "rigid"    },
  { id:"PTS-004", name:"VSD Panel #3",    type:"PTTS SmartSensor",  temp:47.3, vib:1.8, link:"online",  health:"good",    powerKW: 11,  foundation: "rigid"    },
  { id:"RND-005", name:"Fan Motor B",     type:"RONDS SmartSensor", temp:0,    vib:0,   link:"offline", health:"good",    powerKW: 160, foundation: "flexible" },
];

// Per-asset multi-metric trend data (simulated 24h, 2h intervals)
const makeAssetTrend = (
  baseTemp: number, baseVib: number, baseKW: number, baseFreq: number
) => [
  "00:00","02:00","04:00","06:00","08:00","10:00",
  "12:00","14:00","16:00","18:00","20:00","22:00",
].map((time) => {
  const jitter = (range: number) => (Math.random() - 0.5) * range;
  const vib = +(baseVib + jitter(0.6)).toFixed(2);
  const kw  = +(baseKW  + jitter(baseKW * 0.15)).toFixed(1);
  return {
    time,
    temp:     +(baseTemp + jitter(3)).toFixed(1),
    vib,
    rms:      +(vib * 0.92 + jitter(0.1)).toFixed(2),
    powerKW:  kw,
    freq:     +(baseFreq + jitter(2)).toFixed(1),
    velocity: +(vib * 1.3  + jitter(0.15)).toFixed(2),
    current:  +(kw / 0.4  + jitter(2)).toFixed(1),    // rough I = P/(η·V) proxy
  };
});

export const assetTrends: Record<string, import('./types').TrendPoint[]> = {
  "PTS-001": makeAssetTrend(58.2, 3.8, 22,  50),
  "PTS-002": makeAssetTrend(61.5, 4.2, 90,  50),
  "RND-003": makeAssetTrend(55.1, 2.9, 55,  60),
  "PTS-004": makeAssetTrend(47.3, 1.8, 11,  50),
  "RND-005": makeAssetTrend(32.0, 1.2, 160, 60),
  "ALL":     makeAssetTrend(54.4, 3.0, 48,  50), // fleet average
};

export const recentAlerts = [
  {
    id:       "ALT-2026-041",
    asset:    "Crane Drive A",
    type:     "PowerTrain",
    severity: "critical",
    message:  "Bearing temperature exceeded 60°C — immediate inspection required",
    time:     "10:42",
  },
  {
    id:       "ALT-2026-040",
    asset:    "Pump Motor #1",
    type:     "SmartSensor",
    severity: "warning",
    message:  "Vibration RMS above 3.5 mm/s threshold",
    time:     "09:18",
  },
  {
    id:       "ALT-2026-039",
    asset:    "Compressor Unit",
    type:     "SmartSensor",
    severity: "warning",
    message:  "Lubrication condition index degraded",
    time:     "07:55",
  },
];

export const vibrationBarData = [
  { name:"Crane Drive A", value:4.2 },
  { name:"Pump Motor #1", value:3.8 },
  { name:"Compressor",    value:2.9 },
  { name:"Fan Motor B",   value:2.4 },
  { name:"VSD Panel #3",  value:1.8 },
];


export const configDbState = {
  apiKeys: [] as string[]
};

// Dynamic summary calculators
export const getLinkSummary = (assets: Asset[]) => ({
  online: assets.filter(a => a.link === 'online').length,
  offline: assets.filter(a => a.link === 'offline').length,
});

export const getHealthSummary = (assets: Asset[]) => ({
  good: assets.filter(a => a.health === 'good').length,
  warning: assets.filter(a => a.health === 'warning').length,
  fault: assets.filter(a => a.health === 'fault').length,
});
