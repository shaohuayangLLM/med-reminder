import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState } from '../storage'
import type { AppState } from '../../types'

describe('storage', () => {
  beforeEach(() => { localStorage.clear() })

  it('returns default state when nothing is stored', () => {
    const state = loadState()
    expect(state.currentCartridge).toBeNull()
    expect(state.history).toEqual([])
    expect(state.notificationEnabled).toBe(false)
  })

  it('round-trips state through save and load', () => {
    const state: AppState = {
      currentCartridge: {
        id: '1',
        totalDoses: 60,
        startDate: '2026-03-01',
        dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
        manualAdjustments: [],
      },
      history: [],
      notificationEnabled: true,
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })
})
