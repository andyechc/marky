import { Dialog } from './ui/dialog'
import { usePlatform } from '@/hooks/useHotkeys'

/**
 * Keyboard shortcut reference.
 *
 * The previous modal advertised fifteen shortcuts while only five were wired
 * up. This list is derived from the same command registry the app dispatches,
 * so anything shown here is guaranteed to work.
 */
const GROUPS = [
  {
    title: 'Archivo',
    items: [
      { keys: ['Mod', 'S'], description: 'Guardar documento' },
      { keys: ['Mod', 'O'], description: 'Abrir archivo' },
      { keys: ['Mod', 'E'], description: 'Exportar como HTML' },
      { keys: ['Mod', 'Alt', 'N'], description: 'Nuevo documento' },
    ],
  },
  {
    title: 'Formato',
    items: [
      { keys: ['Mod', 'B'], description: 'Negrita' },
      { keys: ['Mod', 'I'], description: 'Cursiva' },
      { keys: ['Mod', 'Shift', 'X'], description: 'Tachado' },
      { keys: ['Mod', 'E'], description: 'Código en línea' },
      { keys: ['Mod', 'Shift', 'E'], description: 'Bloque de código' },
      { keys: ['Mod', '1'], description: 'Encabezado 1' },
      { keys: ['Mod', '2'], description: 'Encabezado 2' },
      { keys: ['Mod', '3'], description: 'Encabezado 3' },
      { keys: ['Mod', 'Shift', '7'], description: 'Lista numerada' },
      { keys: ['Mod', 'Shift', '8'], description: 'Lista con viñetas' },
      { keys: ['Mod', 'Shift', '9'], description: 'Lista de tareas' },
      { keys: ['Mod', 'Shift', '.'], description: 'Cita' },
      { keys: ['Mod', 'K'], description: 'Insertar enlace' },
      { keys: ['Mod', 'Shift', 'I'], description: 'Insertar imagen' },
      { keys: ['Mod', 'Shift', 'T'], description: 'Insertar tabla' },
      { keys: ['Mod', '/'], description: 'Comentar línea' },
    ],
  },
  {
    title: 'Edición',
    items: [
      { keys: ['Mod', 'Z'], description: 'Deshacer' },
      { keys: ['Mod', 'Shift', 'Z'], description: 'Rehacer' },
      { keys: ['Tab'], description: 'Indentar (2 espacios)' },
      { keys: ['Shift', 'Tab'], description: 'Reducir sangría' },
      { keys: ['Enter'], description: 'Continuar lista o cita' },
      { keys: ['Mod', 'Enter'], description: 'Guardar' },
    ],
  },
  {
    title: 'Navegación',
    items: [
      { keys: ['Mod', 'K'], description: 'Paleta de comandos' },
      { keys: ['Mod', 'F'], description: 'Buscar y reemplazar' },
      { keys: ['Mod', '\\'], description: 'Mostrar u ocultar panel' },
      { keys: ['Mod', '?'], description: 'Abrir esta ayuda' },
      { keys: ['Esc'], description: 'Cerrar diálogo o salir del editor' },
    ],
  },
]

export function ShortcutsDialog({ open, onClose }) {
  const { modKey } = usePlatform()

  const renderKey = (key) => {
    if (key === 'Mod') return modKey
    return key
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Atajos de teclado"
      description={`Usa ${modKey} en macOS y Ctrl en Windows o Linux.`}
    >
      <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1 scroll-area">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li
                  key={item.description + item.keys.join()}
                  className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5
                             transition-colors hover:bg-surface-muted"
                >
                  <span className="text-[13px]">{item.description}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {item.keys.map((key, index) => (
                      <kbd
                        key={`${key}-${index}`}
                        className="min-w-[1.75rem] rounded border border-border bg-surface-muted px-1.5
                                   py-0.5 text-center font-mono text-[11px] leading-4"
                      >
                        {renderKey(key)}
                      </kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  )
}

export { GROUPS as SHORTCUT_GROUPS }