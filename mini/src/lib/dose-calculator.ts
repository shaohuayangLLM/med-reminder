import type { Cartridge } from '../types'

export interface DoseStatus {
  totalDoses: number
  usedDoses: number
  remainingDoses: number
  remainingDays: number
  currentDailyDoses: number
  estimatedEndDate: string  // YYYY-MM-DD
}

/**
 * Calculate the number of days between two YYYY-MM-DD date strings.
 * Same day returns 0. Uses UTC to avoid timezone issues.
 */
function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z')
  const b = new Date(dateB + 'T00:00:00Z')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Add a number of days to a YYYY-MM-DD date string and return a new YYYY-MM-DD string.
 */
function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Calculate the current dose status for a cartridge on a given day.
 *
 * Logic:
 * 1. Find the latest manual adjustment on or before `today` to use as baseline.
 *    If none, use (startDate, totalDoses) as baseline.
 * 2. From baseDate to today, sum used doses by iterating through dosageChange segments.
 * 3. remainingDoses = max(0, baseDoses - usedSinceBase)
 * 4. remainingDays = floor(remainingDoses / currentDailyDoses)
 * 5. estimatedEndDate = today + remainingDays
 */
export function calculateDoseStatus(cartridge: Cartridge, today: string): DoseStatus {
  // Step 1: Determine baseline (baseDate, baseDoses)
  const validAdjustments = cartridge.manualAdjustments
    .filter(a => a.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  let baseDate: string
  let baseDoses: number

  if (validAdjustments.length > 0) {
    const latest = validAdjustments[validAdjustments.length - 1]
    baseDate = latest.date
    baseDoses = latest.remainingDoses
  } else {
    baseDate = cartridge.startDate
    baseDoses = cartridge.totalDoses
  }

  // Step 2: Calculate used doses from baseDate to today
  const sortedChanges = [...cartridge.dosageChanges]
    .sort((a, b) => a.date.localeCompare(b.date))

  // Find the active daily dose rate at baseDate (latest change with date <= baseDate)
  let activeDailyDoses = 0
  for (const change of sortedChanges) {
    if (change.date <= baseDate) {
      activeDailyDoses = change.dailyDoses
    }
  }

  // Iterate through dosage changes that fall strictly after baseDate and on or before today,
  // building segments and summing used doses.
  let usedSinceBase = 0
  let segmentStart = baseDate
  let currentRate = activeDailyDoses

  for (const change of sortedChanges) {
    if (change.date > baseDate && change.date <= today) {
      const days = daysBetween(segmentStart, change.date)
      usedSinceBase += days * currentRate
      segmentStart = change.date
      currentRate = change.dailyDoses
    }
  }

  // Final segment from last segment start to today
  const finalDays = daysBetween(segmentStart, today)
  usedSinceBase += finalDays * currentRate

  // Step 3: Remaining doses (never below 0)
  const remainingDoses = Math.max(0, baseDoses - usedSinceBase)

  // Current daily doses = the rate active at today (latest change with date <= today)
  let currentDailyDoses = 0
  for (const change of sortedChanges) {
    if (change.date <= today) {
      currentDailyDoses = change.dailyDoses
    }
  }

  // Step 4: Remaining days
  const remainingDays = currentDailyDoses > 0
    ? Math.floor(remainingDoses / currentDailyDoses)
    : 0

  // Step 5: Estimated end date
  const estimatedEndDate = addDays(today, remainingDays)

  // usedDoses is relative to the total cartridge capacity
  const usedDoses = cartridge.totalDoses - remainingDoses

  return {
    totalDoses: cartridge.totalDoses,
    usedDoses,
    remainingDoses,
    remainingDays,
    currentDailyDoses,
    estimatedEndDate,
  }
}
