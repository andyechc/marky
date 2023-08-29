import { useContext } from 'react'
import { FileContext } from '/src/context/fileContext'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'

import './view.css'

function View () {
  const { fileName, text, extension } = useContext( FileContext )
  
  if ( extension != "md") {
    return null
  }
  
  return (
    <section className="view">
      <ReactMarkdown 
        className="view-code" 
        remarkPlugins={[remarkGfm]} 
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <SyntaxHighlighter
                {...props}
                children={String(children).replace(/\n$/, '')}
                language={match[1]}
                wrapLongLines={true}
                PreTag="div"
              />
            ) : (
              <code {...props} className={className}>
                {children}
              </code>
            )
          }
        }}
      >
        { text }
      </ReactMarkdown>
    </section>
  )
}

export default View;