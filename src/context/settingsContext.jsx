import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { storage, STORAGE_KEYS, SCHEMA_VERSION } from '@/lib/storage'

export const THEMES = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'sepia', label: 'Sepia' },
]

export const FONT_SIZES = [
  { id: 'compact', label: 'Pequeño', px: 14 },
  { id: 'default', label: 'Mediano', px: 16 },
  { id: 'relaxed', label: 'Grande', px: 18 },
]

export const DEFAULT_SETTINGS = {
  theme: 'light',
  editorFontSize: 'default',
  previewFontSize: 'default',
  layout: 'split',
  showSidebar: true,
  // Off by default: line numbers require `wrap="off"` to stay aligned, and soft
  // wrapping reads better for prose. Users editing code can switch it on.
  showLineNumbers: false,
  autoSave: true,
  syncScroll: true,
  spellcheck: true,
  type: 'sans',
}

/** Reads the theme the bootstrap script in index.html already applied. */
function initialTheme() {
  const applied = document.documentElement.dataset.theme
  return THEMES.some((theme) => theme.id === applied) ? applied : DEFAULT_SETTINGS.theme
}

/** Reads the stored settings, discarding anything not in the known shape. */
function loadSettings() {
  const stored = storage.get(STORAGE_KEYS.settings, null)
  if (!stored || typeof stored !== 'object') {
    // First visit: the inline script in index.html has already resolved the
    // theme (stored value, else the OS preference). Reading it back keeps React
    // from overriding that choice with the default on mount.
    return { ...DEFAULT_SETTINGS, theme: initialTheme() }
  }
  const merged = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key in stored && typeof stored[key] === typeof DEFAULT_SETTINGS[key]) {
      merged[key] = stored[key]
    }
  }
  // Guard against values written by an older/newer build.
  if (!THEMES.some((theme) => theme.id === merged.theme)) merged.theme = DEFAULT_SETTINGS.theme
  if (!FONT_SIZES.some((font) => font.id === merged.editorFontSize)) {
    merged.editorFontSize = 'default'
  }
  if (!FONT_SIZES.some((font) => font.id === merged.previewFontSize)) {
    merged.previewFontSize = 'default'
  }
  if (!['split', 'editor', 'preview'].includes(merged.layout)) merged.layout = 'split'
  return merged
}

/**
 * Applies a theme to <html> and keeps `color-scheme` in sync so UA-rendered
 * surfaces (scrollbars, form controls, caret) follow the active theme.
 */
function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
}

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)

  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    storage.set(STORAGE_KEYS.schemaVersion, SCHEMA_VERSION)
  }, [])

  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        storage.set(STORAGE_KEYS.settings, next)
      } catch (error) {
        console.warn('[settings] could not persist:', error)
      }
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS })
    storage.set(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  }, [])

  const value = useMemo(
    () => ({ settings, update, reset }),
    [settings, update, reset],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}