import { useState, useCallback } from 'react'
import type { AppState, Cartridge, OperationLog } from '../types'
import { loadState, saveState, importState } from '../lib/storage'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 19)
}

function addLog(prev: AppState, action: string, detail: string): OperationLog[] {
  const logs = [...(prev.operationLogs ?? []), { timestamp: nowTimestamp(), action, detail }]
  // Only keep logs from the last 30 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 19)
  return logs.filter(l => l.timestamp >= cutoffStr)
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
        operationLogs: addLog(prev, '开新药', `总${totalDoses}次 每日${dailyDoses}次`),
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
        operationLogs: addLog(prev, '修正次数', `剩余修正为 ${remainingDoses}次`),
      }
      saveState(next)
      return next
    })
  }, [])

  const changeDailyDoses = useCallback((dailyDoses: number, effectiveDate?: string) => {
    setState(prev => {
      if (!prev.currentCartridge) return prev
      const date = effectiveDate || todayStr()
      const currentDaily = prev.currentCartridge.dosageChanges
        .filter(c => c.date <= date)
        .sort((a, b) => a.date.localeCompare(b.date))
        .pop()?.dailyDoses ?? 0
      const when = date === todayStr() ? '今天生效' : `${date}生效`
      const next: AppState = {
        ...prev,
        currentCartridge: {
          ...prev.currentCartridge,
          dosageChanges: [
            ...prev.currentCartridge.dosageChanges,
            { date, dailyDoses },
          ],
        },
        operationLogs: addLog(prev, '调整每日', `${currentDaily}→${dailyDoses}次 ${when}`),
      }
      saveState(next)
      return next
    })
  }, [])

  const deleteHistory = useCallback((id: string) => {
    setState(prev => {
      const next: AppState = {
        ...prev,
        history: prev.history.filter(c => c.id !== id),
      }
      saveState(next)
      return next
    })
  }, [])

  const importData = useCallback((json: string) => {
    try {
      const newState = importState(json)
      setState(newState)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    state,
    startNewCartridge,
    adjustRemainingDoses,
    changeDailyDoses,
    deleteHistory,
    importData,
  }
}
