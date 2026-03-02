import { useContext, useState, useRef } from "react"
import { FileContext } from '/src/context/fileContext'
import { FileText } from 'lucide-react'
import FileContextMenu from '../../../fileContextMenu'

function FileTag() {
  const { fileName, extension } = useContext(FileContext)
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 } })
  const fileTagRef = useRef(null)

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = fileTagRef.current?.getBoundingClientRect()
    if (rect) {
      setContextMenu({
        isOpen: true,
        position: {
          x: e.clientX,
          y: e.clientY
        }
      })
    }
  }

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } })
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          {extension === "md" ? (
            <FileText className="h-5 w-5 text-red-600" />
          ) : (
            <span className="text-xs font-semibold text-muted-foreground">
              {extension.toUpperCase()}
            </span>
          )}
          
          <div 
            ref={fileTagRef}
            className="flex items-center cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
            onContextMenu={handleContextMenu}
          >
            <span className="text-sm font-medium select-none">
              {fileName}
            </span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Right-click for options
        </div>
      </div>
      
      <FileContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        fileName={fileName}
      />
    </>
  )
}

export default FileTag