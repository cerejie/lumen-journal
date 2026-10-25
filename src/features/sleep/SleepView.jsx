import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BedDouble, Moon, Sunrise, Trash2 } from 'lucide-react'
import { Button, Card, OptionButton, Toast, cx } from '../../components/ui'
import { ROUGH_HOURS, SLEEP_QUALITY, qualityEmoji } from '../../lib/constants'
import { formatDay, formatDuration, formatTime } from '../../lib/time'

export default function SleepView({ sleep, actions, now, accent }) {
  const inBed = !!sleep.current
  const [rateId, setRateId] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const logs = sleep.logs
  const recent = logs.slice(0, 7)
  const avg = recent.length ? recent.reduce((s, l) => s + (l.wakeAt - l.bedAt), 0) / recent.length : 0
  const rested = recent.filter((l) => l.quality === 'okay' || l.quality === 'rested').length

  const rate = (q) => {
    actions.rateSleep(rateId, q)
    setRateId(null)
    setToast('Logged. Be gentle with yourself today 🌤️')
  }

  return (
    <div className="flex flex-col gap-4">
      <Toast message={toast} />
      <div className="px-1">
        <div className="flex items-center gap-2">
          <Moon className={cx('size-5', accent.text)} />
          <h2 className="text-xl font-bold tracking-tight">Sleep</h2>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">One tap at night, one tap in the morning.</p>
      </div>

      <AnimatePresence mode="wait">
        {rateId ? (
          <motion.div key="rate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-6">
              <p className="text-lg font-semibold">How do you feel?</p>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {SLEEP_QUALITY.map((q) => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => rate(q.value)}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-white/90 py-3 text-xs font-medium shadow-sm transition active:scale-90 dark:bg-zinc-800/80"
                  >
                    <span className="text-3xl">{q.emoji}</span>
                    {q.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setRateId(null)} className="mt-3 w-full py-2 text-sm text-zinc-400">
                Skip
              </button>
            </Card>
          </motion.div>
        ) : inBed ? (
          <motion.div key="bed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="relative overflow-hidden bg-zinc-900/80 p-6 text-white dark:bg-zinc-900/80">
              <div className="absolute -top-10 -right-10 size-40 rounded-full bg-violet-500/30 blur-3xl" />
              <Moon className="size-8 text-violet-300" />
              <p className="mt-3 text-sm text-zinc-400">Sleeping since {formatTime(sleep.current.bedAt)}</p>
              <p className="text-4xl font-bold tabular-nums">{formatDuration(now - sleep.current.bedAt)}</p>
              <Button
                className="mt-6 w-full bg-amber-400 text-zinc-950 dark:bg-amber-400 dark:text-zinc-950"
                onClick={() => setRateId(actions.wake())}
              >
                <Sunrise className="size-5" /> I'm Awake
              </Button>
              <button type="button" onClick={actions.cancelBed} className="mt-2 w-full py-2 text-sm text-zinc-400">
                Oops, not in bed yet
              </button>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="awake" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-6">
              <BedDouble className={cx('size-8', accent.text)} />
              <p className="mt-3 text-lg font-semibold">Winding down?</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Tap once when you get into bed. That's it.</p>
              <Button className="mt-5 w-full" onClick={actions.goToBed}>
                <Moon className="size-5" /> Going to Bed
              </Button>
              <button
                type="button"
                onClick={() => setShowManual((v) => !v)}
                className="mt-2 w-full py-2 text-sm text-zinc-500 dark:text-zinc-400"
              >
                Forgot to tap? Add last night roughly
              </button>
              <AnimatePresence>
                {showManual && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-5 gap-2 overflow-hidden pt-1"
                  >
                    {ROUGH_HOURS.map((h) => (
                      <OptionButton
                        key={h}
                        label={`${h}h`}
                        className="justify-center px-2"
                        onClick={() => {
                          setShowManual(false)
                          setRateId(actions.logRough(h))
                        }}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length > 0 && (
        <Card>
          <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Your last {recent.length} logged {recent.length === 1 ? 'night' : 'nights'}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold tabular-nums">{formatDuration(avg)}</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">average</p>
          </div>
          {rested > 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Woke up feeling okay or better {rested} {rested === 1 ? 'time' : 'times'} 🌤️
            </p>
          )}
          <div className="mt-5 flex h-28 items-end gap-2">
            {[...recent].reverse().map((l) => {
              const hours = (l.wakeAt - l.bedAt) / 3600000
              return (
                <div key={l.id} className="flex flex-1 flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(100, (hours / 10) * 100)}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                    className={cx('w-full rounded-xl', accent.solid)}
                    title={formatDuration(l.wakeAt - l.bedAt)}
                  />
                  <span className="text-sm leading-none">{qualityEmoji(l.quality) || '·'}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {logs.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold tracking-wide text-zinc-400 uppercase">Logged nights</p>
          <AnimatePresence initial={false}>
            {logs.slice(0, 30).map((l) => (
              <motion.div
                key={l.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="flex items-center gap-3 p-4">
                  <span className="text-2xl">{qualityEmoji(l.quality) || '🌙'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold">{formatDay(l.wakeAt)}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatTime(l.bedAt)} → {formatTime(l.wakeAt)}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatDuration(l.wakeAt - l.bedAt)}</p>
                  <button
                    type="button"
                    aria-label="Delete night"
                    onClick={() => actions.deleteLog(l.id)}
                    className="rounded-xl p-2 text-zinc-400 transition active:scale-90"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
