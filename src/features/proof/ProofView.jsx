import { useEffect, useRef, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import ProofCard from './ProofCard'
import { BottomSheet, Button, Group, GroupLabel, Toast, cx } from '../../components/ui'
import { EVIDENCE_KINDS, kindMeta } from '../../lib/constants'

const shortDate = (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })

export default function ProofView({ evidence, actions, accent, addSignal }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [kind, setKind] = useState('win')
  const [text, setText] = useState('')
  const [detail, setDetail] = useState('')
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useState(null)
  const firstSignal = useRef(addSignal)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Another screen asked to open "Add proof" (e.g. the card on Journal).
  useEffect(() => {
    if (addSignal !== firstSignal.current) openAdd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSignal])

  const openAdd = (k = 'win') => {
    setKind(k)
    setText('')
    setDetail('')
    setSheetOpen(true)
  }

  const save = () => {
    const v = text.trim()
    if (!v) return
    actions.addEvidence({ kind, text: v, detail: detail.trim() || null })
    setSheetOpen(false)
    setToast('Saved to your proof')
  }

  const counts = Object.fromEntries(EVIDENCE_KINDS.map((k) => [k.id, evidence.filter((e) => e.kind === k.id).length]))
  const shown = filter === 'all' ? evidence : evidence.filter((e) => e.kind === filter)
  const meta = kindMeta(kind)

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />

      <ProofCard evidence={evidence} accent={accent} onAdd={() => openAdd()} />

      {evidence.length === 0 ? (
        <div>
          <GroupLabel>Start with one</GroupLabel>
          <Group>
            {EVIDENCE_KINDS.map((k) => {
              const Icon = k.icon
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => openAdd(k.id)}
                  className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition active:bg-zinc-900/5 dark:active:bg-white/5"
                >
                  <Icon className={cx('size-5 shrink-0', accent.text)} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold">{k.prompt}</span>
                  </span>
                </button>
              )
            })}
          </Group>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {[{ id: 'all', plural: 'All' }, ...EVIDENCE_KINDS.filter((k) => counts[k.id] > 0)].map((k) => (
              <button
                key={k.id}
                type="button"
                aria-pressed={filter === k.id}
                onClick={() => setFilter(k.id)}
                className={cx(
                  'min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-95',
                  filter === k.id ? accent.solid : 'bg-white/80 text-zinc-600 dark:bg-zinc-900/70 dark:text-zinc-300'
                )}
              >
                {k.plural} <span className="tabular-nums opacity-70">{k.id === 'all' ? evidence.length : counts[k.id]}</span>
              </button>
            ))}
          </div>
          <Group>
            {shown.map((e) => {
              const Icon = kindMeta(e.kind).icon
              return (
                <div key={e.id} className="flex items-start gap-3 py-2 pr-1 pl-4">
                  <Icon className={cx('mt-3 size-4 shrink-0', accent.text)} aria-label={kindMeta(e.kind).label} />
                  <div className="min-w-0 flex-1 py-2">
                    <p className="text-[15px] leading-snug break-words">{e.text}</p>
                    <p className="mt-0.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                      {e.detail ? `${e.detail}, ` : ''}
                      {shortDate(e.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={e.pinned ? 'Unpin' : 'Pin: show more often'}
                    aria-pressed={!!e.pinned}
                    onClick={() => actions.togglePin(e.id)}
                    className={cx('grid size-11 shrink-0 place-items-center rounded-xl transition active:scale-90', e.pinned ? accent.text : 'text-zinc-500 dark:text-zinc-400')}
                  >
                    <Star className="size-4" fill={e.pinned ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => actions.removeEvidence(e.id)}
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-zinc-500 dark:text-zinc-400 transition active:scale-90"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              )
            })}
          </Group>
        </div>
      )}

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add proof">
        <div className="flex flex-wrap gap-2">
          {EVIDENCE_KINDS.map((k) => {
            const Icon = k.icon
            return (
              <button
                key={k.id}
                type="button"
                aria-pressed={kind === k.id}
                onClick={() => setKind(k.id)}
                className={cx(
                  'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition active:scale-95',
                  kind === k.id ? accent.solid : 'bg-zinc-900/5 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                )}
              >
                <Icon className="size-4" /> {k.label}
              </button>
            )
          })}
        </div>
        <label htmlFor="proof-text" className="mt-5 block text-[15px] font-semibold">
          {meta.prompt}
        </label>
        <textarea
          id="proof-text"
          autoFocus
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={meta.placeholder}
          className="mt-2 max-h-40 min-h-16 w-full resize-none rounded-2xl border border-zinc-900/[0.08] bg-white px-4 py-3 text-base outline-none placeholder:text-zinc-400 dark:border-white/10 dark:bg-zinc-800"
        />
        <label htmlFor="proof-detail" className="mt-4 block text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          {kind === 'praise' ? 'Who said it? (optional)' : 'Context (optional)'}
        </label>
        <input
          id="proof-detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={kind === 'praise' ? 'My team lead' : 'Project, place or person'}
          className="mt-2 min-h-12 w-full rounded-2xl border border-zinc-900/[0.08] bg-white px-4 text-base outline-none placeholder:text-zinc-400 dark:border-white/10 dark:bg-zinc-800"
        />
        <Button className={cx('mt-5 w-full', accent.solid)} disabled={!text.trim()} onClick={save}>
          Save to proof
        </Button>
      </BottomSheet>
    </div>
  )
}
