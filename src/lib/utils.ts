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
