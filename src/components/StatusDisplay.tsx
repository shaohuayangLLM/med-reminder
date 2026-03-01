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
          {alertLevel === AlertLevel.Urgent ? '\u26A0\uFE0F ' : '\uD83D\uDC8A '}{alertText}
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
