import { forwardRef, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Mic, X } from 'lucide-react'
import { useIsCoarse } from '../lib/keyboard'
import { useSpeech } from '../lib/speech'

export const cx = (...classes) => classes.filter(Boolean).join(' ')

/**
 * Render overlays on <body>. Glass cards use backdrop-filter, and any element with a filter becomes the
 * containing block for position:fixed children, which would trap sheets and toasts inside the card.
 */
export const OnBody = ({ children }) => createPortal(children, document.body)

/**
 * iOS only raises the keyboard when focus happens inside the tap itself. Call this from the click
 * handler that opens a sheet: a hidden input takes focus now, and the sheet's field takes it over
 * when it mounts, so the keyboard comes up together with the sheet.
 */
let keyboardProxy = null
export function primeKeyboard() {
  if (!window.matchMedia('(pointer: coarse)').matches) return
  if (!keyboardProxy) {
    keyboardProxy = document.createElement('input')
    keyboardProxy.setAttribute('aria-hidden', 'true')
    keyboardProxy.tabIndex = -1
    keyboardProxy.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;pointer-events:none;border:0;padding:0'
    // Disabled while idle so the keyboard's previous/next arrows never jump into it.
    keyboardProxy.disabled = true
    keyboardProxy.addEventListener('blur', () => (keyboardProxy.disabled = true))
    document.body.appendChild(keyboardProxy)
  }
  keyboardProxy.disabled = false
  keyboardProxy.focus({ preventScroll: true })
}

/* ---------- Glass system ---------- */

/** Frosted panel: main cards are rounded-3xl, sub-components rounded-2xl, chips rounded-full. */
export const GLASS =
  'border border-white/50 bg-white/70 shadow-[var(--shadow-glass),var(--shadow-glass-inner)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60'

/** Sub-surface glass (inputs, option tiles). */
export const GLASS_SUB =
  'border border-white/50 bg-white/60 shadow-[var(--shadow-glass-inner)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.06]'

/** Physical press: squeeze fast on touch, spring back on release. */
export const PRESS = 'transition-all duration-300 ease-spring active:scale-[0.96] active:duration-100 active:ease-out'

/* ---------- Surfaces (Moti card: rounded-xl panel, hairline ring, shadow-xs) ---------- */

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-3xl p-5', GLASS, className)} {...rest}>
      {children}
    </div>
  )
}

/** Inset grouped list. Rows are separated by hairlines. */
export function Group({ className, children }) {
  return (
    <div className={cx('divide-y divide-black/5 overflow-hidden rounded-3xl dark:divide-white/10', GLASS, className)}>
      {children}
    </div>
  )
}

export function GroupLabel({ children }) {
  return <p className="px-2 pb-2 text-sm font-medium text-muted-foreground">{children}</p>
}

/* ---------- Buttons (Moti button: press nudges 1px, no shrink) ---------- */

const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 font-semibold whitespace-nowrap outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4 ' +
  PRESS

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-foreground shadow-[var(--shadow-glow),var(--shadow-glass-inner)]',
  outline: cx('text-foreground', GLASS_SUB),
  soft: 'bg-black/5 text-foreground dark:bg-white/10',
  ghost: 'bg-transparent text-muted-foreground active:bg-black/5 dark:active:bg-white/5',
  emerald: 'bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.45),var(--shadow-glass-inner)]',
}

const BUTTON_SIZES = {
  md: 'h-11 rounded-2xl px-4 text-[15px]',
  sm: 'h-9 rounded-full px-3.5 text-sm',
  lg: 'h-12 rounded-full px-6 text-base',
  xl: 'h-14 rounded-full px-6 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  return (
    <button type="button" className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)} {...rest}>
      {children}
    </button>
  )
}

const PILL_IDLE = 'border border-black/10 bg-white/60 text-zinc-700 dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:text-zinc-300'
const PILL_SELECTED = 'border border-primary/60 bg-primary/20 text-foreground shadow-[var(--shadow-glow)] dark:text-primary'

/** One-tap answer in the chat: a 3D glass tile. */
export function OptionButton({ emoji, label, onClick, selected, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex min-h-12 items-center gap-2.5 rounded-2xl px-4 py-3 text-left text-[15px] font-medium shadow-[var(--shadow-glass-inner)] backdrop-blur-xl',
        selected ? PILL_SELECTED : PILL_IDLE,
        PRESS,
        className
      )}
    >
      {emoji && <span className="text-lg leading-none">{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}

/** Pill used for quick suggestions and filters. */
export function Chip({ active, className, children, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium',
        active ? PILL_SELECTED : PILL_IDLE,
        PRESS,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/* ---------- Form controls: same spec as TARTAR / Moti components/ui ---------- */

const CONTROL =
  'w-full min-w-0 rounded-2xl text-base transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 ' + GLASS_SUB

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} data-slot="input" className={cx('h-11 px-4', CONTROL, className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cx('flex min-h-16 resize-none px-4 py-3 [field-sizing:content]', CONTROL, className)}
      {...props}
    />
  )
})

