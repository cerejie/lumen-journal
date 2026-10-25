# Lumen — Gentle Journal & Focus

A minimal, mobile-first PWA for ADHD brains that freeze on perfectionism and fight impostor syndrome. No streaks, no missed days, no blank forms. One small question at a time, and a running record of what you've actually done.

## Features

- **Proof (evidence bank)**: log wins, kind words, skills, things you built and hard things you got through. Your own evidence, not generic quotes. Star items to see them more often.
- **Daily proof card**: the top of Journal shows one real item from your bank each day, with *Another* to shuffle. Evening "tiny wins" are saved to Proof automatically.
- **Adaptive reflection chat** — detects the time of day and shows only that check-in:
  - Morning (06:00–11:59): sleep review → how you feel → one intention (optionally becomes your NOW task)
  - Afternoon (12:00–16:59): battery + brain-fog taps → optional micro note
  - Evening (17:00–05:59): one tiny win → brain dump (optionally tucked into Focus) → "going to bed?"
- **Zero-guilt UX** — missed reflections are never shown. Only completed check-ins from *today* appear under "Earlier today".
- **NOW focus engine** — only one active task. Done 🎉 or Pivot 🔄 (saves for later, no shame). Brain dump is hidden in a sheet; "Surprise me" picks for you when choosing is the hard part.
- **1-tap sleep tracker** — Going to Bed / I'm Awake, auto duration, emoji quality check, "Oops, not in bed yet" undo, and rough manual logging (5–9h) for nights you forgot to tap.
- **Settings** — name, Auto/Light/Dark theme, install button, JSON export/import, erase all.
- **Offline PWA** — web manifest + service worker; everything lives in `localStorage` (keys prefixed `lumen:`). No accounts, no server.

## Stack

React 19 · Vite · Tailwind CSS v4 · Framer Motion · Lucide React

## Run locally

```bash
yarn
yarn dev          # http://localhost:5173
```

Production build + preview (service worker is only registered in production builds):

```bash
yarn build
yarn preview      # http://localhost:4173
```

To test on your phone over Wi-Fi: `yarn dev --host`, then open the printed Network URL. Install-to-home-screen needs HTTPS, so use a deploy for that.

## Deploy

**Vercel** — import the repo at vercel.com/new. Framework preset: Vite. Build `yarn build`, output `dist`. `vercel.json` makes sure `sw.js` is never cached stale.

**Netlify** — import the repo; `netlify.toml` already sets build command and publish dir.

Then open the site on your phone:
- **Android / Chrome:** Settings tab → *Add to Home Screen* (or browser menu → Install app)
- **iPhone / Safari:** Share → *Add to Home Screen*

## Project layout

```
public/
  manifest.webmanifest   PWA manifest
  sw.js                  service worker (offline shell; bump VERSION to bust caches)
  icons/                 app icons (192, 512, maskable, apple-touch)
src/
  App.jsx                state, actions, layout, tab routing
  lib/                   storage hook, time-of-day helpers, theme, install prompt, constants
  components/            UI primitives (Card, Button, BottomSheet, Toast) + BottomNav
  features/journal/      ChatWizard engine + flow definitions per period
  features/focus/        NOW task engine + brain dump
  features/sleep/        sleep tracker + log
  features/proof/        evidence bank + daily proof card
  features/settings/     preferences + backup
```

### Adding or changing a question

Edit `src/features/journal/flows.jsx`. Each step is data:

```js
{ id: 'energy', type: 'choice', prompt: "How's your battery?", options: [...], skippable: true }
{ id: 'note', type: 'text', prompt: 'Anything to jot down?', chips: [...], multiline: true }
{ id: 'x', type: 'custom', render: ({ answer, ctx }) => <MyButtons /> }
```

`when(answers, ctx)` makes a step conditional; `onAnswer(value, ctx, answers)` runs a side effect (e.g. start sleep tracking).

## Data shape (localStorage)

| Key | Shape |
| --- | --- |
| `lumen:journal` | `[{ id, date: 'YYYY-MM-DD', period, createdAt, answers }]` — a day runs 06:00→05:59 |
| `lumen:tasks` | `[{ id, text, status: 'now' \| 'later' \| 'done', createdAt, doneAt }]` |
| `lumen:sleep` | `{ current: { bedAt } \| null, logs: [{ id, bedAt, wakeAt, quality }] }` |
| `lumen:evidence` | `[{ id, kind: 'win' \| 'praise' \| 'skill' \| 'built' \| 'overcame', text, detail, pinned, createdAt }]` |
| `lumen:settings` | `{ name, theme: 'system' \| 'light' \| 'dark' }` |

## Mobile behaviour

- **App shell (from Moti):** fixed top bar, docked tab bar, and the document never scrolls; only the content area does. This stops iOS from leaving the tab bar stranded after the keyboard closes.
- **Input drawer (from TARTAR):** on touch devices every text field is a tap target that opens a bottom sheet sitting on top of the keyboard (`SheetField` / `FieldSheet` in `src/components/ui.jsx`, keyboard tracking in `src/lib/keyboard.js`). On desktop the same field is an inline input.
- **Controls:** `Input`, `Textarea`, `InputGroup`, `Label` and `Button` use the same classes and tokens as TARTAR and Moti's `components/ui`.

## Design workflow

The [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) skill is vendored in `.claude/skills/ui-ux-pro-max`, so Claude Code picks it up in this repo. Run its pre-delivery checklist (`references/pro-rules.md`) before shipping UI changes.
