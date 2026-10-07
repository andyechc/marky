import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, FileDown, FilePlus2, FolderOpen, PanelLeft, Pencil } from 'lucide-react'
import { SettingsProvider, useSettings } from '@/context/settingsContext'
import { DocumentProvider, useDocument } from '@/context/documentContext'
import { EditorActionsProvider, useEditorActions } from '@/context/editorActionsContext'
import { ToastProvider, useToast } from '@/components/ui/toast'
import { Header } from '@/components/header'
import { EditorWorkspace } from '@/components/editor'
import { StatusBar } from '@/components/footer'
import { ResizableSidebar } from '@/components/ui/resizable-sidebar'
import { Sidebar } from '@/components/sidebar'
import { AiInstructionsDialog } from '@/components/sidebar/ai-instructions'
import { CommandPalette } from '@/components/command-palette'
import { ShortcutsDialog } from '@/components/shortcuts'
import { SettingsDialog } from '@/components/settings'
import { ExportDialog, RenameDialog } from '@/components/export-dialog'
import { buildStandaloneHtml } from '@/lib/markdownToHtml'
import { isStorageAvailable, storage, STORAGE_KEYS } from '@/lib/storage'
import { useHotkeys } from '@/hooks/useHotkeys'

/** Reads a File as UTF-8 text. */
function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'))
    reader.readAsText(file)
  })
}

