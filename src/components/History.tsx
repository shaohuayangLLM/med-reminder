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
