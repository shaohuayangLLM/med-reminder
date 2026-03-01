export const AlertLevel = {
  None: 'none',
  Warning: 'warning',
  Urgent: 'urgent',
} as const

export type AlertLevel = (typeof AlertLevel)[keyof typeof AlertLevel]

export function getAlertLevel(remainingDoses: number, currentDailyDoses: number): AlertLevel {
  if (remainingDoses <= currentDailyDoses) return AlertLevel.Urgent
  if (remainingDoses <= 21) return AlertLevel.Warning
  return AlertLevel.None
}
