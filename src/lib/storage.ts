import type { AppState } from '../types'
import { CURRENT_SCHEMA_VERSION } from '../types'

const STORAGE_KEY = 'medication-reminder-state'

const DEFAULT_STATE: AppState = {
  version: CURRENT_SCHEMA_VERSION,
  currentCartridge: null,
  history: [],
  notificationEnabled: false,
  operationLogs: [],
}

function migrate(raw: Record<string, unknown>): AppState {
  const version = (raw.version as number) || 1

  // v1 -> v2: add version field
  if (version < 2) {
    raw.version = 2
  }

  // v2 -> v3: add operationLogs
  if (version < 3) {
    raw.version = 3
    if (!raw.operationLogs) raw.operationLogs = []
  }

  return raw as unknown as AppState
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_STATE }
    const parsed = JSON.parse(raw)
    const state = migrate(parsed)
    // Re-save if migration happened
    if ((parsed.version || 1) < CURRENT_SCHEMA_VERSION) {
      saveState(state)
    }
    return state
  } catch {
    return { ...DEFAULT_STATE }
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: CURRENT_SCHEMA_VERSION }))
}

export function exportState(): string {
  const state = loadState()
  return JSON.stringify(state, null, 2)
}

export function importState(json: string): AppState {
  const parsed = JSON.parse(json)
  const state = migrate(parsed)
  saveState(state)
  return state
}
