import { RefreshCw } from 'lucide-react'
import { cx } from './ui'

/** TARTAR's PullIndicator: a round panel badge that turns as you pull and spins while refreshing. */
export default function PullIndicator({ pull }) {
  if (!pull.visible) return null
  return (
    <div
      className={cx('flex items-end justify-center overflow-hidden', pull.refreshing && 'transition-[height] duration-200')}
      style={{ height: pull.height }}
      role="status"
      aria-live="polite"
    >
      <span
        className={cx(
          'mb-2 flex size-9 items-center justify-center rounded-full bg-panel shadow-sm ring-1 ring-foreground/10 [&_svg]:size-4',
          pull.ready || pull.refreshing ? 'text-primary' : 'text-muted-foreground',
          pull.refreshing && '[&_svg]:animate-spin'
        )}
      >
        <RefreshCw
          aria-label={pull.refreshing ? 'Refreshing' : 'Pull to refresh'}
          style={pull.refreshing ? undefined : { rotate: `${pull.rotation}deg` }}
        />
      </span>
    </div>
  )
}
