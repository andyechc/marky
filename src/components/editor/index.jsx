import Writer from './writer'
import View from './view'
import './editor.css'

const Editor = ({ text, setText }) => {
  return (
    <main className="editor">
      <Writer setText={ setText }/>
      <View text={ text } />
    </main>
  )
}

export default Editor;