function Workspace() {
  const { settings, update } = useSettings()
  const { text, fileName, isDirty, lastSavedAt, edit, rename, save, loadDocument, newDocument } =
    useDocument()
  const { commandList } = useEditorActions()
  const { toast } = useToast()

  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showRename, setShowRename] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [showAiInstructions, setShowAiInstructions] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState(null)

  const fileInputRef = useRef(null)
  const editorActionsRef = useRef(null)
  const storageAvailable = isStorageAvailable()

  // Single source of truth, so the drawer's own close button and the header
  // toggle stay in sync instead of each holding a private copy.
  const showSidebar = settings.showSidebar
  const setShowSidebar = useCallback(
    (next) => update({ showSidebar: typeof next === 'function' ? next(settings.showSidebar) : next }),
    [settings.showSidebar, update],
  )
  const toggleSidebar = useCallback(() => setShowSidebar((v) => !v), [setShowSidebar])
  const openFilePicker = useCallback(() => fileInputRef.current?.click(), [])

  const onFileSelected = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return

      if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Abrir otro archivo de todos modos?')) {
        return
      }
      try {
        const content = await readFile(file)
        loadDocument(content, file.name)
        // Keep a named copy so the sidebar can reopen it later.
        storage.set(`${STORAGE_KEYS.session}:${file.name}`, content)
        toast({ title: 'Archivo abierto', description: file.name, variant: 'success' })
      } catch {
        toast({ title: 'No se pudo abrir el archivo', description: file.name, variant: 'error' })
      }
    },
    [isDirty, loadDocument, toast],
  )

  // Drop a markdown file anywhere in the window.
  useEffect(() => {
    const onDragOver = (event) => {
      if (event.dataTransfer?.types?.includes('Files')) event.preventDefault()
    }
    const onDrop = async (event) => {
      const file = event.dataTransfer?.files?.[0]
      if (!file) return
      event.preventDefault()
      if (!/\.(md|markdown|txt)$/i.test(file.name)) {
        toast({
          title: 'Formato no admitido',
          description: 'Arrastra un archivo .md, .markdown o .txt',
          variant: 'error',
        })
        return
      }
      const content = await readFile(file)
      loadDocument(content, file.name)
      storage.set(`${STORAGE_KEYS.session}:${file.name}`, content)
      toast({ title: 'Archivo abierto', description: file.name, variant: 'success' })
    }

    window.addEventListener('dragover', onDragOver)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('drop', onDrop)
    }
  }, [loadDocument, toast])

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Crear un documento nuevo?')) return
    newDocument()
    setShowSidebar(false)
    toast({ title: 'Nuevo documento' })
  }, [isDirty, newDocument, setShowSidebar, toast])

  const handleSave = useCallback(() => {
    save()
    storage.set(`${STORAGE_KEYS.session}:${fileName}`, text)
    toast({ title: 'Guardado', description: fileName, variant: 'success', duration: 1800 })
  }, [save, fileName, text, toast])

  /**
   * Fit the initial layout to a narrow viewport.
   *
   * Two panes side by side are unusable on a phone, and the drawer would cover
   * the editor entirely, so both are corrected once on mount. After that the
   * user's own choice is left alone.
   */
  const didFitInitialLayout = useRef(false)
  useEffect(() => {
    if (didFitInitialLayout.current) return
    didFitInitialLayout.current = true
    if (!window.matchMedia('(max-width: 1023px)').matches) return

    const patch = {}
    if (settings.showSidebar) patch.showSidebar = false
    if (settings.layout === 'split') patch.layout = 'editor'
    if (Object.keys(patch).length > 0) update(patch)
  }, [settings.showSidebar, settings.layout, update])

  // App-level shortcuts. Text formatting lives in EditorWorkspace.
  useHotkeys(
    {
      'Mod+o': (event) => {
        event.preventDefault()
        fileInputRef.current?.click()
      },
      'Mod+Shift+n': (event) => {
        event.preventDefault()
        handleNew()
      },
      'Mod+Shift+e': (event) => {
        event.preventDefault()
        setShowExport(true)
      },
      'Mod+?': (event) => {
        event.preventDefault()
        setShowShortcuts(true)
      },
      'Mod+Shift+p': (event) => {
        event.preventDefault()
        setShowPalette(true)
      },
      Escape: () => {
        // Dismiss whichever surface is open, most recent first.
        if (showSettings) setShowSettings(false)
        else if (showExport) setShowExport(false)
        else if (showRename) setShowRename(false)
        else if (showShortcuts) setShowShortcuts(false)
        else if (showPalette) setShowPalette(false)
        else if (showSidebar) setShowSidebar(false)
      },
    },
    [
      handleNew,
      showSettings,
      showExport,
      showRename,
      showShortcuts,
      showPalette,
      showSidebar,
      setShowSidebar,
    ],
  )

  const openRecent = useCallback(
    (name) => {
      const content = storage.get(`${STORAGE_KEYS.session}:${name}`, null)
      if (content === null) {
        toast({
          title: 'Contenido no disponible',
          description: `${name} no está guardado en este navegador`,
          variant: 'error',
        })
        return
      }
      if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Cambiar de documento?')) return
      loadDocument(content, name)
      setShowSidebar(false)
    },
    [isDirty, loadDocument, setShowSidebar, toast],
  )

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Lets keyboard users bypass the header straight to the editor. */}
      <a href="#markdown-editor" className="skip-link">
        Saltar al editor
      </a>

      <Header
        fileName={fileName}
        isDirty={isDirty}
        showSidebar={showSidebar}
        onToggleSidebar={toggleSidebar}
        onOpenFile={openFilePicker}
        onSaveFile={handleSave}
        onExport={() => setShowExport(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenCommandPalette={() => setShowPalette(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        {/*
          A resizable column from `lg` up and an overlay drawer below it, so
          phones get the whole app instead of the block page this build used
          to show under 768px.
        */}
        <ResizableSidebar open={showSidebar} onOpenChange={setShowSidebar}>
          <Sidebar
            markdown={text}
            fileName={fileName}
            activeHeadingId={activeHeadingId}
            onNavigateOutline={(item) => {
              setActiveHeadingId(item.id)
              editorActionsRef.current?.gotoHeading?.(item)
            }}
            onOpenRecent={openRecent}
            onRenameRecent={(oldName, newName) => {
              if (oldName === fileName) rename(newName)
            }}
            onDeleteRecent={(name) => {
              storage.remove(`${STORAGE_KEYS.session}:${name}`)
              toast({ title: 'Quitado de recientes', description: name })
            }}
            onOpenInstructions={() => setShowAiInstructions(true)}
          />
        </ResizableSidebar>

        <main id="markdown-editor" tabIndex={-1} className="min-w-0 flex-1 outline-none">
          <EditorWorkspace
            markdown={text}
            onChange={edit}
            onActiveHeadingChange={setActiveHeadingId}
            onOpenCommandPalette={() => setShowPalette(true)}
            registerActions={(actions) => {
              editorActionsRef.current = actions
            }}
          />
        </main>
      </div>

      <StatusBar
        text={text}
        fileName={fileName}
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
        onRename={() => setShowRename(true)}
      />

      {/* Bottom bar is how phones reach file actions. */}
      <nav
        aria-label="Acciones del documento"
        className="flex h-12 shrink-0 items-center gap-1 border-t border-border bg-surface px-2 sm:hidden"
      >
        <MobileTab icon={PanelLeft} label="Panel" active={showSidebar} onClick={toggleSidebar} />
        <MobileTab
          icon={Pencil}
          label="Editar"
          active={settings.layout === 'editor'}
          onClick={() => {
            update({ layout: 'editor' })
            setShowSidebar(false)
          }}
        />
        <MobileTab
          icon={Eye}
          label="Vista"
          active={settings.layout === 'preview'}
          onClick={() => {
            update({ layout: 'preview' })
            setShowSidebar(false)
          }}
        />
        <MobileTab icon={FilePlus2} label="Nuevo" onClick={handleNew} />
        <MobileTab icon={FolderOpen} label="Abrir" onClick={openFilePicker} />
        <MobileTab icon={FileDown} label="Exportar" onClick={() => setShowExport(true)} />
      </nav>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onFileSelected}
      />

      <CommandPalette
        open={showPalette}
        onClose={() => setShowPalette(false)}
        commands={commandList}
        onOpenSettings={() => setShowSettings(true)}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenFile={openFilePicker}
        onExport={() => setShowExport(true)}
        onNewDocument={handleNew}
        onSave={handleSave}
      />

      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <AiInstructionsDialog
        open={showAiInstructions}
        onClose={() => setShowAiInstructions(false)}
        onLoadIntoEditor={({ text, fileName }) => {
          if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Abrir las instrucciones?')) {
            return
          }
          loadDocument(text, fileName)
          toast({
            title: 'Instrucciones cargadas',
            description: `${fileName} — edítalas y guárdalas en la raíz del proyecto`,
          })
        }}
      />

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onClearData={() => {
          storage.clearAll()
          window.location.reload()
        }}
        storageAvailable={storageAvailable}
      />

      <ExportDialog
        open={showExport}
        onClose={() => setShowExport(false)}
        fileName={fileName}
        markdown={text}
        buildHtml={buildStandaloneHtml}
        onExported={(label) =>
          toast({ title: 'Exportado', description: label, variant: 'success' })
        }
      />

      <RenameDialog
        open={showRename}
        onClose={() => setShowRename(false)}
        fileName={fileName}
        onRename={rename}
      />
    </div>
  )
}

function MobileTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-[10px]
                  transition-colors focus-visible:outline-2 focus-visible:outline-ring
                  ${active ? 'text-primary' : 'text-muted-foreground'}`}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {label}
    </button>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <DocumentProvider>
        <EditorActionsProvider>
          <ToastProvider>
            <Workspace />
          </ToastProvider>
        </EditorActionsProvider>
      </DocumentProvider>
    </SettingsProvider>
  )
}