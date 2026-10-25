import { forwardRef, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, X } from 'lucide-react'
import { useIsCoarse } from '../lib/keyboard'

export const cx = (...classes) => classes.filter(Boolean).join(' ')

/* ---------- Surfaces (Moti card: rounded-xl panel, hairline ring, shadow-xs) ---------- */

export function Card({ className, children, ...rest }) {
  return (
    <div className={cx('rounded-xl bg-panel p-5 shadow-xs ring-1 ring-foreground/10', className)} {...rest}>
      {children}
    </div>
  )
}

/** Inset grouped list. Rows are separated by hairlines. */
export function Group({ className, children }) {
  return (
    <div className={cx('divide-y divide-border overflow-hidden rounded-xl bg-panel shadow-xs ring-1 ring-foreground/10', className)}>
      {children}
    </div>
  )
}

export function GroupLabel({ children }) {
  return <p className="px-1 pb-2 text-sm font-medium text-muted-foreground">{children}</p>
}

/* ---------- Buttons (Moti button: press nudges 1px, no shrink) ---------- */

const BUTTON_BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 border border-transparent font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4'

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-primary-foreground active:bg-primary/90',
  outline: 'border-border bg-panel text-foreground shadow-xs active:bg-muted dark:border-input dark:bg-input/30',
  soft: 'bg-muted text-foreground active:bg-foreground/10',
  ghost: 'bg-transparent text-muted-foreground active:bg-muted',
}

const BUTTON_SIZES = {
  md: 'h-11 rounded-lg px-4 text-[15px]',
  sm: 'h-9 rounded-md px-3 text-sm',
  lg: 'h-12 rounded-full px-6 text-base',
}

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }) {
  return (
    <button type="button" className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)} {...rest}>
      {children}
    </button>
  )
}

/** One-tap answer in the chat. */
export function OptionButton({ emoji, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-h-11 items-center gap-2.5 rounded-lg border border-border bg-panel px-3.5 py-2.5 text-left text-[15px] font-medium shadow-xs transition-all',
        'active:translate-y-px active:bg-muted dark:border-input dark:bg-input/30',
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
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-all active:translate-y-px',
        active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
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
  'w-full min-w-0 rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} data-slot="input" className={cx('h-9 px-2.5 py-1', CONTROL, className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cx('flex min-h-16 resize-none px-2.5 py-2 [field-sizing:content]', CONTROL, className)}
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
        'group/input-group relative flex h-9 w-full min-w-0 items-center rounded-md border border-input shadow-xs transition-[color,box-shadow] outline-none dark:bg-input/30',
        'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50',
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
      className={cx('h-full min-w-0 flex-1 bg-transparent py-1 pr-1.5 pl-2.5 text-base outline-none placeholder:text-muted-foreground', className)}
      {...props}
    />
  )
})

export function InputGroupButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={cx(
        'relative mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-[6px] transition-all after:absolute after:-inset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/* ---------- Bottom sheet (TARTAR Sheet side="bottom") ---------- */

export function Sheet({ open, onClose, title, labelFor, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/40"
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
            className={cx(
              'absolute inset-x-0 bottom-(--keyboard-inset) mx-auto flex max-h-[calc(0.92*var(--visual-viewport-height))] max-w-xl flex-col',
              'rounded-t-[20px] border-t border-border bg-panel pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg in-data-keyboard-open:pb-0'
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
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="relative -mr-1 grid size-8 place-items-center rounded-full text-muted-foreground after:absolute after:-inset-1.5 active:bg-muted"
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
  )
}

/** Focus the sheet's input as soon as it mounts (keeps the keyboard up on iOS). */
const focusOnOpen = (el) => {
  if (!el) return
  el.focus({ preventScroll: true })
  requestAnimationFrame(() => {
    if (document.activeElement !== el) el.focus({ preventScroll: true })
  })
}

const SHEET_INPUT_GROUP =
  'h-14 rounded-xl border-2 border-primary px-1 has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-0'
const SHEET_TEXTAREA = 'min-h-28 rounded-xl border-2 border-primary px-4 py-3 focus-visible:border-primary focus-visible:ring-0'

/** The input drawer itself (TARTAR FieldSheet): label, big focused input, clear, Save. */
export function FieldSheet({ open, id, label, draft, onDraftChange, placeholder, multiline, saveLabel = 'Save', onSave, onClose, inputMode }) {
  const inputRef = useRef(null)
  const canSave = draft.trim().length > 0
  const save = () => canSave && onSave()

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
      <Button size="lg" className="w-full" disabled={!canSave} onClick={save}>
        {saveLabel}
      </Button>
    </Sheet>
  )
}

const TRIGGER =
  'flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-left text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted/50 dark:bg-input/30'

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
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4rem)] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg bg-panel px-4 py-3 text-sm font-medium shadow-lg ring-1 ring-foreground/10"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
