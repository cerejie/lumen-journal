import { useRef, useState } from 'react'
import { Download, Laptop, Moon, Share, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { Group, GroupLabel, Toast, cx } from '../../components/ui'
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
      flash('Backup imported')
    } catch {
      flash('Import failed: choose a Lumen backup .json file')
    }
  }

  const row = 'flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-[15px] transition active:bg-zinc-900/5 dark:active:bg-white/5'

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />

      <div>
        <GroupLabel>Your name</GroupLabel>
        <Group>
          <input
            id="name"
            aria-label="Your name"
            value={settings.name}
            onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value.slice(0, 30) }))}
            placeholder="Optional, used in greetings"
            className="min-h-12 w-full bg-transparent px-4 py-3 text-base outline-none placeholder:text-zinc-400"
          />
        </Group>
      </div>

      <div>
        <GroupLabel>Appearance</GroupLabel>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-zinc-900/5 p-1 dark:bg-white/5">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={settings.theme === id}
              onClick={() => setSettings((s) => ({ ...s, theme: id }))}
              className={cx(
                'flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition active:scale-95',
                settings.theme === id ? 'bg-white shadow-sm dark:bg-zinc-700' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>Home screen</GroupLabel>
        <Group>
          {install.installed ? (
            <p className={row}>
              <Smartphone className="size-4 text-zinc-400" /> Installed on this device
            </p>
          ) : install.canInstall ? (
            <button type="button" className={cx(row, 'font-semibold', accent.text)} onClick={install.promptInstall}>
              <Smartphone className="size-4" /> Add to Home Screen
            </button>
          ) : install.isIOS ? (
            <p className="px-4 py-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              In Safari, tap <Share className="inline size-4 align-[-2px]" /> Share, then <strong>Add to Home Screen</strong>.
            </p>
          ) : (
            <p className="px-4 py-3 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              Open your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
            </p>
          )}
        </Group>
      </div>

      <div>
        <GroupLabel>Your data</GroupLabel>
        <Group>
          <button type="button" className={row} onClick={onExport}>
            <Download className="size-4 text-zinc-400" /> Export backup
          </button>
          <button type="button" className={row} onClick={() => fileRef.current?.click()}>
            <Upload className="size-4 text-zinc-400" /> Import backup
          </button>
          <button
            type="button"
            className={cx(row, 'text-rose-600 dark:text-rose-400', confirmReset && 'font-semibold')}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 4000)
                return
              }
              resetAll()
              setConfirmReset(false)
              flash('All data erased')
            }}
          >
            <Trash2 className="size-4" /> {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
          </button>
        </Group>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
      </div>

      <p className="px-4 text-center text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        No accounts, no streaks, no tracking. Missed days don't exist here, only the times you showed up.
      </p>
    </div>
  )
}
