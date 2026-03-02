import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { X, Keyboard } from 'lucide-react'

const Shortcuts = ({ isOpen, onClose }) => {
  const shortcuts = [
    { keys: 'Cmd + S', description: 'Guardar archivo', category: 'Archivo' },
    { keys: 'Cmd + B', description: 'Texto en negrita', category: 'Formato' },
    { keys: 'Cmd + I', description: 'Texto en cursiva', category: 'Formato' },
    { keys: 'Cmd + E', description: 'Código inline', category: 'Formato' },
    { keys: 'Cmd + K', description: 'Insertar enlace', category: 'Formato' },
    { keys: 'Cmd + 1', description: 'Encabezado H1', category: 'Formato' },
    { keys: 'Cmd + 2', description: 'Encabezado H2', category: 'Formato' },
    { keys: 'Cmd + 3', description: 'Encabezado H3', category: 'Formato' },
    { keys: 'Cmd + /', description: 'Comentar línea', category: 'Formato' },
    { keys: 'Cmd + Z', description: 'Deshacer', category: 'Edición' },
    { keys: 'Cmd + Y', description: 'Rehacer', category: 'Edición' },
    { keys: 'Cmd + A', description: 'Seleccionar todo', category: 'Edición' },
    { keys: 'Cmd + F', description: 'Buscar', category: 'Navegación' },
    { keys: 'Cmd + G', description: 'Siguiente resultado', category: 'Navegación' },
    { keys: 'Tab', description: 'Indentar', category: 'Edición' },
    { keys: 'Shift + Tab', description: 'Desindentar', category: 'Edición' },
  ]

  const categories = [...new Set(shortcuts.map(s => s.category))]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de Teclado
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter(shortcut => shortcut.category === category)
                    .map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.split(' + ').map((key, keyIndex) => (
                            <span key={keyIndex} className="px-2 py-1 text-xs font-mono bg-muted border rounded">
                              {key.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
                {category !== categories[categories.length - 1] && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Usa estos atajos para acelerar tu escritura. Los atajos con Cmd en Mac usan Ctrl en Windows/Linux.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Shortcuts
