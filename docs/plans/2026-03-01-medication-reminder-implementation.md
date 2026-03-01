# 用药提醒 Web 应用 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个药剂剩余次数倒计时 Web 应用，确保用户永远不会用到空的吸雾剂。

**Architecture:** 纯前端单页应用，核心是剂量计算引擎（支持分段用量计算和手动修正），数据持久化到 localStorage，使用 Web Notifications API 实现分级提醒。UI 以环形进度条为视觉核心，操作极简。

**Tech Stack:** React 19 + TypeScript + Tailwind CSS v4 + Vite + Vitest + localStorage + Web Notifications API

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Step 1: 用 Vite 创建 React + TypeScript 项目**

```bash
cd "/Users/ysh/Manual Library/ClaudeCode/用药提醒"
npm create vite@latest . -- --template react-ts
```

如果目录非空，选择覆盖。

**Step 2: 安装依赖**

```bash
npm install
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 3: 配置 Tailwind**

修改 `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

替换 `src/index.css` 内容为:
```css
@import "tailwindcss";
```

**Step 4: 配置 Vitest**

在 `vite.config.ts` 中添加 test 配置:
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
```

创建 `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom/vitest'
```

更新 `tsconfig.app.json`，在 `compilerOptions` 中添加:
```json
"types": ["vitest/globals"]
```

**Step 5: 清理默认文件**

- 删除 `src/App.css`, `src/assets/`
- 替换 `src/App.tsx` 为最小骨架:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-slate-800">用药提醒</h1>
    </div>
  )
}

export default App
```

**Step 6: 验证一切正常**

```bash
npm run dev
# 确认页面显示 "用药提醒"
npx vitest run
# 确认测试框架可用（即使还没有测试文件也不应报错）
```

**Step 7: Commit**

```bash
git init
echo "node_modules\ndist\n.DS_Store" > .gitignore
git add -A
git commit -m "chore: scaffold project with Vite + React + TypeScript + Tailwind + Vitest"
```

---

### Task 2: 数据类型定义

**Files:**
- Create: `src/types.ts`

**Step 1: 定义核心类型**

```typescript
// src/types.ts

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
  totalDoses: number          // 总次数（如 60）
  startDate: string           // 启用日期 YYYY-MM-DD
  endDate?: string            // 用完/换药日期
  dosageChanges: DosageChange[]       // 每日次数变更时间线
  manualAdjustments: ManualAdjustment[] // 手动修正记录
}

export interface AppState {
  currentCartridge: Cartridge | null
  history: Cartridge[]
  notificationEnabled: boolean
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: define core data types for Cartridge and AppState"
```

---

### Task 3: 剂量计算引擎 — 核心逻辑

这是整个应用最关键的部分，必须 TDD。

**Files:**
- Create: `src/lib/dose-calculator.ts`
- Create: `src/lib/__tests__/dose-calculator.test.ts`

**Step 1: 写失败测试 — 基本计算（无修正、单段用量）**

```typescript
// src/lib/__tests__/dose-calculator.test.ts
import { describe, it, expect } from 'vitest'
import { calculateDoseStatus } from '../dose-calculator'
import type { Cartridge } from '../../types'

describe('calculateDoseStatus', () => {
  it('calculates remaining doses for a single dosage period', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [],
    }
    // 10 天后: 已用 30, 剩余 30
    const result = calculateDoseStatus(cartridge, '2026-03-11')
    expect(result.usedDoses).toBe(30)
    expect(result.remainingDoses).toBe(30)
    expect(result.remainingDays).toBe(10)
    expect(result.estimatedEndDate).toBe('2026-03-21')
    expect(result.currentDailyDoses).toBe(3)
  })
})
```

**Step 2: 运行测试，确认失败**

```bash
npx vitest run src/lib/__tests__/dose-calculator.test.ts
```

Expected: FAIL — module not found

**Step 3: 实现最小代码通过测试**

