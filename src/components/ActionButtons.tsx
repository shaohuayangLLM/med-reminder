import { useState } from 'react'
import { Modal } from './Modal'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

interface ActionButtonsProps {
  hasCartridge: boolean
  currentDailyDoses: number
  onNewCartridge: (totalDoses: number, dailyDoses: number) => void
  onAdjustRemaining: (remaining: number) => void
  onChangeDailyDoses: (dailyDoses: number, effectiveDate?: string) => void
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
  const [effectiveDateInput, setEffectiveDateInput] = useState('')

  const close = () => setModal(null)

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <button
          onClick={() => { setTotalInput('60'); setDailyInput(String(currentDailyDoses || 3)); setModal('new') }}
          className="w-full h-[50px] rounded-[14px] bg-black text-white text-[17px] font-medium tracking-[-0.4px] active:scale-[0.97] transition-transform"
        >
          开新药
        </button>

        {hasCartridge && (
          <div className="flex gap-2">
            <button
              onClick={() => { setRemainingInput(''); setModal('adjust') }}
              className="flex-1 h-[50px] rounded-[14px] bg-[#f6f6f6] text-black text-[15px] font-medium tracking-[-0.4px] active:scale-[0.97] active:bg-[#ebebeb] transition-all"
            >
              修正次数
            </button>
            <button
              onClick={() => { setNewDailyInput(String(currentDailyDoses)); setEffectiveDateInput(todayStr()); setModal('daily') }}
              className="flex-1 h-[50px] rounded-[14px] bg-[#f6f6f6] text-black text-[15px] font-medium tracking-[-0.4px] active:scale-[0.97] active:bg-[#ebebeb] transition-all"
            >
              调整每日
            </button>
          </div>
        )}
      </div>

      <Modal open={modal === 'new'} onClose={close} title="开新药">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[rgba(60,60,67,0.6)] tracking-[-0.1px]">总次数</span>
            <input type="number" value={totalInput} onChange={e => setTotalInput(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#e5e5ea] px-4 text-[17px] tracking-[-0.4px] outline-none focus:border-black transition-colors" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[rgba(60,60,67,0.6)] tracking-[-0.1px]">每日次数</span>
            <input type="number" value={dailyInput} onChange={e => setDailyInput(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#e5e5ea] px-4 text-[17px] tracking-[-0.4px] outline-none focus:border-black transition-colors" />
          </label>
          <button onClick={() => { onNewCartridge(Number(totalInput), Number(dailyInput)); close() }}
            className="w-full h-[50px] rounded-[14px] bg-black text-white text-[17px] font-medium tracking-[-0.4px] active:scale-[0.97] transition-transform">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'adjust'} onClose={close} title="修正剩余次数">
        <div className="flex flex-col gap-4">
          <input type="number" placeholder="输入当前剩余次数" value={remainingInput}
            onChange={e => setRemainingInput(e.target.value)}
            className="w-full h-11 rounded-xl border border-[#e5e5ea] px-4 text-[17px] tracking-[-0.4px] outline-none focus:border-black transition-colors placeholder:text-[rgba(60,60,67,0.3)]" />
          <button onClick={() => { onAdjustRemaining(Number(remainingInput)); close() }}
            className="w-full h-[50px] rounded-[14px] bg-black text-white text-[17px] font-medium tracking-[-0.4px] active:scale-[0.97] transition-transform">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'daily'} onClose={close} title="调整每日次数">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[rgba(60,60,67,0.6)] tracking-[-0.1px]">每日次数</span>
            <input type="number" value={newDailyInput}
              onChange={e => setNewDailyInput(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#e5e5ea] px-4 text-[17px] tracking-[-0.4px] outline-none focus:border-black transition-colors" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] text-[rgba(60,60,67,0.6)] tracking-[-0.1px]">生效日期</span>
            <input type="date" value={effectiveDateInput}
              onChange={e => setEffectiveDateInput(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#e5e5ea] px-4 text-[17px] tracking-[-0.4px] outline-none focus:border-black transition-colors" />
          </label>
          <button onClick={() => { onChangeDailyDoses(Number(newDailyInput), effectiveDateInput); close() }}
            className="w-full h-[50px] rounded-[14px] bg-black text-white text-[17px] font-medium tracking-[-0.4px] active:scale-[0.97] transition-transform">
            确认
          </button>
        </div>
      </Modal>
    </>
  )
}
