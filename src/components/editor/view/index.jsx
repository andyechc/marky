import { useContext } from 'react'
import { FileContext } from '/src/context/fileContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

function View() {
  const { fileName, text, extension } = useContext(FileContext)
  
  // Check if it's a markdown file or if we should show preview anyway
  const isMarkdownFile = extension === "md" || !extension || fileName.includes("TMV3IERVY3VTZW50LM1K")
  
  if (!isMarkdownFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
          <p className="text-muted-foreground">Preview is only available for markdown (.md) files</p>
        </Card>
      </div>
    )
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
  }

  const isDark = document.documentElement.classList.contains('dark')

  return (
    <section className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Card className="flex-1 m-4 border-0 shadow-none overflow-auto">
        <div className="prose prose-gray dark:prose-invert max-w-4xl p-6 break-words">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <div className="relative">
                    <SyntaxHighlighter
                      {...props}
                      children={String(children).replace(/\n$/, '')}
                      language={match[1]}
                      style={isDark ? oneDark : oneLight}
                      wrapLongLines={true}
                      PreTag="div"
                      className="rounded-md"
                    />
                  </div>
                ) : (
                  <code {...props} className={cn(
                    "bg-muted px-1.5 py-0.5 rounded text-sm font-mono break-all",
                    className
                  )}>
                    {children}
                  </code>
                )
              },
              h1: ({children}) => <h1 className="text-3xl font-bold mb-6 pb-2 border-b break-words">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-semibold mb-4 mt-8 break-words">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-semibold mb-3 mt-6 break-words">{children}</h3>,
              p: ({children}) => <p className="mb-4 leading-7 break-words">{children}</p>,
              ul: ({children}) => <ul className="mb-4 pl-6 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="mb-4 pl-6 space-y-1 list-decimal">{children}</ol>,
              li: ({children}) => <li className="leading-7 break-words">{children}</li>,
              blockquote: ({children}) => (
                <blockquote className="border-l-4 border-red-600 pl-4 italic my-4 text-muted-foreground break-words">
                  {children}
                </blockquote>
              ),
              a: ({children, href}) => (
                <a href={href} className="text-red-600 hover:text-red-700 hover:underline break-all" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              img: ({src, alt}) => (
                <img src={src} alt={alt} className="rounded-lg max-w-full h-auto my-4" />
              ),
              table: ({children}) => (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse border border-border">
                    {children}
                  </table>
                </div>
              ),
              th: ({children}) => (
                <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="border border-border px-4 py-2 break-words">
                  {children}
                </td>
              ),
            }}
          >
            {text}
          </ReactMarkdown>
        </div>
      </Card>
    </section>
  )
}

export default View