import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BottomNav from './components/BottomNav'
import { cx } from './components/ui'
import JournalView, { PERIOD_ICONS } from './features/journal/JournalView'
import FocusView from './features/focus/FocusView'
import SleepView from './features/sleep/SleepView'
import SettingsView from './features/settings/SettingsView'
import { PERIODS } from './lib/constants'
import { useStoredState } from './lib/storage'
import { useTheme } from './lib/theme'
import { formatLongDate, getPeriod, uid, useNow } from './lib/time'

const DEFAULT_SLEEP = { current: null, logs: [] }
const DEFAULT_SETTINGS = { name: '', theme: 'system' }
const RECENT_WAKE_MS = 14 * 3600000

export default function App() {
  const now = useNow(30000)
  const period = getPeriod(now)
  const meta = PERIODS[period]
  const accent = meta.accent

  const [tab, setTab] = useState('journal')
  const [journal, setJournal] = useStoredState('journal', [])
  const [tasks, setTasks] = useStoredState('tasks', [])
  const [sleep, setSleep] = useStoredState('sleep', DEFAULT_SLEEP)
  const [settings, setSettings] = useStoredState('settings', DEFAULT_SETTINGS)
  useTheme(settings.theme)

  /* ---------- sleep actions ---------- */
  const sleepActions = useMemo(
    () => ({
      goToBed: () => setSleep((s) => ({ ...s, current: { bedAt: Date.now() } })),
      cancelBed: () => setSleep((s) => ({ ...s, current: null })),
      wake: () => {
        const id = uid()
        const wakeAt = Date.now()
        setSleep((s) =>
          s.current ? { current: null, logs: [{ id, bedAt: s.current.bedAt, wakeAt, quality: null }, ...s.logs] } : s
        )
        return id
      },
      logRough: (hours) => {
        const id = uid()
        const wakeAt = Date.now()
        setSleep((s) => ({ ...s, logs: [{ id, bedAt: wakeAt - hours * 3600000, wakeAt, quality: null }, ...s.logs] }))
        return id
      },
      rateSleep: (id, quality) =>
        setSleep((s) => ({ ...s, logs: s.logs.map((l) => (l.id === id ? { ...l, quality } : l)) })),
      deleteLog: (id) => setSleep((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) })),
    }),
    [setSleep]
  )

  /* ---------- task actions (only ever ONE task with status 'now') ---------- */
  const taskActions = useMemo(() => {
    const demoteNow = (list) => list.map((t) => (t.status === 'now' ? { ...t, status: 'later' } : t))
    const make = (text, status) => ({ id: uid(), text, status, createdAt: Date.now(), doneAt: null })
    return {
      addTask: (text, { now: asNow = false } = {}) =>
        setTasks((list) => (asNow ? [make(text, 'now'), ...demoteNow(list)] : [make(text, 'later'), ...list])),
      addTasks: (texts) => setTasks((list) => [...texts.map((t) => make(t, 'later')), ...list]),
      completeNow: () =>
        setTasks((list) => list.map((t) => (t.status === 'now' ? { ...t, status: 'done', doneAt: Date.now() } : t))),
      // Pivot: back to the top of the brain dump, no judgement attached.
      pivotNow: () =>
        setTasks((list) => {
          const cur = list.find((t) => t.status === 'now')
          if (!cur) return list
          return [{ ...cur, status: 'later' }, ...list.filter((t) => t.id !== cur.id)]
        }),
      promote: (id) =>
        setTasks((list) => demoteNow(list).map((t) => (t.id === id ? { ...t, status: 'now' } : t))),
      removeTask: (id) => setTasks((list) => list.filter((t) => t.id !== id)),
    }
  }, [setTasks])

  /* ---------- context handed to the reflection engine ---------- */
  const lastLog = sleep.logs[0]
  const ctx = {
    inBed: !!sleep.current,
    recentLog: lastLog && now - lastLog.wakeAt < RECENT_WAKE_MS ? lastLog : null,
    hasNowTask: tasks.some((t) => t.status === 'now'),
    wake: sleepActions.wake,
    goToBed: sleepActions.goToBed,
    logRough: sleepActions.logRough,
    rateSleep: sleepActions.rateSleep,
    addTasks: taskActions.addTasks,
    setNow: (text) => taskActions.addTask(text, { now: true }),
  }

  const saveEntry = ({ date, period: p, answers }) =>
    setJournal((list) => [...list, { id: uid(), date, period: p, createdAt: Date.now(), answers }])

  const exportData = () => ({ app: 'lumen', version: 1, exportedAt: new Date().toISOString(), journal, tasks, sleep, settings })

  const importData = (data) => {
    if (!data || data.app !== 'lumen' || !Array.isArray(data.journal) || !Array.isArray(data.tasks) || !Array.isArray(data.sleep?.logs)) {
      throw new Error('invalid backup')
    }
    setJournal(data.journal)
    setTasks(data.tasks)
    setSleep({ current: data.sleep.current ?? null, logs: data.sleep.logs })
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
  }

  const resetAll = () => {
    setJournal([])
    setTasks([])
    setSleep(DEFAULT_SLEEP)
    setSettings(DEFAULT_SETTINGS)
  }

  const PeriodIcon = PERIOD_ICONS[period]

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Soft ambient glow that shifts with the time of day */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className={cx('absolute -top-32 -left-24 size-80 rounded-full blur-3xl transition-colors duration-1000', accent.blob)} />
        <div className="absolute top-1/2 -right-32 size-72 rounded-full bg-zinc-300/40 blur-3xl dark:bg-zinc-700/20" />
      </div>

      <header className="mx-auto max-w-md px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          <PeriodIcon className={cx('size-4', accent.text)} /> {formatLongDate(now)}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {meta.greeting}
          {settings.name ? `, ${settings.name}` : ''}
        </h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4 pb-36">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'journal' && (
              <JournalView
                period={period}
                now={now}
                entries={journal}
                onSaveEntry={saveEntry}
                ctx={ctx}
                name={settings.name}
              />
            )}
            {tab === 'focus' && <FocusView tasks={tasks} actions={taskActions} accent={accent} />}
            {tab === 'sleep' && <SleepView sleep={sleep} actions={sleepActions} now={now} accent={accent} />}
            {tab === 'settings' && (
              <SettingsView
                settings={settings}
                setSettings={setSettings}
                exportData={exportData}
                importData={importData}
                resetAll={resetAll}
                accent={accent}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav tab={tab} onChange={setTab} accent={accent.text} />
    </div>
  )
}
