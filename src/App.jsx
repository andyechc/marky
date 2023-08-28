import { FileContextProvider } from "./context/fileContext";
import Header from "./components/header"
import Editor from "./components/editor"
import Footer from "./components/footer"

function App() {
  return (
    <FileContextProvider>
      <Header />
      <Editor />
      <Footer />
    </FileContextProvider>
  )
}

export default App
