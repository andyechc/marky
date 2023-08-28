import Menu from './menu'
import Writer from './writer'
import View from './view'
import './editor.css'

function Editor () {
  return (
    <main className="editor">
      <Menu />
      <Writer />
      <View />
    </main>
  )
}

export default Editor;