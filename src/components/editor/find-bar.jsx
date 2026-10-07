import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, CaseSensitive, Replace, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Case-sensitive search with a replace field, mirroring the affordances of a
 * native find bar so muscle memory carries over.
 */
export function FindBar({ text, onClose, onReplace, onReplaceAll, editorRef }) {
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const replaceRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  /** Builds a safe matcher, tolerating invalid user regex. */
  const matcher = useMemo(() => {
    if (!query) return null
    if (useRegex) {
      try {
        const source = matchCase ? query : query
        return new RegExp(source, matchCase ? 'g' : 'gi')
      } catch {
        return null
      }
    }
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(escaped, matchCase ? 'g' : 'gi')
  }, [query, matchCase, useRegex])

  const matches = useMemo(() => {
    if (!matcher) return []
    const found = []
    let m = matcher.exec(text)
    let guard = 0
    while (m !== null && guard < 5000) {
      found.push({ start: m.index, end: m.index + m[0].length })
      // Zero-length matches would loop forever without advancing.
      if (m[0].length === 0) matcher.lastIndex += 1
      m = matcher.exec(text)
      guard += 1
    }
    return found
  }, [text, matcher])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, matchCase, useRegex])

  /** Scrolls the active match into view in the editor textarea. */
  useEffect(() => {
    const node = editorRef.current?.element
    const match = matches[activeIndex]
    if (!node || !match) return

    // Approximate the caret's line by counting newlines up to the match.
    const before = text.slice(0, match.start)
    const line = before.split('\n').length - 1
    const lineHeight = 26
    const target = line * lineHeight

    if (target < node.scrollTop || target > node.scrollTop + node.clientHeight - lineHeight) {
      node.scrollTop = Math.max(0, target - node.clientHeight / 2)
    }
    node.focus({ preventScroll: true })
    node.setSelectionRange(match.start, match.end)
  }, [activeIndex, matches, text, editorRef])

  const step = useCallback(
    (delta) => {
      if (matches.length === 0) return
      setActiveIndex((prev) => (prev + delta + matches.length) % matches.length)
    },
    [matches.length],
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (event.shiftKey) step(-1)
        else step(1)
      } else if (event.key === 'Tab') {
        // Tab moves between the two fields instead of leaving the bar.
        event.preventDefault()
        const target = event.shiftKey ? inputRef.current : replaceRef.current
        target?.focus()
        target?.select()
      }
    },
    [step, onClose],
  )

  const doReplace = useCallback(() => {
    const match = matches[activeIndex]
    if (!match) return
    onReplace(match, replacement)
    // Keep the same index: the text shifts underneath the current match.
    setActiveIndex((prev) => Math.min(prev, Math.max(0, matches.length - 2)))
  }, [matches, activeIndex, onReplace, replacement])

  const doReplaceAll = useCallback(() => {
    if (matches.length === 0) return
    onReplaceAll(replacement)
  }, [matches.length, onReplaceAll, replacement])

  const hasQuery = query.length > 0
  const statusText = !hasQuery
    ? ''
    : matches.length === 0
      ? 'Sin resultados'
      : `${activeIndex + 1} de ${matches.length}`

  return (
    <div
      className="flex flex-col gap-2 border-b border-border bg-surface px-3 py-2 animate-fade-in
                 sm:flex-row sm:items-center sm:gap-2"
      // Escape and Enter are handled here, not globally.
      onKeyDown={handleKeyDown}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />

        <label htmlFor="find-input" className="visually-hidden">
          Buscar
        </label>
        <input
          id="find-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar…"
          autoComplete="off"
          spellCheck="false"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5
                     text-sm outline-none transition-colors
                     focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
        />

        <div className="flex items-center gap-0.5">
          <Button
            variant={matchCase ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setMatchCase((v) => !v)}
            aria-pressed={matchCase}
            title="Distinguir mayúsculas"
            aria-label="Distinguir mayúsculas"
          >
            <CaseSensitive className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant={useRegex ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setUseRegex((v) => !v)}
            aria-pressed={useRegex}
            title="Usar expresión regular"
            aria-label="Usar expresión regular"
            className="font-mono text-[11px] font-semibold"
          >
            .*
          </Button>
        </div>

        <span
          role="status"
          aria-live="polite"
          className="w-24 shrink-0 text-center text-xs tabular-nums text-muted-foreground"
        >
          {statusText}
        </span>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => step(-1)}
            disabled={matches.length === 0}
            title="Anterior"
            aria-label="Coincidencia anterior"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => step(1)}
            disabled={matches.length === 0}
            title="Siguiente"
            aria-label="Coincidencia siguiente"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <label htmlFor="replace-input" className="visually-hidden">
          Reemplazar con
        </label>
        <input
          id="replace-input"
          ref={replaceRef}
          type="text"
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          placeholder="Reemplazar con…"
          autoComplete="off"
          spellCheck="false"
          className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5
                     text-sm outline-none transition-colors
                     focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={doReplace}
          disabled={matches.length === 0}
        >
          <Replace className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Reemplazar</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={doReplaceAll}
          disabled={matches.length === 0}
        >
          <span className="hidden sm:inline">Todo</span>
          <span className="sm:hidden" aria-hidden="true">*</span>
        </Button>
      </div>

      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar búsqueda">
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}