import { motion } from 'framer-motion'
import { Mic, Square } from 'lucide-react'
import { PRESS, cx } from './ui'

/** Big tactile mic. While listening, rings ripple out from it like a soundwave. */
export default function MicButton({ listening, onClick, size = 'lg', className }) {
  const dims = size === 'lg' ? 'size-14' : 'size-9'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={listening ? 'Stop listening' : 'Speak your answer'}
      aria-pressed={listening}
      className={cx('relative grid shrink-0 place-items-center rounded-full', dims, PRESS, className)}
    >
      {listening &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/30"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.1, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: 'easeOut' }}
          />
        ))}
      <span
        className={cx(
          'relative grid size-full place-items-center rounded-full transition-colors duration-300',
          listening
            ? 'bg-primary text-primary-foreground shadow-[var(--shadow-glow)]'
            : 'border border-white/50 bg-white/60 text-foreground shadow-[var(--shadow-glass-inner)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10'
        )}
      >
        {listening ? <Square className={size === 'lg' ? 'size-5' : 'size-3.5'} fill="currentColor" /> : <Mic className={size === 'lg' ? 'size-6' : 'size-4'} />}
      </span>
    </button>
  )
}

/** Live soundwave bars shown next to what's being heard. */
export function SoundWave() {
  return (
    <span aria-hidden className="flex h-4 items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-0.5 rounded-full bg-primary"
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}
