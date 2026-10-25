import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MicButton, { SoundWave } from '../../components/MicButton'
import { Button, Chip, GLASS, OptionButton, SheetField, cx } from '../../components/ui'
import { useSpeech } from '../../lib/speech'

const TYPING_MS = 500
const FLASH_MS = 180

function nextIndex(steps, from, answers, ctx) {
  for (let i = from; i < steps.length; i++) {
    const step = steps[i]
    if (!step.when || step.when(answers, ctx)) return i
  }
  return -1
}

const resolve = (v, answers, ctx) => (typeof v === 'function' ? v(answers, ctx) : v)

/**
 * Conversational one-question-at-a-time wizard.
 * Step shapes:
 *  { id, type: 'choice', prompt, options: [{ value, label, emoji }], skippable?, when?, onAnswer? }
 *  { id, type: 'text',   prompt, placeholder, chips?, multiline?, skippable?, skipLabel?, when?, onAnswer? }
 *  { id, type: 'custom', prompt, render: ({ answer, ctx, answers }) => JSX, when? }
 * onAnswer(value, ctx, answers) may return a replacement value to store.
 */
export default function ChatWizard({ steps, ctx, closing, onFinish, onClose }) {
  const answersRef = useRef({})
  const [messages, setMessages] = useState([])
  const [current, setCurrent] = useState(() => nextIndex(steps, 0, {}, ctx))
  const [typing, setTyping] = useState(true)
  const [finished, setFinished] = useState(false)
  const endRef = useRef(null)

  const push = (from, text) => setMessages((m) => [...m, { id: `${Date.now()}-${m.length}`, from, text }])

  useEffect(() => {
    if (current === -1) return
    setTyping(true)
    const step = steps[current]
    const t = setTimeout(() => {
      push('bot', resolve(step.prompt, answersRef.current, ctx))
      setTyping(false)
    }, TYPING_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  useEffect(() => {
    if (!finished) return
    setTyping(true)
    const t = setTimeout(() => {
      push('bot', closing(answersRef.current))
      setTyping(false)
    }, TYPING_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  // Follow the conversation once it is under way; on first open, stay at the top of the page.
  useEffect(() => {
    if (messages.length < 2 && !finished) return
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, typing, finished])

  const answer = (value, label) => {
    const step = steps[current]
    const replaced = step.onAnswer?.(value, ctx, answersRef.current)
    const stored = replaced === undefined ? value : replaced
    const next = { ...answersRef.current, [step.id]: stored }
    answersRef.current = next
    if (label) push('me', label)
    const ni = nextIndex(steps, current + 1, next, ctx)
    if (ni === -1) {
      setCurrent(-1)
      setFinished(true)
      onFinish(next)
    } else {
      setCurrent(ni)
    }
  }

  const step = current === -1 ? null : steps[current]
  const lastBot = [...messages].reverse().find((m) => m.from === 'bot')?.text ?? ''

  return (
    <div className="flex flex-col gap-2.5">
      {messages.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cx('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cx(
              'max-w-[85%] rounded-3xl px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line',
              m.from === 'me'
                ? 'rounded-br-lg bg-primary font-medium text-primary-foreground shadow-[var(--shadow-glow)]'
                : cx('rounded-bl-lg', GLASS)
            )}
          >
            {m.text}
          </div>
        </motion.div>
      ))}

      {typing && <TypingDots />}

      <AnimatePresence mode="wait">
        {!typing && step && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -48, transition: { duration: 0.22, ease: 'easeIn' } }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="mt-3"
          >
            <StepInput step={step} answer={answer} ctx={ctx} answers={answersRef.current} prompt={lastBot} />
          </motion.div>
        )}
        {finished && !typing && (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <Button size="lg" className="w-full" onClick={onClose}>
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} className="h-px" />
    </div>
  )
}

function StepInput({ step, answer, ctx, answers, prompt }) {
  const [picked, setPicked] = useState(null)
  const speech = useSpeech({ onFinal: (text) => answer(text, text) })

  // Light up the tapped answer for a beat before moving on, so the choice registers.
  const choose = (key, value, label) => {
    if (picked !== null) return
    setPicked(key)
    navigator.vibrate?.(6)
    setTimeout(() => answer(value, label), FLASH_MS)
  }

  const skip = step.skippable && (
    <button
      type="button"
      onClick={() => answer(null, step.skipLabel ?? 'Skip for now')}
      className="mx-auto mt-1 flex h-11 items-center rounded-full px-4 text-sm font-medium text-muted-foreground transition-all duration-300 ease-spring active:scale-[0.96]"
    >
      {step.skipLabel ?? 'Skip for now'}
    </button>
  )

  if (step.type === 'custom') return step.render({ answer, ctx, answers })

  if (step.type === 'choice') {
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {step.options.map((o) => {
            const key = String(o.value)
            return (
              <OptionButton
                key={key}
                emoji={o.emoji}
                label={o.label}
                selected={picked === key}
                onClick={() => choose(key, o.value, `${o.emoji ? o.emoji + ' ' : ''}${o.label}`)}
              />
            )
          })}
        </div>
        {skip}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {step.chips?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.chips.map((c) => (
            <Chip key={c} active={picked === c} onClick={() => choose(c, c, c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      {speech.listening && (
        <div className="flex justify-end">
          <div className="flex max-w-[85%] items-center gap-2.5 rounded-3xl rounded-br-lg border border-primary/40 bg-primary/15 px-4 py-3 text-[15px] text-foreground">
            <SoundWave />
            <span className={speech.interim ? '' : 'text-muted-foreground'}>{speech.interim || 'Listening…'}</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <SheetField
            id={`chat-${step.id}`}
            label={prompt.split('\n').pop()}
            placeholder={step.placeholder}
            multiline={step.multiline}
            saveLabel="Send"
            clearAfter
            onCommit={(text) => answer(text, text)}
          />
        </div>
        {speech.supported && <MicButton listening={speech.listening} onClick={speech.toggle} />}
      </div>
      {speech.error && <p className="px-2 text-sm text-muted-foreground">{speech.error}</p>}
      {skip}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className={cx('flex gap-1 rounded-3xl rounded-bl-lg px-4 py-4', GLASS)}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}
