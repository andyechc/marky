import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Editor, EDITOR_LINE_HEIGHT } from './editor'
import { Toolbar } from './toolbar'
import { FindBar } from './find-bar'
import Preview from './preview'
import { ResizableSplit, useSplitRatio } from '@/components/ui/resizable-split'
import { useSettings } from '@/context/settingsContext'
import { useEditorActions } from '@/context/editorActionsContext'
import { useDocument } from '@/context/documentContext'
import { useHotkeys } from '@/hooks/useHotkeys'
import { useToast } from '@/components/ui/toast'
import { extractOutline } from '@/lib/markdownActions'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

/**
 * The writing surface: toolbar, editor and preview.
 *
 * Keyboard shortcuts are resolved from the shared command registry and
 * dispatched from one listener, so a shortcut works regardless of focus and
 * cannot drift from its toolbar button.
 */
export function EditorWorkspace({
  markdown,
  onChange,
  onOpenCommandPalette,
  registerActions,
  onActiveHeadingChange,
}) {
  const { settings, update } = useSettings()
  const { undo, redo, save, canUndo, canRedo } = useDocument()
  const {
    commands,
    commandList,
    getSelection,
    apply,
    registerEditor,
    setHistoryState,
  } = useEditorActions()
  const editorRef = useRef(null)
  const previewRef = useRef(null)
  const [findOpen, setFindOpen] = useState(false)
  const [splitRatio, setSplitRatio] = useSplitRatio(0.5)
  const { toast } = useToast()

  /** Guards against the two panes echoing scroll events at each other. */
  const syncLock = useRef(false)

  /**
   * What the preview actually renders.
   *
   * Parsing and rendering markdown is by far the most expensive thing here: on
   * a 1200-line document it took over 100ms per keystroke and dominated the
   * frame budget. The preview trails the editor by a short pause so typing stays
   * responsive and the render catches up a moment later. Everything else —
   * scroll sync, the find bar, the status bar — works against the live text.
   */
  const previewMarkdown = useDebouncedValue(markdown)

  /**
   * Heading currently under the preview's reading position.
   *
   * Reported upward so the sidebar outline can mark where the reader is, which
   * turns it into a progress indicator as well as a jump list.
   */
  const outline = useMemo(() => extractOutline(previewMarkdown), [previewMarkdown])
  const lastReported = useRef(null)

  const reportActiveHeading = useCallback(() => {
    if (!onActiveHeadingChange) return
    const container = previewRef.current
    if (outline.length === 0 || !container) {
      lastReported.current = null
      return
    }

    const rect = container.getBoundingClientRect()
    const maxScroll = container.scrollHeight - container.clientHeight

    // At the very bottom the last heading should win even if it sits well below
    // the band, otherwise a document too short to scroll leaves its final
    // sections permanently unhighlighted.
    if (maxScroll > 0 && container.scrollTop >= maxScroll - 2) {
      if (lastReported.current !== 'bottom') {
        lastReported.current = 'bottom'
        onActiveHeadingChange(outline[outline.length - 1].id)
      }
      return
    }

    // Anything within this band counts as "the heading you are reading".
    const threshold = rect.top + 90
    let active = outline[0].id
    for (const item of outline) {
      const el = container.querySelector(`#${CSS.escape(item.id)}`)
      if (!el) continue
      if (el.getBoundingClientRect().top <= threshold) active = item.id
      else break
    }

    if (active !== lastReported.current) {
      lastReported.current = active
      onActiveHeadingChange(active)
    }
  }, [outline, onActiveHeadingChange])

  useEffect(() => {
    setHistoryState(canUndo, canRedo)
  }, [canUndo, canRedo, setHistoryState])

  const run = useCallback(
    (name) => commands[name]?.(),
    [commands],
  )

  const handleEditorScroll = useCallback(
    (top) => {
      const node = previewRef.current
      if (!settings.syncScroll || !node || syncLock.current) return
      const max = node.scrollHeight - node.clientHeight
      if (max <= 0) return
      syncLock.current = true
      node.scrollTop = (top / Math.max(1, max)) * max
      requestAnimationFrame(() => {
        syncLock.current = false
      })
    },
    [settings.syncScroll],
  )

  const handlePreviewScroll = useCallback(
    (event) => {
      reportActiveHeading()

      const editorNode = editorRef.current?.element
      if (!settings.syncScroll || !editorNode || syncLock.current) return
      const node = event.currentTarget
      const max = node.scrollHeight - node.clientHeight
      if (max <= 0) return
      syncLock.current = true
      editorNode.scrollTop = (node.scrollTop / max) * editorNode.scrollHeight
      requestAnimationFrame(() => {
        syncLock.current = false
      })
    },
    [settings.syncScroll, reportActiveHeading],
  )

  /**
   * Shortcut map, built from the same command registry the toolbar renders, so
   * a documented shortcut and its button cannot drift apart.
   */
  const hotkeyHandlers = useMemo(() => {
    const handlers = {}

    commandList.forEach((entry) => {
      if (!entry.shortcut) return
      // Cmd+K doubles as the command palette when nothing is selected, so it is
      // handled below rather than bound here.
      if (entry.id === 'link') return
      handlers[entry.shortcut] = (event) => {
        event.preventDefault()
        entry.run()
      }
    })

    handlers['Mod+s'] = (event) => {
      event.preventDefault()
      save()
    }
    handlers['Mod+Shift+z'] = (event) => {
      event.preventDefault()
      redo()
    }
    handlers['Mod+f'] = (event) => {
      event.preventDefault()
      setFindOpen(true)
    }
    handlers['Mod+\\'] = (event) => {
      event.preventDefault()
      update({ showSidebar: !settings.showSidebar })
    }
    handlers['Mod+Enter'] = (event) => {
      event.preventDefault()
      save()
    }
    handlers.Escape = () => {
      if (!findOpen) return
      setFindOpen(false)
      editorRef.current?.focus()
    }

    return handlers
  }, [commandList, save, redo, findOpen, settings.showSidebar, update])

  useHotkeys(hotkeyHandlers, [hotkeyHandlers])

  // Shortcuts that must win even when focus is in the textarea.
  useEffect(() => {
    const onKeyDown = (event) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()

      // Cmd+Z has to beat the browser's native textarea undo.
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
        return
      }

      if (key === 'k' && !event.shiftKey) {
        event.preventDefault()
        const { start, end } = getSelection()
        if (start !== end) commands.link()
        else onOpenCommandPalette?.()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [undo, commands, getSelection, onOpenCommandPalette])

  const handleReplace = useCallback(
    (match, replacement) => {
      const next = markdown.slice(0, match.start) + replacement + markdown.slice(match.end)
      const caret = match.start + replacement.length
      apply(next, { select: [caret, caret] })
    },
    [markdown, apply],
  )

  const handleReplaceAll = useCallback(
    (replacement) => {
      const query = document.getElementById('find-input')?.value ?? ''
      if (!query) return
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'g')
      const count = (markdown.match(regex) ?? []).length
      if (count === 0) return
      apply(markdown.replace(regex, replacement))
      toast({
        title: count === 1 ? '1 reemplazo realizado' : `${count} reemplazos realizados`,
        variant: 'success',
      })
    },
    [markdown, apply, toast],
  )

  /** Jumps the editor caret to an outline entry. */
  const navigateToHeading = useCallback(
    (item) => {
      const node = editorRef.current?.element
      if (!node) return
      const line = markdown.slice(0, item.start).split('\n').length - 1
      node.focus({ preventScroll: true })
      node.scrollTop = Math.max(0, line * EDITOR_LINE_HEIGHT - node.clientHeight / 3)
      node.setSelectionRange(item.start, item.start + item.label.length)
    },
    [markdown],
  )

  // Publish outline navigation to the sidebar without coupling it to the ref.
  useEffect(() => {
    registerActions?.({ gotoHeading: navigateToHeading })
  }, [registerActions, navigateToHeading])

  const editorPane = (
    <div className="flex h-full min-h-0 flex-col">
      <Toolbar
        commands={commands}
        commandList={commandList}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onRun={() => editorRef.current?.focus()}
      />

      {findOpen && (
        <FindBar
          text={markdown}
          onClose={() => {
            setFindOpen(false)
            editorRef.current?.focus()
          }}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          editorRef={editorRef}
        />
      )}

      <div className="min-h-0 flex-1">
        <Editor
          ref={editorRef}
          id="markdown-textarea"
          value={markdown}
          onChange={onChange}
          onScroll={handleEditorScroll}
          onSave={save}
          onIndent={() => run('indent')}
          onOutdent={() => run('outdent')}
          registerEditor={registerEditor}
        />
      </div>
    </div>
  )

  const previewPane = (
    <div
      ref={previewRef}
      onScroll={handlePreviewScroll}
      className="scroll-area h-full min-h-0 overflow-y-auto bg-background"
      tabIndex={-1}
      role="region"
      aria-label="Vista previa"
    >
      <Preview markdown={previewMarkdown} onRendered={reportActiveHeading} />
    </div>
  )

  if (settings.layout === 'editor') {
    return <div className="h-full min-h-0">{editorPane}</div>
  }
  if (settings.layout === 'preview') {
    return <div className="h-full min-h-0">{previewPane}</div>
  }

  return (
    <div className="h-full min-h-0">
      <ResizableSplit
        ratio={splitRatio}
        onRatioChange={setSplitRatio}
        first={editorPane}
        second={previewPane}
      />
    </div>
  )
}

export default EditorWorkspace