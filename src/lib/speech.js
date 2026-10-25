import { useEffect, useRef, useState } from 'react'

const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

/**
 * Speech-to-text with the browser's built-in recognizer (Safari on iOS, Chrome, Edge).
 * `onFinal(text)` fires once the person stops talking; `interim` shows the words as they come.
 */
export function useSpeech({ onFinal, lang } = {}) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const finalRef = useRef('')
  const onFinalRef = useRef(onFinal)
  onFinalRef.current = onFinal

  useEffect(() => () => recRef.current?.abort(), [])

  const start = () => {
    if (!Recognition || listening) return
    const rec = new Recognition()
    rec.lang = lang || navigator.language || 'en-US'
    rec.interimResults = true
    rec.continuous = false
    finalRef.current = ''
    setInterim('')
    setError(null)

    rec.onresult = (e) => {
      let live = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalRef.current += r[0].transcript
        else live += r[0].transcript
      }
      setInterim((finalRef.current + live).trim())
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') setError('Microphone access is off for this app.')
      else if (e.error !== 'aborted' && e.error !== 'no-speech') setError("Couldn't hear that. Try again.")
    }
    rec.onend = () => {
      setListening(false)
      const text = finalRef.current.trim()
      setInterim('')
      if (text) onFinalRef.current?.(text)
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
      navigator.vibrate?.(8)
    } catch {
      setListening(false)
    }
  }

  const stop = () => recRef.current?.stop()

  return { supported: !!Recognition, listening, interim, error, start, stop, toggle: () => (listening ? stop() : start()) }
}
