import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import * as md from '@/lib/markdownActions'

/**
 * Owns every markdown transform.
 *
 * The toolbar, the keyboard map and the command palette all call into this, so
 * a shortcut and its toolbar button can never drift apart.
 *
 * Transforms receive `{ text, start, end }` and return
 * `{ text, start, end }`, where start/end are the next caret selection.
 */
const EditorActionsContext = createContext(null)

export function EditorActionsProvider({ children }) {
  const editorRef = useRef(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  /** Bridges to the textarea, which owns the real selection. */
  const registerEditor = useCallback((api) => {
    editorRef.current = api
  }, [])

  const getSelection = useCallback(
    () =>
      editorRef.current?.getSelection() ?? {
        text: '',
        start: 0,
        end: 0,
      },
    [],
  )

  /** Applies a transform result and moves the caret. */
  const apply = useCallback((text, { select, coalesce = false } = {}) => {
    editorRef.current?.apply(text, { select, coalesce })
  }, [])

  const focus = useCallback(() => editorRef.current?.focus(), [])

  /** Wraps a pure text transform into a runnable command. */
  const command = useCallback(
    (transform) =>
      () => {
        const { text, start, end } = getSelection()
        const result = transform(text, start, end)
        if (!result) return
        apply(result.text, { select: [result.start, result.end] })
      },
    [getSelection, apply],
  )

  const commands = useMemo(
    () => ({
      bold: command((t, s, e) => md.toggleWrap(t, s, e, '**', 'texto en negrita')),
      italic: command((t, s, e) => md.toggleWrap(t, s, e, '*', 'texto en cursiva')),
      strike: command((t, s, e) => md.toggleStrike(t, s, e)),
      inlineCode: command((t, s, e) => md.toggleWrap(t, s, e, '`', 'código')),
      codeBlock: command((t, s, e) => md.toggleCodeBlock(t, s, e)),
      link: command((t, s, e) => md.toggleLink(t, s, e)),
      image: command((t, s, e) => md.insertImage(t, s, e)),
      rule: command((t, s, e) => md.insertRule(t, s, e)),
      table: command((t, s, e) => md.insertTable(t, s, e)),

      bulletList: command((t, s, e) => md.toggleList(t, s, e, false)),
      orderedList: command((t, s, e) => md.toggleList(t, s, e, true)),
      taskList: command((t, s, e) => md.toggleTaskList(t, s, e)),
      quote: command((t, s, e) => md.toggleQuote(t, s, e)),
      comment: command((t, s, e) => md.toggleComment(t, s, e)),

      indent: command((t, s, e) => md.indentLines(t, s, e, 2, false)),
      outdent: command((t, s, e) => md.indentLines(t, s, e, 2, true)),

      uppercase: command((t, s, e) => md.transformLines(t, s, e, (v) => v.toUpperCase())),
      lowercase: command((t, s, e) => md.transformLines(t, s, e, (v) => v.toLowerCase())),

      // Headings are parameterised, so this returns a command.
      heading: (level) =>
        command((t, s, e) => {
          // Pressing the same level twice removes the heading.
          const target = md.currentHeadingLevel(t, s) === level ? 0 : level
          return md.setHeading(t, s, e, target)
        }),
    }),
    [command],
  )

  /**
   * Registry consumed by the toolbar, palette and shortcuts dialog. Keeping it
   * here means the documented shortcut list is generated, not hand-maintained.
   */
  const commandList = useMemo(
    () => [
      { id: 'bold', label: 'Negrita', shortcut: 'Mod+b', group: 'Formato', run: commands.bold },
      { id: 'italic', label: 'Cursiva', shortcut: 'Mod+i', group: 'Formato', run: commands.italic },
      { id: 'strike', label: 'Tachado', shortcut: 'Mod+Shift+x', group: 'Formato', run: commands.strike },
      { id: 'inlineCode', label: 'Código en línea', shortcut: 'Mod+e', group: 'Formato', run: commands.inlineCode },
      { id: 'codeBlock', label: 'Bloque de código', shortcut: 'Mod+Shift+e', group: 'Formato', run: commands.codeBlock },
      { id: 'heading1', label: 'Encabezado 1', shortcut: 'Mod+1', group: 'Formato', run: commands.heading(1) },
      { id: 'heading2', label: 'Encabezado 2', shortcut: 'Mod+2', group: 'Formato', run: commands.heading(2) },
      { id: 'heading3', label: 'Encabezado 3', shortcut: 'Mod+3', group: 'Formato', run: commands.heading(3) },
      { id: 'heading4', label: 'Encabezado 4', shortcut: 'Mod+4', group: 'Formato', run: commands.heading(4) },
      { id: 'bulletList', label: 'Lista', shortcut: 'Mod+Shift+8', group: 'Formato', run: commands.bulletList },
      { id: 'orderedList', label: 'Lista numerada', shortcut: 'Mod+Shift+7', group: 'Formato', run: commands.orderedList },
      { id: 'taskList', label: 'Lista de tareas', shortcut: 'Mod+Shift+9', group: 'Formato', run: commands.taskList },
      { id: 'quote', label: 'Cita', shortcut: 'Mod+Shift+.', group: 'Formato', run: commands.quote },
      { id: 'table', label: 'Tabla', shortcut: 'Mod+Shift+t', group: 'Formato', run: commands.table },
      { id: 'rule', label: 'Separador', group: 'Formato', run: commands.rule },
      { id: 'link', label: 'Enlace', shortcut: 'Mod+k', group: 'Formato', run: commands.link },
      { id: 'image', label: 'Imagen', shortcut: 'Mod+Shift+i', group: 'Formato', run: commands.image },
      { id: 'comment', label: 'Comentar línea', shortcut: 'Mod+/', group: 'Formato', run: commands.comment },
      { id: 'uppercase', label: 'Convertir a MAYÚSCULAS', group: 'Formato', run: commands.uppercase },
      { id: 'lowercase', label: 'Convertir a minúsculas', group: 'Formato', run: commands.lowercase },
    ],
    [commands],
  )

  const value = useMemo(
    () => ({
      commands,
      commandList,
      getSelection,
      apply,
      registerEditor,
      focus,
      setHistoryState: (canGoBack, canGoForward) => {
        setCanUndo(canGoBack)
        setCanRedo(canGoForward)
      },
      canUndo,
      canRedo,
    }),
    [commands, commandList, getSelection, apply, registerEditor, focus, canUndo, canRedo],
  )

  return <EditorActionsContext.Provider value={value}>{children}</EditorActionsContext.Provider>
}

export function useEditorActions() {
  const ctx = useContext(EditorActionsContext)
  if (!ctx) throw new Error('useEditorActions must be used inside <EditorActionsProvider>')
  return ctx
}