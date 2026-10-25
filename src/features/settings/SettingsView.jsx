import { useRef, useState } from 'react'
import { Download, Laptop, Moon, Share, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { Group, GroupLabel, SheetField, Toast, cx, useToast } from '../../components/ui'
import { useInstallPrompt } from '../../lib/pwa'

const THEMES = [
  { id: 'system', label: 'Auto', icon: Laptop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

const ROW = 'flex min-h-14 w-full items-center gap-3 px-5 text-left text-[15px] font-medium transition-all duration-300 ease-spring active:scale-[0.98] active:bg-black/5 dark:active:bg-white/5'

export default function SettingsView({ settings, setSettings, exportData, importData, resetAll }) {
  const install = useInstallPrompt()
  const fileRef = useRef(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useToast()

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
      setToast('Backup imported')
    } catch {
      setToast('Import failed: choose a Lumen backup file')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toast} />

      <div>
        <GroupLabel>Your name</GroupLabel>
        <SheetField
          id="name"
          label="Your name"
          value={settings.name}
          placeholder="Used in greetings"
          onCommit={(text) => {
            setSettings((s) => ({ ...s, name: text.slice(0, 30) }))
            setToast('Name saved')
          }}
        />
      </div>

      <div>
        <GroupLabel>Appearance</GroupLabel>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-white/50 bg-white/50 p-1 backdrop-blur-xl dark:border-white/10 dark:bg-white/5" role="radiogroup" aria-label="Appearance">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.theme === id}
              onClick={() => setSettings((s) => ({ ...s, theme: id }))}
              className={cx(
                'flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-spring active:scale-[0.96]',
                settings.theme === id ? 'bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:bg-white/15' : 'text-muted-foreground'
              )}
            >
              <Icon className="size-4" aria-hidden /> {label}
            </button>
          ))}
        </div>
      </div>

      {!install.installed && (
        <div>
          <GroupLabel>Home screen</GroupLabel>
          <Group>
            {install.canInstall ? (
              <button type="button" className={cx(ROW, 'text-primary')} onClick={install.promptInstall}>
                <Smartphone className="size-5" aria-hidden /> Add to Home Screen
              </button>
            ) : (
              <p className="px-4 py-3.5 text-[15px] leading-relaxed text-muted-foreground">
                {install.isIOS ? (
                  <>
                    In Safari, tap <Share className="inline size-4 align-[-2px]" aria-label="Share" /> then <span className="font-medium text-foreground">Add to Home Screen</span>.
                  </>
                ) : (
                  <>
                    Open the browser menu and choose <span className="font-medium text-foreground">Install app</span>.
                  </>
                )}
              </p>
            )}
          </Group>
        </div>
      )}

      <div>
        <GroupLabel>Data</GroupLabel>
        <Group>
          <button type="button" className={ROW} onClick={onExport}>
            <Download className="size-5 text-muted-foreground" aria-hidden /> Export backup
          </button>
          <button type="button" className={ROW} onClick={() => fileRef.current?.click()}>
            <Upload className="size-5 text-muted-foreground" aria-hidden /> Import backup
          </button>
          <button
            type="button"
            className={cx(ROW, 'text-red-600 dark:text-red-400')}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true)
                setTimeout(() => setConfirmReset(false), 4000)
                return
              }
              resetAll()
              setConfirmReset(false)
              setToast('All data erased')
            }}
          >
            <Trash2 className="size-5" aria-hidden /> {confirmReset ? 'Tap again to erase everything' : 'Erase all data'}
          </button>
        </Group>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
      </div>
    </div>
  )
}
