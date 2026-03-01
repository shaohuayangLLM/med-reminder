export enum AlertLevel {
  None = 'none',
  Warning = 'warning',
  Urgent = 'urgent',
}

export function getAlertLevel(remainingDoses: number, currentDailyDoses: number): AlertLevel {
  if (remainingDoses <= currentDailyDoses) return AlertLevel.Urgent
  if (remainingDoses <= 21) return AlertLevel.Warning
  return AlertLevel.None
}
