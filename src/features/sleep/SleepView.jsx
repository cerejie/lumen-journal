import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BedDouble, Moon, Sunrise, Trash2 } from 'lucide-react'
import { Button, Card, Chip, Group, GroupLabel, Toast, useToast } from '../../components/ui'
import { ROUGH_HOURS, SLEEP_QUALITY, qualityEmoji } from '../../lib/constants'
import { formatDay, formatDuration, formatTime } from '../../lib/time'

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.1 } },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export default function SleepView({ sleep, actions, now }) {
  const inBed = !!sleep.current
  const [rateId, setRateId] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [toast, setToast] = useToast()

  const logs = sleep.logs
  const recent = logs.slice(0, 7)
  const avg = recent.length ? recent.reduce((s, l) => s + (l.wakeAt - l.bedAt), 0) / recent.length : 0

  const rate = (q) => {
    actions.rateSleep(rateId, q)
    setRateId(null)
    setToast('Sleep logged')
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />

      <AnimatePresence mode="wait" initial={false}>
        {rateId ? (
          <motion.div key="rate" {...fade}>
            <Card className="flex flex-col gap-4">
              <p className="text-lg font-semibold">How do you feel?</p>
              <div className="grid grid-cols-4 gap-2">
                {SLEEP_QUALITY.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => rate(q.value)}
                    className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border border-border bg-panel text-xs font-medium shadow-xs transition-all active:translate-y-px active:bg-muted dark:border-input dark:bg-input/30"
                  >
                    <span className="text-2xl leading-none">{q.emoji}</span>
                    {q.label}
                  </button>
                ))}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setRateId(null)}>
                Skip
              </Button>
            </Card>
          </motion.div>
        ) : inBed ? (
          <motion.div key="bed" {...fade}>
            <Card className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Moon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">Asleep since {formatTime(sleep.current.bedAt)}</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatDuration(now - sleep.current.bedAt)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button className="w-full" onClick={() => setRateId(actions.wake())}>
                  <Sunrise /> I'm awake
                </Button>
                <Button variant="ghost" className="w-full" onClick={actions.cancelBed}>
                  Not in bed yet
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="awake" {...fade}>
            <Card className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <BedDouble className="size-5" aria-hidden />
                </span>
                <p className="text-lg font-semibold">Heading to bed?</p>
              </div>
              <div className="flex flex-col gap-1">
                <Button className="w-full" onClick={actions.goToBed}>
                  <Moon /> Going to bed
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setShowManual((v) => !v)} aria-expanded={showManual}>
                  Forgot to tap? Add last night
                </Button>
              </div>
              <AnimatePresence initial={false}>
                {showManual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="-mt-2 overflow-hidden"
                  >
                    <div className="grid grid-cols-5 gap-2">
                      {ROUGH_HOURS.map((h) => (
                        <Chip
                          key={h}
                          className="justify-center"
                          onClick={() => {
                            setShowManual(false)
                            setRateId(actions.logRough(h))
                          }}
                        >
                          {h}h
                        </Chip>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length > 0 && (
        <div>
          <GroupLabel>Last {recent.length} {recent.length === 1 ? 'night' : 'nights'}</GroupLabel>
          <Card className="flex flex-col gap-5">
            <p className="text-3xl font-semibold tabular-nums">
              {formatDuration(avg)} <span className="text-base font-normal text-muted-foreground">average</span>
            </p>
            <div className="flex h-24 items-end gap-2" role="img" aria-label="Hours slept per logged night">
              {[...recent].reverse().map((l) => {
                const hours = (l.wakeAt - l.bedAt) / 3600000
                return (
                  <div key={l.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <div
                      className="w-full rounded-md bg-primary transition-[height] duration-500"
                      style={{ height: `${Math.max(6, Math.min(100, (hours / 10) * 100))}%` }}
                      title={formatDuration(l.wakeAt - l.bedAt)}
                    />
                    <span className="text-xs leading-none">{qualityEmoji(l.quality) || '·'}</span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <GroupLabel>Logged nights</GroupLabel>
          <Group>
            {logs.slice(0, 30).map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
                <span className="w-6 text-center text-lg" aria-label={l.quality ?? 'not rated'}>
                  {qualityEmoji(l.quality) || <Moon className="mx-auto size-4 text-muted-foreground" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">{formatDay(l.wakeAt)}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatTime(l.bedAt)} – {formatTime(l.wakeAt)}
                  </p>
                </div>
                <p className="text-[15px] font-semibold tabular-nums">{formatDuration(l.wakeAt - l.bedAt)}</p>
                <button
                  type="button"
                  aria-label={`Delete ${formatDay(l.wakeAt)}`}
                  onClick={() => actions.deleteLog(l.id)}
                  className="relative grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-all after:absolute after:-inset-1 active:translate-y-px active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </Group>
        </div>
      )}
    </div>
  )
}
