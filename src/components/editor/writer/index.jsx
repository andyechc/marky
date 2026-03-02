import { useContext, useRef, useEffect, useCallback } from 'react'
import { FileContext } from '/src/context/fileContext'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useHotkeys } from 'react-hotkeys-hook'
import FileTag from './fileTag'
import { safeStorage } from '@/lib/security'

function Writer() {
  const { text, setText, fileName, setFileName } = useContext(FileContext)
  const textareaRef = useRef(null)

  const handleChange = useCallback((e) => {
    const newText = e.target.value
    setText(newText)
  }, [setText])

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text && text.trim()) {
        safeStorage.set('marky-autosave', text)
        safeStorage.set('marky-filename', fileName)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [text, fileName])

  // Load autosaved content on mount
  useEffect(() => {
    const savedText = safeStorage.get('marky-autosave')
    const savedFileName = safeStorage.get('marky-filename')
    
    // Only load saved content if current content is empty/default
    if (savedText && text === "# Welcome to Marky!\n\nStart writing amazing markdown here...") {
      setText(savedText)
    }
    
    // Only load saved filename if current filename is default
    if (savedFileName && fileName === "New Document.md") {
      setFileName(savedFileName)
    }
  }, [])

  // Keyboard shortcuts
  useHotkeys('mod+s', (e) => {
    e.preventDefault()
    // Save functionality will be handled by parent
    const event = new CustomEvent('saveFile')
    window.dispatchEvent(event)
  }, { enableOnFormTags: true })

  useHotkeys('mod+b', (e) => {
    e.preventDefault()
    insertText('**', '**')
  }, { enableOnFormTags: true })

  useHotkeys('mod+i', (e) => {
    e.preventDefault()
    insertText('*', '*')
  }, { enableOnFormTags: true })

  useHotkeys('mod+k', (e) => {
    e.preventDefault()
    insertText('[', '](url)')
  }, { enableOnFormTags: true })

  useHotkeys('mod+e', (e) => {
    e.preventDefault()
    insertText('`', '`')
  }, { enableOnFormTags: true })

  const insertText = useCallback((before, after) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = text.substring(start, end)
    
    const newText = text.substring(0, start) + before + selectedText + after + text.substring(end)
    setText(newText)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.selectionStart = start + before.length
      textarea.selectionEnd = start + before.length + selectedText.length
      textarea.focus()
    }, 0)
  }, [text, setText])

  return (
    <section className="flex flex-col h-full">
      <FileTag />
      <Card className="flex-1 m-4 border-0 shadow-none">
        <Textarea
          ref={textareaRef}
          onChange={handleChange}
          value={text}
          placeholder="Start writing markdown here...

# Welcome to Marky

## Features
- **Bold text** with Cmd+B
- *Italic text* with Cmd+I  
- `Code` with Cmd+E
- [Links](url) with Cmd+K
- Auto-save enabled
- Dark/light mode
- Split view editing

## Shortcuts
- **Cmd+S**: Save file
- **Cmd+B**: Bold
- **Cmd+I**: Italic
- **Cmd+E**: Code
- **Cmd+K**: Link

Try it out! 🚀"
          className="h-full w-full p-6 font-mono text-sm resize-none border-0 focus:outline-none"
          style={{ minHeight: '400px' }}
        />
      </Card>
    </section>
  )
}

export default Writer