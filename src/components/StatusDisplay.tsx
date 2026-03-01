import type { DoseStatus } from '../lib/dose-calculator'
import { AlertLevel } from '../lib/alert-level'
import { RingProgress } from './RingProgress'

interface StatusDisplayProps {
  status: DoseStatus
  alertLevel: AlertLevel
}

const ALERT_CONFIG = {
  [AlertLevel.None]: null,
  [AlertLevel.Warning]: {
    text: '该准备新药了',
    bg: 'bg-[#FFF8F0]',
    border: 'border-[#FFE0B2]',
    textColor: 'text-[#E65100]',
  },
  [AlertLevel.Urgent]: {
    text: '明天就用完了！',
    bg: 'bg-[#FFF0F0]',
    border: 'border-[#FFCDD2]',
    textColor: 'text-[#C62828]',
  },
}

export function StatusDisplay({ status, alertLevel }: StatusDisplayProps) {
  const alert = ALERT_CONFIG[alertLevel]

  return (
    <div className="flex-1 flex flex-col items-center pt-6 gap-5">
      {/* Alert banner */}
      {alert && (
        <div className={`w-full text-center py-3 px-4 rounded-[14px] border ${alert.bg} ${alert.border}`}>
          <span className={`text-[15px] font-semibold tracking-[-0.4px] ${alert.textColor}`}>
            {alert.text}
          </span>
        </div>
      )}

      {/* Ring + center text */}
      <div className="relative my-2">
        <RingProgress
          remaining={status.remainingDoses}
          total={status.totalDoses}
          alertLevel={alertLevel}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[48px] font-bold tracking-[-1px] leading-none text-black">
            {status.remainingDoses}
          </span>
          <span className="text-[13px] text-[rgba(60,60,67,0.6)] mt-1 tracking-[-0.1px]">
            剩余 / {status.totalDoses} 次
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="bg-[#f6f6f6] rounded-[14px] py-4 px-2 text-center">
          <div className="text-[22px] font-semibold tracking-[-0.4px] text-black">{status.usedDoses}</div>
          <div className="text-[13px] text-[rgba(60,60,67,0.6)] mt-0.5">已用</div>
        </div>
        <div className="bg-[#f6f6f6] rounded-[14px] py-4 px-2 text-center">
          <div className="text-[22px] font-semibold tracking-[-0.4px] text-black">{status.currentDailyDoses}</div>
          <div className="text-[13px] text-[rgba(60,60,67,0.6)] mt-0.5">每日</div>
        </div>
        <div className="bg-[#f6f6f6] rounded-[14px] py-4 px-2 text-center">
          <div className="text-[22px] font-semibold tracking-[-0.4px] text-black">{status.remainingDays}</div>
          <div className="text-[13px] text-[rgba(60,60,67,0.6)] mt-0.5">剩余天</div>
        </div>
      </div>

      {/* Estimated end */}
      <div className="text-[15px] text-[rgba(60,60,67,0.6)] tracking-[-0.2px]">
        预计 <span className="font-medium text-black">{status.estimatedEndDate}</span> 用完
      </div>
    </div>
  )
}