export function Label({ className, ...props }) {
  return <label data-slot="label" className={cx('flex items-center gap-2 text-sm leading-none font-medium select-none', className)} {...props} />
}

export function InputGroup({ className, children }) {
  return (
    <div
      data-slot="input-group"
      className={cx(
        'group/input-group relative flex h-11 w-full min-w-0 items-center rounded-2xl transition-[color,box-shadow] outline-none',
        GLASS_SUB,
        'has-[[data-slot=input-group-control]:focus-visible]:border-primary/60 has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30',
        className
      )}
    >
      {children}
    </div>
  )
}

export const InputGroupInput = forwardRef(function InputGroupInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      data-slot="input-group-control"
      className={cx('h-full min-w-0 flex-1 bg-transparent py-1 pr-1.5 pl-4 text-base outline-none placeholder:text-muted-foreground', className)}
      {...props}
    />
  )
})

export function InputGroupButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'relative mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full after:absolute after:-inset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
        PRESS,
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Bottom sheet (TARTAR Sheet side="bottom") ---------- */

export function Sheet({ open, onClose, title, labelFor, action, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <OnBody>
    <AnimatePresence>
      {open && (
        <div className="fixed inset-x-0 top-0 bottom-[calc(-1*var(--below-viewport))] z-50" data-overlay>
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            // Tapping a button must not pull focus from the text field: that closes the keyboard, the sheet
            // drops, and the tap lands somewhere else. Keep focus where it is; the click still fires.
            onMouseDown={(e) => {
              if (e.target.closest('button') && document.activeElement?.matches('input, textarea')) e.preventDefault()
            }}
            className={cx(
              'absolute inset-x-0 bottom-(--sheet-lift) mx-auto flex max-h-[calc(0.92*var(--visual-viewport-height))] max-w-xl flex-col',
              'rounded-t-[28px] border-t border-white/40 bg-white/80 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl in-data-keyboard-open:pb-0 dark:border-white/10 dark:bg-zinc-900/80'
            )}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="flex min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain px-4 pt-4 pb-4">
              {title && (
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor={labelFor} className="text-sm font-medium text-muted-foreground">
                    {title}
                  </label>
                  {action && <span className="ml-auto">{action}</span>}
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="relative -mr-1 grid size-8 place-items-center rounded-full bg-black/5 text-muted-foreground after:absolute after:-inset-1.5 dark:bg-white/10"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </OnBody>
  )
}

/** Focus the sheet's input as soon as it mounts (keeps the keyboard up on iOS). */
export const focusOnOpen = (el) => {
  if (!el) return
  el.focus({ preventScroll: true })
  requestAnimationFrame(() => {
    if (document.activeElement !== el) el.focus({ preventScroll: true })
  })
}

const SHEET_INPUT_GROUP =
  'h-14 rounded-2xl border-2 border-primary px-1 has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-0'
const SHEET_TEXTAREA = 'min-h-28 rounded-2xl border-2 border-primary px-4 py-3 focus-visible:border-primary focus-visible:ring-0'

/** The input drawer itself (TARTAR FieldSheet): label, big focused input, clear, Save. */
export function FieldSheet({ open, id, label, draft, onDraftChange, placeholder, multiline, saveLabel = 'Save', onSave, onClose, inputMode }) {
  const inputRef = useRef(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const canSave = draft.trim().length > 0
  const save = () => canSave && onSave()
  const speech = useSpeech({ onFinal: (text) => onDraftChange(draftRef.current ? `${draftRef.current.trimEnd()} ${text}` : text) })
  const micButton = speech.supported && (
    <InputGroupButton
      aria-label={speech.listening ? 'Stop dictation' : 'Dictate'}
      aria-pressed={speech.listening}
      onClick={speech.toggle}
      className={speech.listening ? 'bg-primary text-primary-foreground shadow-[var(--shadow-glow)]' : 'text-muted-foreground'}
    >
      <Mic />
    </InputGroupButton>
  )

  return (
    <Sheet open={open} onClose={onClose} title={label} labelFor={id}>
      {multiline ? (
        <Textarea
          ref={focusOnOpen}
          id={id}
          rows={4}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              save()
            }
          }}
          className={SHEET_TEXTAREA}
        />
      ) : (
        <InputGroup className={SHEET_INPUT_GROUP}>
          <InputGroupInput
            ref={(el) => {
              inputRef.current = el
              focusOnOpen(el)
            }}
            id={id}
            value={draft}
            placeholder={placeholder}
            inputMode={inputMode}
            enterKeyHint="done"
            autoComplete="off"
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                save()
              }
            }}
          />
          {micButton}
          {draft && (
            <InputGroupButton
              aria-label="Clear"
              className="rounded-full text-muted-foreground"
              onClick={() => {
                onDraftChange('')
                inputRef.current?.focus()
              }}
            >
              <X />
            </InputGroupButton>
          )}
        </InputGroup>
      )}
      {multiline && speech.supported && (
        <div className="-mt-1 flex justify-end">
          <Button variant={speech.listening ? 'primary' : 'outline'} size="sm" onClick={speech.toggle} aria-pressed={speech.listening}>
            <Mic /> {speech.listening ? 'Listening…' : 'Dictate'}
          </Button>
        </div>
      )}
      {speech.listening && speech.interim && <p className="px-1 text-sm text-muted-foreground italic">{speech.interim}</p>}
      {speech.error && <p className="px-1 text-sm text-muted-foreground">{speech.error}</p>}
      <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
        {saveLabel}
      </Button>
    </Sheet>
  )
}

