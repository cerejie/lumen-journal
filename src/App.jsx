import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import BottomNav from './components/BottomNav'
import { PageHeader, cx } from './components/ui'
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
  const date = formatLongDate(now)
  const headers = {
    journal: { title: `${meta.greeting}${settings.name ? `, ${settings.name}` : ''}`, subtitle: date, icon: PeriodIcon },
    focus: { title: 'Focus', subtitle: 'One thing at a time' },
    sleep: { title: 'Sleep', subtitle: 'One tap at night, one in the morning' },
    settings: { title: 'Settings', subtitle: 'Everything stays on this device' },
  }

  const views = {
    journal: (
      <JournalView period={period} now={now} entries={journal} onSaveEntry={saveEntry} ctx={ctx} name={settings.name} />
    ),
    focus: <FocusView tasks={tasks} actions={taskActions} accent={accent} />,
    sleep: <SleepView sleep={sleep} actions={sleepActions} now={now} accent={accent} />,
    settings: (
      <SettingsView
        settings={settings}
        setSettings={setSettings}
        exportData={exportData}
        importData={importData}
        resetAll={resetAll}
        accent={accent}
      />
    ),
  }

  // Each tab opens at the top.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className={cx('absolute -top-40 -left-32 size-96 rounded-full blur-3xl transition-colors duration-1000', accent.blob)} />
      </div>

      <main className="mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),24px)] pb-36">
        {/*
          Every tab stays mounted so the chat keeps its place; only the active one is visible.
          There is no exit animation, so two tabs can never be on screen at once.
        */}
        {Object.entries(views).map(([id, view]) => {
          const active = tab === id
          const h = headers[id]
          return (
            <motion.section
              key={id}
              hidden={!active}
              aria-hidden={!active}
              initial={false}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
              transition={active ? { duration: 0.22, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
            >
              <PageHeader title={h.title} subtitle={h.subtitle} icon={h.icon} accent={accent.text} />
              {view}
            </motion.section>
          )
        })}
      </main>

      <BottomNav tab={tab} onChange={setTab} accent={accent.text} />
    </div>
  )
}
