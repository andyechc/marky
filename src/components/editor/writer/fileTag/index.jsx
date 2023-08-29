import { useContext, useState } from "react"
import { FileContext } from '/src/context/fileContext'
import { MdIcon } from '/src/components/icons'
import './fileTag.css'

function FileTag () {
  const [ changeName, setChangeName ] = useState(false)
  const { fileName, setFileName, extension } = useContext(FileContext)
  
  const handleDoubleClick = e => {
    !changeName && setChangeName(true)
  }
  
  const handleSubmit = e => {
    e.preventDefault()
    
    if (e.type === 'submit') {
      const form = e.target
      const input = form.getElementsByTagName('input')[0]
      const newName = input.value
      newName && setFileName(newName)
      setChangeName(false)
    }
    
    else{
      const newName = e.target.value
      newName && setFileName(newName)
      setChangeName(false)
    }
  }

  
  return (
    <form 
      className="file-tag" 
      onSubmit={ handleSubmit } 
      onDoubleClick={ handleDoubleClick }
      onBlur={ handleSubmit }
    >
      { 
        extension === "md" 
          ? <MdIcon size="1.5em" color="#700"/> 
          : extension.toUpperCase() + " - " 
      } 
          
      <input placeholder={fileName} disabled={ !changeName } autofocus />
    </form>
  )
}

export default FileTag;