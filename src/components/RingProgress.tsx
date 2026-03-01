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
