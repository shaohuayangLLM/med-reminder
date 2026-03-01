import { describe, it, expect } from 'vitest'
import { getAlertLevel, AlertLevel } from '../alert-level'

describe('getAlertLevel', () => {
  it('returns None when doses are plenty', () => {
    expect(getAlertLevel(40, 3)).toBe(AlertLevel.None)
  })
  it('returns Warning when remaining <= 21', () => {
    expect(getAlertLevel(21, 3)).toBe(AlertLevel.Warning)
    expect(getAlertLevel(15, 3)).toBe(AlertLevel.Warning)
  })
  it('returns Urgent when remaining <= currentDailyDoses', () => {
    expect(getAlertLevel(3, 3)).toBe(AlertLevel.Urgent)
    expect(getAlertLevel(2, 3)).toBe(AlertLevel.Urgent)
    expect(getAlertLevel(0, 3)).toBe(AlertLevel.Urgent)
  })
})
