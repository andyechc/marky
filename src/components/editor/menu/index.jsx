import { useContext } from 'react'

import { FileContext } from '/src/context/fileContext'
import ThemeCheckbox from './themeCheckbox'
import MenuSection from './menuSection'
import MenuItem from './menuItem'

import { SaveIcon, EditIcon } from '/src/components/icons'
import './menu.css'

function Menu () {
  const { saveFile } = useContext(FileContext)
  
  return (
    <aside className="menu">
      <MenuSection header="File">
        <MenuItem label="Save" onClick={ saveFile }>
          <SaveIcon size="1.3em" color="#f00" />
        </MenuItem>
      </MenuSection>
      
      <MenuSection header="Configuration">
        <ThemeCheckbox />
      </MenuSection>
    </aside>
  )
}

export default Menu;