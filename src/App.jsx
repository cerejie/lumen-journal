import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Ambient from './components/Ambient'
import BottomNav from './components/BottomNav'
import PullIndicator from './components/PullIndicator'
import Splash from './components/Splash'

import JournalView, { PERIOD_ICONS } from './features/journal/JournalView'
import FocusView from './features/focus/FocusView'
import SleepView from './features/sleep/SleepView'
import SettingsView from './features/settings/SettingsView'
import ProofView from './features/proof/ProofView'
import { PERIODS } from './lib/constants'
import { readStore, useStoredState } from './lib/storage'
import { usePullToRefresh } from './lib/pull'
import { useTheme } from './lib/theme'
import { useKeyboardInset } from './lib/keyboard'
import { useViewportFix } from './lib/viewport'
import { getPeriod, uid, useNow } from './lib/time'

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
  const [evidence, setEvidence] = useStoredState('evidence', [])
  const [proofSignal, setProofSignal] = useState(0)
  useTheme(settings.theme)
  useKeyboardInset()
  useViewportFix()
  const scrollRef = useRef(null)
  const [splash, setSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('lumen:splashed')
    } catch {
      return true
    }
  })
  const [shuffle, setShuffle] = useState(0)
  useEffect(() => {
    document.documentElement.dataset.period = period
  }, [period])

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

  /* ---------- proof (evidence bank) ---------- */
  const evidenceActions = useMemo(
    () => ({
      addEvidence: ({ kind, text, detail = null }) =>
        setEvidence((list) => [{ id: uid(), kind, text, detail, pinned: false, createdAt: Date.now() }, ...list]),
      removeEvidence: (id) => setEvidence((list) => list.filter((e) => e.id !== id)),
      togglePin: (id) => setEvidence((list) => list.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e))),
    }),
    [setEvidence]
  )

  const openAddProof = () => {
    setTab('proof')
    setProofSignal((n) => n + 1)
  }

  const closeSplash = useCallback(() => {
    try {
      sessionStorage.setItem('lumen:splashed', '1')
    } catch {
      // private mode: the splash simply shows again next time
    }
    setSplash(false)
  }, [])

  // Pull to refresh: reload what is saved on this device and show a different proof.
  const pull = usePullToRefresh(() => {
    setJournal(readStore('journal', []))
    setTasks(readStore('tasks', []))
    setSleep(readStore('sleep', DEFAULT_SLEEP))
    setEvidence(readStore('evidence', []))
    setShuffle((n) => n + 1)
  })

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
    addEvidence: evidenceActions.addEvidence,
  }

  const saveEntry = ({ date, period: p, answers }) =>
    setJournal((list) => [...list, { id: uid(), date, period: p, createdAt: Date.now(), answers }])

  const exportData = () => ({ app: 'lumen', version: 1, exportedAt: new Date().toISOString(), journal, tasks, sleep, settings, evidence })

  const importData = (data) => {
    if (!data || data.app !== 'lumen' || !Array.isArray(data.journal) || !Array.isArray(data.tasks) || !Array.isArray(data.sleep?.logs)) {
      throw new Error('invalid backup')
    }
    setJournal(data.journal)
    setTasks(data.tasks)
    setSleep({ current: data.sleep.current ?? null, logs: data.sleep.logs })
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    if (Array.isArray(data.evidence)) setEvidence(data.evidence)
  }

  const resetAll = () => {
    setJournal([])
    setTasks([])
    setSleep(DEFAULT_SLEEP)
    setSettings(DEFAULT_SETTINGS)
    setEvidence([])
  }

  const PeriodIcon = PERIOD_ICONS[period]
  const date = new Date(now).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  const headers = {
    journal: { title: `${meta.greeting}${settings.name ? `, ${settings.name}` : ''}` },
    proof: { title: 'Proof' },
    focus: { title: 'Focus' },
    sleep: { title: 'Sleep' },
    settings: { title: 'Settings' },
  }

  const views = {
    journal: (
      <JournalView
        period={period}
        now={now}
        entries={journal}
        onSaveEntry={saveEntry}
        ctx={ctx}
        name={settings.name}
        evidence={evidence}
        shuffle={shuffle}
        onAddProof={openAddProof}
      />
    ),
    proof: <ProofView evidence={evidence} actions={evidenceActions} addSignal={proofSignal} shuffle={shuffle} />,
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
    scrollRef.current?.scrollTo({ top: 0 })
  }, [tab])

  // App shell from Moti: the document never scrolls. Top bar and tab bar stay put; only the content scrolls.
  return (
    <div className="flex h-dvh flex-col overflow-hidden text-foreground">
      <Ambient period={period} />
      <header className="z-20 flex min-h-14 shrink-0 items-center gap-3 border-b border-white/30 bg-white/50 px-5 pt-[env(safe-area-inset-top)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/40">
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight">{headers[tab].title}</h1>
        <p className="ml-auto flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <PeriodIcon className="size-4 text-primary" aria-hidden />
          {date}
        </p>
      </header>

      <main ref={scrollRef} {...pull.handlers} className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-none pb-[calc(5.5rem+var(--nav-bottom))] scroll-pb-[calc(6.5rem+var(--nav-bottom))]">
        <PullIndicator pull={pull} />
        <div className="mx-auto w-full max-w-xl px-4 pt-5 pb-8">
          {/* Every tab stays mounted (the chat keeps its place); only the active one is shown, with no exit animation. */}
          {Object.entries(views).map(([id, view]) => {
            const active = tab === id
            return (
              <motion.section
                key={id}
                hidden={!active}
                aria-hidden={!active}
                initial={false}
                animate={active ? { opacity: 1 } : { opacity: 0 }}
                transition={active ? { duration: 0.18, ease: 'easeOut' } : { duration: 0 }}
              >
                {view}
              </motion.section>
            )
          })}
        </div>
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      <AnimatePresence>{splash && <Splash key="splash" evidence={evidence} name={settings.name} onDone={closeSplash} />}</AnimatePresence>
    </div>
  )
}
