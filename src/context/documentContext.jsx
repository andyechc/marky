import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { useSettings } from '@/context/settingsContext'
import { storage, STORAGE_KEYS, withMarkdownExtension } from '@/lib/storage'

/** Placeholder shown on a truly empty document, and the starter document. */
export const STARTER_DOC = `# Bienvenido a Marky

Escribe markdown a la izquierda y mira el resultado a la derecha, en tiempo real.

## Atajos que sí funcionan

| Atajo | Acción |
| --- | --- |
| \`Cmd/Ctrl + B\` | **Negrita** |
| \`Cmd/Ctrl + I\` | *Cursiva* |
| \`Cmd/Ctrl + K\` | Enlace |
| \`Cmd/Ctrl + F\` | Buscar y reemplazar |

## Listas

- [ ] Probar el buscador
- [ ] Exportar a HTML
- [ ] Cambiar de tema

> Todo se guarda solo en tu navegador. No hay servidor ni cuentas.
`

const HISTORY_LIMIT = 200

/**
 * Document state lives in a reducer so undo/redo and dirty-tracking are one
 * atomic transition. The previous implementation set `isDirty` true on every
 * keystroke and cleared it after a timer, so its "unsaved changes" prompt
 * could never fire; here dirty means "text differs from the last explicit save".
 */
const initialState = {
  text: '',
  fileName: 'Sin título.md',
  savedText: '',
  lastSavedAt: null,
  past: [],
  future: [],
}

function reducer(state, action) {
  switch (action.type) {
    case 'edit': {
      const { text } = action
      if (text === state.text) return state
      return {
        ...state,
        text,
        past: [...state.past, state.text].slice(-HISTORY_LIMIT),
        future: [],
      }
    }

    case 'replace': {
      // Programmatic replacement (toolbar, shortcut). Normally one undo step;
      // `coalesce` merges it into the previous entry, used for typing bursts.
      const { text, coalesce } = action
      if (text === state.text) return state
      const canCoalesce = coalesce && state.past.length > 0
      return {
        ...state,
        text,
        past: canCoalesce ? state.past : [...state.past, state.text].slice(-HISTORY_LIMIT),
        future: [],
      }
    }

    case 'undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        ...state,
        text: previous,
        past: state.past.slice(0, -1),
        future: [state.text, ...state.future].slice(0, HISTORY_LIMIT),
      }
    }

    case 'redo': {
      if (state.future.length === 0) return state
      const [next, ...rest] = state.future
      return {
        ...state,
        text: next,
        past: [...state.past, state.text].slice(-HISTORY_LIMIT),
        future: rest,
      }
    }

    case 'rename':
      return { ...state, fileName: withMarkdownExtension(action.fileName) }

    case 'save':
      return { ...state, savedText: state.text, lastSavedAt: Date.now() }

    case 'load': {
      const { text, fileName } = action
      return {
        ...initialState,
        text,
        fileName: withMarkdownExtension(fileName),
        savedText: text,
        lastSavedAt: Date.now(),
      }
    }

    default:
      return state
  }
}

/** Restores the last session so a refresh doesn't lose work. */
function loadInitialState() {
  const session = storage.get(STORAGE_KEYS.session, null)
  if (session && typeof session.text === 'string' && typeof session.fileName === 'string') {
    return {
      ...initialState,
      text: session.text,
      fileName: session.fileName,
      savedText: session.text,
      lastSavedAt: session.lastSavedAt ?? null,
    }
  }
  return { ...initialState, text: STARTER_DOC, savedText: STARTER_DOC, fileName: 'Sin título.md' }
}

const DocumentContext = createContext(null)

export function DocumentProvider({ children }) {
  const { settings } = useSettings()
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)
  const saveTimer = useRef(null)

  const isDirty = state.text !== state.savedText

  /** Typewriter-style edits coalesce while the user is actively typing. */
  const edit = useCallback((text) => dispatch({ type: 'edit', text }), [])

  const replace = useCallback(
    (text, { coalesce = false } = {}) => dispatch({ type: 'replace', text, coalesce }),
    [],
  )

  /** Single entry point used by the editor, honouring the coalesce option. */
  const setText = useCallback(
    (text, { coalesce = false } = {}) => dispatch({ type: 'replace', text, coalesce }),
    [],
  )

  const undo = useCallback(() => dispatch({ type: 'undo' }), [])
  const redo = useCallback(() => dispatch({ type: 'redo' }), [])

  const rename = useCallback((fileName) => dispatch({ type: 'rename', fileName }), [])

  const markSaved = useCallback(() => dispatch({ type: 'save' }), [])

  const loadDocument = useCallback(
    (text, fileName) => dispatch({ type: 'load', text, fileName }),
    [],
  )

  /** Explicit save: records the baseline and mirrors to storage. */
  const save = useCallback(() => {
    dispatch({ type: 'save' })
    try {
      storage.set(STORAGE_KEYS.session, {
        text: state.text,
        fileName: state.fileName,
        lastSavedAt: Date.now(),
      })
    } catch (error) {
      console.warn('[document] could not persist session:', error)
    }
  }, [state.text, state.fileName])

  // Autosave, debounced. Writes only the draft, never flips the dirty flag.
  useEffect(() => {
    if (!settings.autoSave || !isDirty) return undefined
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        storage.set(STORAGE_KEYS.session, {
          text: state.text,
          fileName: state.fileName,
          lastSavedAt: state.lastSavedAt,
        })
      } catch (error) {
        console.warn('[document] autosave failed:', error)
      }
    }, 800)
    return () => clearTimeout(saveTimer.current)
  }, [state.text, state.fileName, isDirty, settings.autoSave, state.lastSavedAt])

  // Warn before unload only while there is genuinely unsaved work.
  useEffect(() => {
    if (!isDirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const value = useMemo(
    () => ({
      text: state.text,
      fileName: state.fileName,
      lastSavedAt: state.lastSavedAt,
      isDirty,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      edit,
      replace,
      setText,
      undo,
      redo,
      rename,
      save,
      markSaved,
      loadDocument,
      newDocument: () => loadDocument(STARTER_DOC, 'Sin título.md'),
      clearDocument: () => loadDocument('', 'Sin título.md'),
    }),
    [
      state.text,
      state.fileName,
      state.lastSavedAt,
      isDirty,
      state.past.length,
      state.future.length,
      edit,
      replace,
      setText,
      undo,
      redo,
      rename,
      save,
      markSaved,
      loadDocument,
    ],
  )

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>
}

export function useDocument() {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocument must be used inside <DocumentProvider>')
  return ctx
}