import type { AppState } from '../types'

const STORAGE_KEY = 'medication-reminder-state'

const DEFAULT_STATE: AppState = {
  currentCartridge: null,
  history: [],
  notificationEnabled: false,
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    return JSON.parse(raw) as AppState
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
