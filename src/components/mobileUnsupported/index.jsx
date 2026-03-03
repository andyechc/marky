import { useState, useEffect } from 'react'

const MobileUnsupported = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground"
          >
            {/* Laptop/Monitor */}
            <rect
              x="10"
              y="20"
              width="100"
              height="60"
              rx="4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="15"
              y="25"
              width="90"
              height="50"
              rx="2"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            {/* Screen content lines */}
            <line x1="25" y1="35" x2="95" y2="35" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="25" y1="42" x2="85" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="25" y1="49" x2="90" y2="49" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="25" y1="56" x2="80" y2="56" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            <line x1="25" y1="63" x2="75" y2="63" stroke="currentColor" strokeWidth="1" opacity="0.5" />
            
            {/* Stand */}
            <rect
              x="50"
              y="80"
              width="20"
              height="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="40"
              y="88"
              width="40"
              height="4"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Dispositivo No Compatible
          </h1>
          
          <p className="text-muted-foreground leading-relaxed">
            Marky está optimizado para escritorio y requiere una pantalla más grande para una experiencia óptima.
          </p>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Para disfrutar de todas las funcionalidades:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Editor de markdown con vista previa en tiempo real</li>
              <li>Atajos de teclado y herramientas avanzadas</li>
              <li>Interfaz dividida para edición y previsualización</li>
            </ul>
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Por favor, accede desde un ordenador o tablet con una pantalla más grande.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MobileUnsupported
