// ABB Red: #CC0000 | FLUKE Yellow: #FFD700 | SKF Blue: #003DA5 | PTTS Teal: #00A3B4

export const kpiData = [
  {
    label: "Active Sensors",
    value: "24",
    sub: "of 30 total",
    trend: "+2 this week",
    trendUp: true,
    color: "#00A3B4",  // PTTS teal
  },
  {
    label: "Active Alerts",
    value: "3",
    sub: "Needs attention",
    trend: "1 critical",
    trendUp: false,
    color: "#CC0000",  // ABB Red
  },
  {
    label: "Avg Temperature",
    value: "52.4°C",
    sub: "Across all assets",
    trend: "+1.2°C vs yesterday",
    trendUp: false,
    color: "#FFD700",  // FLUKE Yellow
  },
  {
    label: "Avg Vibration",
    value: "2.8 mm/s",
    sub: "RMS overall",
    trend: "Within threshold",
    trendUp: true,
    color: "#003DA5",  // SKF Blue
  },
];

export const trendData = [
  { time: "00:00", temp: 49.2, vib: 2.4 },
  { time: "02:00", temp: 50.1, vib: 2.5 },
  { time: "04:00", temp: 51.3, vib: 2.6 },
  { time: "06:00", temp: 52.8, vib: 2.9 },
  { time: "08:00", temp: 54.1, vib: 3.1 },
  { time: "10:00", temp: 53.6, vib: 2.8 },
  { time: "12:00", temp: 52.9, vib: 2.7 },
  { time: "14:00", temp: 53.4, vib: 2.9 },
  { time: "16:00", temp: 54.0, vib: 3.0 },
  { time: "18:00", temp: 52.4, vib: 2.8 },
  { time: "20:00", temp: 51.8, vib: 2.6 },
  { time: "22:00", temp: 50.9, vib: 2.5 },
];

export const statusData = [
  { name: "Online",  value: 20, color: "#22c55e"  },
  { name: "Warning", value: 3,  color: "#FFD700"  },  // FLUKE
  { name: "Offline", value: 1,  color: "#6b7280"  },
  { name: "Fault",   value: 2,  color: "#CC0000"  },  // ABB
];

export const topAssets = [
  { id: "ABB-001", name: "Pump Motor #1",   type: "ABB SmartSensor",   temp: 58.2, vib: 3.8, status: "warning" },
  { id: "ABB-002", name: "Crane Drive A",   type: "ABB PowerTrain",    temp: 61.5, vib: 4.2, status: "fault"   },
  { id: "RND-003", name: "Compressor Unit", type: "RONDS SmartSensor", temp: 55.1, vib: 2.9, status: "warning" },
  { id: "ABB-004", name: "VSD Panel #3",    type: "ABB SmartSensor",   temp: 47.3, vib: 1.8, status: "online"  },
  { id: "RND-005", name: "Fan Motor B",     type: "RONDS SmartSensor", temp: 44.6, vib: 1.4, status: "online"  },
];

export const recentAlerts = [
  {
    id: "ALT-2026-041",
    asset: "Crane Drive A",
    type: "ABB PowerTrain",
    severity: "critical",
    message: "Bearing temperature exceeded 60°C",
    time: "10:42",
  },
  {
    id: "ALT-2026-040",
    asset: "Pump Motor #1",
    type: "ABB SmartSensor",
    severity: "warning",
    message: "Vibration RMS above 3.5 mm/s threshold",
    time: "09:18",
  },
  {
    id: "ALT-2026-039",
    asset: "Compressor Unit",
    type: "RONDS SmartSensor",
    severity: "warning",
    message: "Lubrication condition degraded",
    time: "07:55",
  },
];

export const vibrationBarData = [
  { name: "Crane Drive A", value: 4.2 },
  { name: "Pump Motor #1", value: 3.8 },
  { name: "Compressor",    value: 2.9 },
  { name: "Fan Motor B",   value: 2.4 },
  { name: "VSD Panel #3",  value: 1.8 },
];
