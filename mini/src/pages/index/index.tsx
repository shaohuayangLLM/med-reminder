import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import { useDidShow } from '@tarojs/taro'
import Taro from '@tarojs/taro'
import { useAppState } from '../../hooks/useAppState'
import { calculateDoseStatus } from '../../lib/dose-calculator'
import { getAlertLevel, AlertLevel } from '../../lib/alert-level'
import { StatusDisplay } from '../../components/StatusDisplay'
import { ActionButtons } from '../../components/ActionButtons'
import { History } from '../../components/History'
import { DataManager } from '../../components/DataManager'
import './index.scss'

export default function Index() {
  const { state, startNewCartridge, adjustRemainingDoses, changeDailyDoses, deleteHistory, importData } = useAppState()
  const [today, setToday] = useState(() => new Date().toISOString().split('T')[0])

  // Refresh date when page is shown (e.g., returning from background)
  useDidShow(() => {
    setToday(new Date().toISOString().split('T')[0])
  })

  const status = state.currentCartridge
    ? calculateDoseStatus(state.currentCartridge, today)
    : null

  const alertLevel = status
    ? getAlertLevel(status.remainingDoses, status.currentDailyDoses)
    : null

  // Show notification on page load if alert
  useDidShow(() => {
    if (alertLevel === AlertLevel.Warning) {
      Taro.showToast({
        title: '该准备新药了',
        icon: 'none',
        duration: 3000,
      })
    } else if (alertLevel === AlertLevel.Urgent) {
      Taro.showModal({
        title: '用药提醒',
        content: '药剂即将用完，请尽快换药！',
        showCancel: false,
        confirmText: '知道了',
      })
    }
  })

  return (
    <View className='index'>
      {/* Content */}
      <View style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        {status && alertLevel !== null ? (
          <StatusDisplay status={status} alertLevel={alertLevel} />
        ) : (
          <View style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <View style={{
              width: '46px',
              height: '46px',
              backgroundColor: '#000',
              borderRadius: '23px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <Text style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Rx</Text>
            </View>
            <Text style={{
              fontSize: '17px',
              fontWeight: '600',
              letterSpacing: '-0.4px',
              marginBottom: '4px',
            }}>
              还没有正在使用的药剂
            </Text>
            <Text style={{
              fontSize: '15px',
              color: 'rgba(60,60,67,0.6)',
            }}>
              点击下方「开新药」开始记录
            </Text>
          </View>
        )}
      </View>

      {/* Actions + History */}
      <View style={{
        padding: '0 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <ActionButtons
          hasCartridge={!!state.currentCartridge}
          currentDailyDoses={status?.currentDailyDoses ?? 3}
          onNewCartridge={startNewCartridge}
          onAdjustRemaining={adjustRemainingDoses}
          onChangeDailyDoses={changeDailyDoses}
        />
        <History history={state.history} onDelete={deleteHistory} />
        <DataManager onImport={importData} />
      </View>
    </View>
  )
}
