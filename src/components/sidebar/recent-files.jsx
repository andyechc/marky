import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, Trash2, Pencil, Check, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateFilename, withMarkdownExtension, storage, STORAGE_KEYS } from '@/lib/storage'
import { cn } from '@/lib/utils'

const MAX_RECENT = 8

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const UNITS = [
  ['year', 31536000000],
  ['month', 2592000000],
  ['week', 604800000],
  ['day', 86400000],
  ['hour', 3600000],
  ['minute', 60000],
]

/** "hace 3 días", "ahora mismo". Falls back to "ahora" for odd inputs. */
export function relativeTime(timestamp, now = Date.now()) {
  if (!timestamp) return ''
  const delta = timestamp - now
  const abs = Math.abs(delta)
  if (abs < 60000) return 'ahora'

  for (const [unit, ms] of UNITS) {
    if (abs >= ms) return RELATIVE.format(Math.round(delta / ms), unit)
  }
  return 'ahora'
}

/**
 * Recent documents list.
 *
 * Entries are unique by name and carry a modified time, so the list can be
 * sorted and show when each was last opened. Kept in sync with storage on every
 * change rather than only on mount.
 */
export function RecentFiles({ activeName, onOpen, onRename, onDelete, query }) {
  const [files, setFiles] = useState([])
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setFiles(storage.get(STORAGE_KEYS.recent, []))
  }, [])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const persist = useCallback((next) => {
    setFiles(next)
    storage.set(STORAGE_KEYS.recent, next)
  }, [])

  /** Moves the document to the top of the list as it is opened. */
  const touch = useCallback(
    (name) => {
      const previous = storage.get(STORAGE_KEYS.recent, [])
      const entry = { name, modifiedAt: Date.now() }
      const next = [entry, ...previous.filter((f) => f.name !== name)]
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .slice(0, MAX_RECENT)
      persist(next)
    },
    [persist],
  )

  useEffect(() => {
    if (activeName) touch(activeName)
    // Re-run only when the active document identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeName])

  const startRename = useCallback((name) => {
    setEditing(name)
    setDraft(name.replace(/\.[^/.]+$/, ''))
    setError(null)
  }, [])

  const commitRename = useCallback(() => {
    const nextName = withMarkdownExtension(draft)
    if (!validateFilename(nextName)) {
      setError('Nombre no válido: evita / \\ : * ? " < > |')
      return
    }
    if (nextName === editing) {
      setEditing(null)
      return
    }
    // Swapping names would orphan the stored content; block the collision.
    if (files.some((f) => f.name === nextName)) {
      setError('Ya existe un documento con ese nombre.')
      return
    }

    const next = files.map((f) =>
      f.name === editing ? { ...f, name: nextName, modifiedAt: Date.now() } : f,
    )
    persist(next)
    onRename?.(editing, nextName)
    setEditing(null)
  }, [draft, editing, files, persist, onRename])

  const visible = query?.trim()
    ? files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()))
    : files

  if (files.length === 0) {
    return (
      <p className="px-4 py-5 text-[13px] leading-relaxed text-muted-foreground">
        Los documentos que abras aparecerán aquí para volver a ellos rápido.
      </p>
    )
  }

  return (
    <>
      {visible.length === 0 ? (
        <p className="px-4 py-5 text-[13px] text-muted-foreground">
          Ningún documento coincide con «{query.trim()}».
        </p>
      ) : (
        <ul className="space-y-0.5 px-2">
          {visible.map((file) => {
            const isEditing = editing === file.name
            const isActive = file.name === activeName
            const when = relativeTime(file.modifiedAt)

            return (
              <li key={file.name}>
                {isEditing ? (
                  <div className="px-1">
                    <div className="flex items-center gap-1">
                      <label htmlFor="rename-recent" className="visually-hidden">
                        Nuevo nombre
                      </label>
                      <input
                        id="rename-recent"
                        ref={inputRef}
                        value={draft}
                        onChange={(event) => {
                          setDraft(event.target.value)
                          setError(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') commitRename()
                          if (event.key === 'Escape') setEditing(null)
                        }}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? 'rename-error' : undefined}
                        className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2
                                   text-[13px] outline-none focus-visible:border-primary"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={commitRename}
                        aria-label="Guardar nombre"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(null)}
                        aria-label="Cancelar renombrado"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                    {error && (
                      <p id="rename-error" role="alert" className="mt-1 text-[11.5px] text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'group flex items-center gap-1 rounded-md pr-1 transition-colors',
                      isActive ? 'bg-surface-muted' : 'hover:bg-surface-muted',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onOpen?.(file.name)}
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5
                                 text-left focus-visible:outline-2 focus-visible:outline-ring"
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <FileText
                        className={cn(
                          'h-3.5 w-3.5 shrink-0',
                          isActive ? 'text-primary' : 'text-muted-foreground',
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate',
                          isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {file.name}
                      </span>
                      {when && (
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/70">
                          {when}
                        </span>
                      )}
                    </button>

                    <div
                      className="flex shrink-0 items-center opacity-0 transition-opacity
                                 focus-within:opacity-100 group-hover:opacity-100"
                    >
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => startRename(file.name)}
                        aria-label={`Renombrar ${file.name}`}
                        title="Renombrar"
                      >
                        <Pencil className="h-3 w-3" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          persist(files.filter((f) => f.name !== file.name))
                          onDelete?.(file.name)
                        }}
                        aria-label={`Quitar ${file.name} de recientes`}
                        title="Quitar de recientes"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

/**
 * Collapsible section wrapper used by both sidebar groups.
 *
 * The disclosure button is a real button with `aria-expanded`, so the state is
 * announced rather than implied by a rotated chevron.
 */
export function SidebarSection({ title, icon: Icon, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = `sidebar-section-${title.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <section className="border-b border-border/60 py-2.5 last:border-b-0">
      <h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex w-full items-center gap-1.5 rounded-md px-4 py-1 text-left
                     text-[11px] font-semibold uppercase tracking-wider text-muted-foreground
                     transition-colors hover:text-foreground
                     focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-ring"
        >
          <ChevronDown
            className={cn(
              'h-3 w-3 shrink-0 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
            aria-hidden="true"
          />
          {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
          {title}
          {count !== undefined && (
            <span className="ml-auto rounded-full bg-surface-muted px-1.5 text-[10px] tabular-nums font-medium text-muted-foreground">
              {count}
            </span>
          )}
        </button>
      </h2>

      <div id={contentId} hidden={!open} className="mt-1.5">
        {children}
      </div>
    </section>
  )
}