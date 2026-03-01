import { type ReactNode } from 'react'
import { View, Text } from '@tarojs/components'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <View
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
      }} />

      {/* Sheet */}
      <View
        style={{
          position: 'relative',
          backgroundColor: '#fff',
          width: '100%',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          padding: '24px',
          paddingBottom: '32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <View style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <View style={{
            width: '36px',
            height: '4px',
            borderRadius: '2px',
            backgroundColor: 'rgba(60,60,67,0.3)',
          }} />
        </View>

        <Text style={{
          fontSize: '20px',
          fontWeight: '600',
          letterSpacing: '-0.4px',
          color: '#000',
          marginBottom: '20px',
          display: 'block',
        }}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  )
}
