import { useState } from 'react'
import type { Cartridge, OperationLog } from '../types'
import { exportState } from '../lib/storage'

interface RecordTabsProps {
  logs: OperationLog[]
  history: Cartridge[]
  onDeleteHistory: (id: string) => void
}

function formatTime(timestamp: string): string {
  const date = timestamp.slice(0, 10)
  const time = timestamp.slice(11, 16)
  return `${date} ${time}`
}

export function RecordTabs({ logs, history, onDeleteHistory }: RecordTabsProps) {
  const [tab, setTab] = useState<'logs' | 'history'>('logs')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [exportMsg, setExportMsg] = useState<string | null>(null)

  const safeLogs = logs ?? []
  const hasLogs = safeLogs.length > 0
  const hasHistory = history.length > 0

  // Always show if there's any data or a current cartridge to export

  const handleExport = () => {
    const json = exportState()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `用药记录-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMsg('已导出')
    setTimeout(() => setExportMsg(null), 2000)
  }

  return (
    <div className="w-full">
      {/* Tab bar - lightweight style */}
      <div className="flex items-center mb-2">
        <button
          onClick={() => setTab('logs')}
          className={`text-[13px] font-medium tracking-[-0.1px] py-1.5 transition-colors mr-4 ${
            tab === 'logs'
              ? 'text-black'
              : 'text-[rgba(60,60,67,0.35)]'
          }`}
        >
          操作记录{hasLogs ? `（${safeLogs.length}）` : ''}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`text-[13px] font-medium tracking-[-0.1px] py-1.5 transition-colors ${
            tab === 'history'
              ? 'text-black'
              : 'text-[rgba(60,60,67,0.35)]'
          }`}
        >
          开药记录{hasHistory ? `（${history.length}）` : ''}
        </button>
        <button
          onClick={handleExport}
          className="ml-auto p-1.5 active:scale-90 transition-transform"
          title="导出数据"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(60,60,67,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      </div>

      {/* Tab content */}
      {tab === 'logs' && (
        hasLogs ? (
          <div className="flex flex-col gap-1.5 min-h-[108px] max-h-[108px] overflow-y-auto scrollbar-none">
            {[...safeLogs].reverse().map((log, i) => (
              <div
                key={`${log.timestamp}-${i}`}
                className="bg-[#f6f6f6] rounded-[14px] px-4 py-3 flex items-baseline gap-3"
              >
                <span className="text-[13px] text-[rgba(60,60,67,0.4)] tracking-[-0.1px] shrink-0">
                  {formatTime(log.timestamp)}
                </span>
                <span className="text-[14px] text-black font-medium tracking-[-0.2px] shrink-0">
                  {log.action}
                </span>
                <span className="text-[14px] text-[rgba(60,60,67,0.6)] tracking-[-0.2px]">
                  {log.detail}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="min-h-[108px] flex items-center justify-center text-[14px] text-[rgba(60,60,67,0.3)]">
            暂无操作记录
          </div>
        )
      )}

      {tab === 'history' && (
        hasHistory ? (
          <div className="flex flex-col gap-1.5 min-h-[108px] max-h-[108px] overflow-y-auto scrollbar-none">
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
                      onClick={() => { onDeleteHistory(c.id); setConfirmId(null) }}
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
        ) : (
          <div className="min-h-[108px] flex items-center justify-center text-[14px] text-[rgba(60,60,67,0.3)]">
            暂无开药记录
          </div>
        )
      )}

    </div>
  )
}
