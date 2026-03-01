import { useRef, useState } from 'react'
import { exportState } from '../lib/storage'

interface DataManagerProps {
  onImport: (json: string) => boolean
}

export function DataManager({ onImport }: DataManagerProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleExport = () => {
    const json = exportState()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `用药记录-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    showMessage('已导出')
  }

  const handleImport = () => {
    fileRef.current?.click()
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const ok = onImport(reader.result as string)
      showMessage(ok ? '已恢复' : '文件格式错误')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2000)
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 h-10 rounded-xl bg-[#f6f6f6] text-[13px] text-[rgba(60,60,67,0.6)] font-medium tracking-[-0.1px] active:scale-[0.97] active:bg-[#ebebeb] transition-all"
        >
          导出数据
        </button>
        <button
          onClick={handleImport}
          className="flex-1 h-10 rounded-xl bg-[#f6f6f6] text-[13px] text-[rgba(60,60,67,0.6)] font-medium tracking-[-0.1px] active:scale-[0.97] active:bg-[#ebebeb] transition-all"
        >
          导入数据
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
      />

      {message && (
        <div className="mt-2 text-center text-[13px] text-[rgba(60,60,67,0.6)] animate-pulse">
          {message}
        </div>
      )}
    </div>
  )
}
