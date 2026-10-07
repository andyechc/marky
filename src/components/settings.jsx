import { useState } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { Button } from './ui/button'
import { useSettings, THEMES, FONT_SIZES } from '@/context/settingsContext'
import { storage, isStorageAvailable } from '@/lib/storage'
import { cn } from '@/lib/utils'

/** Labelled row with a description, used throughout the dialog. */
function Row({ title, description, children, htmlFor }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="block text-sm font-medium">
          {title}
        </label>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

/**
 * Switch built on a native button.
 *
 * The knob needs an explicit `left`/`top`. Without them an absolutely
 * positioned child falls back to its static position, and buttons are
 * `text-align: center` by default — so the knob started centred and the
 * translate pushed it clear outside the track.
 *
 * Track 40x24 with a 1px border, knob 18: a 3px inset leaves a 14px travel, and
 * the knob sits symmetrically at 3px from whichever end it is nearest.
 */
const KNOB_TRAVEL = 'translate-x-[14px]'

function Switch({ id, checked, onChange, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-200',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-ring',
        checked ? 'border-primary bg-primary' : 'border-border bg-surface-subtle',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
            // The hairline keeps the knob readable against the pale
            // "off" track, where a plain white circle nearly disappears.
            'absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white',
            'shadow-sm ring-1 ring-inset ring-foreground/10',
            'transition-transform duration-200 ease-spring',
          checked ? KNOB_TRAVEL : 'translate-x-0',
        )}
      />
    </button>
  )
}

/** Segmented radio group for mutually exclusive options. */
function Segmented({ id, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-labelledby={id} className="flex rounded-md border border-border p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            'rounded px-2.5 py-1 text-[13px] transition-colors',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring',
            value === option.id
              ? 'bg-surface-muted font-medium text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function SettingsDialog({ open, onClose, onClearData, storageAvailable }) {
  const { settings, update, reset } = useSettings()
  const [confirming, setConfirming] = useState(false)

  const usage = storage.usage()
  const usageLabel = usage > 1024 * 1024
    ? `${(usage / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(usage / 1024))} KB`

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Ajustes"
      description="Se guardan en este navegador."
      contentClassName="max-h-[60vh] overflow-y-auto scroll-area"
    >
      <section>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Apariencia
        </h3>

        <Row title="Tema" description="Cambia el aspecto del editor y la vista previa.">
          <Segmented
            id="theme-setting"
            options={THEMES}
            value={settings.theme}
            onChange={(theme) => update({ theme })}
          />
        </Row>

        <Row title="Tamaño en el editor" description="Tamaño de fuente del área de escritura.">
          <Segmented
            id="editor-font-setting"
            options={FONT_SIZES.map((f) => ({ id: f.id, label: f.label }))}
            value={settings.editorFontSize}
            onChange={(editorFontSize) => update({ editorFontSize })}
          />
        </Row>

        <Row title="Tamaño en la vista previa" description="Tamaño de fuente del texto renderizado.">
          <Segmented
            id="preview-font-setting"
            options={FONT_SIZES.map((f) => ({ id: f.id, label: f.label }))}
            value={settings.previewFontSize}
            onChange={(previewFontSize) => update({ previewFontSize })}
          />
        </Row>
      </section>

      <div className="my-4 h-px bg-border" />

      <section>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Editor
        </h3>

        <Row
          title="Autoguardado"
          description="Guarda una copia del borrador mientras escribes."
        >
          <Switch
            id="autosave-setting"
            checked={settings.autoSave}
            onChange={(autoSave) => update({ autoSave })}
            label="Autoguardado"
          />
        </Row>

        <Row title="Números de línea" description="Muestra el número de cada línea a la izquierda.">
          <Switch
            id="line-numbers-setting"
            checked={settings.showLineNumbers}
            onChange={(showLineNumbers) => update({ showLineNumbers })}
            label="Números de línea"
          />
        </Row>

        <Row
          title="Sincronizar scroll"
          description="Al desplazarte en el editor, la vista previa sigue el mismo porcentaje."
        >
          <Switch
            id="scroll-sync-setting"
            checked={settings.syncScroll}
            onChange={(syncScroll) => update({ syncScroll })}
            label="Sincronizar scroll"
          />
        </Row>

        <Row title="Corrector ortográfico" description="Subrayado nativo del navegador.">
          <Switch
            id="spellcheck-setting"
            checked={settings.spellcheck}
            onChange={(spellcheck) => update({ spellcheck })}
            label="Corrector ortográfico"
          />
        </Row>

        <Row title="Panel lateral" description="Esquema del documento y archivos recientes.">
          <Switch
            id="sidebar-setting"
            checked={settings.showSidebar}
            onChange={(showSidebar) => update({ showSidebar })}
            label="Panel lateral"
          />
        </Row>
      </section>

      <div className="my-4 h-px bg-border" />

      <section>
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Datos
        </h3>

        <div className="py-2 text-[12.5px] text-muted-foreground">
          Espacio usado: <span className="font-medium text-foreground">{usageLabel}</span>
          {!storageAvailable && (
            <p className="mt-1 text-destructive">
              Este navegador bloquea el almacenamiento local, así que nada se guardará al cerrar.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 py-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Restablecer preferencias
          </Button>

          {confirming ? (
            <span className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClearData?.()
                  setConfirming(false)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Borrar todo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Borrar datos locales
            </Button>
          )}
        </div>
      </section>
    </Dialog>
  )
}

export { isStorageAvailable }