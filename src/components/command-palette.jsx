import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react'
import { Dialog } from './ui/dialog'
import { usePlatform } from '@/hooks/useHotkeys'

/**
 * Fuzzy command palette (Cmd/Ctrl+Shift+P).
 *
 * Scores subsequences rather than substrings so "ttd" still finds
 * "Tachado", the way editor palettes users expect.
 */
function score(query, candidate) {
  if (!query) return { score: 0, indices: [] }
  const q = query.toLowerCase()
  const c = candidate.toLowerCase()

  // A contiguous match, especially at a word boundary, always wins.
  const direct = c.indexOf(q)
  if (direct !== -1) {
    const boundary = direct === 0 || /[\s\-/.]/.test(c[direct - 1])
    return {
      score: 1000 - direct + (boundary ? 250 : 0),
      indices: Array.from({ length: q.length }, (_, i) => direct + i),
    }
  }

  const indices = []
  let cursor = 0
  let total = 0
  let streak = 0
  for (const ch of q) {
    const found = c.indexOf(ch, cursor)
    if (found === -1) return { score: -1, indices: [] }
    indices.push(found)
    streak = found === cursor ? streak + 1 : 0
    total += 10 + streak * 6 - Math.min(found - cursor, 8)
    cursor = found + 1
  }
  // Prefer shorter candidates when scores tie.
  return { score: total - c.length * 0.1, indices }
}

function Highlight({ label, indices }) {
  if (!indices?.length) return label
  const hits = new Set(indices)
  return Array.from(label).map((char, i) => (
    <span key={i} className={hits.has(i) ? 'font-semibold text-primary' : undefined}>
      {char}
    </span>
  ))
}

export function CommandPalette({
  open,
  onClose,
  commands,
  onOpenSettings,
  onOpenShortcuts,
  onOpenFile,
  onExport,
  onNewDocument,
  onSave,
}) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef(null)
  const { modKey } = usePlatform()

  const items = useMemo(
    () => [
      ...commands,
      { id: 'app.new', label: 'Nuevo documento', group: 'Archivo', run: onNewDocument },
      { id: 'app.open', label: 'Abrir archivo…', group: 'Archivo', run: onOpenFile },
      { id: 'app.save', label: 'Guardar documento', group: 'Archivo', run: onSave },
      { id: 'app.export', label: 'Exportar como HTML', group: 'Archivo', run: onExport },
      { id: 'app.shortcuts', label: 'Ver atajos de teclado', group: 'Aplicación', run: onOpenShortcuts },
      { id: 'app.settings', label: 'Abrir ajustes', group: 'Aplicación', run: onOpenSettings },
    ],
    [commands, onNewDocument, onOpenFile, onSave, onExport, onOpenShortcuts, onOpenSettings],
  )

  const results = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return items.slice(0, 10).map((item) => ({ item, indices: [] }))
    return items
      .map((item) => ({ item, ...score(trimmed, item.label) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }, [items, query])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (open) setQuery('')
  }, [open])

  // Keep the highlighted row inside the scroll area.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, results])

  const commit = (index) => {
    const entry = results[index]
    if (!entry) return
    onClose()
    entry.item.run()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (i + 1) % Math.max(results.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (i - 1 + results.length) % Math.max(results.length, 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      commit(activeIndex)
    }
  }

  let lastGroup = null

  return (
    <Dialog open={open} onClose={onClose} title="Paleta de comandos" contentClassName="p-0">
      <div onKeyDown={onKeyDown}>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="command-palette-input" className="visually-hidden">
            Buscar comando
          </label>
          <input
            id="command-palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Escribe un comando…"
            autoComplete="off"
            aria-controls="command-palette-list"
            aria-activedescendant={
              results[activeIndex] ? `command-option-${activeIndex}` : undefined
            }
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">
            {modKey}⇧P
          </kbd>
        </div>

        <ul
          ref={listRef}
          id="command-palette-list"
          role="listbox"
          aria-label="Comandos"
          className="max-h-72 overflow-y-auto p-1.5 scroll-area"
        >
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              Ningún comando coincide con «{query}».
            </li>
          )}

          {results.map(({ item, indices }, index) => {
            const showGroup = item.group && item.group !== lastGroup
            lastGroup = item.group
            const isActive = index === activeIndex
            return (
              <li key={item.id}>
                {showGroup && (
                  <p className="px-3 pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {item.group}
                  </p>
                )}
                <button
                  type="button"
                  id={`command-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => commit(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm
                              transition-colors ${
                                isActive
                                  ? 'bg-surface-muted text-foreground'
                                  : 'text-muted-foreground'
                              }`}
                >
                  <span className="truncate">
                    <Highlight label={item.label} indices={indices} />
                  </span>
                  {item.shortcut && (
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground/80">
                      {item.shortcut.replace('Mod', modKey)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-4 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
            <ArrowDown className="h-3 w-3" aria-hidden="true" />
            navegar
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" aria-hidden="true" />
            ejecutar
          </span>
          <span className="ml-auto">Esc para cerrar</span>
        </div>
      </div>
    </Dialog>
  )
}