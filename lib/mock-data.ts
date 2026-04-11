export const kpiData = [
  {
    label: "Active Sensors",
    value: "24",
    sub: "of 30 total",
    trend: "+2 this week",
    trendUp: true,
    color: "#4caf7d",
    icon: "activity",
  },
  {
    label: "Active Alerts",
    value: "3",
    sub: "Needs attention",
    trend: "1 critical",
    trendUp: false,
    color: "#ef4444",
    icon: "alert",
  },
  {
    label: "Avg Temperature",
    value: "52.4°C",
    sub: "Across all assets",
    trend: "+1.2°C vs yesterday",
    trendUp: false,
    color: "#f59e0b",
    icon: "thermometer",
  },
  {
    label: "Avg Vibration",
    value: "2.8 mm/s",
    sub: "RMS overall",
    trend: "Within threshold",
    trendUp: true,
    color: "#4a90d9",
    icon: "wave",
  },
];

export const trendData = [
  { time: "00:00", temp: 49.2, vib: 2.4, rpm: 1480 },
  { time: "02:00", temp: 50.1, vib: 2.5, rpm: 1485 },
  { time: "04:00", temp: 51.3, vib: 2.6, rpm: 1488 },
  { time: "06:00", temp: 52.8, vib: 2.9, rpm: 1492 },
  { time: "08:00", temp: 54.1, vib: 3.1, rpm: 1495 },
  { time: "10:00", temp: 53.6, vib: 2.8, rpm: 1490 },
  { time: "12:00", temp: 52.9, vib: 2.7, rpm: 1488 },
  { time: "14:00", temp: 53.4, vib: 2.9, rpm: 1491 },
  { time: "16:00", temp: 54.0, vib: 3.0, rpm: 1494 },
  { time: "18:00", temp: 52.4, vib: 2.8, rpm: 1489 },
  { time: "20:00", temp: 51.8, vib: 2.6, rpm: 1486 },
  { time: "22:00", temp: 50.9, vib: 2.5, rpm: 1483 },
];

export const statusData = [
  { name: "Online", value: 20, color: "#4caf7d" },
  { name: "Warning", value: 3, color: "#f59e0b" },
  { name: "Offline", value: 1, color: "#6b6560" },
  { name: "Fault", value: 2, color: "#ef4444" },
];

export const topAssets = [
  { id: "ABB-001", name: "Pump Motor #1", type: "ABB SmartSensor", temp: 58.2, vib: 3.8, status: "warning" },
  { id: "ABB-002", name: "Crane Drive A", type: "ABB PowerTrain", temp: 61.5, vib: 4.2, status: "fault" },
  { id: "RND-003", name: "Compressor Unit", type: "RONDS SmartSensor", temp: 55.1, vib: 2.9, status: "warning" },
  { id: "ABB-004", name: "VSD Panel #3", type: "ABB SmartSensor", temp: 47.3, vib: 1.8, status: "online" },
  { id: "RND-005", name: "Fan Motor B", type: "RONDS SmartSensor", temp: 44.6, vib: 1.4, status: "online" },
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
  { name: "Compressor", value: 2.9 },
  { name: "Fan Motor B", value: 2.4 },
  { name: "VSD Panel #3", value: 1.8 },
];
