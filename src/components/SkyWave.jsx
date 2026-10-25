import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

const SKIES = {
  night: {
    background: 'radial-gradient(circle at 50% 40%, #4c1d95 0%, #1e1b4b 45%, #020617 100%)',
    Icon: Moon,
    glow: 'shadow-[0_0_60px_20px_rgba(196,181,253,0.45)]',
    tint: 'text-violet-100',
    label: 'Good night',
  },
  morning: {
    background: 'radial-gradient(circle at 50% 45%, #fde68a 0%, #fb923c 45%, #be185d 100%)',
    Icon: Sun,
    glow: 'shadow-[0_0_60px_20px_rgba(253,230,138,0.6)]',
    tint: 'text-amber-50',
    label: 'Good morning',
  },
}

/**
 * Full-screen wave that washes out from where you tapped: twilight when you go to bed,
 * sunrise when you wake. Clears itself after about a second and a half.
 */
export default function SkyWave({ kind, origin, onDone }) {
  const sky = SKIES[kind]
  const { Icon } = sky
  const at = origin ? `${origin.x}px ${origin.y}px` : '50% 70%'

  useEffect(() => {
    const t = setTimeout(onDone, 1700)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 bottom-[calc(-1*var(--below-viewport))] z-[90] grid place-items-center"
      style={{ background: sky.background }}
      initial={{ clipPath: `circle(0% at ${at})`, opacity: 1 }}
      animate={{ clipPath: `circle(150% at ${at})`, opacity: [1, 1, 1, 0] }}
      transition={{
        clipPath: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
        opacity: { duration: 1.7, times: [0, 0.6, 0.75, 1] },
      }}
    >
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1, 1.05, 1.1] }}
        transition={{ duration: 1.6, times: [0, 0.4, 0.75, 1] }}
      >
        <motion.span
          className={`grid size-24 place-items-center rounded-full ${sky.glow} ${sky.tint}`}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon className="size-14" strokeWidth={1.5} fill="currentColor" />
        </motion.span>
        <span className={`text-xl font-semibold tracking-tight ${sky.tint}`}>{sky.label}</span>
      </motion.div>
    </motion.div>
  )
}