```typescript
// src/lib/dose-calculator.ts
import type { Cartridge } from '../types'

export interface DoseStatus {
  totalDoses: number
  usedDoses: number
  remainingDoses: number
  remainingDays: number
  currentDailyDoses: number
  estimatedEndDate: string
}

function daysBetween(from: string, to: string): number {
  const msPerDay = 86400000
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function calculateDoseStatus(cartridge: Cartridge, today: string): DoseStatus {
  const { totalDoses, dosageChanges, manualAdjustments } = cartridge

  // 找到最近的手动修正
  const sortedAdjustments = [...manualAdjustments].sort(
    (a, b) => b.date.localeCompare(a.date)
  )
  const latestAdjustment = sortedAdjustments[0]

  // 确定计算起点
  let baseDate: string
  let baseDoses: number

  if (latestAdjustment && latestAdjustment.date <= today) {
    baseDate = latestAdjustment.date
    baseDoses = latestAdjustment.remainingDoses
  } else {
    baseDate = cartridge.startDate
    baseDoses = totalDoses
  }

  // 从起点开始，按 dosageChanges 分段计算已用次数
  const sortedChanges = [...dosageChanges].sort(
    (a, b) => a.date.localeCompare(b.date)
  )

  let usedSinceBase = 0
  let currentDailyDoses = sortedChanges[0]?.dailyDoses ?? 0

  for (let i = 0; i < sortedChanges.length; i++) {
    const change = sortedChanges[i]
    if (change.date > today) break
    if (change.date < baseDate) {
      currentDailyDoses = change.dailyDoses
      continue
    }

    const segmentStart = change.date < baseDate ? baseDate : change.date
    const segmentEnd = (i + 1 < sortedChanges.length && sortedChanges[i + 1].date <= today)
      ? sortedChanges[i + 1].date
      : today

    const days = daysBetween(segmentStart, segmentEnd)
    usedSinceBase += days * change.dailyDoses
    currentDailyDoses = change.dailyDoses
  }

  // 如果 baseDate 之前没有 dosageChange 覆盖到 baseDate~第一个 change 的空隙
  // 需要处理 baseDate 到第一个 >= baseDate 的 change 之间的天数
  const firstRelevantChangeIdx = sortedChanges.findIndex(c => c.date >= baseDate)
  if (firstRelevantChangeIdx === -1) {
    // 没有任何 change >= baseDate，用最后一个 change 的 dailyDoses
    const lastChange = sortedChanges[sortedChanges.length - 1]
    if (lastChange) {
      const days = daysBetween(baseDate, today)
      usedSinceBase = days * lastChange.dailyDoses
      currentDailyDoses = lastChange.dailyDoses
    }
  } else if (sortedChanges[firstRelevantChangeIdx].date > baseDate) {
    // baseDate 到第一个 relevant change 之间有间隙
    // 用前一个 change 的 dailyDoses 来填充
    const prevChange = firstRelevantChangeIdx > 0
      ? sortedChanges[firstRelevantChangeIdx - 1]
      : sortedChanges[firstRelevantChangeIdx]
    const gapDays = daysBetween(baseDate, sortedChanges[firstRelevantChangeIdx].date)
    usedSinceBase += gapDays * prevChange.dailyDoses
  }

  const remainingDoses = Math.max(0, baseDoses - usedSinceBase)
  const remainingDays = currentDailyDoses > 0
    ? Math.floor(remainingDoses / currentDailyDoses)
    : 0
  const estimatedEndDate = addDays(today, remainingDays)

  return {
    totalDoses,
    usedDoses: totalDoses - remainingDoses,
    remainingDoses,
    remainingDays,
    currentDailyDoses,
    estimatedEndDate,
  }
}
```

> 注意：上面的初始实现可能在分段计算逻辑上有 bug。核心思路对了但边界情况需要靠后续测试来打磨。这就是 TDD 的价值。

**Step 4: 运行测试，确认通过**

```bash
npx vitest run src/lib/__tests__/dose-calculator.test.ts
```

Expected: PASS

**Step 5: 写更多测试覆盖边界情况**

追加到测试文件:

