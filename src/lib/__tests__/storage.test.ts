import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState, exportState, importState } from '../storage'
import type { AppState } from '../../types'
import { CURRENT_SCHEMA_VERSION } from '../../types'

describe('storage', () => {
  beforeEach(() => { localStorage.clear() })

  it('returns default state when nothing is stored', () => {
    const state = loadState()
    expect(state.currentCartridge).toBeNull()
    expect(state.history).toEqual([])
    expect(state.notificationEnabled).toBe(false)
    expect(state.version).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('round-trips state through save and load', () => {
    const state: AppState = {
      version: CURRENT_SCHEMA_VERSION,
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

  it('migrates v1 data (no version field) to current version', () => {
    const v1Data = {
      currentCartridge: {
        id: '1',
        totalDoses: 60,
        startDate: '2026-03-01',
        dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
        manualAdjustments: [],
      },
      history: [],
      notificationEnabled: false,
    }
    localStorage.setItem('medication-reminder-state', JSON.stringify(v1Data))
    const state = loadState()
    expect(state.version).toBe(CURRENT_SCHEMA_VERSION)
    expect(state.currentCartridge?.id).toBe('1')
  })

  it('exports and imports state correctly', () => {
    const state: AppState = {
      version: CURRENT_SCHEMA_VERSION,
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
    const json = exportState()
    localStorage.clear()
    const imported = importState(json)
    expect(imported).toEqual(state)
    expect(loadState()).toEqual(state)
  })
})
