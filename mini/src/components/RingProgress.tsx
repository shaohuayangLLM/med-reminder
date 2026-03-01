import { useEffect, useRef } from 'react'
import { Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AlertLevel } from '../lib/alert-level'

interface RingProgressProps {
  remaining: number
  total: number
  alertLevel: AlertLevel
}

const COLORS = {
  [AlertLevel.None]: { fg: '#000000', bg: 'rgba(0,0,0,0.06)' },
  [AlertLevel.Warning]: { fg: '#FF9500', bg: 'rgba(255,149,0,0.12)' },
  [AlertLevel.Urgent]: { fg: '#FF3B30', bg: 'rgba(255,59,48,0.12)' },
}

export function RingProgress({ remaining, total, alertLevel }: RingProgressProps) {
  const canvasId = 'ringProgress'
  const drawnRef = useRef(false)

  useEffect(() => {
    // Small delay to ensure canvas is ready
    const timer = setTimeout(() => {
      drawRing()
    }, 100)
    return () => clearTimeout(timer)
  }, [remaining, total, alertLevel])

  function drawRing() {
    const query = Taro.createSelectorQuery()
    query.select('#ringCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          // Fallback to old API
          drawRingLegacy()
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = Taro.getSystemInfoSync().pixelRatio
        const width = res[0].width
        const height = res[0].height

        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)

        drawOnContext(ctx, width, height)
      })
  }

  function drawRingLegacy() {
    const ctx = Taro.createCanvasContext(canvasId)
    const size = 200
    drawOnLegacyContext(ctx, size, size)
    ctx.draw()
  }

  function drawOnContext(ctx: any, width: number, height: number) {
    const { fg, bg } = COLORS[alertLevel]
    const center = width / 2
    const radius = center * 0.8
    const strokeWidth = 8
    const progress = total > 0 ? Math.max(0, remaining / total) : 0

    ctx.clearRect(0, 0, width, height)

    // Background ring
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.strokeStyle = bg
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.stroke()

    // Progress ring
    if (progress > 0) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * progress
      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.strokeStyle = fg
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  function drawOnLegacyContext(ctx: any, width: number, height: number) {
    const { fg, bg } = COLORS[alertLevel]
    const center = width / 2
    const radius = center * 0.8
    const strokeWidth = 8
    const progress = total > 0 ? Math.max(0, remaining / total) : 0

    // Background ring
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.setStrokeStyle(bg)
    ctx.setLineWidth(strokeWidth)
    ctx.setLineCap('round')
    ctx.stroke()

    // Progress ring
    if (progress > 0) {
      const startAngle = -Math.PI / 2
      const endAngle = startAngle + Math.PI * 2 * progress
      ctx.beginPath()
      ctx.arc(center, center, radius, startAngle, endAngle)
      ctx.setStrokeStyle(fg)
      ctx.setLineWidth(strokeWidth)
      ctx.setLineCap('round')
      ctx.stroke()
    }
  }

  return (
    <Canvas
      type='2d'
      id='ringCanvas'
      canvasId={canvasId}
      style={{ width: '200px', height: '200px' }}
    />
  )
}
