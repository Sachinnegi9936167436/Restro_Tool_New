/**
 * Utility helpers
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date string */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** Format a number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}

/** Truncate text to maxLen characters */
export function truncate(text: string, maxLen = 80): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

/** Convert radius in meters to label */
export function radiusLabel(meters: number): string {
  return meters >= 1000 ? `${meters / 1000} km` : `${meters} m`
}

/** Safely parse JSON */
export function safeJsonParse<T>(str: unknown, fallback: T): T {
  if (typeof str !== 'string') return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

/** Lead status display info */
export const LEAD_STATUS_CONFIG = {
  NEW: { label: 'New', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  CONTACTED: { label: 'Contacted', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  INTERESTED: { label: 'Interested', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  CLIENT: { label: 'Client ✓', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  LOST: { label: 'Lost', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const

/** UTTARAKHAND cities list */
export const UK_CITIES = [
  'Dehradun', 'Haridwar', 'Rishikesh', 'Haldwani', 'Roorkee',
  'Kashipur', 'Rudrapur', 'Mussoorie', 'Nainital', 'Almora',
  'Pithoragarh', 'Chamoli', 'Bageshwar', 'Uttarkashi', 'Tehri',
  'Kotdwar', 'Ramnagar', 'Lansdowne', 'Chakrata', 'Pauri',
]

/** Restaurant categories */
export const CATEGORIES = [
  'Restaurant', 'Cafe', 'Bakery', 'Hotel Restaurant', 'Dhaba', 'Fast Food',
]

/** Radius options */
export const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
]
