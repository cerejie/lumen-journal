import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

const AUTO_DISMISS_MS = 2600

/** The app mark: a crescent cut from a warm-to-violet disc, drawn so it can animate. */
function Mark() {
  return (
    <svg viewBox="0 0 120 120" className="size-24" aria-hidden>
      <defs>
        <linearGradient id="splash-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <mask id="splash-m">
          <rect width="120" height="120" fill="white" />
          <motion.circle
            r="38"
            fill="black"
            initial={{ cx: 120, cy: 20 }}
            animate={{ cx: 78, cy: 46 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </mask>
      </defs>
      <motion.circle
        cx="60"
        cy="60"
        r="44"
        fill="url(#splash-g)"
        mask="url(#splash-m)"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '60px 60px' }}
      />
    </svg>
  )
}

/**
 * Launch screen. Shows the mark and one line of the person's own proof.
 * Tap anywhere or swipe up to go straight in; otherwise it leaves by itself.
 */
export default function Splash({ evidence, name, onDone }) {
  const line = useMemo(() => {
    if (!evidence.length) return null
    return evidence[Math.floor(Math.random() * evidence.length)].text
  }, [evidence])

  useEffect(() => {
    const t = setTimeout(onDone, line ? AUTO_DISMISS_MS + 800 : AUTO_DISMISS_MS)
    return () => clearTimeout(t)
  }, [onDone, line])

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label="Open Lumen"
      onClick={onDone}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && onDone()}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.1 }}
      onDragEnd={(_, info) => {
        if (info.offset.y < -60 || info.velocity.y < -400) onDone()
      }}
      className="fixed inset-0 z-[100] flex cursor-pointer touch-none flex-col items-center justify-center bg-app px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-center outline-none select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.3, ease: 'easeIn' } }}
    >
      <Mark />
      <motion.p
        className="mt-5 text-2xl font-semibold tracking-tight"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        {name ? `Hi, ${name}` : 'Lumen'}
      </motion.p>
      {line && (
        <motion.blockquote
          className="font-proof mt-3 max-w-xs text-lg leading-snug text-balance text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {line}
        </motion.blockquote>
      )}
      <motion.p
        className="absolute bottom-[calc(env(safe-area-inset-bottom)+2.5rem)] text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5, 1] }}
        transition={{ delay: 1.2, duration: 1.6 }}
      >
        Tap to start
      </motion.p>
    </motion.div>
  )
}
