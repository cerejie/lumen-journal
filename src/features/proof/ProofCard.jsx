import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Shuffle } from 'lucide-react'
import { cx } from '../../components/ui'
import { kindMeta } from '../../lib/constants'
import { dayKey } from '../../lib/time'

/** Stable pick for the day; pinned items are twice as likely. */
function dailyPick(items, seed, offset) {
  if (!items.length) return null
  const pool = items.flatMap((i) => (i.pinned ? [i, i] : [i]))
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return pool[(h + offset) % pool.length]
}

const formatWhen = (ts) =>
  new Date(ts).toLocaleDateString([], { month: 'long', day: 'numeric', year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })

export default function ProofCard({ evidence, accent, onAdd }) {
  const [offset, setOffset] = useState(0)
  const today = dayKey()
  const item = useMemo(() => dailyPick(evidence, today, offset), [evidence, today, offset])

  const another = () => {
    // Step until we land on a different item (pinned items appear twice in the pool).
    let next = offset + 1
    for (let i = 0; i < 4 && evidence.length > 1 && dailyPick(evidence, today, next)?.id === item?.id; i++) next++
    setOffset(next)
  }

  if (!item) {
    return (
      <section className={cx('rounded-3xl p-6', accent.soft)}>
        <p className="font-proof text-[22px] leading-snug text-balance">Your doubts forget what you've done. This remembers.</p>
        <button
          type="button"
          onClick={onAdd}
          className={cx('mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition active:scale-95', accent.solid)}
        >
          <Plus className="size-4" strokeWidth={2.5} /> Add proof
        </button>
      </section>
    )
  }

  const meta = kindMeta(item.kind)
  const Icon = meta.icon

  return (
    <section className={cx('rounded-3xl p-6', accent.soft)} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.2 }}
        >
          <p className="flex items-center gap-1.5 text-[13px] font-semibold opacity-80">
            <Icon className="size-3.5" strokeWidth={2.4} />
            {meta.label}, {formatWhen(item.createdAt)}
          </p>
          <blockquote className="font-proof mt-2 text-[22px] leading-snug text-balance">{item.text}</blockquote>
          {item.detail && <p className="mt-2 text-[15px] opacity-80">{item.detail}</p>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 flex gap-2">
        {evidence.length > 1 && (
          <button
            type="button"
            onClick={another}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/60 px-4 text-[15px] font-semibold transition active:scale-95 dark:bg-white/10"
          >
            <Shuffle className="size-4" /> Another
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white/60 px-4 text-[15px] font-semibold transition active:scale-95 dark:bg-white/10"
        >
          <Plus className="size-4" strokeWidth={2.5} /> Add proof
        </button>
      </div>
    </section>
  )
}
