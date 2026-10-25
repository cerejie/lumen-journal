import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Shuffle } from 'lucide-react'
import { Button } from '../../components/ui'
import { kindMeta } from '../../lib/constants'
import { dayKey } from '../../lib/time'

/** Stable pick for the day; starred items are twice as likely. */
function dailyPick(items, seed, offset) {
  if (!items.length) return null
  const pool = items.flatMap((i) => (i.pinned ? [i, i] : [i]))
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return pool[(h + offset) % pool.length]
}

const formatWhen = (ts) =>
  new Date(ts).toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })

const SURFACE = 'rounded-xl bg-primary-soft p-5 ring-1 ring-primary/15'

export default function ProofCard({ evidence, onAdd }) {
  const [offset, setOffset] = useState(0)
  const today = dayKey()
  const item = useMemo(() => dailyPick(evidence, today, offset), [evidence, today, offset])

  const another = () => {
    let next = offset + 1
    for (let i = 0; i < 4 && evidence.length > 1 && dailyPick(evidence, today, next)?.id === item?.id; i++) next++
    setOffset(next)
  }

  if (!item) {
    return (
      <section className={SURFACE}>
        <p className="font-proof text-xl leading-snug text-balance">Your doubts forget what you've done. This remembers.</p>
        <Button className="mt-4" onClick={onAdd}>
          <Plus /> Add proof
        </Button>
      </section>
    )
  }

  const meta = kindMeta(item.kind)
  const Icon = meta.icon

  return (
    <section className={SURFACE} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.2 }}
        >
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Icon className="size-4" aria-hidden />
            {meta.label}, {formatWhen(item.createdAt)}
          </p>
          <blockquote className="font-proof mt-2 text-xl leading-snug text-balance">{item.text}</blockquote>
          {item.detail && <p className="mt-1.5 text-[15px] text-muted-foreground">{item.detail}</p>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 flex gap-2">
        {evidence.length > 1 && (
          <Button variant="outline" size="sm" onClick={another}>
            <Shuffle /> Another
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus /> Add proof
        </Button>
      </div>
    </section>
  )
}
