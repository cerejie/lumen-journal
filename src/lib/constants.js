import { Mountain, Quote, Rocket, Trophy, Wrench } from 'lucide-react'

// Every period uses the same token classes; the actual hue comes from :root[data-period] in index.css.
const ACCENT = {
  text: 'text-primary',
  soft: 'bg-primary-soft text-foreground',
  solid: 'bg-primary text-primary-foreground',
}

export const PERIODS = {
  morning: { label: 'Morning', greeting: 'Good morning', accent: ACCENT },
  afternoon: { label: 'Afternoon', greeting: 'Good afternoon', accent: ACCENT },
  evening: { label: 'Evening', greeting: 'Good evening', accent: ACCENT },
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

/* ---------- Proof (evidence bank against impostor syndrome) ---------- */

export const EVIDENCE_KINDS = [
  {
    id: 'win',
    label: 'Win',
    plural: 'Wins',
    icon: Trophy,
    prompt: 'What went well?',
    placeholder: 'Fixed a bug nobody else could find',
  },
  {
    id: 'praise',
    label: 'Kind words',
    plural: 'Kind words',
    icon: Quote,
    prompt: 'What did someone say about you or your work?',
    placeholder: 'Client said the system saves them hours every week',
  },
  {
    id: 'skill',
    label: 'Skill',
    plural: 'Skills',
    icon: Wrench,
    prompt: 'What can you do that you once couldn’t?',
    placeholder: 'I can build a full app from an empty folder',
  },
  {
    id: 'built',
    label: 'Built',
    plural: 'Built',
    icon: Rocket,
    prompt: 'What did you build or ship?',
    placeholder: 'Shipped a working PWA in one night',
  },
  {
    id: 'overcame',
    label: 'Got through',
    plural: 'Got through',
    icon: Mountain,
    prompt: 'What hard thing did you get through?',
    placeholder: 'Learned networking with nobody teaching me',
  },
]

export const kindMeta = (id) => EVIDENCE_KINDS.find((k) => k.id === id) ?? EVIDENCE_KINDS[0]
