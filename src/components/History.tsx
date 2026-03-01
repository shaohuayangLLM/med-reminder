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
              <span className="text-[15px] tracking-[-0.2px] text-black">
                {c.startDate} ~ {c.endDate ?? '?'}
              </span>
              <span className="text-[15px] text-[rgba(60,60,67,0.6)]">
                {c.totalDoses} 次
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
