import { createContext, useState, useEffect } from "react"
import { saveAs } from "file-saver"
import { useToast } from "@/components/ui/use-toast"

const FileContext = createContext()

export function FileContextProvider({ children }) {
  const [fileName, setFileName] = useState("New Document.md")
  const [text, setText] = useState("# Welcome to Marky!\n\nStart writing amazing markdown here...")
  const [isDirty, setIsDirty] = useState(false)
  const { toast } = useToast()

  const extension = fileName.split(".").reverse()[0]

  // Track if document has unsaved changes
  useEffect(() => {
    setIsDirty(true)
    const timer = setTimeout(() => {
      setIsDirty(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [text])

  function saveFile() {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
    try {
      saveAs(blob, fileName)
      setIsDirty(false)
      return true
    } catch (e) {
      toast({
        title: "Save failed",
        description: e.message,
        variant: "destructive"
      })
      return false
    }
  }

  function exportAsHTML() {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${fileName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    ${text.replace(/\n/g, '<br>')}
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const htmlFileName = fileName.replace(/\.[^/.]+$/, ".html")
    saveAs(blob, htmlFileName)
    
    toast({
      title: "Export successful",
      description: `File exported as ${htmlFileName}`
    })
  }

  function newFile() {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Are you sure you want to create a new file?")) {
        return false
      }
    }
    setFileName("New Document.md")
    setText("# New Document\n\nStart writing here...")
    setIsDirty(false)
    return true
  }

  function loadFile(fileContent, newFileName) {
    setText(fileContent)
    setFileName(newFileName)
    setIsDirty(false)
  }

  const data = {
    fileName,
    setFileName,
    text,
    setText,
    extension,
    saveFile,
    exportAsHTML,
    newFile,
    loadFile,
    isDirty
  }

  return (
    <FileContext.Provider value={data}>
      {children}
    </FileContext.Provider>
  )
}

export { FileContext }
