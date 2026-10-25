import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, ChevronRight, Dices, Inbox, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Button, Card, FieldSheet, Group, GroupLabel, Sheet, SheetField, Toast, cx, useToast } from '../../components/ui'
import { DONE_MESSAGES, PIVOT_MESSAGES, pick } from '../../lib/constants'
import { dayKey } from '../../lib/time'

export default function FocusView({ tasks, actions }) {
  const nowTask = tasks.find((t) => t.status === 'now')
  const later = tasks.filter((t) => t.status === 'later')
  const winsToday = tasks.filter((t) => t.status === 'done' && t.doneAt && dayKey(t.doneAt) === dayKey()).length

  const [toast, setToast] = useToast()
  const [dumpOpen, setDumpOpen] = useState(false)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [capture, setCapture] = useState('')

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
        <AnimatePresence mode="wait" initial={false}>
          {nowTask ? (
            <motion.div
              key={nowTask.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Card className="flex flex-col gap-5">
                <p className="text-2xl leading-snug font-semibold tracking-tight text-balance break-words">{nowTask.text}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      actions.completeNow()
                      setToast(pick(DONE_MESSAGES))
                    }}
                  >
                    <CheckCircle2 /> Done 🎉
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      actions.pivotNow()
                      setToast(pick(PIVOT_MESSAGES))
                    }}
                  >
                    <RotateCcw /> Pivot
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
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
          className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium transition-colors active:bg-muted"
        >
          <Inbox className="size-5 text-muted-foreground" aria-hidden />
          Brain dump
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">{later.length}</span>
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setCaptureOpen(true)}
          className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium text-primary transition-colors active:bg-muted"
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
                    'relative grid size-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-all after:absolute after:-inset-1 active:translate-y-px active:bg-muted'
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
