import { useEffect, useState } from 'react'

/** morning 06:00–11:59 · afternoon 12:00–16:59 · evening 17:00–05:59 */
export function getPeriod(date = new Date()) {
  const h = new Date(date).getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 17) return 'afternoon'
  return 'evening'
}

/** A "day" runs 06:00 → 05:59, so a 1 AM brain dump still belongs to that evening. */
export function dayKey(date = new Date()) {
  const d = new Date(date)
  if (d.getHours() < 6) d.setDate(d.getDate() - 1)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function formatDuration(ms) {
  const mins = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDay(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatLongDate(ts) {
  return new Date(ts).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Re-renders every `interval` ms so time-of-day UI stays current while the app is open. */
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, interval)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [interval])
  return now
}
