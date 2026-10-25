import { OptionButton } from '../../components/ui'
import { ROUGH_HOURS, SLEEP_QUALITY } from '../../lib/constants'
import { formatDuration } from '../../lib/time'

const hi = (name) => (name ? `, ${name}` : '')
const labelOf = (options, value) => {
  const o = options.find((x) => x.value === value)
  return o ? `${o.emoji} ${o.label}` : null
}

const MOOD = [
  { value: 'heavy', emoji: '🌧️', label: 'Heavy' },
  { value: 'meh', emoji: '⛅', label: 'Meh' },
  { value: 'okay', emoji: '🌤️', label: 'Okay' },
  { value: 'bright', emoji: '☀️', label: 'Bright' },
]
const ENERGY = [
  { value: 'low', emoji: '🪫', label: 'Running low' },
  { value: 'medium', emoji: '🔋', label: 'Medium' },
  { value: 'high', emoji: '⚡', label: 'Charged' },
  { value: 'wired', emoji: '🌀', label: 'Wired / scattered' },
]
const FOG = [
  { value: 'foggy', emoji: '🌫️', label: 'Foggy' },
  { value: 'hazy', emoji: '⛅', label: 'A bit hazy' },
  { value: 'clear', emoji: '🔆', label: 'Clear' },
  { value: 'racing', emoji: '🏎️', label: 'Racing' },
]
const YES_NO = (yes, no) => [
  { value: true, emoji: yes[0], label: yes[1] },
  { value: false, emoji: no[0], label: no[1] },
]

const splitLines = (text) =>
  text
    .split(/\n|;/)
    .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)

