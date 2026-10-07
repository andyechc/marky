import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useSettings, FONT_SIZES } from '@/context/settingsContext'
import { useWrappedRows, WrapMirror } from './useWrapRows.jsx'

const TAB_SIZE = 2
const LINE_HEIGHT = 26

/**
 * Markdown textarea with the affordances a bare <textarea> lacks: a line-number
 * gutter, Tab/Shift+Tab indentation, list continuation on Enter, and an
 * imperative handle so the toolbar, shortcuts and command palette can drive it.
 *
 * The textarea keeps a genuine textbox role and label. The gutter is
 * aria-hidden because it only restates what the caret position already conveys.
 */
export const Editor = forwardRef(function Editor(
  {
    id,
    value,
    onChange,
    onSave,
    onIndent,
    onOutdent,
    onScroll,
    registerEditor,
  },
  ref,
) {
  const { settings } = useSettings()
  const textareaRef = useRef(null)
  const gutterRef = useRef(null)
  const mirrorRef = useRef(null)
  const [caret, setCaret] = useState({ line: 1, column: 1 })
  const [selectionLength, setSelectionLength] = useState(0)

  const fontSize = FONT_SIZES.find((f) => f.id === settings.editorFontSize)?.px ?? 16
  const lineCount = useMemo(() => value.split('\n').length, [value])

  const readCaret = useCallback(() => {
    const node = textareaRef.current
    if (!node) return
    const before = value.slice(0, node.selectionStart)
    const segments = before.split('\n')
    setCaret({ line: segments.length, column: segments[segments.length - 1].length + 1 })
    setSelectionLength(node.selectionEnd - node.selectionStart)
  }, [value])

  const getSelection = useCallback(
    () => ({
      text: value,
      start: textareaRef.current?.selectionStart ?? value.length,
      end: textareaRef.current?.selectionEnd ?? value.length,
    }),
    [value],
  )

  const apply = useCallback(
    (nextText, { select, coalesce = false } = {}) => {
      onChange(nextText, { coalesce })
      if (!select) return
      // Wait for React to commit the new value before moving the caret.
      requestAnimationFrame(() => {
        const node = textareaRef.current
        if (!node) return
        const [start, end] = select
        if (start <= nextText.length) {
          node.setSelectionRange(start, Math.min(end, nextText.length))
        }
      })
    },
    [onChange],
  )

  const setSelection = useCallback(
    (range) => {
      const node = textareaRef.current
      if (!node || !Array.isArray(range)) return
      node.setSelectionRange(range[0], range[1])
      readCaret()
    },
    [readCaret],
  )

  const focus = useCallback(() => textareaRef.current?.focus(), [])

  const insertAtCaret = useCallback(
    (snippet, cursorOffset) => {
      const { start, end } = getSelection()
      const next = value.slice(0, start) + snippet + value.slice(end)
      const cursor = start + (cursorOffset ?? snippet.length)
      apply(next, { select: [cursor, cursor] })
    },
    [value, getSelection, apply],
  )

  useImperativeHandle(
    ref,
    () => ({
      focus,
      getSelection,
      setSelection,
      apply,
      insertAtCaret,
      element: textareaRef.current,
    }),
    [focus, getSelection, setSelection, apply, insertAtCaret],
  )

  // Hand the same API to the command layer so shortcuts and buttons share code.
  useEffect(() => {
    registerEditor?.({ focus, getSelection, setSelection, apply, insertAtCaret })
  }, [registerEditor, focus, getSelection, setSelection, apply, insertAtCaret])

  const handleKeyDown = useCallback(
    (event) => {
      const node = event.currentTarget
      const start = node.selectionStart
      const end = node.selectionEnd
      const hasSelection = start !== end
      const isMod = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
        node.blur()
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        if (event.shiftKey) onOutdent?.()
        else if (hasSelection || event.ctrlKey || event.metaKey) onIndent?.()
        else insertAtCaret(' '.repeat(TAB_SIZE))
        return
      }

      // Continue lists and quotes on Enter instead of ending them.
      if (event.key === 'Enter' && !event.shiftKey && !isMod && !hasSelection) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        const line = value.slice(lineStart, start)

        const bullet = line.match(/^(\s*)([-*+]|\d+\.)(\s+)(\[[ xX]\]\s+)?/)
        if (bullet) {
          event.preventDefault()
          if (line.trim() === bullet[0].trim()) {
            // Enter on an empty item exits the list.
            const next = value.slice(0, lineStart) + value.slice(start)
            apply(next, { select: [lineStart, lineStart] })
          } else {
            const [, indent, marker, , checkbox] = bullet
            const nextMarker = /^\d/.test(marker)
              ? `${parseInt(marker, 10) + 1}.`
              : marker
            const suffix = checkbox ? '- [ ] ' : `${nextMarker} `
            insertAtCaret(`\n${indent}${suffix}`)
          }
          return
        }

        const quote = line.match(/^(\s*)>\s?/)
        if (quote) {
          event.preventDefault()
          if (line.trim() === '>') {
            const next = value.slice(0, lineStart) + value.slice(start)
            apply(next, { select: [lineStart, lineStart] })
          } else {
            insertAtCaret(`\n${quote[1]}> `)
          }
        }
        return
      }

      if (isMod && event.key === 'Enter') {
        event.preventDefault()
        onSave?.()
      }
    },
    [value, insertAtCaret, apply, onSave, onIndent, onOutdent],
  )

  const handlePaste = useCallback(
    (event) => {
      const files = Array.from(event.clipboardData?.files ?? [])
      const markdown = files.find((file) => /\.(md|markdown|txt)$/i.test(file.name))
      if (!markdown) return
      event.preventDefault()
      const reader = new FileReader()
      reader.onload = () => insertAtCaret(String(reader.result ?? ''))
      reader.readAsText(markdown)
    },
    [insertAtCaret],
  )

  /**
   * How many visual rows each logical line occupies once soft-wrapped.
   *
   * Without this the gutter can't stay aligned while the text wraps, which is
   * why line numbers and soft wrapping used to be mutually exclusive.
   */
  const { rows: rowsPerLine, candidates } = useWrappedRows({
    value,
    mirrorRef,
    fontSize,
    lineHeight: LINE_HEIGHT,
  })

  return (
    <div className="flex h-full min-h-0 w-full bg-surface">
      {settings.showLineNumbers && (
        <div
          aria-hidden="true"
          className="shrink-0 select-none overflow-hidden border-r border-border/70
                     bg-surface-muted/40 py-5 pr-2.5 text-right font-mono tabular-nums
                     text-muted-foreground/60"
          style={{
            // Digits plus the right padding, so numbers never touch the border.
            width: `calc(${Math.max(2, String(lineCount).length)}ch + 0.75rem)`,
          }}
        >
          <div ref={gutterRef}>
            {rowsPerLine.map((rows, index) => (
              <div key={index} style={{ height: `${rows * LINE_HEIGHT}px` }}>
                {/* Only the first visual row carries the number; wrapped
                    continuations stay blank so the gutter reads as one line. */}
                <div
                  style={{
                    height: `${LINE_HEIGHT}px`,
                    fontSize: `${fontSize - 2}px`,
                    lineHeight: `${LINE_HEIGHT}px`,
                  }}
                >
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The mirror shares this box so its width matches the textarea's
          content box exactly; wrapping must be measured at that width. */}
      <div className="relative min-w-0 flex-1">
        <WrapMirror
          mirrorRef={mirrorRef}
          candidates={candidates}
          fontSize={fontSize}
          lineHeight={LINE_HEIGHT}
        />
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value, { coalesce: true })}
          onKeyDown={handleKeyDown}
          onKeyUp={readCaret}
          onClick={readCaret}
          onSelect={readCaret}
          onFocus={readCaret}
          onPaste={handlePaste}
          onScroll={(event) => {
            const { scrollTop } = event.currentTarget
            if (gutterRef.current) gutterRef.current.scrollTop = scrollTop
            onScroll?.(scrollTop)
          }}
          spellCheck={settings.spellcheck}
          autoCapitalize="sentences"
          autoCorrect="off"
          wrap="soft"
          aria-label="Editor de markdown"
          aria-describedby="editor-caret-status"
          placeholder={'# Empieza a escribir…\n\nCmd+B para negrita, o usa la barra de formato.'}
          className="scroll-area absolute inset-0 h-full w-full resize-none whitespace-pre-wrap
                     bg-transparent px-5 py-5 font-mono text-foreground caret-primary
                     outline-none placeholder:text-muted-foreground/60"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: `${LINE_HEIGHT}px`,
            tabSize: TAB_SIZE,
          }}
        />
      </div>

      {/* Live region for assistive tech; the visible status bar shows the same data. */}
      <span id="editor-caret-status" className="visually-hidden" aria-live="polite">
        {`Línea ${caret.line}, columna ${caret.column}${
          selectionLength ? `, ${selectionLength} caracteres seleccionados` : ''
        }`}
      </span>
    </div>
  )
})

export { LINE_HEIGHT as EDITOR_LINE_HEIGHT, TAB_SIZE }