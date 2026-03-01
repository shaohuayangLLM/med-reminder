import { useAppState } from './hooks/useAppState'
import { calculateDoseStatus } from './lib/dose-calculator'
import { getAlertLevel, AlertLevel } from './lib/alert-level'
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
            <p className="text-sm">点击下方「开新药」开始记录</p>
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
