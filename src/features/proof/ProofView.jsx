import { useEffect, useRef, useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import ProofCard from './ProofCard'
import { Button, Chip, Group, GroupLabel, Input, Label, Sheet, Textarea, Toast, cx, useToast } from '../../components/ui'
import { EVIDENCE_KINDS, kindMeta } from '../../lib/constants'

const shortDate = (ts) => new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })

const ICON_BUTTON =
  'relative grid size-9 shrink-0 place-items-center rounded-full transition-all duration-300 ease-spring after:absolute after:-inset-1 active:scale-90'

export default function ProofView({ evidence, actions, addSignal, shuffle }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [kind, setKind] = useState('win')
  const [text, setText] = useState('')
  const [detail, setDetail] = useState('')
  const [filter, setFilter] = useState('all')
  const [toast, setToast] = useToast()
  const firstSignal = useRef(addSignal)

  const openAdd = (k = 'win') => {
    setKind(k)
    setText('')
    setDetail('')
    setSheetOpen(true)
  }

  // The card on Journal asks this tab to open "Add proof".
  useEffect(() => {
    if (addSignal !== firstSignal.current) openAdd()
  }, [addSignal])

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
      <ProofCard evidence={evidence} shuffle={shuffle} onAdd={() => openAdd()} />

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
                  className="flex min-h-13 w-full items-center gap-3 px-4 py-3 text-left text-[15px] font-medium transition-all duration-300 ease-spring active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5"
                >
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  {k.prompt}
                </button>
              )
            })}
          </Group>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {[{ id: 'all', plural: 'All' }, ...EVIDENCE_KINDS.filter((k) => counts[k.id] > 0)].map((k) => (
              <Chip key={k.id} active={filter === k.id} onClick={() => setFilter(k.id)}>
                {k.plural}
                <span className="tabular-nums opacity-70">{k.id === 'all' ? evidence.length : counts[k.id]}</span>
              </Chip>
            ))}
          </div>
          <Group>
            {shown.map((e) => {
              const m = kindMeta(e.kind)
              const Icon = m.icon
              return (
                <div key={e.id} className="flex items-start gap-3 py-3 pr-2 pl-4">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-label={m.label} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug break-words">{e.text}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {e.detail ? `${e.detail}, ` : ''}
                      {shortDate(e.createdAt)}
                    </p>
                  </div>
                  <div className="-my-1 flex shrink-0">
                    <button
                      type="button"
                      aria-label={e.pinned ? 'Unstar' : 'Star: show more often'}
                      aria-pressed={!!e.pinned}
                      onClick={() => actions.togglePin(e.id)}
                      className={cx(ICON_BUTTON, e.pinned ? 'text-primary' : 'text-muted-foreground')}
                    >
                      <Star className="size-4" fill={e.pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete"
                      onClick={() => actions.removeEvidence(e.id)}
                      className={cx(ICON_BUTTON, 'text-muted-foreground')}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </Group>
        </div>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Add proof" labelFor="proof-text">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {EVIDENCE_KINDS.map((k) => {
            const Icon = k.icon
            return (
              <Chip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
                <Icon className="size-4" aria-hidden /> {k.label}
              </Chip>
            )
          })}
        </div>
        <Textarea
          id="proof-text"
          autoFocus
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={meta.prompt}
          className="min-h-28 rounded-2xl border-2 border-primary px-4 py-3 focus-visible:border-primary focus-visible:ring-0"
        />
        <div className="flex flex-col gap-2 pt-1">
          <Label htmlFor="proof-detail" className="text-muted-foreground">
            {kind === 'praise' ? 'Who said it' : 'Context'} (optional)
          </Label>
          <Input
            id="proof-detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={kind === 'praise' ? 'My team lead' : 'Project, place or person'}
            className="h-11 px-3"
          />
        </div>
        <Button size="lg" className="mt-1 w-full" disabled={!text.trim()} onClick={save}>
          Save
        </Button>
      </Sheet>
    </div>
  )
}
