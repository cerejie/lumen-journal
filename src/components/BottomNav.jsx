import { CheckCircle2, MessageSquare, Moon, Settings, ShieldCheck } from 'lucide-react'
import { cx } from './ui'

export const TABS = [
  { id: 'journal', label: 'Journal', icon: MessageSquare },
  { id: 'proof', label: 'Proof', icon: ShieldCheck },
  { id: 'focus', label: 'Focus', icon: CheckCircle2 },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/** Docked tab bar, as in Moti: panel colour, hairline on top, brand-coloured active tab with a bar above it. */
export default function BottomNav({ tab, onChange }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-panel pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_2px_color-mix(in_oklab,black_4%,transparent)]"
    >
      <div className="mx-auto flex h-15 max-w-xl items-stretch">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs transition-colors',
                active ? 'font-semibold text-primary' : 'font-medium text-muted-foreground'
              )}
            >
              {active && <span aria-hidden className="absolute top-0 left-1/2 h-1 w-10 -translate-x-1/2 rounded-b-full bg-primary" />}
              <Icon size={20} aria-hidden strokeWidth={active ? 2.25 : 2} />
              <span className="w-full truncate text-center">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
