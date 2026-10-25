import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import { Button, OptionButton, cx } from '../../components/ui'

const TYPING_MS = 550

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
export default function ChatWizard({ steps, ctx, accent, closing, onFinish, onClose }) {
  const answersRef = useRef({})
  const [messages, setMessages] = useState([])
  const [current, setCurrent] = useState(() => nextIndex(steps, 0, {}, ctx))
  const [typing, setTyping] = useState(true)
  const [finished, setFinished] = useState(false)
  const endRef = useRef(null)

  const push = (from, text) =>
    setMessages((m) => [...m, { id: `${Date.now()}-${m.length}`, from, text }])

  // Bot "types", then asks the current question.
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

  // Closing message after the last answer.
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

  useEffect(() => {
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
  const showInput = !typing && step

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cx('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cx(
                'max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-3 text-[15px] leading-relaxed',
                m.from === 'me'
                  ? cx('rounded-br-lg font-medium', accent.solid)
                  : 'rounded-bl-lg bg-white/90 backdrop-blur-md dark:bg-zinc-800/90'
              )}
            >
              {m.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {typing && <TypingDots />}

      <AnimatePresence mode="wait">
        {showInput && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="mt-2"
          >
            <StepInput step={step} answer={answer} ctx={ctx} answers={answersRef.current} accent={accent} />
          </motion.div>
        )}
        {finished && !typing && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex justify-center"
          >
            <Button onClick={onClose} className="w-full">
              <Sparkles className="size-4" /> All set
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={endRef} className="h-1" />
    </div>
  )
}

function StepInput({ step, answer, ctx, answers, accent }) {
  if (step.type === 'custom') return step.render({ answer, ctx, answers })
  if (step.type === 'choice') {
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          {step.options.map((o) => (
            <OptionButton
              key={String(o.value)}
              emoji={o.emoji}
              label={o.label}
              onClick={() => answer(o.value, `${o.emoji ? o.emoji + ' ' : ''}${o.label}`)}
            />
          ))}
        </div>
        {step.skippable && <SkipButton label={step.skipLabel} onClick={() => answer(null, step.skipLabel ?? 'Skip for now')} />}
      </div>
    )
  }
  return <TextReply step={step} answer={answer} accent={accent} />
}

function TextReply({ step, answer, accent }) {
  const [value, setValue] = useState('')
  const submit = () => {
    const v = value.trim()
    if (v) answer(v, v)
  }
  const Field = step.multiline ? 'textarea' : 'input'
  return (
    <div className="flex flex-col gap-2">
      {step.chips?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => answer(c, c)}
              className={cx('min-h-10 rounded-full px-4 py-2 text-sm font-medium transition active:scale-95', accent.soft)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <div
        className={cx(
          'flex items-end gap-2 rounded-3xl border border-zinc-900/[0.08] bg-white p-2 pl-4 ring-4 ring-transparent transition',
          'dark:border-white/10 dark:bg-zinc-900',
          accent.ring
        )}
      >
        <Field
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (!step.multiline || e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              submit()
            }
          }}
          rows={step.multiline ? 3 : undefined}
          placeholder={step.placeholder}
          enterKeyHint="send"
          className="max-h-48 min-h-10 flex-1 resize-none bg-transparent py-2 text-base outline-none placeholder:text-zinc-400"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          aria-label="Send"
          className={cx('grid size-10 shrink-0 place-items-center rounded-full transition active:scale-90 disabled:opacity-30', accent.solid)}
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </div>
      {step.skippable && <SkipButton label={step.skipLabel} onClick={() => answer(null, step.skipLabel ?? 'Skip for now')} />}
    </div>
  )
}

function SkipButton({ label = 'Skip for now', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 self-center rounded-full px-4 py-2 text-sm font-medium text-zinc-500 transition active:scale-95 dark:text-zinc-400"
    >
      {label}
    </button>
  )
}

function TypingDots() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
      <div className="flex gap-1 rounded-3xl rounded-bl-lg bg-white/90 px-4 py-4 backdrop-blur-md dark:bg-zinc-800/90">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-2 rounded-full bg-zinc-400"
            animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}
