import { useState } from 'react'
import type { Cartridge } from '../types'

interface HistoryProps {
  history: Cartridge[]
  onDelete: (id: string) => void
}

export function History({ history, onDelete }: HistoryProps) {
  const [open, setOpen] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (history.length === 0) return null

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left text-[15px] text-[rgba(60,60,67,0.6)] tracking-[-0.2px] py-2 flex items-center gap-2"
      >
        <span
          className="text-[10px] transition-transform duration-200"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        历史记录（{history.length} 支）
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 mt-1">
          {[...history].reverse().map(c => (
            <div
              key={c.id}
              className="bg-[#f6f6f6] rounded-[14px] px-4 py-3 flex justify-between items-center"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[15px] tracking-[-0.2px] text-black">
                  {c.startDate} ~ {c.endDate ?? '?'}
                </span>
                <span className="text-[15px] text-[rgba(60,60,67,0.6)] ml-2">
                  {c.totalDoses} 次
                </span>
              </div>

              {confirmId === c.id ? (
                <div className="flex gap-2 shrink-0 ml-2">
                  <button
                    onClick={() => { onDelete(c.id); setConfirmId(null) }}
                    className="text-[13px] text-[#FF3B30] font-medium px-2 py-1 rounded-lg active:bg-[#FF3B30]/10"
                  >
                    删除
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-[13px] text-[rgba(60,60,67,0.6)] px-2 py-1 rounded-lg active:bg-black/5"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(c.id)}
                  className="shrink-0 ml-2 w-7 h-7 flex items-center justify-center rounded-full active:bg-black/5"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(60,60,67,0.3)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
