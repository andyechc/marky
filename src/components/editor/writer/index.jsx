import { useContext } from 'react'
import { FileContext } from '/src/context/fileContext'
import FileTag from './fileTag'
import './writer.css'

function Writer () {
  const { text, setText } = useContext(FileContext)
  
  const handleChange = e => {
    const newText = e.target.value
    setText( newText )
  }
  
  return (
    <section className="writer">
      <FileTag />
      
      <textarea 
        onChange={ handleChange } 
        value={ text } 
        placeholder="Start Coding Markdown Here..." 
        translate="no"
      />
    </section>
  )
}

export default Writer