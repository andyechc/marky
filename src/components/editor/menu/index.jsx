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
import { safeStorage, safeJSONParse, validateFilename } from '@/lib/security'

function Menu() {
  const { saveFile, fileName, setFileName, setText, exportAsHTML, newFile, loadFile } = useContext(FileContext)
  const [recentFiles, setRecentFiles] = useState([])
  const { toast } = useToast()

  useEffect(() => {
    // Load recent files from localStorage
    const saved = safeStorage.get('marky-recent-files', [])
    if (Array.isArray(saved)) {
      setRecentFiles(saved)
    }
  }, [])

  const handleSave = () => {
    const success = saveFile()
    if (success) {
      addToRecentFiles(fileName)
      toast({
        title: "File saved",
        description: `${fileName} has been saved successfully.`
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
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file && validateFilename(file.name)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          loadFile(e.target.result, file.name)
          addToRecentFiles(file.name)
          toast({
            title: "File opened",
            description: `${file.name} has been opened.`
          })
        }
        reader.readAsText(file)
      } else {
        toast({
          title: "Invalid file",
          description: "Please select a valid file.",
          variant: "destructive"
        })
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
    if (!validateFilename(filename)) return
    
    const updated = [filename, ...recentFiles.filter(f => f !== filename)].slice(0, 5)
    setRecentFiles(updated)
    safeStorage.set('marky-recent-files', updated)
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
                onClick={() => {
                  setFileName(file)
                  // Load file content if available
                }}
              >
                {file}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default Menu