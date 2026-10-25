import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Plus, Sparkles, Sun, Sunrise } from 'lucide-react'
import ChatWizard from './ChatWizard'
import ProofCard from '../proof/ProofCard'
import { buildFlows } from './flows'
import { Button, Card, cx } from '../../components/ui'
import { PERIODS } from '../../lib/constants'
import { dayKey, formatTime } from '../../lib/time'

export const PERIOD_ICONS = { morning: Sunrise, afternoon: Sun, evening: Moon }
const ORDER = ['morning', 'afternoon', 'evening']

export default function JournalView({ period, now, entries, onSaveEntry, ctx, name, evidence, onAddProof }) {
  const flows = useMemo(() => buildFlows({ name }), [name])
  const flow = flows[period]
  const accent = PERIODS[period].accent
  const today = dayKey(now)

  const todays = entries.filter((e) => e.date === today)
  const doneNow = todays.filter((e) => e.period === period)
  // Zero-guilt: only *completed* earlier reflections from today are ever shown. Missed ones simply don't exist.
  const earlier = todays.filter((e) => ORDER.indexOf(e.period) < ORDER.indexOf(period))

  const [session, setSession] = useState(() => (doneNow.length ? null : Date.now()))

  // When the clock rolls into a new period/day, start fresh.
  useEffect(() => {
    setSession(doneNow.length ? null : Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, today])

  return (
    <div className="flex flex-col gap-6">
      <ProofCard evidence={evidence} accent={accent} onAdd={onAddProof} />

      {session ? (
        <ChatWizard
          key={`${period}-${today}-${session}`}
          steps={flow.steps}
          ctx={ctx}
          accent={accent}
          closing={flow.closing}
          onFinish={(answers) => onSaveEntry({ date: today, period, answers })}
          onClose={() => setSession(null)}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className={cx('size-5', accent.text)} />
              <p className="font-semibold">You checked in. That's the whole job.</p>
            </div>
            <div className="flex flex-col gap-3">
              {doneNow.map((e) => (
                <EntrySummary key={e.id} entry={e} flow={flow} />
              ))}
            </div>
            <Button variant="soft" className="mt-4 w-full" onClick={() => setSession(Date.now())}>
              <Plus className="size-4" /> Add another little note
            </Button>
          </Card>
        </motion.div>
      )}

      {earlier.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="px-4 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">Earlier today</p>
          {earlier.map((e) => {
            const EIcon = PERIOD_ICONS[e.period]
            return (
              <Card key={e.id} className="p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                  <EIcon className="size-4" /> {PERIODS[e.period].label}
                </div>
                <EntrySummary entry={e} flow={flows[e.period]} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EntrySummary({ entry, flow }) {
  const lines = flow.summarize(entry.answers)
  if (!lines.length) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Checked in at {formatTime(entry.createdAt)} 🌿</p>
  }
  return (
    <dl className="flex flex-col gap-2">
      {lines.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</dt>
          <dd className="text-[15px] whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
