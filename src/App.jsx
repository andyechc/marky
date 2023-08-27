import { useState } from "react";
import Header from "./components/header"
import Editor from "./components/editor"
import Footer from "./components/footer"

function App() {
  const [ text, setText ] = useState(null)
  
  return (
    <>
      <Header />
      <Editor text={ text } setText={ setText } />
      <Footer length={ text ? text.length : 0 } />
    </>
  )
}

export default App
