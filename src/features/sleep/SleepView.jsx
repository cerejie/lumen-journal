import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sunrise, Trash2 } from 'lucide-react'
import SkyWave from '../../components/SkyWave'
import { Button, Card, Chip, Group, GroupLabel, OnBody, PRESS, Toast, cx, useToast } from '../../components/ui'
import { ROUGH_HOURS, SLEEP_QUALITY, qualityEmoji } from '../../lib/constants'
import { formatDay, formatDuration, formatTime } from '../../lib/time'

const rise = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
  transition: { type: 'spring', stiffness: 260, damping: 26 },
}

const centerOf = (el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

/** The giant ring: a slowly turning conic glow around a frosted disc. */
function SleepRing({ inBed, onPress, children, label }) {
  return (
    <button type="button" onClick={onPress} aria-label={label} className={cx('relative mx-auto grid size-60 place-items-center rounded-full', PRESS)}>
      <span
        aria-hidden
        className={cx(
          'spin-slow absolute inset-0 rounded-full opacity-90 blur-[2px]',
          inBed
            ? 'bg-[conic-gradient(from_0deg,#a78bfa,#6366f1,#1e1b4b,#a78bfa)]'
            : 'bg-[conic-gradient(from_0deg,var(--primary-bright),var(--primary),transparent,var(--primary-bright))]'
        )}
      />
      <span
        aria-hidden
        className={cx(
          'absolute inset-0 rounded-full blur-2xl transition-opacity duration-700',
          inBed ? 'bg-violet-500/40 opacity-100' : 'bg-primary/25 opacity-70'
        )}
      />
      <span className="relative grid size-[calc(100%-10px)] place-items-center rounded-full border border-white/40 bg-white/75 shadow-[var(--shadow-glass),var(--shadow-glass-inner)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/75">
        {children}
      </span>
    </button>
  )
}

export default function SleepView({ sleep, actions, now }) {
  const inBed = !!sleep.current
  const [rateId, setRateId] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [wave, setWave] = useState(null) // { kind: 'night' | 'morning', origin }
  const [toast, setToast] = useToast()

  const logs = sleep.logs
  const recent = logs.slice(0, 7)
  const avg = recent.length ? recent.reduce((s, l) => s + (l.wakeAt - l.bedAt), 0) / recent.length : 0

  const toggle = (e) => {
    const origin = centerOf(e.currentTarget)
    navigator.vibrate?.(14)
    if (inBed) {
      setWave({ kind: 'morning', origin })
      setRateId(actions.wake())
    } else {
      setWave({ kind: 'night', origin })
      actions.goToBed()
    }
  }

  const rate = (q) => {
    actions.rateSleep(rateId, q)
    setRateId(null)
    setToast('Sleep logged')
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />
      <OnBody>
        <AnimatePresence>{wave && <SkyWave key={wave.kind} kind={wave.kind} origin={wave.origin} onDone={() => setWave(null)} />}</AnimatePresence>
      </OnBody>

      <AnimatePresence mode="wait" initial={false}>
        {rateId ? (
          <motion.div key="rate" {...rise} className="flex flex-col gap-4">
            <p className="px-2 text-2xl font-semibold tracking-tight">How do you feel?</p>
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {SLEEP_QUALITY.map((q, i) => (
                <motion.button
                  key={q.value}
                  type="button"
                  onClick={() => rate(q.value)}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                  whileTap={{ scale: 0.93 }}
                  className="flex h-36 w-28 shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-3xl border border-white/50 bg-white/65 text-sm font-medium shadow-[var(--shadow-glass),var(--shadow-glass-inner)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/60"
                >
                  <span className="text-4xl leading-none">{q.emoji}</span>
                  {q.label}
                </motion.button>
              ))}
            </div>
            <Button variant="ghost" className="mx-auto" onClick={() => setRateId(null)}>
              Skip
            </Button>
          </motion.div>
        ) : (
          <motion.div key={inBed ? 'bed' : 'awake'} {...rise} className="flex flex-col items-center gap-5 pt-2">
            <SleepRing inBed={inBed} onPress={toggle} label={inBed ? "I'm awake" : 'Going to bed'}>
              {inBed ? (
                <span className="flex flex-col items-center gap-1.5">
                  <Moon className="size-7 text-violet-500 dark:text-violet-300" fill="currentColor" aria-hidden />
                  <span className="text-3xl font-semibold tabular-nums">{formatDuration(now - sleep.current.bedAt)}</span>
                  <span className="text-sm text-muted-foreground">since {formatTime(sleep.current.bedAt)}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary">
                    <Sunrise className="size-4" aria-hidden /> I'm awake
                  </span>
                </span>
              ) : (
                <span className="flex flex-col items-center gap-2">
                  <Moon className="size-9 text-primary" aria-hidden />
                  <span className="text-xl font-semibold tracking-tight">Going to bed</span>
                  <span className="text-sm text-muted-foreground">Tap once</span>
                </span>
              )}
            </SleepRing>

            {inBed ? (
              <Button variant="ghost" onClick={actions.cancelBed}>
                Not in bed yet
              </Button>
            ) : (
              <div className="flex w-full flex-col items-center gap-3">
                <Button variant="ghost" onClick={() => setShowManual((v) => !v)} aria-expanded={showManual}>
                  Forgot to tap? Add last night
                </Button>
                <AnimatePresence initial={false}>
                  {showManual && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex flex-wrap justify-center gap-2"
                    >
                      {ROUGH_HOURS.map((h) => (
                        <Chip
                          key={h}
                          onClick={() => {
                            setShowManual(false)
                            setRateId(actions.logRough(h))
                          }}
                        >
                          {h}h
                        </Chip>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {recent.length > 0 && (
        <div>
          <GroupLabel>
            Last {recent.length} {recent.length === 1 ? 'night' : 'nights'}
          </GroupLabel>
          <Card className="flex flex-col gap-5">
            <p className="text-3xl font-semibold tabular-nums">
              {formatDuration(avg)} <span className="text-base font-normal text-muted-foreground">average</span>
            </p>
            <div className="flex h-24 items-end gap-2" role="img" aria-label="Hours slept per logged night">
              {[...recent].reverse().map((l, i) => {
                const hours = (l.wakeAt - l.bedAt) / 3600000
                return (
                  <div key={l.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <motion.div
                      className="w-full rounded-full bg-gradient-to-t from-primary to-primary-bright shadow-[var(--shadow-glow)]"
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(6, Math.min(100, (hours / 10) * 100))}%` }}
                      transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
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
              <div key={l.id} className="flex items-center gap-3 py-3 pr-2 pl-5">
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
                  className={cx('relative grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground after:absolute after:-inset-1', PRESS)}
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
