import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  SquareCode,
  Link2,
  Image as ImageIcon,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table2,
  Minus,
  Undo2,
  Redo2,
  WrapText,
  CaseUpper,
  CaseLower,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePlatform } from '@/hooks/useHotkeys'

/**
 * Group of related actions, separated by a thin divider.
 */
/**
 * Groups related buttons. Each group carries its own leading rule instead of
 * standalone separators between them, because a separator that lands at the end
 * of a wrapped row reads as a stray line.
 */
function Group({ label, children }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 items-center gap-0.5 border-l border-border/70 pl-2
                 first:border-l-0 first:pl-0"
    >
      {children}
    </div>
  )
}

/** Overflow menu for narrow viewports: keeps the primary actions reachable. */
function OverflowMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Más formatos"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <WrapText className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border
                     bg-surface p-1 shadow-md animate-fade-in"
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.run()
                setOpen(false)
              }}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2
                         text-left text-sm transition-colors hover:bg-surface-muted
                         focus-visible:bg-surface-muted"
            >
              <span className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {item.label}
              </span>
              {item.hint && <span className="text-xs text-muted-foreground">{item.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Toolbar layout, mirroring the command registry's groupings. */
const GROUPS = [
  { label: 'Texto', ids: ['bold', 'italic', 'strike', 'inlineCode', 'codeBlock'] },
  { label: 'Encabezados', ids: ['heading1', 'heading2', 'heading3'] },
  { label: 'Listas', ids: ['bulletList', 'orderedList', 'taskList', 'quote'] },
  { label: 'Insertar', ids: ['link', 'image', 'table', 'rule'] },
]

/** Icon per command id, defined once at module scope. */
const ICONS = {
  bold: Bold,
  italic: Italic,
  strike: Strikethrough,
  inlineCode: Code,
  codeBlock: SquareCode,
  heading1: Heading1,
  heading2: Heading2,
  heading3: Heading3,
  bulletList: List,
  orderedList: ListOrdered,
  taskList: ListChecks,
  quote: Quote,
  link: Link2,
  image: ImageIcon,
  table: Table2,
  rule: Minus,
  comment: WrapText,
  uppercase: CaseUpper,
  lowercase: CaseLower,
}

/**
 * Formatting toolbar. Every button runs the same command object the keyboard
 * shortcuts use, so the two can't diverge.
 */
export const Toolbar = forwardRef(function Toolbar(
  { commandList, canUndo, canRedo, onUndo, onRedo, onRun },
  ref,
) {
  const { modKey } = usePlatform()

  /** Returns focus to the editor after a toolbar action steals it. */
  const invoke = useCallback(
    (entry) => {
      onRun?.()
      entry.run()
    },
    [onRun],
  )

  const hint = useCallback((combo) => combo.replace('Mod', modKey), [modKey])

  const byId = useMemo(
    () => Object.fromEntries(commandList.map((entry) => [entry.id, entry])),
    [commandList],
  )

  const renderButton = (id) => {
    const entry = byId[id]
    if (!entry) return null
    const Icon = ICONS[id]
    const shortcut = entry.shortcut ? ` (${hint(entry.shortcut)})` : ''
    return (
      <Button
        key={id}
        variant="ghost"
        size="icon-sm"
        title={`${entry.label}${shortcut}`}
        aria-label={`${entry.label}${shortcut}`}
        onClick={() => invoke(entry)}
      >
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      </Button>
    )
  }

  const overflow = useMemo(
    () =>
      commandList
        .filter((entry) => ['comment', 'uppercase', 'lowercase'].includes(entry.id))
        .map((entry) => ({
          id: entry.id,
          label: entry.label,
          icon: ICONS[entry.id],
          run: () => invoke(entry),
          hint: entry.shortcut ? hint(entry.shortcut) : null,
        })),
    [commandList, hint, invoke],
  )

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Formato de markdown"
      aria-controls="markdown-editor"
      // Wraps onto a second row when the editor pane is narrow, instead of
      // clipping the last actions behind a horizontal scroll.
      className="flex shrink-0 flex-wrap items-center gap-x-1 gap-y-1.5 border-b border-border
                 bg-surface-muted/40 px-2 py-1.5"
    >
      <Group label="Historial">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            onRun?.()
            onUndo?.()
          }}
          disabled={!canUndo}
          title={`Deshacer (${hint('Mod+z')})`}
          aria-label="Deshacer"
        >
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            onRun?.()
            onRedo?.()
          }}
          disabled={!canRedo}
          title={`Rehacer (${hint('Mod+Shift+z')})`}
          aria-label="Rehacer"
        >
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </Group>

      {GROUPS.map((group) => (
        <Group key={group.label} label={group.label}>
          {group.ids.map(renderButton)}
        </Group>
      ))}

      <Group label="Más formatos">
        <OverflowMenu items={overflow} />
      </Group>
    </div>
  )
})

