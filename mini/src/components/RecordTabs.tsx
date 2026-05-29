import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
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

  const safeLogs = logs ?? []
  const hasLogs = safeLogs.length > 0
  const hasHistory = history.length > 0

  // Always show if there's any data or a current cartridge to export

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条开药记录吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) onDeleteHistory(id)
      },
    })
  }

  const handleExport = () => {
    const json = exportState()
    Taro.setClipboardData({
      data: json,
      success: () => Taro.showToast({ title: '已复制到剪贴板', icon: 'none' }),
      fail: () => Taro.showToast({ title: '复制失败', icon: 'none' }),
    })
  }

  const tabStyle = (active: boolean) => ({
    fontSize: '13px',
    fontWeight: '500',
    letterSpacing: '-0.1px',
    padding: '6px 0',
    color: active ? '#000' : 'rgba(60,60,67,0.35)',
    transition: 'color 0.2s',
  })

  return (
    <View style={{ width: '100%' }}>
      {/* Tab bar */}
      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: '8px' }}>
        <View onClick={() => setTab('logs')} style={{ ...tabStyle(tab === 'logs'), marginRight: '16px' }}>
          <Text style={{ color: tab === 'logs' ? '#000' : 'rgba(60,60,67,0.35)', fontSize: '13px', fontWeight: '500' }}>
            操作记录{hasLogs ? `（${safeLogs.length}）` : ''}
          </Text>
        </View>
        <View onClick={() => setTab('history')} style={tabStyle(tab === 'history')}>
          <Text style={{ color: tab === 'history' ? '#000' : 'rgba(60,60,67,0.35)', fontSize: '13px', fontWeight: '500' }}>
            开药记录{hasHistory ? `（${history.length}）` : ''}
          </Text>
        </View>
        <View onClick={handleExport} style={{ marginLeft: 'auto', padding: '6px' }}>
          <Text style={{ fontSize: '18px', color: 'rgba(60,60,67,0.35)' }}>↓</Text>
        </View>
      </View>

      {/* Tab content */}
      {tab === 'logs' && (
        hasLogs ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '108px', maxHeight: '108px', overflowY: 'auto' }}>
            {[...safeLogs].reverse().map((log, i) => (
              <View
                key={`${log.timestamp}-${i}`}
                style={{
                  backgroundColor: '#f6f6f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '12px',
                }}
              >
                <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.4)', letterSpacing: '-0.1px', flexShrink: 0 }}>
                  {formatTime(log.timestamp)}
                </Text>
                <Text style={{ fontSize: '14px', color: '#000', fontWeight: '500', letterSpacing: '-0.2px', flexShrink: 0 }}>
                  {log.action}
                </Text>
                <Text style={{ fontSize: '14px', color: 'rgba(60,60,67,0.6)', letterSpacing: '-0.2px' }}>
                  {log.detail}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ textAlign: 'center', minHeight: '108px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '14px', color: 'rgba(60,60,67,0.3)' }}>暂无操作记录</Text>
          </View>
        )
      )}

      {tab === 'history' && (
        hasHistory ? (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '108px', maxHeight: '108px', overflowY: 'auto' }}>
            {[...history].reverse().map(c => (
              <View
                key={c.id}
                style={{
                  backgroundColor: '#f6f6f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '15px', letterSpacing: '-0.2px', color: '#000' }}>
                    {c.startDate} ~ {c.endDate ?? '?'}
                  </Text>
                  <Text style={{ fontSize: '15px', color: 'rgba(60,60,67,0.6)', marginLeft: '8px' }}>
                    {c.totalDoses} 次
                  </Text>
                </View>
                <View
                  onClick={() => handleDelete(c.id)}
                  style={{
                    marginLeft: '8px',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: '16px', color: 'rgba(60,60,67,0.3)' }}>···</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ textAlign: 'center', minHeight: '108px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '14px', color: 'rgba(60,60,67,0.3)' }}>暂无开药记录</Text>
          </View>
        )
      )}

    </View>
  )
}
