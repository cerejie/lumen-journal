import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Moon, Settings, ShieldCheck } from 'lucide-react'
import { PRESS, cx } from './ui'

export const TABS = [
  { id: 'journal', label: 'Journal', icon: MessageSquare },
  { id: 'proof', label: 'Proof', icon: ShieldCheck },
  { id: 'focus', label: 'Focus', icon: CheckCircle2 },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/**
 * Floating glass pill, like a dynamic island. Sits 24px above the screen edge,
 * or just above the home indicator on phones that have one.
 */
export default function BottomNav({ tab, onChange }) {
  return (
    <nav aria-label="Primary" className="pointer-events-none fixed inset-x-0 bottom-(--nav-bottom) z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-xs items-center justify-between rounded-full border border-white/70 bg-white/75 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.14),var(--shadow-glass-inner)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-2xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className={cx('relative grid h-11 w-12 place-items-center rounded-full', PRESS)}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-primary/12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] dark:bg-white/15 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.8 }}
                />
              )}
              <Icon
                size={22}
                aria-hidden
                strokeWidth={active ? 2.3 : 2}
                className={cx(
                  'relative transition-all duration-300 ease-spring',
                  active ? 'scale-110 text-primary dark:text-primary-bright' : 'text-zinc-700 opacity-60 dark:text-white dark:opacity-50'
                )}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
