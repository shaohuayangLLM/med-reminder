import { describe, it, expect } from 'vitest'
import { calculateDoseStatus } from '../dose-calculator'
import type { Cartridge } from '../../types'

describe('calculateDoseStatus', () => {
  it('calculates on start date (day 0, nothing used yet)', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [],
    }
    const result = calculateDoseStatus(cartridge, '2026-03-01')
    expect(result.usedDoses).toBe(0)
    expect(result.remainingDoses).toBe(60)
    expect(result.remainingDays).toBe(20)
    expect(result.currentDailyDoses).toBe(3)
  })

  it('calculates remaining doses for a single dosage period', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [],
    }
    // 10 days later: used 30, remaining 30
    const result = calculateDoseStatus(cartridge, '2026-03-11')
    expect(result.usedDoses).toBe(30)
    expect(result.remainingDoses).toBe(30)
    expect(result.remainingDays).toBe(10)
    expect(result.currentDailyDoses).toBe(3)
  })

  it('calculates with multiple dosage periods', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [
        { date: '2026-03-01', dailyDoses: 2 },
        { date: '2026-03-16', dailyDoses: 3 },
      ],
      manualAdjustments: [],
    }
    // 3/1~3/15 = 15 days × 2 = 30
    // 3/16~3/20 = 5 days × 3 = 15
    // total used = 45, remaining = 15
    const result = calculateDoseStatus(cartridge, '2026-03-21')
    expect(result.usedDoses).toBe(45)
    expect(result.remainingDoses).toBe(15)
    expect(result.currentDailyDoses).toBe(3)
    expect(result.remainingDays).toBe(5)
  })

  it('handles manual adjustment as new baseline', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [
        { date: '2026-03-10', remainingDoses: 35 },
      ],
    }
    // From adjustment: 3/10 remaining=35
    // 3/10~3/14 = 5 days × 3 = 15
    // remaining = 35 - 15 = 20
    const result = calculateDoseStatus(cartridge, '2026-03-15')
    expect(result.remainingDoses).toBe(20)
    expect(result.usedDoses).toBe(40) // 60 - 20
  })

  it('remaining doses never go below 0', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [],
    }
    // 30 days: 90 > 60, should be 0
    const result = calculateDoseStatus(cartridge, '2026-03-31')
    expect(result.remainingDoses).toBe(0)
    expect(result.remainingDays).toBe(0)
  })

  it('handles dosage change on the same day as manual adjustment', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [
        { date: '2026-03-01', dailyDoses: 3 },
        { date: '2026-03-10', dailyDoses: 2 },
      ],
      manualAdjustments: [
        { date: '2026-03-10', remainingDoses: 33 },
      ],
    }
    // From 3/10: remaining=33, daily=2
    // 3/10~3/14 = 5 days × 2 = 10
    // remaining = 33 - 10 = 23
    const result = calculateDoseStatus(cartridge, '2026-03-15')
    expect(result.remainingDoses).toBe(23)
    expect(result.currentDailyDoses).toBe(2)
    expect(result.remainingDays).toBe(11) // floor(23/2)
  })
})
