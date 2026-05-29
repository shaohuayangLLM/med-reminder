import { useEffect, useState, useCallback } from 'react'
import { useAppState } from './hooks/useAppState'
import { calculateDoseStatus } from './lib/dose-calculator'
import { getAlertLevel, AlertLevel } from './lib/alert-level'
import { requestNotificationPermission, sendNotification } from './lib/notification'
import { StatusDisplay } from './components/StatusDisplay'
import { ActionButtons } from './components/ActionButtons'
import { RecordTabs } from './components/RecordTabs'

function App() {
  const { state, startNewCartridge, adjustRemainingDoses, changeDailyDoses, deleteHistory } = useAppState()
  const today = new Date().toISOString().split('T')[0]

  const status = state.currentCartridge
    ? calculateDoseStatus(state.currentCartridge, today)
    : null

  const alertLevel = status
    ? getAlertLevel(status.remainingDoses, status.currentDailyDoses)
    : null

  const [toast, setToast] = useState<string | null>(null)

  const handleChangeDailyDoses = useCallback((dailyDoses: number, effectiveDate?: string) => {
    const before = status
    changeDailyDoses(dailyDoses, effectiveDate)
    if (before) {
      const msg = `每日 ${before.currentDailyDoses}→${dailyDoses} 次 · 可用 ${before.remainingDays}→${Math.floor(before.remainingDoses / dailyDoses)} 天`
      setToast(msg)
    }
  }, [changeDailyDoses, status])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (alertLevel && alertLevel !== AlertLevel.None) {
      requestNotificationPermission().then(granted => {
        if (granted) sendNotification(alertLevel)
      })
    }
  }, [alertLevel])

  return (
    <div className="min-h-screen bg-white flex justify-center safe-area-top safe-area-bottom">
      {/* Toast */}
      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-black/90 text-white text-[14px] font-medium tracking-[-0.2px] shadow-lg animate-[fadeInUp_0.25s_ease-out]">
          {toast}
        </div>
      )}
      <div className="w-full max-w-[393px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-center h-11 shrink-0">
          <span className="text-[17px] font-semibold tracking-[-0.4px]">
            用药提醒
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 flex flex-col">
          {status && alertLevel !== null ? (
            <StatusDisplay status={status} alertLevel={alertLevel} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-[46px] h-[46px] bg-black rounded-full flex items-center justify-center mb-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-2h2V7h-2v7z" fill="none"/>
                  <text x="12" y="17" textAnchor="middle" fontSize="14" fill="white" fontWeight="600">Rx</text>
                </svg>
              </div>
              <p className="text-[17px] font-semibold tracking-[-0.4px] mb-1">
                还没有正在使用的药剂
              </p>
              <p className="text-[15px] text-[rgba(60,60,67,0.6)]">
                点击下方「开新药」开始记录
              </p>
            </div>
          )}
        </div>

        {/* Actions + History */}
        <div className="px-4 pb-6 flex flex-col gap-3">
          <ActionButtons
            hasCartridge={!!state.currentCartridge}
            currentDailyDoses={status?.currentDailyDoses ?? 3}
            onNewCartridge={startNewCartridge}
            onAdjustRemaining={adjustRemainingDoses}
            onChangeDailyDoses={handleChangeDailyDoses}
          />
          <RecordTabs
            logs={state.operationLogs ?? []}
            history={state.history}
            onDeleteHistory={deleteHistory}
          />
        </div>
      </div>
    </div>
  )
}

export default App
