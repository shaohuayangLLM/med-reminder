import { useState } from 'react'
import { View, Text, Input, Picker } from '@tarojs/components'
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

  const buttonStyle = {
    width: '100%',
    height: '50px',
    borderRadius: '14px',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '500',
    letterSpacing: '-0.4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    flex: 1,
    width: 'auto',
    backgroundColor: '#f6f6f6',
    color: '#000',
    fontSize: '15px',
  }

  const inputStyle = {
    width: '100%',
    height: '44px',
    borderRadius: '12px',
    border: '1px solid #e5e5ea',
    padding: '0 16px',
    fontSize: '17px',
    letterSpacing: '-0.4px',
  }

  const labelStyle = {
    fontSize: '13px',
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: '-0.1px',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <View>
      <View style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        <View
          style={buttonStyle}
          onClick={() => { setTotalInput('60'); setDailyInput(String(currentDailyDoses || 3)); setModal('new') }}
        >
          <Text style={{ color: '#fff', fontSize: '17px', fontWeight: '500' }}>开新药</Text>
        </View>

        {hasCartridge && (
          <View style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
            <View
              style={secondaryButtonStyle}
              onClick={() => { setRemainingInput(''); setModal('adjust') }}
            >
              <Text style={{ color: '#000', fontSize: '15px', fontWeight: '500' }}>修正次数</Text>
            </View>
            <View
              style={secondaryButtonStyle}
              onClick={() => { setNewDailyInput(String(currentDailyDoses)); setEffectiveDateInput(todayStr()); setModal('daily') }}
            >
              <Text style={{ color: '#000', fontSize: '15px', fontWeight: '500' }}>调整每日</Text>
            </View>
          </View>
        )}
      </View>

      {/* New cartridge modal */}
      <Modal open={modal === 'new'} onClose={close} title='开新药'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <View>
            <Text style={labelStyle}>总次数</Text>
            <Input
              type='number'
              value={totalInput}
              onInput={e => setTotalInput(e.detail.value)}
              style={inputStyle}
            />
          </View>
          <View>
            <Text style={labelStyle}>每日次数</Text>
            <Input
              type='number'
              value={dailyInput}
              onInput={e => setDailyInput(e.detail.value)}
              style={inputStyle}
            />
          </View>
          <View
            style={buttonStyle}
            onClick={() => { onNewCartridge(Number(totalInput), Number(dailyInput)); close() }}
          >
            <Text style={{ color: '#fff', fontSize: '17px', fontWeight: '500' }}>确认</Text>
          </View>
        </View>
      </Modal>

      {/* Adjust remaining modal */}
      <Modal open={modal === 'adjust'} onClose={close} title='修正剩余次数'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            type='number'
            placeholder='输入当前剩余次数'
            value={remainingInput}
            onInput={e => setRemainingInput(e.detail.value)}
            style={inputStyle}
          />
          <View
            style={buttonStyle}
            onClick={() => { onAdjustRemaining(Number(remainingInput)); close() }}
          >
            <Text style={{ color: '#fff', fontSize: '17px', fontWeight: '500' }}>确认</Text>
          </View>
        </View>
      </Modal>

      {/* Change daily doses modal */}
      <Modal open={modal === 'daily'} onClose={close} title='调整每日次数'>
        <View style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <View>
            <Text style={labelStyle}>每日次数</Text>
            <Input
              type='number'
              value={newDailyInput}
              onInput={e => setNewDailyInput(e.detail.value)}
              style={inputStyle}
            />
          </View>
          <View>
            <Text style={labelStyle}>生效日期</Text>
            <Picker
              mode='date'
              value={effectiveDateInput}
              onChange={e => setEffectiveDateInput(e.detail.value)}
            >
              <View style={{
                ...inputStyle,
                display: 'flex',
                alignItems: 'center',
                color: effectiveDateInput ? '#000' : 'rgba(60,60,67,0.3)',
              }}>
                <Text>{effectiveDateInput || '选择日期'}</Text>
              </View>
            </Picker>
          </View>
          <View
            style={buttonStyle}
            onClick={() => { onChangeDailyDoses(Number(newDailyInput), effectiveDateInput); close() }}
          >
            <Text style={{ color: '#fff', fontSize: '17px', fontWeight: '500' }}>确认</Text>
          </View>
        </View>
      </Modal>
    </View>
  )
}
