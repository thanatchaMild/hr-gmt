// Tenure (อายุงาน) helpers — everything derived from startDate, no stored value.

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole days from `date` to `asOf` (positive = in the past). */
export function daysSince(date?: string | Date | null, asOf: Date = new Date()): number | null {
  const d = toDate(date)
  if (!d) return null
  return Math.floor((asOf.getTime() - d.getTime()) / 86_400_000)
}

/** Whole days from `asOf` until `date` (positive = in the future, negative = overdue). */
export function daysUntil(date?: string | Date | null, asOf: Date = new Date()): number | null {
  const s = daysSince(date, asOf)
  return s === null ? null : -s
}

export type DeadlineSeverity = 'info' | 'warning' | 'urgent' | 'overdue'

/**
 * Severity of an upcoming probation / contract-end deadline, using the same
 * thresholds as the alerts feed (server/api/alerts.ts `deadlineTier`).
 * Returns null outside the -30..+30 day window, i.e. when no alert is shown.
 */
export function deadlineSeverity(date?: string | Date | null, asOf: Date = new Date()): DeadlineSeverity | null {
  const d = daysUntil(date, asOf)
  if (d === null || d > 30 || d < -30) return null
  if (d > 7) return 'info'
  if (d > 3) return 'warning'
  if (d >= 0) return 'urgent'
  return 'overdue'
}

/** Tailwind text classes for a deadline date cell, coloured by its alert severity. */
export function deadlineDateClass(date?: string | Date | null, asOf: Date = new Date()): string {
  switch (deadlineSeverity(date, asOf)) {
    case 'overdue': return 'text-rose-700 font-semibold'
    case 'urgent': return 'text-red-600 font-semibold'
    case 'warning': return 'text-amber-600 font-semibold'
    case 'info': return 'text-amber-600'
    default: return 'text-slate-600'
  }
}

export interface Tenure {
  totalDays: number
  years: number
  months: number
  days: number
  label: string
}

/** Calendar tenure between startDate and asOf. Returns null for missing/future dates. */
export function tenure(startDate?: string | Date | null, asOf: Date = new Date()): Tenure | null {
  const start = toDate(startDate)
  if (!start || start.getTime() > asOf.getTime()) return null

  let years = asOf.getFullYear() - start.getFullYear()
  let months = asOf.getMonth() - start.getMonth()
  let days = asOf.getDate() - start.getDate()

  if (days < 0) {
    months -= 1
    // days in the month before asOf
    days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const totalDays = Math.floor((asOf.getTime() - start.getTime()) / 86_400_000)

  const parts: string[] = []
  if (years) parts.push(`${years} ปี`)
  if (months) parts.push(`${months} เดือน`)
  if (days || parts.length === 0) parts.push(`${days} วัน`)

  return { totalDays, years, months, days, label: parts.join(' ') }
}
