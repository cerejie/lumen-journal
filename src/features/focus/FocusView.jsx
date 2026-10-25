import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ChevronRight, Dices, Inbox, Plus, RotateCcw, Trash2 } from 'lucide-react'
import Celebrate from '../../components/Celebrate'
import { Button, Card, FieldSheet, GLASS, Group, GroupLabel, PRESS, Sheet, SheetField, Toast, cx, useToast } from '../../components/ui'
import { DONE_MESSAGES, pick } from '../../lib/constants'
import { dayKey } from '../../lib/time'

export default function FocusView({ tasks, actions }) {
  const nowTask = tasks.find((t) => t.status === 'now')
  const later = tasks.filter((t) => t.status === 'later')
  const winsToday = tasks.filter((t) => t.status === 'done' && t.doneAt && dayKey(t.doneAt) === dayKey()).length

  const [toast, setToast] = useToast()
  const [dumpOpen, setDumpOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [capture, setCapture] = useState('')
  const [celebrating, setCelebrating] = useState(false)
  const [leaving, setLeaving] = useState('done') // how the current card exits: 'done' lifts away, 'pivot' glides right

  const complete = () => {
    if (celebrating) return
    setLeaving('done')
    setCelebrating(true)
    navigator.vibrate?.([12, 40, 18])
    setTimeout(() => {
      actions.completeNow()
      setCelebrating(false)
      setToast(pick(DONE_MESSAGES))
    }, 850)
  }

  const pivot = () => {
    setLeaving('pivot')
    // Let React render the exit direction before the card unmounts.
    requestAnimationFrame(() => {
      actions.pivotNow()
      setToast('Saved for later. Zero guilt!')
    })
  }

  const exitFor = {
    done: { opacity: 0, y: -24, scale: 0.94, transition: { duration: 0.3, ease: 'easeIn' } },
    pivot: { opacity: 0, x: 160, rotate: 2, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } },
  }

  const saveCapture = () => {
    actions.addTask(capture.trim())
    setCapture('')
    setCaptureOpen(false)
    setToast('Saved to brain dump')
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />

      <div>
        <GroupLabel>{winsToday > 0 ? `Now (${winsToday} done today)` : 'Now'}</GroupLabel>
        <AnimatePresence mode="wait" initial={false} custom={leaving}>
          {nowTask ? (
            <motion.div
              key={nowTask.id}
              custom={leaving}
              variants={exitFor}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
              exit={leaving}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <div
                className={cx(
                  'relative flex flex-col gap-7 rounded-3xl p-6 transition-[background-color,border-color] duration-300',
                  GLASS,
                  celebrating ? '!border-emerald-400/60 shadow-[0_0_48px_rgba(16,185,129,0.35)]' : 'breathe',
                  leaving === 'pivot' && 'border-violet-300/50 bg-violet-200/40 dark:bg-violet-500/15'
                )}
              >
                {celebrating && <Celebrate />}
                <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  Now
                </p>
                <p
                  className={cx(
                    'text-3xl leading-tight font-semibold tracking-tight text-balance break-words transition-opacity duration-300',
                    celebrating && 'opacity-30'
                  )}
                >
                  {nowTask.text}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="emerald" size="xl" onClick={complete} disabled={celebrating}>
                    <CheckCircle2 className="size-5" /> Done 🎉
                  </Button>
                  <Button variant="outline" size="xl" className="rounded-full" onClick={pivot} disabled={celebrating}>
                    <RotateCcw className="size-5" /> Pivot 🔄
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <Card className="flex flex-col gap-4">
                <SheetField
                  id="now-task"
                  label="What's one small thing?"
                  placeholder="One small thing…"
                  saveLabel="Start"
                  clearAfter
                  onCommit={(text) => actions.addTask(text, { now: true })}
                />
                {later.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        actions.promote(pick(later).id)
                        setToast('Picked one for you 🎲')
                      }}
                    >
                      <Dices /> Surprise me
                    </Button>
                    <Button variant="outline" onClick={() => setDumpOpen(true)}>
                      <Inbox /> Choose
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Group>
        <button
          type="button"
          onClick={() => setDumpOpen(true)}
          className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium transition-all duration-300 ease-spring active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5"
        >
          <Inbox className="size-5 text-muted-foreground" aria-hidden />
          Brain dump
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{later.length}</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium text-primary transition-all duration-300 ease-spring active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5"
        >
          <Plus className="size-5" aria-hidden />
          Capture a thought
        </button>
      </Group>

      <FieldSheet
        open={captureOpen}
        id="capture"
        label="Capture a thought"
        draft={capture}
        onDraftChange={setCapture}
        placeholder="A thought, a task, anything…"
        saveLabel="Save to brain dump"
        onSave={saveCapture}
        onClose={() => setCaptureOpen(false)}
      />

      <Sheet open={dumpOpen} onClose={() => setDumpOpen(false)} title="Brain dump">
        {later.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-muted-foreground">Empty.</p>
        ) : (
          <Group className="shadow-none">
            {later.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 pr-2 pl-4">
                <span className="min-w-0 flex-1 py-2 text-[15px] break-words">{t.text}</span>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    actions.promote(t.id)
                    setDumpOpen(false)
                  }}
                >
                  <ArrowUpRight /> {nowTask ? 'Swap' : 'Start'}
                </Button>
                <button
                  type="button"
                  aria-label="Delete"
                  onClick={() => actions.removeTask(t.id)}
                  className={cx(
                    'relative grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-all duration-300 ease-spring after:absolute after:-inset-1 active:scale-90'
                  )}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </Group>
        )}
      </Sheet>
    </div>
  )
}
