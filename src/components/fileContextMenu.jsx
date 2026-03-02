import { useState, useEffect, useRef, useContext } from 'react'
import { FileText, Edit3, Save, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileContext } from '/src/context/fileContext'
import { useToast } from '@/components/ui/use-toast'

function FileContextMenu({ isOpen, position, onClose, fileName }) {
  const { saveFile, exportAsHTML, setFileName } = useContext(FileContext)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(fileName)
  const inputRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isRenaming) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isRenaming])

  const handleRename = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsRenaming(true)
    setNewName(fileName)
  }

  const handleSaveRename = () => {
    if (newName && newName.trim()) {
      setFileName(newName)
      toast({
        title: "File renamed",
        description: `File renamed to ${newName}`
      })
    }
    setIsRenaming(false)
    onClose()
  }

  const handleCancelRename = () => {
    setIsRenaming(false)
    setNewName(fileName)
    onClose()
  }

  const handleSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const success = saveFile()
    if (success) {
      toast({
        title: "File saved",
        description: `${fileName} has been saved successfully.`
      })
    }
    onClose()
  }

  const handleExport = (e) => {
    e.preventDefault()
    e.stopPropagation()
    exportAsHTML()
    toast({
      title: "Exported",
      description: "File exported as HTML"
    })
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      handleSaveRename()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleCancelRename()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.context-menu')) {
        if (isRenaming) {
          setIsRenaming(false)
        }
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, onClose, isRenaming])

  if (!isOpen) return null

  return (
    <div
      className="context-menu fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    >
      <Card className="min-w-48 shadow-lg border">
        <CardContent className="p-1">
          {isRenaming ? (
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black dark:bg-gray-800 dark:text-white"
                placeholder="Enter new filename"
                style={{ minWidth: '200px' }}
              />
              <div className="flex gap-1 mt-2">
                <Button size="sm" onClick={handleSaveRename} className="flex-1">
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelRename} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRename}
                className="w-full justify-start px-2 py-1 h-8 text-sm"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Rename
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="w-full justify-start px-2 py-1 h-8 text-sm"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="w-full justify-start px-2 py-1 h-8 text-sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default FileContextMenu
