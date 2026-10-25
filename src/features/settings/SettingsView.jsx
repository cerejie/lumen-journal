import { useRef, useState } from 'react'
import { Download, Laptop, Moon, Share, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { Button, Card, Toast, cx } from '../../components/ui'
import { useInstallPrompt } from '../../lib/pwa'

const THEMES = [
  { id: 'system', label: 'Auto', icon: Laptop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

export default function SettingsView({ settings, setSettings, exportData, importData, resetAll, accent }) {
  const install = useInstallPrompt()
  const fileRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState(null)

  const flash = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const onExport = () => {
    const blob = new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumen-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      importData(JSON.parse(await file.text()))
      flash('Backup restored ✨')
    } catch {
      flash("That file didn't look like a Lumen backup.")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Toast message={toast} />
      <div className="px-1">
        <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Everything stays on this device.</p>
      </div>

      <Card>
        <label className="text-xs font-semibold tracking-wide text-zinc-400 uppercase" htmlFor="name">
          What should I call you?
        </label>
        <input
          id="name"
          value={settings.name}
          onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value.slice(0, 30) }))}
          placeholder="Optional"
          className="mt-2 w-full rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 text-base outline-none dark:border-white/10 dark:bg-zinc-800/80"
        />
      </Card>

      <Card>
        <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Appearance</p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl bg-zinc-900/5 p-1 dark:bg-white/5">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSettings((s) => ({ ...s, theme: id }))}
              className={cx(
                'flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition active:scale-95',
                settings.theme === id ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Home screen</p>
        {install.installed ? (
          <p className="mt-2 text-sm">Installed. You're all set 📱</p>
        ) : install.canInstall ? (
          <Button className={cx('mt-3 w-full', accent.solid)} onClick={install.promptInstall}>
            <Smartphone className="size-5" /> Add to Home Screen
          </Button>
        ) : install.isIOS ? (
          <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-zinc-600 dark:text-zinc-300">
            In Safari, tap <Share className="inline size-4" /> Share, then <strong>Add to Home Screen</strong>.
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
          </p>
        )}
      </Card>

      <Card>
        <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">Your data</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="soft" className="text-sm" onClick={onExport}>
            <Download className="size-4" /> Export
          </Button>
          <Button variant="soft" className="text-sm" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </div>
        <Button
          variant="ghost"
          className={cx('mt-2 w-full text-sm', confirmReset && 'text-rose-600 dark:text-rose-400')}
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true)
              setTimeout(() => setConfirmReset(false), 4000)
              return
            }
            resetAll()
            setConfirmReset(false)
            flash('Fresh start. 🌱')
          }}
        >
          <Trash2 className="size-4" /> {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
        </Button>
      </Card>

      <p className="px-4 text-center text-xs leading-relaxed text-zinc-400">
        Lumen has no accounts, no streaks and no tracking. Missed days don't exist here — only the moments you showed up.
      </p>
    </div>
  )
}
