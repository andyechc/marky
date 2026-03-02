import { useContext, useState, useEffect } from 'react'
import { FileContext } from '/src/context/fileContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Save, 
  Download, 
  Upload, 
  FileText, 
  FolderOpen, 
  Clock
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { safeStorage } from '@/lib/security'
import RecentFileContextMenu from '../../recentFileContextMenu'

function Menu() {
  const { saveFile, saveFileLocally, fileName, setFileName, text, setText, exportAsHTML, newFile, loadFile } = useContext(FileContext)
  const [recentFiles, setRecentFiles] = useState([])
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, fileName: '' })
  const { toast } = useToast()

  useEffect(() => {
    // Load recent files from localStorage
    const saved = safeStorage.get('marky-recent-files', [])
    if (Array.isArray(saved)) {
      setRecentFiles(saved)
    }
  }, [])

  const handleSave = () => {
    const success = saveFileLocally()
    if (success) {
      addToRecentFiles(fileName)
      toast({
        title: "File saved",
        description: `${fileName} has been saved successfully.`
      })
    }
  }

  const handleDownload = () => {
    const success = saveFile()
    if (success) {
      toast({
        title: "File downloaded",
        description: `${fileName} has been downloaded successfully.`
      })
    }
  }

  const handleExport = (format) => {
    if (format === 'html') {
      exportAsHTML()
    } else {
      toast({
        title: "Export started",
        description: `Exporting ${fileName} as ${format.toUpperCase()}...`
      })
    }
  }

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
          addToRecentFiles(file.name)
          toast({
            title: "File opened",
            description: `${file.name} has been opened.`
          })
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleNewFile = () => {
    const success = newFile()
    if (success) {
      toast({
        title: "New file created",
        description: "A new document has been created."
      })
    }
  }

  const addToRecentFiles = (filename) => {
    if (!filename || !filename.trim()) return
    
    const updated = [filename, ...recentFiles.filter(f => f !== filename)].slice(0, 5)
    setRecentFiles(updated)
    safeStorage.set('marky-recent-files', updated)
  }

  const removeFromRecentFiles = (filename) => {
    const updated = recentFiles.filter(f => f !== filename)
    setRecentFiles(updated)
    safeStorage.set('marky-recent-files', updated)
    toast({
      title: "File removed",
      description: `${filename} removed from recent files.`
    })
  }

  const handleRecentFileClick = (filename) => {
    // Save current file content before switching
    const currentText = text
    const currentFileName = fileName
    if (currentText && currentText.trim() && currentFileName !== filename) {
      safeStorage.set(`marky-file-${currentFileName}`, currentText)
    }
    
    // Load file content from localStorage if available
    const savedContent = safeStorage.get(`marky-file-${filename}`)
    if (savedContent) {
      loadFile(savedContent, filename)
      addToRecentFiles(filename)
      toast({
        title: "File opened",
        description: `${filename} has been opened.`
      })
    } else {
      // If no saved content, just set the filename
      setFileName(filename)
      setText("# " + filename.replace(/\.[^/.]+$/, "") + "\n\nStart writing here...")
      addToRecentFiles(filename)
      toast({
        title: "File opened",
        description: `${filename} has been created.`
      })
    }
  }

  const handleRecentFileContextMenu = (e, filename) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      isOpen: true,
      position: {
        x: e.clientX,
        y: e.clientY
      },
      fileName: filename
    })
  }

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, fileName: '' })
  }

  return (
    <div className="p-4 space-y-6 h-full overflow-auto">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleNewFile}>
            <FileText className="mr-2 h-4 w-4" />
            New Document
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleOpenFile}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open File
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save File
          </Button>
          <Separator />
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('md')}>
            <Download className="mr-2 h-4 w-4" />
            Export as MD
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('html')}>
            <Download className="mr-2 h-4 w-4" />
            Export as HTML
          </Button>
        </CardContent>
      </Card>

      {recentFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Recent Files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentFiles.map((file, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => handleRecentFileClick(file)}
                onContextMenu={(e) => handleRecentFileContextMenu(e, file)}
              >
                {file}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
      
      {contextMenu.isOpen && (
        <RecentFileContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={closeContextMenu}
          fileName={contextMenu.fileName}
          onRemove={removeFromRecentFiles}
          onOpen={handleRecentFileClick}
          onRename={(oldName, newName) => {
            // Update the filename in recent files
            const updated = recentFiles.map(f => f === oldName ? newName : f)
            setRecentFiles(updated)
            safeStorage.set('marky-recent-files', updated)
            toast({
              title: "File renamed in recent files",
              description: `${oldName} renamed to ${newName}`
            })
          }}
        />
      )}
    </div>
  )
}

export default Menu