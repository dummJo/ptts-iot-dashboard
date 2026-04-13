/**
 * PTTS SmartSensor — Utility Functions
 * ─────────────────────────────────────────────────────
 * Common formatting and calculation helpers.
 */

/**
 * Formats temperature values to a consistent string with unit.
 */
export function formatTemp(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '-- °C' : `${num.toFixed(1)} °C`;
}

/**
 * Formats vibration values to a consistent string with unit.
 */
export function formatVib(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '-- mm/s' : `${num.toFixed(2)} mm/s`;
}

/**
 * Formats frequency values.
 */
export function formatFreq(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? '-- Hz' : `${num.toFixed(1)} Hz`;
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
