import {
  PanelLeft,
  FileDown,
  FileUp,
  Save,
  Keyboard,
  Settings as SettingsIcon,
  Github,
  Sun,
  Moon,
  Coffee,
  Columns2,
  SquarePen,
  Eye,
  Command,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppIcon } from '@/components/brand'
import { useSettings, THEMES } from '@/context/settingsContext'
import { usePlatform } from '@/hooks/useHotkeys'
import { cn } from '@/lib/utils'

const THEME_ICONS = { light: Sun, dark: Moon, sepia: Coffee }

const LAYOUTS = [
  { id: 'split', icon: Columns2, label: 'Dividido' },
  { id: 'editor', icon: SquarePen, label: 'Solo editor' },
  { id: 'preview', icon: Eye, label: 'Solo vista previa' },
]

export function Header({
  fileName,
  isDirty,
  onOpenFile,
  onSaveFile,
  onExport,
  onOpenShortcuts,
  onOpenSettings,
  onToggleSidebar,
  onOpenCommandPalette,
  showSidebar,
}) {
  const { settings, update } = useSettings()
  const { modKey } = usePlatform()

  const cycleTheme = () => {
    const index = THEMES.findIndex((t) => t.id === settings.theme)
    const next = THEMES[(index + 1) % THEMES.length]
    update({ theme: next.id })
  }

  const ThemeIcon = THEME_ICONS[settings.theme] ?? Sun

  return (
    <header
      className="z-40 flex h-header shrink-0 items-center gap-2 border-b border-border
                 bg-surface px-2 sm:px-3"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        aria-label={showSidebar ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
        aria-pressed={showSidebar}
        title={`Panel lateral (${modKey}+\\)`}
        className="shrink-0"
      >
        <PanelLeft className="h-[18px] w-[18px]" aria-hidden="true" />
      </Button>

      <div className="flex min-w-0 items-center gap-2">
        {/*
          The icon is inlined rather than loaded with <img>: an SVG referenced
          that way is a separate document and cannot inherit CSS colour. It keeps
          the brand colour baked in, because a logo is the one thing that should
          not shift with the theme.
        */}
        <a
          href="/"
          aria-label="Marky, ir al inicio"
          className="flex shrink-0 items-center rounded-md p-1
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <AppIcon className="h-[26px] w-[26px]" />
        </a>

        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-border sm:block" />

        {/* Filename is editable in place; the input only appears while editing. */}
        <h1 className="min-w-0 truncate text-[13px] font-medium text-foreground">
          <span className="sr-only">Documento actual: </span>
          {fileName}
          {isDirty && (
            <span className="ml-1.5 text-primary" aria-label="con cambios sin guardar">
              •
            </span>
          )}
        </h1>
      </div>

      <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenCommandPalette}
          title={`Comandos (${modKey}+K)`}
          aria-label="Abrir paleta de comandos"
          className="hidden sm:inline-flex"
        >
          <Command className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenFile}
          title={`Abrir archivo (${modKey}+O)`}
          aria-label="Abrir archivo"
        >
          <FileUp className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onSaveFile}
          title={`Guardar (${modKey}+S)`}
          aria-label="Guardar"
        >
          <Save className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onExport}
          title="Exportar"
          aria-label="Exportar documento"
        >
          <FileDown className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-border sm:block" />

        {/* Layout switcher: a radiogroup, since these are mutually exclusive. */}
        <div
          role="radiogroup"
          aria-label="Diseño del editor"
          className="hidden items-center rounded-md border border-border p-0.5 md:flex"
        >
          {LAYOUTS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={settings.layout === id}
              onClick={() => update({ layout: id })}
              title={label}
              aria-label={label}
              className={cn(
                'rounded p-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                settings.layout === id
                  ? 'bg-surface-muted text-foreground'
                  : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          title={`Tema: ${THEMES.find((t) => t.id === settings.theme)?.label} (cambiar)`}
          aria-label={`Cambiar tema, actual: ${THEMES.find((t) => t.id === settings.theme)?.label}`}
        >
          <ThemeIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenShortcuts}
          title={`Atajos de teclado (${modKey}+?)`}
          aria-label="Atajos de teclado"
          className="hidden sm:inline-flex"
        >
          <Keyboard className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          title="Ajustes"
          aria-label="Ajustes"
        >
          <SettingsIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          asChild
          title="Código fuente en GitHub"
        >
          <a
            href="https://github.com/andyechc/marky"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="h-[18px] w-[18px]" aria-hidden="true" />
            <span className="visually-hidden">Repositorio en GitHub (se abre en una pestaña nueva)</span>
          </a>
        </Button>
      </div>
    </header>
  )
}