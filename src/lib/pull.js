import { useRef, useState } from 'react'

// Same feel as TARTAR's pull.hook: half-speed drag, ready at 64px, capped at 96px.
const READY = 64
const MAX = 96
const RESISTANCE = 0.5
export const REFRESHING_HEIGHT = 52

/**
 * Pull-to-refresh for a scroll container. Spread `handlers` onto the element that scrolls.
 * onRefresh may return a promise; the spinner stays at least `minMs` so the refresh is visible.
 */
export function usePullToRefresh(onRefresh, minMs = 700) {
  const startY = useRef(null)
  const [distance, setDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const end = async () => {
    if (startY.current === null) return
    startY.current = null
    const ready = distance >= READY
    setDistance(0)
    if (!ready) return
    setRefreshing(true)
    navigator.vibrate?.(10)
    await Promise.all([Promise.resolve(onRefresh()), new Promise((r) => setTimeout(r, minMs))])
    setRefreshing(false)
  }

  const handlers = {
    onTouchStart: (e) => {
      if (e.currentTarget.scrollTop > 0 || refreshing) return
      startY.current = e.touches[0]?.clientY ?? null
    },
    onTouchMove: (e) => {
      if (startY.current === null) return
      const pulled = (e.touches[0]?.clientY ?? startY.current) - startY.current
      setDistance(Math.min(Math.max(0, pulled * RESISTANCE), MAX))
    },
    onTouchEnd: end,
    onTouchCancel: end,
  }

  return {
    handlers,
    height: refreshing ? REFRESHING_HEIGHT : distance,
    rotation: (distance / READY) * 360,
    ready: distance >= READY,
    refreshing,
    visible: refreshing || distance > 0,
  }
}
