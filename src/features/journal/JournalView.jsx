import { useEffect, useMemo, useState } from 'react'
import { Moon, Plus, Sun, Sunrise } from 'lucide-react'
import ChatWizard from './ChatWizard'
import ProofCard from '../proof/ProofCard'
import { buildFlows } from './flows'
import { Button, Card, GroupLabel } from '../../components/ui'
import { PERIODS } from '../../lib/constants'
import { dayKey, formatTime } from '../../lib/time'

export const PERIOD_ICONS = { morning: Sunrise, afternoon: Sun, evening: Moon }
const ORDER = ['morning', 'afternoon', 'evening']

export default function JournalView({ period, now, entries, onSaveEntry, ctx, name, evidence, onAddProof }) {
  const flows = useMemo(() => buildFlows({ name }), [name])
  const flow = flows[period]
  const today = dayKey(now)

  const todays = entries.filter((e) => e.date === today)
  const doneNow = todays.filter((e) => e.period === period)
  // Zero guilt: only completed reflections from today are ever shown. Missed ones do not exist.
  const earlier = todays.filter((e) => ORDER.indexOf(e.period) < ORDER.indexOf(period))

  const [session, setSession] = useState(() => (doneNow.length ? null : Date.now()))

  useEffect(() => {
    setSession(doneNow.length ? null : Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, today])

  return (
    <div className="flex flex-col gap-6">
      <ProofCard evidence={evidence} onAdd={onAddProof} />

      {session ? (
        <ChatWizard
          key={`${period}-${today}-${session}`}
          steps={flow.steps}
          ctx={ctx}
          closing={flow.closing}
          onFinish={(answers) => onSaveEntry({ date: today, period, answers })}
          onClose={() => setSession(null)}
        />
      ) : (
        <div>
          <GroupLabel>{flow.title}</GroupLabel>
          <Card className="flex flex-col gap-4">
            {doneNow.map((e) => (
              <EntrySummary key={e.id} entry={e} flow={flow} />
            ))}
            <Button variant="outline" className="w-full" onClick={() => setSession(Date.now())}>
              <Plus /> Add another note
            </Button>
          </Card>
        </div>
      )}

      {earlier.length > 0 && (
        <div>
          <GroupLabel>Earlier today</GroupLabel>
          <div className="flex flex-col gap-3">
            {earlier.map((e) => {
              const Icon = PERIOD_ICONS[e.period]
              return (
                <Card key={e.id} className="flex flex-col gap-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Icon className="size-4" aria-hidden /> {PERIODS[e.period].label}
                  </p>
                  <EntrySummary entry={e} flow={flows[e.period]} />
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function EntrySummary({ entry, flow }) {
  const lines = flow.summarize(entry.answers)
  if (!lines.length) return <p className="text-[15px] text-muted-foreground">Checked in at {formatTime(entry.createdAt)}</p>
  return (
    <dl className="flex flex-col gap-3">
      {lines.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-[15px] whitespace-pre-line">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
