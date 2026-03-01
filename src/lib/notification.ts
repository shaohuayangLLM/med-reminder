import { AlertLevel } from './alert-level'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function sendNotification(alertLevel: AlertLevel): void {
  if (Notification.permission !== 'granted') return

  if (alertLevel === AlertLevel.Warning) {
    new Notification('用药提醒 💊', {
      body: '药剂快用完了，该准备新药了',
    })
  } else if (alertLevel === AlertLevel.Urgent) {
    new Notification('用药提醒 ⚠️', {
      body: '药剂明天就用完了！请尽快更换',
    })
  }
}
