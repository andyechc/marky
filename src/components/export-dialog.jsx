import { useCallback, useEffect, useRef, useState } from 'react'
import { FileDown, FileText, FolderOpen, Pencil, Plus } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { validateFilename, withMarkdownExtension } from '@/lib/storage'
import { markdownToPlainText } from '@/lib/markdownToHtml'

/**
 * Export options.
 *
 * The previous implementation wrote the raw markdown into <body> with
 * newlines replaced by <br>, so "Export as HTML" produced a file that
 * displayed literal `#` characters. HTML export now renders real markup, and
 * plain text strips markdown syntax.
 */
const FORMATS = [
  {
    id: 'html',
    label: 'Documento HTML',
    extension: '.html',
    mime: 'text/html;charset=utf-8',
    description: 'Página web independiente con estilos y soporte para tema oscuro.',
    icon: FileText,
  },
  {
    id: 'txt',
    label: 'Texto plano',
    extension: '.txt',
    mime: 'text/plain;charset=utf-8',
    description: 'Sin marcas de markdown, listo para pegar en cualquier sitio.',
    icon: FileText,
  },
  {
    id: 'md',
    label: 'Markdown',
    extension: '.md',
    mime: 'text/markdown;charset=utf-8',
    description: 'El código fuente tal cual, sin cambios.',
    icon: FileText,
  },
]

export function ExportDialog({ open, onClose, fileName, markdown, buildHtml, onExported }) {
  const [format, setFormat] = useState('html')

  const handleExport = () => {
    const selected = FORMATS.find((f) => f.id === format)
    if (!selected) return
    const content =
      format === 'html'
        ? buildHtml(markdown, fileName)
        : format === 'txt'
          ? markdownToPlainText(markdown)
          : markdown

    const blob = new Blob([content], { type: selected.mime })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName.replace(/\.[^/.]+$/, '') + selected.extension
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    // Revoke on the next tick so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000)

    onExported?.(selected.label)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Exportar documento"
      description={fileName}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <FileDown className="h-4 w-4" aria-hidden="true" />
            Descargar
          </Button>
        </>
      }
    >
      <fieldset>
        <legend className="visually-hidden">Formato de exportación</legend>
        <div className="space-y-2">
          {FORMATS.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                          ${
                            format === option.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-surface-muted'
                          }`}
            >
              <input
                type="radio"
                name="export-format"
                value={option.id}
                checked={format === option.id}
                onChange={() => setFormat(option.id)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </Dialog>
  )
}

/**
 * Rename dialog, also used for the first-time filename.
 */
export function RenameDialog({ open, onClose, fileName, onRename }) {
  const [draft, setDraft] = useState(fileName)
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setDraft(fileName)
      setError(null)
      // Focus and select the stem so typing replaces the whole name.
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(0, fileName.replace(/\.[^/.]+$/, '').length)
      })
    }
  }, [open, fileName])

  const commit = () => {
    const next = withMarkdownExtension(draft)
    if (!validateFilename(next)) {
      setError('Usa solo letras, números, espacios, guiones y puntos. Sin / \\ : * ? " < > |')
      return
    }
    onRename(next)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Renombrar documento"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={commit}>
            Guardar
          </Button>
        </>
      }
    >
      <label htmlFor="rename-input" className="mb-1.5 block text-sm font-medium">
        Nombre del archivo
      </label>
      <input
        id="rename-input"
        ref={inputRef}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          setError(null)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
        }}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'rename-error' : undefined}
        className={`h-9 w-full rounded-md border bg-surface px-2.5 text-sm outline-none
                    focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30
                    ${error ? 'border-destructive' : 'border-border'}`}
      />
      {error && (
        <p id="rename-error" role="alert" className="mt-1.5 text-[12.5px] text-destructive">
          {error}
        </p>
      )}
    </Dialog>
  )
}

/** Open-file input, triggered by a button. */
export function useFileOpen() {
  const inputRef = useRef(null)

  const open = useCallback(() => inputRef.current?.click(), [])

  const element = (
    <input
      ref={inputRef}
      type="file"
      accept=".md,.markdown,.txt,text/markdown,text/plain"
      className="visually-hidden"
      tabIndex={-1}
      aria-hidden="true"
    />
  )

  return { open, element }
}

export { Plus, FolderOpen, Pencil }