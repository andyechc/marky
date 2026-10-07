import { useMemo } from 'react'
import { Hash, Clock3, FileText } from 'lucide-react'
import { useSettings } from '@/context/settingsContext'
import { cn } from '@/lib/utils'

const WORDS_PER_MINUTE = 200

/** Computes word/character/line counts and a reading estimate. */
export function getStats(text) {
  const trimmed = text.trim()
  const words = trimmed ? trimmed.split(/\s+/).length : 0
  const characters = text.length
  const lines = text.split('\n').length
  const sentences = (text.match(/[.!?]+(\s|$)/g) ?? []).length
  return {
    words,
    characters,
    lines,
    sentences,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) || 0,
    bytes: new Blob([text]).size,
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Status bar. Shows live counts and the save state.
 *
 * The save indicator uses an icon and text, not colour alone, so the state is
 * legible without colour perception.
 */
export function StatusBar({ text, fileName, isDirty, onRename }) {
  const { settings, update } = useSettings()
  const stats = useMemo(() => getStats(text), [text])

  const saveState = isDirty ? 'Sin guardar' : 'Guardado'

  return (
    <footer
      className="z-30 flex h-statusbar shrink-0 items-center gap-3 border-t border-border
                 bg-surface px-3 text-[11px] text-muted-foreground"
    >
      <button
        type="button"
        onClick={onRename}
        className="flex min-w-0 items-center gap-1.5 rounded px-1 py-0.5 transition-colors
                   hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring"
        title="Cambiar nombre del documento"
      >
        <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="max-w-[16rem] truncate">{fileName}</span>
      </button>

      <span aria-hidden="true" className="h-3 w-px bg-border" />

      <span className="flex items-center gap-1">
        <Hash className="h-3 w-3" aria-hidden="true" />
        <span className="tabular-nums">{stats.words.toLocaleString('es')}</span>
        <span className="visually-hidden"> palabras</span>
      </span>

      <span className="hidden items-center gap-1 sm:flex">
        <span className="tabular-nums">{stats.characters.toLocaleString('es')}</span>
        <span className="visually-hidden"> caracteres</span>
        <span aria-hidden="true" className="visually-hidden">,</span>
      </span>

      <span className="hidden items-center gap-1 md:flex">
        <span className="tabular-nums">{stats.lines.toLocaleString('es')}</span>
        <span className="visually-hidden"> líneas</span>
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden items-center gap-1 lg:flex">
          <Clock3 className="h-3 w-3" aria-hidden="true" />
          <span className="tabular-nums">{stats.readingMinutes} min</span>
          <span className="visually-hidden"> de lectura</span>
        </span>

        <span className="hidden tabular-nums lg:inline">{formatBytes(stats.bytes)}</span>

        <button
          type="button"
          onClick={() => update({ autoSave: !settings.autoSave })}
          aria-pressed={settings.autoSave}
          className={cn(
            'flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors',
            'hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-ring',
            isDirty ? 'text-primary' : 'text-muted-foreground',
          )}
          title={
            settings.autoSave
              ? 'Autoguardado activo: pulsa para desactivarlo'
              : 'Autoguardado desactivado: pulsa para activarlo'
          }
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isDirty ? 'bg-primary' : 'bg-success',
              settings.autoSave && isDirty && 'animate-pulse-dot',
            )}
          />
          {saveState}
        </button>
      </div>
    </footer>
  )
}