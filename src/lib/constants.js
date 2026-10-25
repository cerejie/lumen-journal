export const PERIODS = {
  morning: {
    label: 'Morning',
    greeting: 'Good morning',
    accent: {
      text: 'text-amber-600 dark:text-amber-300',
      soft: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
      solid: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-zinc-950',
      ring: 'focus-within:ring-amber-400/50',
      blob: 'bg-amber-300/50 dark:bg-amber-500/15',
    },
  },
  afternoon: {
    label: 'Afternoon',
    greeting: 'Good afternoon',
    accent: {
      text: 'text-sky-600 dark:text-sky-300',
      soft: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
      solid: 'bg-sky-500 text-white dark:bg-sky-400 dark:text-zinc-950',
      ring: 'focus-within:ring-sky-400/50',
      blob: 'bg-sky-300/50 dark:bg-sky-500/15',
    },
  },
  evening: {
    label: 'Evening',
    greeting: 'Good evening',
    accent: {
      text: 'text-violet-600 dark:text-violet-300',
      soft: 'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200',
      solid: 'bg-violet-500 text-white dark:bg-violet-400 dark:text-zinc-950',
      ring: 'focus-within:ring-violet-400/50',
      blob: 'bg-violet-300/50 dark:bg-violet-500/15',
    },
  },
}

export const SLEEP_QUALITY = [
  { value: 'tired', emoji: '😴', label: 'Still tired' },
  { value: 'groggy', emoji: '🥱', label: 'Groggy' },
  { value: 'okay', emoji: '🙂', label: 'Okay' },
  { value: 'rested', emoji: '⚡', label: 'Rested' },
]

export const qualityEmoji = (value) => SLEEP_QUALITY.find((q) => q.value === value)?.emoji ?? ''

export const ROUGH_HOURS = [5, 6, 7, 8, 9]

export const DONE_MESSAGES = [
  'Done. That counts. 🎉',
  'Look at you go. ✨',
  'One thing, finished. That’s the whole game. 🎉',
  'Nice. Your brain earned a tiny dopamine snack. 🍪',
  'Done is beautiful. 🌟',
]

export const PIVOT_MESSAGES = [
  'Pivoted. Saved for later — smart move, not a miss. 🔄',
  'Parked safely. It’ll wait for you. 🔄',
  'Changing course is a skill. Nice pivot. 🧭',
  'Saved for later. No timer, no guilt. 🌿',
]

export const pick = (list) => list[Math.floor(Math.random() * list.length)]
