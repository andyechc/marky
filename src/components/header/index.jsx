import { useState, useEffect } from "react"
import { Moon, Sun, Download, Upload, FileText, Settings, Github, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import Logo from '../logo'
import SettingsModal from '../settings'
import ShortcutsModal from '../shortcuts'
import { useSettings } from '@/hooks/useSettings'

const Header = () => {
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { settings, updateSettings } = useSettings()

  const toggleTheme = () => {
    updateSettings({ isDark: !settings.isDark })
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + ? para abrir shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '?') {
        e.preventDefault()
        setShowShortcuts(true)
      }
      // Escape para cerrar modales
      if (e.key === 'Escape') {
        setShowSettings(false)
        setShowShortcuts(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-6">
          <Logo />
          
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" size="sm">
                <Upload className="h-4 w-4" />
                <span className="sr-only">Open file</span>
              </Button>
              
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
                <span className="sr-only">Save file</span>
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} title="Atajos de teclado (Cmd/Ctrl + ?)">
                <Keyboard className="h-4 w-4" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
              
              <Toggle pressed={settings.isDark} onPressedChange={toggleTheme} aria-label="Toggle dark mode">
                {settings.isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Toggle>
              
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
              
              <Button variant="ghost" size="sm" asChild>
                <a href="https://github.com/andyechc/marky" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  <span className="sr-only">GitHub</span>
                </a>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      
      {showSettings && (
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      )}
      
      {showShortcuts && (
        <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      )}
    </>
  )
}

export default Header