export interface DosageChange {
  date: string        // ISO date string YYYY-MM-DD
  dailyDoses: number  // 该日起的每日次数
}

export interface ManualAdjustment {
  date: string           // ISO date string YYYY-MM-DD
  remainingDoses: number // 修正后的剩余次数
}

export interface Cartridge {
  id: string
  totalDoses: number
  startDate: string
  endDate?: string
  dosageChanges: DosageChange[]
  manualAdjustments: ManualAdjustment[]
}

export interface OperationLog {
  timestamp: string   // ISO datetime e.g. "2026-03-28T14:30:00"
  action: string      // e.g. "开新药", "修正次数", "调整每日"
  detail: string      // e.g. "总60次 每日3次", "3→2次 今天生效"
}

export interface AppState {
  version: number
  currentCartridge: Cartridge | null
  history: Cartridge[]
  notificationEnabled: boolean
  operationLogs: OperationLog[]
}

export const CURRENT_SCHEMA_VERSION = 3
