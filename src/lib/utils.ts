/**
 * PTTS SmartSensor — Utility Functions
 * ─────────────────────────────────────────────────────
 * Common formatting and calculation helpers.
 */

/**
 * Formats a number to Indonesian locale (comma decimal) with at most 2 decimals.
 */
export function formatLocalNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '--';
  
  // Format to fixed decimals, then replace dot with comma
  let formatted = num.toFixed(decimals).replace('.', ',');
  
  // Remove trailing zeros if they are not needed (optional, but "paling banyak 2" might imply this)
  // But usually in industrial dashboards, fixed precision is cleaner.
  // Given the example 3,55, I will stick with toFixed(decimals).
  
  return formatted;
}

/**
 * Formats temperature values to a consistent string with unit.
 */
export function formatTemp(value: number | string): string {
  return `${formatLocalNumber(value, 1)} °C`;
}

/**
 * Formats vibration values to a consistent string with unit.
 */
export function formatVib(value: number | string): string {
  return `${formatLocalNumber(value, 2)} mm/s`;
}

/**
 * Formats frequency values.
 */
export function formatFreq(value: number | string): string {
  return `${formatLocalNumber(value, 1)} Hz`;
}

/**
 * Truncates and formats long asset names or IDs.
 */
export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Compacts large magnitudes for stat tiles and axis ticks (1.284 jt, 12,9 rb).
 * Uses Indonesian short scale so the console reads the same as an invoice.
 */
export function formatCompact(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '--';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatLocalNumber(value / 1_000_000_000, decimals)} M`;
  if (abs >= 1_000_000) return `${formatLocalNumber(value / 1_000_000, decimals)} jt`;
  if (abs >= 1_000) return `${formatLocalNumber(value / 1_000, decimals)} rb`;
  return formatLocalNumber(value, abs >= 100 ? 0 : decimals);
}

/**
 * Formats a money amount. Kept compact by default because these values live in
 * stat tiles; pass compact=false for table cells where the exact figure matters.
 */
export function formatCurrency(value: number, currency = 'IDR', compact = true): string {
  if (!Number.isFinite(value)) return '--';
  const symbol = currency === 'IDR' ? 'Rp' : `${currency} `;
  if (compact) return `${symbol}${formatCompact(value)}`;
  return `${symbol}${Math.round(value).toLocaleString('id-ID')}`;
}

/**
 * Formats an ISO timestamp as a local wall-clock reading for a given UTC offset.
 * Telemetry is stored in UTC but operators read the plant clock (WIB by default).
 */
export function formatLocalClock(iso: string | null, utcOffsetMinutes = 420): string {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  const shifted = new Date(d.getTime() + utcOffsetMinutes * 60_000);
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  const mon = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mon} ${hh}:${mm}`;
}

/**
 * Returns the CSS color associated with an industrial status.
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'online':  return 'var(--online)';
    case 'warning': return 'var(--warning)';
    case 'fault':
    case 'critical': return 'var(--fault)';
    case 'offline': return 'var(--offline)';
    default:        return 'var(--text-faint)';
  }
}

/**
 * Returns the CSS color associated with machine condition health.
 */
export function getHealthColor(health: string): string {
  switch (health?.toLowerCase()) {
    case 'good':    return 'var(--online)';
    case 'warning': return 'var(--warning)';
    case 'fault':   return 'var(--fault)';
    default:        return 'var(--text-faint)';
  }
}

/**
 * Returns the CSS color associated with sensor connectivity (link).
 */
export function getLinkColor(link: string): string {
  return link?.toLowerCase() === 'online' ? 'var(--online)' : 'var(--offline)';
}

/**
 * ISO 10816 Vibration Threshold Calculator
 * Determines mm/s RMS limits based on motor power (kW) and foundation type.
 */
export function getISO10816Thresholds(powerKW?: number, foundation: 'rigid' | 'flexible' = 'rigid') {
  // Default to Class I if no power rating
  if (!powerKW || powerKW < 15) {
    // Class I (up to 15 kW)
    return { warning: 1.8, fault: 4.5 };
  } else if (powerKW >= 15 && powerKW <= 75) {
    // Class II (15 kW - 75 kW)
    return { warning: 2.8, fault: 7.1 };
  } else if (powerKW > 75 && foundation === 'rigid') {
    // Class III (large rigid)
    return { warning: 4.5, fault: 11.2 };
  } else {
    // Class IV (large flexible)
    return { warning: 7.1, fault: 18.0 };
  }
}

/**
 * Evaluates machine health dynamically based on ISO thresholds or manual overrides.
 */
export function calculateMachineHealth(
  vib: number,
  powerKW?: number,
  foundation: 'rigid' | 'flexible' = 'rigid',
  overrides?: { warning: number; fault: number }
): 'good' | 'warning' | 'fault' {
  const limits = overrides || getISO10816Thresholds(powerKW, foundation);
  
  if (vib >= limits.fault) return 'fault';
  if (vib >= limits.warning) return 'warning';
  return 'good';
}
