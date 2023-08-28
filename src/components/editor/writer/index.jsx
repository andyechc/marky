import { useContext } from 'react'
import { FileContext } from '/src/context/fileContext'
import { MdIcon } from '/src/components/icons'
import './writer.css'

function Writer () {
  const { 
    text, 
    fileName, 
    setText, 
    extension
  } = useContext(FileContext)
  
  const handleChange = e => {
    const newText = e.target.value
    setText( newText )
  }
  
  return (
    <section className="writer">
      <small className="title">
        { extension === "md" ? <MdIcon size="1.5em" /> : "TXT " } 
        - { fileName }
      </small>
      
      <textarea onChange={ handleChange } value={ text } placeholder="Start Coding Markdown Here..." />
    </section>
  )
}

export default Writer