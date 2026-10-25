import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export const cx = (...classes) => classes.filter(Boolean).join(' ')

export function Card({ className, children, ...rest }) {
  return (
    <div
      className={cx(
        'rounded-3xl bg-white/80 p-5 backdrop-blur-md dark:bg-zinc-900/70',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

const VARIANTS = {
  primary: 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900',
  soft: 'bg-zinc-900/5 text-zinc-800 dark:bg-white/10 dark:text-zinc-100',
  ghost: 'bg-transparent text-zinc-500 dark:text-zinc-400',
}

export function Button({ variant = 'primary', className, children, ...rest }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold',
        'transition duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

/** Big, thumb-friendly chip used for one-tap answers. */
export function OptionButton({ emoji, label, onClick, className }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex min-h-12 items-center gap-2.5 rounded-2xl border border-zinc-900/[0.08] bg-white px-4 py-3 text-left text-[15px] font-medium',
        'transition duration-150 active:scale-95 dark:border-white/10 dark:bg-zinc-900',
        className
      )}
    >
      {emoji && <span className="text-xl leading-none">{emoji}</span>}
      <span>{label}</span>
    </button>
  )
}

/** iOS-style large title. One per screen. */
export function PageHeader({ title, subtitle, icon: Icon, accent, action }) {
  return (
    <header className="flex items-end justify-between gap-3 px-1 pb-5">
      <div className="min-w-0">
        {subtitle && (
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
            {Icon && <Icon className={cx('size-3.5', accent)} strokeWidth={2.4} />}
            {subtitle}
          </p>
        )}
        <h1 className="mt-0.5 truncate text-[32px] leading-tight font-bold tracking-tight text-balance">{title}</h1>
      </div>
      {action}
    </header>
  )
}

/** Small sentence-case heading above a group. */
export function GroupLabel({ children }) {
  return <p className="px-4 pb-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{children}</p>
}

/** Inset grouped list, like iOS Settings. Children are rows separated by hairlines. */
export function Group({ className, children }) {
  return (
    <div
      className={cx(
        'divide-y divide-zinc-900/[0.06] overflow-hidden rounded-3xl bg-white/80 backdrop-blur-md dark:divide-white/[0.06] dark:bg-zinc-900/70',
        className
      )}
    >
      {children}
    </div>
  )
}

export function BottomSheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cx(
              'relative w-full max-w-md rounded-t-3xl border border-white/60 bg-zinc-50/95 p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-2xl backdrop-blur-md',
              'max-h-[85dvh] overflow-y-auto dark:border-white/10 dark:bg-zinc-900/95'
            )}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full bg-zinc-900/5 p-2 transition active:scale-95 dark:bg-white/10"
              >
                <X className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function Toast({ message }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),16px)] z-[60] flex justify-center px-4">
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            className="rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm font-semibold shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-800/90"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
