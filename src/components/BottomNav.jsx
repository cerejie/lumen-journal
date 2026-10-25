import { motion } from 'framer-motion'
import { CheckCircle2, MessageSquare, Moon, Settings, ShieldCheck } from 'lucide-react'
import { cx } from './ui'

export const TABS = [
  { id: 'journal', label: 'Journal', icon: MessageSquare },
  { id: 'proof', label: 'Proof', icon: ShieldCheck },
  { id: 'focus', label: 'Focus', icon: CheckCircle2 },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function BottomNav({ tab, onChange, accent }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="mx-auto flex max-w-md gap-1 rounded-3xl border border-white/60 bg-white/75 p-1.5 shadow-lg shadow-zinc-900/10 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/75">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition active:scale-95',
                active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-zinc-900/5 dark:bg-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className={cx('relative size-5', active && accent)} strokeWidth={active ? 2.4 : 2} />
              <span className="relative">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