function SleepReview({ ctx, answer }) {
  if (ctx.inBed) {
    return (
      <OptionButton
        emoji="☀️"
        label="I'm awake"
        className="w-full justify-center"
        onClick={() => answer({ logId: ctx.wake(), needsQuality: true }, "☀️ I'm awake")}
      />
    )
  }
  if (ctx.recentLog) {
    const log = ctx.recentLog
    return (
      <OptionButton
        emoji="👍"
        label="Yep, that's right"
        className="w-full justify-center"
        onClick={() => answer({ logId: log.id, needsQuality: !log.quality }, "👍 Yep, that's right")}
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2">
        {ROUGH_HOURS.map((h) => (
          <OptionButton
            key={h}
            label={`${h}h`}
            className="justify-center px-2"
            onClick={() => answer({ logId: ctx.logRough(h), needsQuality: true }, `About ${h}h`)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => answer({ needsQuality: false }, 'Skip sleep today')}
        className="mx-auto flex h-11 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground active:bg-muted"
      >
        Skip sleep today
      </button>
    </div>
  )
}

export function buildFlows({ name }) {
  return {
    morning: {
      title: 'Morning chat',
      steps: [
        {
          id: 'sleep',
          type: 'custom',
          prompt: (_, ctx) =>
            ctx.inBed
              ? `Morning${hi(name)} ☀️ You're still logged as sleeping — tap when you're up.`
              : ctx.recentLog
                ? `Morning${hi(name)} ☀️ Looks like you slept about ${formatDuration(ctx.recentLog.wakeAt - ctx.recentLog.bedAt)}.`
                : `Morning${hi(name)} ☀️ No sleep logged — totally fine. Roughly how long did you sleep?`,
          render: (props) => <SleepReview {...props} />,
        },
        {
          id: 'sleepQuality',
          type: 'choice',
          when: (a) => a.sleep?.needsQuality,
          prompt: 'How do you feel?',
          options: SLEEP_QUALITY,
          onAnswer: (v, ctx, a) => {
            if (a.sleep?.logId) ctx.rateSleep(a.sleep.logId, v)
          },
        },
        {
          id: 'mood',
          type: 'choice',
          prompt: "What's the weather like inside today?",
          options: MOOD,
          skippable: true,
          skipLabel: 'Not sure yet',
        },
        {
          id: 'intention',
          type: 'text',
          prompt: (a) =>
            a.mood === 'heavy'
              ? "Heavy days get tiny plans. What's ONE gentle intention? Tiny is perfect."
              : "What's ONE intention for today? Tiny counts.",
          placeholder: 'One small thing…',
          chips: ['Just show up', 'Drink water first', 'One small task', 'Go easy on myself'],
          skippable: true,
          skipLabel: 'Skip — just vibing today',
        },
        {
          id: 'intentionNow',
          type: 'choice',
          when: (a, ctx) => !!a.intention && !ctx.hasNowTask,
          prompt: 'Want that as your NOW task in Focus?',
          options: YES_NO(['🎯', 'Yes, make it Now'], ['🌱', 'Keep it as an intention']),
          onAnswer: (v, ctx, a) => {
            if (v) ctx.setNow(a.intention)
          },
        },
      ],
      closing: (a) =>
        a.intention
          ? `Got it: “${a.intention}”.\nThat's the whole plan. Everything else is bonus. 🌱`
          : "That's enough for this morning. You showed up — that's the whole plan. 🌱",
      summarize: (a) =>
        [
          a.sleepQuality && ['Woke up feeling', labelOf(SLEEP_QUALITY, a.sleepQuality)],
          a.mood && ['Inner weather', labelOf(MOOD, a.mood)],
          a.intention && ['Intention', a.intention],
        ].filter(Boolean),
    },

    afternoon: {
      title: 'Mid-day energy check',
      steps: [
        {
          id: 'energy',
          type: 'choice',
          prompt: `Quick check-in${hi(name)} 🔋 How's your battery?`,
          options: ENERGY,
        },
        {
          id: 'fog',
          type: 'choice',
          prompt: 'And your head — foggy or clear?',
          options: FOG,
        },
        {
          id: 'note',
          type: 'text',
          prompt: 'Anything to jot down? One line is plenty.',
          placeholder: 'A micro note…',
          chips: ['Need water', 'Need a break', 'Doing alright', 'Overstimulated'],
          skippable: true,
          skipLabel: 'Nope, all good',
        },
      ],
      closing: (a) => {
        if (a.energy === 'low' || a.fog === 'foggy')
          return 'Low battery is information, not failure.\nOne tiny thing or a real rest — both count. 🫖'
        if (a.energy === 'wired' || a.fog === 'racing')
          return 'Lots of motion up there. Try picking just one thing in Focus and letting the rest wait. 🧭'
        return "Noted. You're doing the day — that's plenty. ✨"
      },
      summarize: (a) =>
        [
          a.energy && ['Battery', labelOf(ENERGY, a.energy)],
          a.fog && ['Head', labelOf(FOG, a.fog)],
          a.note && ['Note', a.note],
        ].filter(Boolean),
    },

    evening: {
      title: 'Evening wind-down',
      steps: [
        {
          id: 'win',
          type: 'text',
          prompt: `Evening${hi(name)} 🌙 What's one tiny win from today? Anything counts.`,
          placeholder: 'One tiny win…',
          chips: ['I got out of bed', 'I ate something', 'I rested', 'I talked to someone'],
          skippable: true,
          skipLabel: "Can't think of one",
          onAnswer: (v, ctx) => {
            if (v) ctx.addEvidence({ kind: 'win', text: v })
          },
        },
        {
          id: 'dump',
          type: 'text',
          multiline: true,
          prompt: (a) =>
            `${a.win ? 'Saved to your proof. 💜' : 'Getting through the day counts. 💜'}\nAnything rattling around? Dump it here — no order, no grammar.`,
          placeholder: 'One thought per line…',
          skippable: true,
          skipLabel: 'Nothing right now',
        },
        {
          id: 'dumpToFocus',
          type: 'choice',
          when: (a) => !!a.dump,
          prompt: 'Want me to tuck those into your brain dump so tomorrow-you has them?',
          options: YES_NO(['📥', 'Yes, tuck them away'], ['💨', 'No, just letting it out']),
          onAnswer: (v, ctx, a) => {
            if (v) ctx.addTasks(splitLines(a.dump))
          },
        },
        {
          id: 'bedtime',
          type: 'choice',
          when: (_, ctx) => !ctx.inBed,
          prompt: 'Heading to bed soon?',
          options: YES_NO(['🛏️', 'Going to bed now'], ['🌙', 'Not yet']),
          onAnswer: (v, ctx) => {
            if (v) ctx.goToBed()
          },
        },
      ],
      closing: (a) =>
        a.bedtime
          ? "Sleep tracking started. Whatever didn't happen today can wait — it's not going anywhere, and neither are you. Rest well. 🌙"
          : "Day's done. Whatever didn't happen can wait — it's not going anywhere, and neither are you. 🌙",
      summarize: (a) =>
        [
          a.win && ['Tiny win', a.win],
          a.dump && ['Brain dump', a.dump],
        ].filter(Boolean),
    },
  }
}