const TRIGGER = cx(
  'flex min-h-12 w-full min-w-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-left text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/30',
  GLASS_SUB,
  PRESS
)

/**
 * A text field that behaves like TARTAR's FieldSheetControl:
 * on phones it is a tap target that opens the input drawer (with the keyboard already up);
 * on desktop it is a normal input with an inline submit button.
 *
 * value    current text (for edit fields), '' for compose fields
 * onCommit called with the text when the person saves
 */
export function SheetField({ id, label, value = '', placeholder, onCommit, multiline, saveLabel = 'Save', clearAfter, trailing }) {
  const coarse = useIsCoarse()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const proxyRef = useRef(null)
  const triggerRef = useRef(null)
  const focusingProxy = useRef(false)

  useEffect(() => {
    if (!open) setDraft(value)
  }, [value, open])

  const commit = () => {
    const text = draft.trim()
    if (!text) return
    onCommit(text)
    setOpen(false)
    if (clearAfter) setDraft('')
  }

  if (!coarse) {
    return (
      <InputGroup>
        <InputGroupInput
          id={id}
          aria-label={label}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
        />
        <InputGroupButton
          aria-label={saveLabel}
          disabled={!draft.trim() || draft.trim() === value}
          onClick={commit}
          className="bg-primary text-primary-foreground"
        >
          <ArrowUp strokeWidth={2.5} />
        </InputGroupButton>
      </InputGroup>
    )
  }

  const openSheet = () => {
    // Focus a hidden input inside the tap itself, so iOS raises the keyboard; the sheet input takes over.
    focusingProxy.current = true
    if (proxyRef.current) proxyRef.current.disabled = false
    proxyRef.current?.focus({ preventScroll: true })
    focusingProxy.current = false
    setDraft(value)
    setOpen(true)
  }

  return (
    <div className="relative min-w-0">
      <input
        ref={proxyRef}
        aria-hidden
        tabIndex={-1}
        disabled
        onBlur={(e) => (e.currentTarget.disabled = true)}
        className="pointer-events-none absolute top-0 left-0 size-px text-base opacity-0"
        onFocus={() => {
          if (!focusingProxy.current) triggerRef.current?.focus()
        }}
      />
      <button ref={triggerRef} id={id} type="button" aria-label={label} className={TRIGGER} onClick={openSheet}>
        <span className={cx('min-w-0 flex-1', value ? 'text-foreground' : 'text-muted-foreground', multiline ? 'line-clamp-2 whitespace-pre-line' : 'truncate')}>
          {value || placeholder}
        </span>
        {trailing && <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{trailing}</span>}
      </button>
      <FieldSheet
        open={open}
        id={`${id}-sheet`}
        label={label}
        draft={draft}
        onDraftChange={setDraft}
        placeholder={placeholder}
        multiline={multiline}
        saveLabel={saveLabel}
        onSave={commit}
        onClose={() => {
          setOpen(false)
          triggerRef.current?.blur()
        }}
      />
    </div>
  )
}

/* ---------- Toast (sits under the top bar) ---------- */

export function Toast({ message }) {
  return (
    <OnBody>
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="rounded-full border border-white/50 bg-white/80 px-5 py-3 text-sm font-medium shadow-[var(--shadow-glass)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </OnBody>
  )
}

/** Shared timer for toasts. */
export function useToast() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])
  return [toast, setToast]
}
