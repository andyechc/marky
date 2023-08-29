import { createContext, useState } from "react"
import { saveAs } from "file-saver"

const FileContext = createContext()

export function FileContextProvider ({ children }) {
  const [ fileName, setFileName ] = useState("New Document.md")
  const [ text, setText ] = useState("# Lets Create Something Awesome!!")
  
  const extension = fileName.split(".").reverse()[0]
  
  function saveFile () {
    const blob = new Blob( [text], { type: 'text/markdown;chartset=utf-8'})
    try{
      saveAs( blob, fileName)
    }
    catch (e) {
      alert(e)
    }
    
  }
  
  const data = {
    fileName,
    setFileName,
    text,
    setText,
    extension,
    saveFile
  }
  
  return (
    <FileContext.Provider value={ data } >
      { children }
    </FileContext.Provider>
  )
}

export { FileContext }
