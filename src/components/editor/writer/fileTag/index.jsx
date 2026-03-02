import { useContext, useState } from "react"
import { FileContext } from '/src/context/fileContext'
import { FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { validateFilename } from '@/lib/security'

function FileTag() {
  const [changeName, setChangeName] = useState(false)
  const { fileName, setFileName, extension } = useContext(FileContext)

  const handleDoubleClick = (e) => {
    !changeName && setChangeName(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (e.type === 'submit') {
      const form = e.target
      const input = form.getElementsByTagName('input')[0]
      const newName = input.value
      
      if (validateFilename(newName)) {
        setFileName(newName)
        setChangeName(false)
      }
    } else {
      const newName = e.target.value
      
      if (validateFilename(newName)) {
        setFileName(newName)
        setChangeName(false)
      }
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-muted/30">
      <div className="flex items-center space-x-2">
        {extension === "md" ? (
          <FileText className="h-5 w-5 text-red-600" />
        ) : (
          <span className="text-xs font-semibold text-muted-foreground">
            {extension.toUpperCase()}
          </span>
        )}
        
        <form 
          onSubmit={handleSubmit} 
          onDoubleClick={handleDoubleClick}
          onBlur={handleSubmit}
          className="flex items-center"
        >
          <Input
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={!changeName}
            className="border-0 bg-transparent text-sm font-medium focus:ring-0 focus:ring-offset-0 px-0"
            style={{ width: changeName ? 'auto' : `${fileName.length + 2}ch` }}
          />
        </form>
      </div>
      
      <div className="text-xs text-muted-foreground">
        Double-click to rename
      </div>
    </div>
  )
}

export default FileTag