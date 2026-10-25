import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, CheckCircle2, Dices, Inbox, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { BottomSheet, Button, Card, Toast, cx } from '../../components/ui'
import { DONE_MESSAGES, PIVOT_MESSAGES, pick } from '../../lib/constants'
import { dayKey } from '../../lib/time'

export default function FocusView({ tasks, actions, accent }) {
  const nowTask = tasks.find((t) => t.status === 'now')
  const later = tasks.filter((t) => t.status === 'later')
  const winsToday = tasks.filter((t) => t.status === 'done' && t.doneAt && dayKey(t.doneAt) === dayKey()).length

  const [toast, setToast] = useState(null)
  const [sheet, setSheet] = useState(null) // 'dump' | 'capture' | null
  const [draft, setDraft] = useState('')
  const [capture, setCapture] = useState('')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const startNow = () => {
    const v = draft.trim()
    if (!v) return
    actions.addTask(v, { now: true })
    setDraft('')
  }

  const saveCapture = () => {
    const v = capture.trim()
    if (!v) return
    actions.addTask(v)
    setCapture('')
    setToast('Parked in your brain dump 💭')
  }

  return (
    <div className="flex flex-col gap-4">
      <Toast message={toast} />

      {winsToday > 0 && (
        <p className="-mt-2 px-1 text-[15px] text-zinc-500 dark:text-zinc-400">
          <span className={cx('font-semibold', accent.text)}>{winsToday} done</span> today. Nice.
        </p>
      )}

      <AnimatePresence mode="wait">
        {nowTask ? (
          <motion.div
            key={nowTask.id}
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <Card className="p-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                <span className={cx('size-2 rounded-full', accent.solid)} /> Now
              </p>
              <p className="mt-3 text-[26px] leading-snug font-bold tracking-tight text-balance break-words">{nowTask.text}</p>
              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button
                  className={accent.solid}
                  onClick={() => {
                    actions.completeNow()
                    setToast(pick(DONE_MESSAGES))
                  }}
                >
                  <CheckCircle2 className="size-5" /> Done 🎉
                </Button>
                <Button
                  variant="soft"
                  onClick={() => {
                    actions.pivotNow()
                    setToast(pick(PIVOT_MESSAGES))
                  }}
                >
                  <RotateCcw className="size-5" /> Pivot
                </Button>
              </div>
              <p className="mt-3 text-center text-[13px] text-zinc-500 dark:text-zinc-400">Pivot saves it for later. No guilt.</p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-6">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
                <span className={cx('size-2 rounded-full', accent.solid)} /> Now
              </p>
              <p className="mt-3 text-lg font-semibold">Nothing here. That's a fine place to be.</p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">When you're ready, pick one small thing.</p>
              <div className="mt-5 flex items-center gap-2 rounded-2xl border border-zinc-900/[0.08] bg-white p-1.5 pl-4 dark:border-white/10 dark:bg-zinc-900">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && startNow()}
                  placeholder="One small thing…"
                  enterKeyHint="go"
                  className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-zinc-400"
                />
                <Button className={cx('min-h-10 px-4 py-2 text-sm', accent.solid)} disabled={!draft.trim()} onClick={startNow}>
                  Start
                </Button>
              </div>
              {later.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="soft"
                    className="text-sm"
                    onClick={() => {
                      const t = pick(later)
                      actions.promote(t.id)
                      setToast('The dice chose. No overthinking needed. 🎲')
                    }}
                  >
                    <Dices className="size-4" /> Surprise me
                  </Button>
                  <Button variant="soft" className="text-sm" onClick={() => setSheet('dump')}>
                    <Inbox className="size-4" /> Pick one
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={() => setSheet('dump')}
          className="flex min-h-14 items-center justify-between rounded-3xl bg-white/80 px-5 py-4 text-left backdrop-blur-md transition active:scale-[0.98] dark:bg-zinc-900/70"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Inbox className="size-4 text-zinc-500 dark:text-zinc-400" /> Brain dump
          </span>
          <span className="text-sm text-zinc-500 tabular-nums dark:text-zinc-400">{later.length} saved</span>
        </button>
        <button
          type="button"
          onClick={() => setSheet('capture')}
          aria-label="Quick capture"
          className={cx('grid aspect-square place-items-center rounded-3xl px-5 transition active:scale-95', accent.solid)}
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </button>
      </div>

      <BottomSheet open={sheet === 'capture'} onClose={() => setSheet(null)} title="Quick capture">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">Get it out of your head. It goes straight to the brain dump.</p>
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200/80 bg-white p-1.5 pl-4 dark:border-white/10 dark:bg-zinc-800">
          <input
            autoFocus
            value={capture}
            onChange={(e) => setCapture(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveCapture()}
            placeholder="A thought, a task, anything…"
            enterKeyHint="done"
            className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-zinc-400"
          />
          <Button className={cx('min-h-10 px-4 py-2 text-sm', accent.solid)} disabled={!capture.trim()} onClick={saveCapture}>
            Park it
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'dump'} onClose={() => setSheet(null)} title="Brain dump">
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">No order, no deadlines. Just parked thoughts.</p>
        {later.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">Empty and peaceful. 🌿</p>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {later.map((t) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-4 dark:bg-zinc-800"
                >
                  <span className="min-w-0 flex-1 py-2 text-[15px] break-words">{t.text}</span>
                  <button
                    type="button"
                    onClick={() => {
                      actions.promote(t.id)
                      setSheet(null)
                    }}
                    className={cx('flex min-h-11 items-center gap-1 rounded-xl px-3 text-[13px] font-semibold transition active:scale-95', accent.soft)}
                  >
                    <ArrowUpRight className="size-3.5" /> {nowTask ? 'Swap in' : 'Do now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.removeTask(t.id)}
                    aria-label="Delete"
                    className="grid size-11 place-items-center rounded-xl text-zinc-400 transition active:scale-90"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </BottomSheet>
    </div>
  )
}
