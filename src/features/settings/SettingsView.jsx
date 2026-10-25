import { useRef, useState } from 'react'
import { Download, Laptop, Moon, Share, Smartphone, Sun, Trash2, Upload } from 'lucide-react'
import { Group, GroupLabel, SheetField, Toast, cx, useToast } from '../../components/ui'
import { useInstallPrompt } from '../../lib/pwa'

const THEMES = [
  { id: 'system', label: 'Auto', icon: Laptop },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
]

const ROW = 'flex min-h-13 w-full items-center gap-3 px-4 text-left text-[15px] font-medium transition-colors active:bg-muted'

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
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1" role="radiogroup" aria-label="Appearance">
          {THEMES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.theme === id}
              onClick={() => setSettings((s) => ({ ...s, theme: id }))}
              className={cx(
                'flex h-9 items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-all',
                settings.theme === id ? 'bg-panel text-foreground shadow-xs ring-1 ring-foreground/10' : 'text-muted-foreground'
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
