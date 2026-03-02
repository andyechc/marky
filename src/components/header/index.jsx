import { useState, useEffect, useContext } from "react"
import { Download, Upload, FileText, Settings, Github, Keyboard, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Logo from '../logo'
import SettingsModal from '../settings'
import ShortcutsModal from '../shortcuts'
import { useSettings } from '@/hooks/useSettings'
import { FileContext } from '/src/context/fileContext'
import { safeStorage } from '@/lib/security'

const Header = () => {
  const [showSettings, setShowSettings] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { settings, updateSettings } = useSettings()
  const { saveFile, saveFileLocally, newFile, loadFile, fileName, text } = useContext(FileContext)

  const handleOpenFile = () => {
    // Save current file content before opening new file
    if (text && text.trim() && fileName) {
      safeStorage.set(`marky-file-${fileName}`, text)
    }
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target.result
          loadFile(content, file.name)
          // Save the loaded content to individual file storage
          safeStorage.set(`marky-file-${file.name}`, content)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleSaveFile = () => {
    const success = saveFileLocally()
    if (success) {
      // You could add a toast here if needed, but keeping it minimal for header
    }
  }

  const handleDownloadFile = () => {
    const success = saveFile()
    if (success) {
      // You could add a toast here if needed
    }
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
              <Button variant="ghost" size="sm" onClick={handleOpenFile} title="Open file">
                <Upload className="h-4 w-4" />
                <span className="sr-only">Open file</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleDownloadFile} title="Download file">
                <Download className="h-4 w-4" />
                <span className="sr-only">Download file</span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleSaveFile} title="Save file">
                <Save className="h-4 w-4" />
                <span className="sr-only">Save file</span>
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)} title="Atajos de teclado (Cmd/Ctrl + ?)">
                <Keyboard className="h-4 w-4" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
              
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