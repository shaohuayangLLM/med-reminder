import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Cartridge } from '../types'

interface HistoryProps {
  history: Cartridge[]
  onDelete: (id: string) => void
}

export function History({ history, onDelete }: HistoryProps) {
  const [open, setOpen] = useState(false)

  if (history.length === 0) return null

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          onDelete(id)
        }
      },
    })
  }

  return (
    <View style={{ width: '100%' }}>
      <View
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          fontSize: '15px',
          color: 'rgba(60,60,67,0.6)',
          letterSpacing: '-0.2px',
          padding: '8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Text style={{
          fontSize: '10px',
          display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>
          ▶
        </Text>
        <Text>历史记录（{history.length} 支）</Text>
      </View>

      {open && (
        <View style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
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
      )}
    </View>
  )
}
