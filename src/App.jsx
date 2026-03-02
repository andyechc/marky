import { FileContextProvider } from "./context/fileContext"
import Header from "./components/header"
import Editor from "./components/editor"
import Footer from "./components/footer"
import { Toaster } from "./components/ui/toaster"

function App() {
  return (
    <FileContextProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <Editor />
        <Footer />
      </div>
      <Toaster />
    </FileContextProvider>
  )
}

export default App
