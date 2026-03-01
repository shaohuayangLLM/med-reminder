import { useState } from 'react'
import { Modal } from './Modal'

interface ActionButtonsProps {
  hasCartridge: boolean
  currentDailyDoses: number
  onNewCartridge: (totalDoses: number, dailyDoses: number) => void
  onAdjustRemaining: (remaining: number) => void
  onChangeDailyDoses: (dailyDoses: number) => void
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

  const close = () => setModal(null)

  return (
    <>
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => { setTotalInput('60'); setDailyInput(String(currentDailyDoses || 3)); setModal('new') }}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
        >
          开新药
        </button>

        {hasCartridge && (
          <>
            <button
              onClick={() => { setRemainingInput(''); setModal('adjust') }}
              className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
            >
              修正剩余次数
            </button>
            <button
              onClick={() => { setNewDailyInput(String(currentDailyDoses)); setModal('daily') }}
              className="w-full py-3 rounded-xl bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
            >
              调整每日次数
            </button>
          </>
        )}
      </div>

      <Modal open={modal === 'new'} onClose={close} title="开新药">
        <div className="flex flex-col gap-3">
          <label className="text-sm text-slate-600">
            总次数
            <input type="number" value={totalInput} onChange={e => setTotalInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          </label>
          <label className="text-sm text-slate-600">
            每日次数
            <input type="number" value={dailyInput} onChange={e => setDailyInput(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          </label>
          <button onClick={() => { onNewCartridge(Number(totalInput), Number(dailyInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'adjust'} onClose={close} title="修正剩余次数">
        <div className="flex flex-col gap-3">
          <input type="number" placeholder="输入当前剩余次数" value={remainingInput}
            onChange={e => setRemainingInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          <button onClick={() => { onAdjustRemaining(Number(remainingInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>

      <Modal open={modal === 'daily'} onClose={close} title="调整每日次数">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">从今天起生效</p>
          <input type="number" value={newDailyInput}
            onChange={e => setNewDailyInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg" />
          <button onClick={() => { onChangeDailyDoses(Number(newDailyInput)); close() }}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white font-semibold">
            确认
          </button>
        </div>
      </Modal>
    </>
  )
}
