import { useState, useCallback } from 'react'
import type { AppState, Cartridge } from '../types'
import { loadState, saveState } from '../lib/storage'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState)

  const startNewCartridge = useCallback((totalDoses: number, dailyDoses: number) => {
    const today = todayStr()
    const newCartridge: Cartridge = {
      id: generateId(),
      totalDoses,
      startDate: today,
      dosageChanges: [{ date: today, dailyDoses }],
      manualAdjustments: [],
    }

    setState(prev => {
      const next: AppState = {
        ...prev,
        currentCartridge: newCartridge,
        history: prev.currentCartridge
          ? [...prev.history, { ...prev.currentCartridge, endDate: today }]
          : prev.history,
      }
      saveState(next)
      return next
    })
  }, [])

  const adjustRemainingDoses = useCallback((remainingDoses: number) => {
    setState(prev => {
      if (!prev.currentCartridge) return prev
      const today = todayStr()
      const next: AppState = {
        ...prev,
        currentCartridge: {
          ...prev.currentCartridge,
          manualAdjustments: [
            ...prev.currentCartridge.manualAdjustments,
            { date: today, remainingDoses },
          ],
        },
      }
      saveState(next)
      return next
    })
  }, [])

  const changeDailyDoses = useCallback((dailyDoses: number) => {
    setState(prev => {
      if (!prev.currentCartridge) return prev
      const today = todayStr()
      const next: AppState = {
        ...prev,
        currentCartridge: {
          ...prev.currentCartridge,
          dosageChanges: [
            ...prev.currentCartridge.dosageChanges,
            { date: today, dailyDoses },
          ],
        },
      }
      saveState(next)
      return next
    })
  }, [])

  return {
    state,
    startNewCartridge,
    adjustRemainingDoses,
    changeDailyDoses,
  }
}
