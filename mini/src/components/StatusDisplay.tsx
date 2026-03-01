import { View, Text } from '@tarojs/components'
import type { DoseStatus } from '../lib/dose-calculator'
import { AlertLevel } from '../lib/alert-level'
import { RingProgress } from './RingProgress'

interface StatusDisplayProps {
  status: DoseStatus
  alertLevel: AlertLevel
}

const ALERT_CONFIG = {
  [AlertLevel.None]: null,
  [AlertLevel.Warning]: {
    text: '该准备新药了',
    bgColor: '#FFF8F0',
    borderColor: '#FFE0B2',
    textColor: '#E65100',
  },
  [AlertLevel.Urgent]: {
    text: '明天就用完了！',
    bgColor: '#FFF0F0',
    borderColor: '#FFCDD2',
    textColor: '#C62828',
  },
}

export function StatusDisplay({ status, alertLevel }: StatusDisplayProps) {
  const alert = ALERT_CONFIG[alertLevel]

  return (
    <View style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px', gap: '20px' }}>
      {/* Alert banner */}
      {alert && (
        <View style={{
          width: '100%',
          textAlign: 'center',
          padding: '12px 16px',
          borderRadius: '14px',
          border: `1px solid ${alert.borderColor}`,
          backgroundColor: alert.bgColor,
        }}>
          <Text style={{
            fontSize: '15px',
            fontWeight: '600',
            letterSpacing: '-0.4px',
            color: alert.textColor,
          }}>
            {alert.text}
          </Text>
        </View>
      )}

      {/* Ring + center text */}
      <View style={{ position: 'relative', margin: '8px 0' }}>
        <RingProgress
          remaining={status.remainingDoses}
          total={status.totalDoses}
          alertLevel={alertLevel}
        />
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text style={{
            fontSize: '48px',
            fontWeight: 'bold',
            letterSpacing: '-1px',
            lineHeight: 1,
            color: '#000',
          }}>
            {status.remainingDoses}
          </Text>
          <Text style={{
            fontSize: '13px',
            color: 'rgba(60,60,67,0.6)',
            marginTop: '4px',
            letterSpacing: '-0.1px',
          }}>
            剩余 / {status.totalDoses} 次
          </Text>
        </View>
      </View>

      {/* Stats cards */}
      <View style={{ display: 'flex', flexDirection: 'row', gap: '12px', width: '100%' }}>
        <View style={{
          flex: 1,
          backgroundColor: '#f6f6f6',
          borderRadius: '14px',
          padding: '16px 8px',
          textAlign: 'center',
        }}>
          <Text style={{ fontSize: '22px', fontWeight: '600', color: '#000', display: 'block' }}>
            {status.usedDoses}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginTop: '2px', display: 'block' }}>
            已用
          </Text>
        </View>
        <View style={{
          flex: 1,
          backgroundColor: '#f6f6f6',
          borderRadius: '14px',
          padding: '16px 8px',
          textAlign: 'center',
        }}>
          <Text style={{ fontSize: '22px', fontWeight: '600', color: '#000', display: 'block' }}>
            {status.currentDailyDoses}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginTop: '2px', display: 'block' }}>
            每日
          </Text>
        </View>
        <View style={{
          flex: 1,
          backgroundColor: '#f6f6f6',
          borderRadius: '14px',
          padding: '16px 8px',
          textAlign: 'center',
        }}>
          <Text style={{ fontSize: '22px', fontWeight: '600', color: '#000', display: 'block' }}>
            {status.remainingDays}
          </Text>
          <Text style={{ fontSize: '13px', color: 'rgba(60,60,67,0.6)', marginTop: '2px', display: 'block' }}>
            剩余天
          </Text>
        </View>
      </View>

      {/* Estimated end */}
      <View>
        <Text style={{ fontSize: '15px', color: 'rgba(60,60,67,0.6)', letterSpacing: '-0.2px' }}>
          预计 <Text style={{ fontWeight: '500', color: '#000' }}>{status.estimatedEndDate}</Text> 用完
        </Text>
      </View>
    </View>
  )
}
