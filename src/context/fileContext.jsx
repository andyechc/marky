import { createContext, useState } from "react"

const FileContext = createContext()

export function FileContextProvider ({ children }) {
  const [ fileName, setFileName ] = useState("New Document.md")
  const [ text, setText ] = useState("# Lets Create Something Awesome!!")
  
  const extension = fileName.split(".").reverse()[0]
  
  const data = {
    fileName,
    setFileName,
    text,
    setText,
    extension
  }
  
  return (
    <FileContext.Provider value={ data } >
      { children }
    </FileContext.Provider>
  )
}

export { FileContext }
