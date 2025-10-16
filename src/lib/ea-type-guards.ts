/**
 * Type guard utilities for safely handling EA API responses
 * EA returns Record<string, unknown> which needs to be safely converted
 */

/**
 * Safely converts unknown value to string
 */
export function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return '';
}

/**
 * Safely converts unknown value to number
 */
export function safeNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Safely renders unknown value in React components
 * Returns "-" for null/undefined/objects, otherwise converts to string
 */
export function safeRender(value: unknown, fallback: string = '-'): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return fallback;
  if (value === '') return fallback;
  return String(value);
}

/**
 * Safely converts unknown value to integer
 */
export function safeInt(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Checks if value exists and is not an empty object
 */
export function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return true;
}
