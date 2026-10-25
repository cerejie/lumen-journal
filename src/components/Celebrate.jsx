import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const PARTICLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2
  const distance = 90 + (i % 3) * 22
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    size: 6 + (i % 4) * 2,
    color: ['#10b981', '#34d399', '#fbbf24', '#a78bfa'][i % 4],
  }
})

/** Completion reward: a ring bursts out, confetti dots fly, a check pops. Lives inside a relative parent. */
export default function Celebrate() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 grid place-items-center overflow-visible">
      <motion.span
        className="absolute size-24 rounded-full border-4 border-emerald-400"
        initial={{ scale: 0.4, opacity: 0.9 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.span
        className="absolute size-24 rounded-full bg-emerald-400/30 blur-xl"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 2.8, opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.span
        className="relative grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_32px_rgba(16,185,129,0.6)]"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.25, 1] }}
        transition={{ duration: 0.5, times: [0, 0.6, 1], ease: 'easeOut' }}
      >
        <Check className="size-8" strokeWidth={3} />
      </motion.span>
    </div>
  )
}
