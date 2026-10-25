import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button, Chip, OptionButton, SheetField, cx } from '../../components/ui'

const TYPING_MS = 500

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
  const lastBot = [...messages].reverse().find((m) => m.from === 'bot')?.text ?? ''

  return (
    <div className="flex flex-col gap-2.5">
      {messages.map((m) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cx('flex', m.from === 'me' ? 'justify-end' : 'justify-start')}
        >
          <div
            className={cx(
              'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-line',
              m.from === 'me'
                ? 'rounded-br-md bg-primary font-medium text-primary-foreground'
                : 'rounded-bl-md bg-panel shadow-xs ring-1 ring-foreground/10'
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="mt-3"
          >
            <StepInput step={step} answer={answer} ctx={ctx} answers={answersRef.current} prompt={lastBot} />
          </motion.div>
        )}
        {finished && !typing && (
          <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <Button className="w-full" onClick={onClose}>
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
  const skip = step.skippable && (
    <button
      type="button"
      onClick={() => answer(null, step.skipLabel ?? 'Skip for now')}
      className="mx-auto mt-1 flex h-11 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground active:bg-muted"
    >
      {step.skipLabel ?? 'Skip for now'}
    </button>
  )

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
        {skip}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {step.chips?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {step.chips.map((c) => (
            <Chip key={c} onClick={() => answer(c, c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      <SheetField
        id={`chat-${step.id}`}
        label={prompt.split('\n').pop()}
        placeholder={step.placeholder}
        multiline={step.multiline}
        saveLabel="Send"
        clearAfter
        onCommit={(text) => answer(text, text)}
      />
      {skip}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl rounded-bl-md bg-panel px-3.5 py-3.5 shadow-xs ring-1 ring-foreground/10">
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
