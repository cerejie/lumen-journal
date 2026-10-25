import { cx } from './ui'

/**
 * Time-of-day gradient mesh behind everything.
 * Morning: amber, peach, gold. Afternoon: azure, sky, mint. Evening: twilight violet over indigo.
 */
const MESH = {
  morning: {
    base: 'bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-orange-400/5',
    a: 'bg-amber-400/40 dark:bg-amber-500/25',
    b: 'bg-rose-300/40 dark:bg-rose-500/20',
    c: 'bg-orange-200/50 dark:bg-orange-400/15',
  },
  afternoon: {
    base: 'bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-emerald-400/5',
    a: 'bg-sky-400/40 dark:bg-sky-500/25',
    b: 'bg-indigo-300/35 dark:bg-indigo-500/20',
    c: 'bg-emerald-200/45 dark:bg-emerald-400/15',
  },
  evening: {
    base: 'bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-slate-100 dark:from-indigo-950 dark:via-purple-900/40 dark:to-slate-950',
    a: 'bg-violet-400/35 dark:bg-violet-600/30',
    b: 'bg-indigo-400/30 dark:bg-indigo-700/30',
    c: 'bg-blue-300/30 dark:bg-blue-900/40',
  },
}

export default function Ambient({ period }) {
  const m = MESH[period]
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 bottom-[calc(-1*var(--below-viewport))] -z-10 overflow-hidden bg-app">
      <div className={cx('absolute inset-0 transition-colors duration-1000', m.base)} />
      <div className={cx('ambient-a absolute -top-[15%] -left-[20%] size-[75vmax] rounded-full blur-3xl transition-colors duration-1000', m.a)} />
      <div className={cx('ambient-b absolute top-[35%] -right-[25%] size-[65vmax] rounded-full blur-3xl transition-colors duration-1000', m.b)} />
      <div className={cx('ambient-c absolute -bottom-[25%] left-[5%] size-[60vmax] rounded-full blur-3xl transition-colors duration-1000', m.c)} />
      <div className="absolute inset-0 backdrop-blur-3xl" />
    </div>
  )
}
