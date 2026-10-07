import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ClipboardCopy,
  Download,
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { ScrollRail } from '@/components/ui/scroll-rail'
import {
  applyTemplate,
  blankFactors,
  composeAgentDoc,
  FACTORS,
  normalizeFactors,
  OUTPUT_LANGUAGES,
  sanitizeFileName,
  TARGET_FILES,
  TEMPLATE_CATALOG,
} from '@/lib/agentInstructions'
import { storage, STORAGE_KEYS } from '@/lib/storage'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils'

const DRAFT_KEY = STORAGE_KEYS.instructionDraft

/**
 * The sidebar entry point: a CTA that opens the generator.
 *
 * Only the button lives in the sidebar. The dialog is rendered at the app root
 * like every other modal, so its fields do not end up ahead of the editor in
 * document order.
 */
export function AiInstructionsCta({ onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-2 mb-2 flex w-[calc(100%-1rem)] items-center gap-2.5 rounded-lg border
                 border-border bg-surface-muted/40 p-2.5 text-left transition-colors
                 hover:border-primary/40 hover:bg-surface-muted
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                 focus-visible:outline-ring"
      >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                   bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="truncate text-[13px] font-medium">Instrucciones para IA</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
          Genera tu archivo de contexto
        </span>
      </span>
      <Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}

/**
 * The generator form.
 *
 * Nothing here talks to a model. The factors are assembled into a markdown draft
 * that lands in the editor, and the user rewrites whatever they want from there —
 * which is the point: these files live in the repo root and have to read like the
 * project, not like a form someone filled in.
 *
 * Download and copy are both offered explicitly rather than behind one action,
 * because "save it into my repo" and "paste it in a chat" are different intents.
 */
export function AiInstructionsDialog({ open, onClose, onLoadIntoEditor }) {
  const [factors, setFactors] = useState(blankFactors)
  const [fileName, setFileName] = useState('AGENT.md')
  const [selectedTemplate, setSelectedTemplate] = useState('blank')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [status, setStatus] = useState('')
  const hydrated = useRef(false)

  // Restore the half-written form, so closing the modal does not cost the work.
  useEffect(() => {
    if (!open) return
    const raw = storage.get(DRAFT_KEY, null)
    setFactors(normalizeFactors(raw?.factors))
    setFileName(typeof raw?.fileName === 'string' && raw.fileName ? raw.fileName : 'AGENT.md')
    setSelectedTemplate(typeof raw?.template === 'string' ? raw.template : 'blank')
    setStatus('')
    hydrated.current = true
  }, [open])

  // Debounced rather than on every keystroke: the JSON write is the expensive
  // part, not the change. Serialised because the debounce compares by identity
  // and a fresh object literal would never settle.
  const debounced = useDebouncedValue(
    `${JSON.stringify({ factors, fileName, template: selectedTemplate })}`,
    400,
  )
  useEffect(() => {
    if (!hydrated.current) return
    storage.set(DRAFT_KEY, JSON.parse(debounced))
  }, [debounced])

  const preview = useMemo(() => composeAgentDoc(factors), [factors])

  const setFactor = useCallback((id, value) => {
    setFactors((prev) => ({ ...prev, [id]: value }))
  }, [])

  const pickTemplate = useCallback((templateId) => {
    setSelectedTemplate(templateId)
    setFactors((prev) => {
      const { fileName: suggested } = applyTemplate(templateId, prev)
      // Only take the template's filename while the field is untouched, so
      // picking a template to peek at its tone cannot rename your file.
      setFileName((current) => (current === 'AGENT.md' && suggested ? suggested : current))
      return applyTemplate(templateId, prev).factors
    })
  }, [])

  const clearAll = useCallback(() => {
    setFactors(blankFactors())
    setFileName('AGENT.md')
    setSelectedTemplate('blank')
    setStatus('')
  }, [])

  const loadIntoEditor = useCallback(() => {
    if (!preview) {
      setStatus('Rellena al menos el nombre o el stack.')
      return
    }
    const safeName = sanitizeFileName(fileName)
    onClose()
    onLoadIntoEditor?.({ text: preview, fileName: safeName })
  }, [fileName, onClose, onLoadIntoEditor, preview])

  const copy = useCallback(async () => {
    if (!preview) {
      setStatus('Rellena al menos el nombre o el stack.')
      return
    }
    try {
      await navigator.clipboard.writeText(preview)
      setStatus('Copiado al portapapeles.')
    } catch {
      setStatus('No se pudo copiar. Cópialo desde el editor.')
    }
  }, [preview])

  const download = useCallback(() => {
    if (!preview) {
      setStatus('Rellena al menos el nombre o el stack.')
      return
    }
    const safeName = sanitizeFileName(fileName)
    const blob = new Blob([preview], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = safeName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    // Revoke on the next tick so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setStatus(`Descargado como ${safeName}.`)
  }, [fileName, preview])

  const core = FACTORS.filter((f) => !f.advanced)
  const advanced = FACTORS.filter((f) => f.advanced)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Instrucciones para IA"
      description="Elige una plantilla y ajusta lo que necesites."
      footer={
        <>
          <span
            role="status"
            className="mr-auto truncate text-[12px] text-muted-foreground"
          >
            {status || `${preview.length} caracteres`}
          </span>
          <Button variant="secondary" onClick={download} disabled={!preview}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Descargar
          </Button>
          <Button variant="secondary" onClick={copy} disabled={!preview}>
            <ClipboardCopy className="h-3.5 w-3.5" aria-hidden="true" />
            Copiar
          </Button>
          <Button variant="primary" onClick={loadIntoEditor} disabled={!preview}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Cargar en el editor
          </Button>
        </>
      }
    >
      {/*
        The temperature and the intended use are on the card because two
        templates you cannot tell apart are not a choice.
      */}
      <ScrollRail
        label="Plantillas"
        step="item"
        header={
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Plantilla
          </span>
        }
      >
          {TEMPLATE_CATALOG.map((template) => {
            const selected = template.id === selectedTemplate
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => pickTemplate(template.id)}
                aria-pressed={selected}
                title={`${template.useCase}. ${template.characteristics.join('. ')}.`}
                className={cn(
                  'flex w-[13rem] shrink-0 snap-start flex-col gap-1 rounded-lg border p-2.5',
                  'text-left transition-all duration-150',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  selected
                    ? 'border-primary/60 bg-primary/5 shadow-sm'
                    : 'border-border bg-surface hover:-translate-y-px hover:border-primary/40 hover:bg-surface-muted hover:shadow-sm',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {template.name}
                  </span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />}
                </span>
                <span className="w-fit rounded-full bg-primary/10 px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-primary">
                  {template.temperature}
                </span>
                <span className="text-[11.5px] leading-snug text-muted-foreground">
                  {template.useCase}
                </span>
              </button>
            )
          })}
      </ScrollRail>

      <div>
        <ScrollRail
          label="Nombres de archivo sugeridos"
          step="chip"
          header={
            <label
              htmlFor="instruction-filename"
              className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nombre del archivo
            </label>
          }
        >
          {TARGET_FILES.map((preset) => {
            const selected = fileName === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setFileName(preset)}
                aria-pressed={selected}
                className={cn(
                  'shrink-0 snap-start whitespace-nowrap rounded-full border px-2.5 py-1',
                  'font-mono text-[11.5px] transition-all duration-150',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  selected
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {preset}
              </button>
            )
          })}
        </ScrollRail>
        <div className="mt-2 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            id="instruction-filename"
            type="text"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="AGENT.md"
            aria-label="Nombre del archivo"
            className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono
                       text-[12px] outline-none transition-colors
                       focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
          />
        </div>
      </div>

      <div className="space-y-3">
        {core.map((factor) => (
          <FactorField
            key={factor.id}
            factor={factor}
            value={factors[factor.id]}
            onChange={setFactor}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        onClick={() => setShowAdvanced((v) => !v)}
        aria-expanded={showAdvanced}
        className="w-full justify-start text-[11px] font-semibold uppercase tracking-wider"
      >
        <Plus
          className={`h-3 w-3 transition-transform duration-200 ${showAdvanced ? 'rotate-45' : ''}`}
          aria-hidden="true"
        />
        Avanzados
      </Button>

      {showAdvanced && (
        <div className="space-y-3">
          {advanced.map((factor) => (
            <FactorField
              key={factor.id}
              factor={factor}
              value={factors[factor.id]}
              onChange={setFactor}
            />
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={clearAll} className="w-full text-muted-foreground">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        Limpiar formulario
      </Button>
    </Dialog>
  )
}

/** One factor. Textareas throughout, since every factor is prose or a list. */
function FactorField({ factor, value, onChange }) {
  const id = `instruction-${factor.id}`

  if (factor.choice === 'outputLanguage') {
    return (
      <div>
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {factor.label}
        </label>
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(factor.id, event.target.value)}
          className="mt-1 h-8 w-full rounded-md border border-border bg-background px-2 text-[13px]
                     outline-none transition-colors
                     focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
        >
          <option value="">Sin especificar</option>
          {Object.values(OUTPUT_LANGUAGES).map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11.5px] text-muted-foreground">{factor.hint}</p>
      </div>
    )
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {factor.label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(factor.id, event.target.value)}
        placeholder={factor.placeholder}
        rows={factor.rows}
        className="mt-1 w-full resize-y rounded-md border border-border bg-background px-2 py-1.5
                   text-[13px] leading-relaxed outline-none transition-colors
                   focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/25"
      />
      <p className="mt-1 text-[11.5px] text-muted-foreground">{factor.hint}</p>
    </div>
  )
}

