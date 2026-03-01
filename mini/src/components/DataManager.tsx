import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { exportState } from '../lib/storage'

interface DataManagerProps {
  onImport: (json: string) => boolean
}

export function DataManager({ onImport }: DataManagerProps) {
  const [message, setMessage] = useState<string | null>(null)

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 2000)
  }

  const handleExport = () => {
    const json = exportState()
    Taro.setClipboardData({
      data: json,
      success: () => showMessage('已复制到剪贴板'),
      fail: () => showMessage('复制失败'),
    })
  }

  const handleImport = () => {
    Taro.getClipboardData({
      success: (res) => {
        if (!res.data) {
          showMessage('剪贴板为空')
          return
        }
        const ok = onImport(res.data)
        showMessage(ok ? '已恢复' : '数据格式错误')
      },
      fail: () => showMessage('读取剪贴板失败'),
    })
  }

  const btnStyle = {
    flex: 1,
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#f6f6f6',
    fontSize: '13px',
    color: 'rgba(60,60,67,0.6)',
    fontWeight: '500',
    letterSpacing: '-0.1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  }

  return (
    <View style={{ width: '100%' }}>
      <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
        <View style={btnStyle} onClick={handleExport}>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', fontWeight: '500' }}>导出数据</Text>
        </View>
        <View style={btnStyle} onClick={handleImport}>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', fontWeight: '500' }}>导入数据</Text>
        </View>
      </View>

      {message && (
        <View style={{ marginTop: '8px', textAlign: 'center' }}>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)' }}>{message}</Text>
        </View>
      )}
    </View>
  )
}