```typescript
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
    // 3/1~3/15 = 15天 × 2 = 30
    // 3/16~3/20 = 5天 × 3 = 15
    // 已用 45, 剩余 15
    const result = calculateDoseStatus(cartridge, '2026-03-21')
    expect(result.usedDoses).toBe(45)
    expect(result.remainingDoses).toBe(15)
    expect(result.currentDailyDoses).toBe(3)
    expect(result.remainingDays).toBe(5)
  })

  it('handles manual adjustment', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [
        { date: '2026-03-10', remainingDoses: 35 },
      ],
    }
    // 从修正点 3/10 剩余 35 开始计算
    // 3/10~3/15 = 5天 × 3 = 15
    // 剩余 35 - 15 = 20
    const result = calculateDoseStatus(cartridge, '2026-03-15')
    expect(result.remainingDoses).toBe(20)
  })

  it('remaining doses never go below 0', () => {
    const cartridge: Cartridge = {
      id: '1',
      totalDoses: 60,
      startDate: '2026-03-01',
      dosageChanges: [{ date: '2026-03-01', dailyDoses: 3 }],
      manualAdjustments: [],
    }
    // 30天后: 90 > 60, 应该返回 0
    const result = calculateDoseStatus(cartridge, '2026-03-31')
    expect(result.remainingDoses).toBe(0)
    expect(result.remainingDays).toBe(0)
  })

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
  })
```

**Step 6: 运行所有测试，逐个修复直到全部通过**

```bash
npx vitest run src/lib/__tests__/dose-calculator.test.ts
```

根据失败情况调整 `dose-calculator.ts` 的实现。重点关注分段计算的边界情况。

**Step 7: Commit**

```bash
git add src/lib/
git commit -m "feat: implement dose calculator with segmented dosage tracking and manual adjustments"
```

---

### Task 4: 提醒级别判定

**Files:**
- Create: `src/lib/alert-level.ts`
- Create: `src/lib/__tests__/alert-level.test.ts`

**Step 1: 写失败测试**

```typescript
// src/lib/__tests__/alert-level.test.ts
import { describe, it, expect } from 'vitest'
import { getAlertLevel, AlertLevel } from '../alert-level'

describe('getAlertLevel', () => {
  it('returns "none" when doses are plenty', () => {
    expect(getAlertLevel(40, 3)).toBe(AlertLevel.None)
  })

  it('returns "warning" when remaining <= 21', () => {
    expect(getAlertLevel(21, 3)).toBe(AlertLevel.Warning)
    expect(getAlertLevel(15, 3)).toBe(AlertLevel.Warning)
  })

  it('returns "urgent" when remaining <= currentDailyDoses (last day)', () => {
    expect(getAlertLevel(3, 3)).toBe(AlertLevel.Urgent)
    expect(getAlertLevel(2, 3)).toBe(AlertLevel.Urgent)
    expect(getAlertLevel(0, 3)).toBe(AlertLevel.Urgent)
  })
})
```

**Step 2: 运行测试，确认失败**

```bash
npx vitest run src/lib/__tests__/alert-level.test.ts
```

**Step 3: 实现**

```typescript
// src/lib/alert-level.ts

export enum AlertLevel {
  None = 'none',
  Warning = 'warning',
  Urgent = 'urgent',
}

export function getAlertLevel(remainingDoses: number, currentDailyDoses: number): AlertLevel {
  if (remainingDoses <= currentDailyDoses) return AlertLevel.Urgent
  if (remainingDoses <= 21) return AlertLevel.Warning
  return AlertLevel.None
}
```

**Step 4: 运行测试，确认通过**

```bash
npx vitest run src/lib/__tests__/alert-level.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/alert-level.ts src/lib/__tests__/alert-level.test.ts
git commit -m "feat: add alert level logic with warning and urgent thresholds"
```

---

### Task 5: localStorage 持久化

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/lib/__tests__/storage.test.ts`

**Step 1: 写失败测试**

```typescript
// src/lib/__tests__/storage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState } from '../storage'
import type { AppState } from '../../types'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

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
    const loaded = loadState()
    expect(loaded).toEqual(state)
  })
})
```

**Step 2: 运行测试，确认失败**

```bash
npx vitest run src/lib/__tests__/storage.test.ts
```

**Step 3: 实现**

```typescript
// src/lib/storage.ts
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
```

**Step 4: 运行测试，确认通过**

```bash
npx vitest run src/lib/__tests__/storage.test.ts
```

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/__tests__/storage.test.ts
git commit -m "feat: add localStorage persistence for app state"
```

---

### Task 6: 状态管理 Hook

**Files:**
- Create: `src/hooks/useAppState.ts`

**Step 1: 实现 Hook**

