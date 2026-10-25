import { useEffect, useState } from 'react'

export const PREFIX = 'lumen:'
export const DATA_KEYS = ['journal', 'tasks', 'sleep', 'settings']

export function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStore(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage full or blocked (private mode) — the app keeps working in memory.
  }
}

/** useState that mirrors itself into localStorage under `lumen:<key>`. */
export function useStoredState(key, initial) {
  const [state, setState] = useState(() =>
    readStore(key, typeof initial === 'function' ? initial() : initial)
  )
  useEffect(() => {
    writeStore(key, state)
  }, [key, state])
  return [state, setState]
}
