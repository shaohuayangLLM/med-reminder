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

export interface AppState {
  currentCartridge: Cartridge | null
  history: Cartridge[]
  notificationEnabled: boolean
}