```typescript
// src/hooks/useAppState.ts
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

  const persist = useCallback((next: AppState) => {
    setState(next)
    saveState(next)
  }, [])

  const startNewCartridge = useCallback((totalDoses: number, dailyDoses: number) => {
    const today = todayStr()
    const newCartridge: Cartridge = {
      id: generateId(),
      totalDoses,
      startDate: today,
      dosageChanges: [{ date: today, dailyDoses }],
      manualAdjustments: [],
    }

    persist({
      ...state,
      currentCartridge: newCartridge,
      history: state.currentCartridge
        ? [...state.history, { ...state.currentCartridge, endDate: today }]
        : state.history,
    })
  }, [state, persist])

  const adjustRemainingDoses = useCallback((remainingDoses: number) => {
    if (!state.currentCartridge) return
    const today = todayStr()
    persist({
      ...state,
      currentCartridge: {
        ...state.currentCartridge,
        manualAdjustments: [
          ...state.currentCartridge.manualAdjustments,
          { date: today, remainingDoses },
        ],
      },
    })
  }, [state, persist])

  const changeDailyDoses = useCallback((dailyDoses: number) => {
    if (!state.currentCartridge) return
    const today = todayStr()
    persist({
      ...state,
      currentCartridge: {
        ...state.currentCartridge,
        dosageChanges: [
          ...state.currentCartridge.dosageChanges,
          { date: today, dailyDoses },
        ],
      },
    })
  }, [state, persist])

  return {
    state,
    startNewCartridge,
    adjustRemainingDoses,
    changeDailyDoses,
  }
}
```

**Step 2: Commit**

```bash
git add src/hooks/useAppState.ts
git commit -m "feat: add useAppState hook for state management with localStorage persistence"
```

---

### Task 7: 环形进度条组件

**Files:**
- Create: `src/components/RingProgress.tsx`

**Step 1: 实现 SVG 环形进度条**

```tsx
// src/components/RingProgress.tsx
import { AlertLevel } from '../lib/alert-level'

interface RingProgressProps {
  remaining: number
  total: number
  alertLevel: AlertLevel
}

const COLORS = {
  [AlertLevel.None]: 'stroke-emerald-500',
  [AlertLevel.Warning]: 'stroke-amber-500',
  [AlertLevel.Urgent]: 'stroke-red-500',
}

const BG_COLORS = {
  [AlertLevel.None]: 'stroke-emerald-100',
  [AlertLevel.Warning]: 'stroke-amber-100',
  [AlertLevel.Urgent]: 'stroke-red-100',
}

export function RingProgress({ remaining, total, alertLevel }: RingProgressProps) {
  const radius = 90
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? Math.max(0, remaining / total) : 0
  const offset = circumference * (1 - progress)

  return (
    <svg width="220" height="220" viewBox="0 0 220 220" className="transform -rotate-90">
      <circle
        cx="110" cy="110" r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className={BG_COLORS[alertLevel]}
      />
      <circle
        cx="110" cy="110" r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`${COLORS[alertLevel]} transition-all duration-500`}
      />
    </svg>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/RingProgress.tsx
git commit -m "feat: add RingProgress SVG component with alert-level colors"
```

---

### Task 8: 状态展示区组件

**Files:**
- Create: `src/components/StatusDisplay.tsx`

**Step 1: 实现状态展示**

```tsx
// src/components/StatusDisplay.tsx
import type { DoseStatus } from '../lib/dose-calculator'
import { AlertLevel } from '../lib/alert-level'
import { RingProgress } from './RingProgress'

interface StatusDisplayProps {
  status: DoseStatus
  alertLevel: AlertLevel
}

const ALERT_TEXT = {
  [AlertLevel.None]: null,
  [AlertLevel.Warning]: '该准备新药了',
  [AlertLevel.Urgent]: '明天就用完了！',
}

const ALERT_BG = {
  [AlertLevel.None]: '',
  [AlertLevel.Warning]: 'bg-amber-50 border-amber-200',
  [AlertLevel.Urgent]: 'bg-red-50 border-red-200 animate-pulse',
}

export function StatusDisplay({ status, alertLevel }: StatusDisplayProps) {
  const alertText = ALERT_TEXT[alertLevel]

  return (
    <div className="flex flex-col items-center gap-6">
      {alertText && (
        <div className={`w-full text-center py-3 px-4 rounded-xl border text-lg font-semibold ${ALERT_BG[alertLevel]}`}>
          {alertLevel === AlertLevel.Urgent ? '⚠️ ' : '💊 '}{alertText}
        </div>
      )}

      <div className="relative">
        <RingProgress
          remaining={status.remainingDoses}
          total={status.totalDoses}
          alertLevel={alertLevel}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-slate-800">
            {status.remainingDoses}
          </span>
          <span className="text-sm text-slate-500">
            剩余 / {status.totalDoses} 次
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center w-full">
        <div>
          <div className="text-2xl font-semibold text-slate-700">{status.usedDoses}</div>
          <div className="text-xs text-slate-400">已用次数</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-700">{status.currentDailyDoses}</div>
          <div className="text-xs text-slate-400">每日次数</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-slate-700">{status.remainingDays}</div>
          <div className="text-xs text-slate-400">剩余天数</div>
        </div>
      </div>

      <div className="text-sm text-slate-500">
        预计 <span className="font-medium text-slate-700">{status.estimatedEndDate}</span> 用完
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/StatusDisplay.tsx
git commit -m "feat: add StatusDisplay component with ring progress and stats"
```

---

### Task 9: 操作区组件 — 弹窗 + 按钮

**Files:**
- Create: `src/components/ActionButtons.tsx`
- Create: `src/components/Modal.tsx`

**Step 1: 实现通用 Modal**

```tsx
// src/components/Modal.tsx
import { type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-80 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
```

**Step 2: 实现操作区**

```tsx
// src/components/ActionButtons.tsx
import { useState } from 'react'
import { Modal } from './Modal'

interface ActionButtonsProps {
  hasCartridge: boolean
  currentDailyDoses: number
  onNewCartridge: (totalDoses: number, dailyDoses: number) => void
  onAdjustRemaining: (remaining: number) => void
  onChangeDailyDoses: (dailyDoses: number) => void
}

export function ActionButtons({
  hasCartridge,
  currentDailyDoses,
  onNewCartridge,
  onAdjustRemaining,
  onChangeDailyDoses,
}: ActionButtonsProps) {
  const [modal, setModal] = useState<'new' | 'adjust' | 'daily' | null>(null)
  const [totalInput, setTotalInput] = useState('60')
  const [dailyInput, setDailyInput] = useState('3')
  const [remainingInput, setRemainingInput] = useState('')
  const [newDailyInput, setNewDailyInput] = useState('')

  const close = () => setModal(null)

  return (
    <>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => { setTotalInput('60'); setDailyInput(String(currentDailyDoses || 3)); setModal('new') }}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
        >
          开新药
        </button>

        {hasCartridge && (
          <>
            <button
              onClick={() => { setRemainingInput(''); setModal('adjust') }}
              className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
            >
              修正剩余次数
            </button>
            <button
              onClick={() => { setNewDailyInput(String(currentDailyDoses)); setModal('daily') }}
              className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
            >
              调整每日次数
            </button>
          </>
        )}
      </div>

      <Modal open={modal === 'new'} onClose={close} title="开新药">
        <div className="flex flex-col gap-3">
          <label className="text-sm text-slate-600">
            总次数
            <input type="number" value={totalInput} onChange={e => setTotalInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          </label>
          <label className="text-sm text-slate-600">
            每日次数
            <input type="number" value={dailyInput} onChange={e => setDailyInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          </label>
          <button onClick={() => { onNewCartridge(Number(totalInput), Number(dailyInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'adjust'} onClose={close} title="修正剩余次数">
        <div className="flex flex-col gap-3">
          <input type="number" placeholder="输入当前剩余次数" value={remainingInput}
            onChange={e => setRemainingInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          <button onClick={() => { onAdjustRemaining(Number(remainingInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'daily'} onClose={close} title="调整每日次数">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">从今天起生效</p>
          <input type="number" value={newDailyInput}
            onChange={e => setNewDailyInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          <button onClick={() => { onChangeDailyDoses(Number(newDailyInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>
    </>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Modal.tsx src/components/ActionButtons.tsx
git commit -m "feat: add Modal and ActionButtons components for user operations"
```

---

### Task 10: 历史记录组件

**Files:**
- Create: `src/components/History.tsx`

**Step 1: 实现折叠面板**

```tsx
// src/components/History.tsx
import { useState } from 'react'
import type { Cartridge } from '../types'

interface HistoryProps {
  history: Cartridge[]
}

export function History({ history }: HistoryProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left text-sm text-slate-500 py-2 flex items-center gap-1"
      >
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
        历史记录（{history.length} 支）
      </button>
      {open && (
        <div className="flex flex-col gap-2 mt-1">
          {[...history].reverse().map(c => (
            <div key={c.id} className="bg-white rounded-lg p-3 border border-slate-100 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>{c.startDate} ~ {c.endDate ?? '?'}</span>
                <span>{c.totalDoses} 次</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/History.tsx
git commit -m "feat: add collapsible History component"
```

---

### Task 11: 组装主页面

**Files:**
- Modify: `src/App.tsx`

**Step 1: 整合所有组件**

```tsx
// src/App.tsx
import { useAppState } from './hooks/useAppState'
import { calculateDoseStatus } from './lib/dose-calculator'
import { getAlertLevel } from './lib/alert-level'
import { StatusDisplay } from './components/StatusDisplay'
import { ActionButtons } from './components/ActionButtons'
import { History } from './components/History'

function App() {
  const { state, startNewCartridge, adjustRemainingDoses, changeDailyDoses } = useAppState()
  const today = new Date().toISOString().split('T')[0]

  const status = state.currentCartridge
    ? calculateDoseStatus(state.currentCartridge, today)
    : null

  const alertLevel = status
    ? getAlertLevel(status.remainingDoses, status.currentDailyDoses)
    : null

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      <div className="w-full max-w-sm px-4 py-8 flex flex-col items-center gap-8">
        <h1 className="text-xl font-bold text-slate-800">用药提醒</h1>

        {status && alertLevel !== null ? (
          <StatusDisplay status={status} alertLevel={alertLevel} />
        ) : (
          <div className="text-center text-slate-400 py-16">
            <p className="text-lg mb-2">还没有正在使用的药剂</p>
            <p className="text-sm">点击下方"开新药"开始记录</p>
          </div>
        )}

        <ActionButtons
          hasCartridge={!!state.currentCartridge}
          currentDailyDoses={status?.currentDailyDoses ?? 3}
          onNewCartridge={startNewCartridge}
          onAdjustRemaining={adjustRemainingDoses}
          onChangeDailyDoses={changeDailyDoses}
        />

        <History history={state.history} />
      </div>
    </div>
  )
}

export default App
```

**Step 2: 运行开发服务器，手动验证**

```bash
npm run dev
```

验证清单:
- [ ] 首次打开显示"还没有正在使用的药剂"
- [ ] 点击"开新药"弹出弹窗，默认 60 次
- [ ] 确认后显示环形进度条和剩余信息
- [ ] "修正次数"和"调整每日次数"正常工作
- [ ] 刷新页面后数据不丢失

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble main page with all components"
```

---

### Task 12: Web Notifications 提醒

**Files:**
- Create: `src/lib/notification.ts`

**Step 1: 实现通知功能**

```typescript
// src/lib/notification.ts
import { AlertLevel } from './alert-level'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(alertLevel: AlertLevel): void {
  if (Notification.permission !== 'granted') return

  if (alertLevel === AlertLevel.Warning) {
    new Notification('用药提醒 💊', {
      body: '药剂快用完了，该准备新药了',
      icon: '/favicon.ico',
    })
  } else if (alertLevel === AlertLevel.Urgent) {
    new Notification('用药提醒 ⚠️', {
      body: '药剂明天就用完了！请尽快更换',
      icon: '/favicon.ico',
    })
  }
}
```

**Step 2: 在 App.tsx 中集成通知**

在 `App.tsx` 中添加 `useEffect`，页面加载时检查提醒级别并发送通知：

```typescript
import { useEffect } from 'react'
import { requestNotificationPermission, sendNotification } from './lib/notification'

// 在 App 组件内部添加:
useEffect(() => {
  if (alertLevel && alertLevel !== AlertLevel.None) {
    requestNotificationPermission().then(granted => {
      if (granted) sendNotification(alertLevel)
    })
  }
}, [alertLevel])
```

**Step 3: Commit**

```bash
git add src/lib/notification.ts src/App.tsx
git commit -m "feat: add Web Notifications for warning and urgent alerts"
```

---

### Task 13: 全量测试 + 最终验证

**Step 1: 运行所有测试**

```bash
npx vitest run
```

Expected: 全部 PASS

**Step 2: 构建生产版本**

```bash
npm run build
```

Expected: 无错误

**Step 3: 预览生产版本**

```bash
npm run preview
```

手动验证完整流程。

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup and production build verification"
```
