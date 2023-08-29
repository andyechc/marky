function CrayonIcon ({ size }) {
  return (
    <svg 
      stroke="#000" 
      fill="#ff0c00" 
      strokeWidth="0" 
      viewBox="0 0 16 16" 
      height={ size } 
      width={ size } 
      xmlns="http://www.w3.org/2000/svg">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z">
        </path>
    </svg>
  )
}

function MdIcon ({ size, color }) {
  return (
    <svg 
      stroke="currentColor" 
      fill={ color || "currentColor" }
      strokeWidth="0" 
      role="img" 
      viewBox="0 0 24 24" 
      height={ size }
      width={ size }
      xmlns="http://www.w3.org/2000/svg"
    >
      <title></title>
      <path 
        d="M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z"
      ></path>
    </svg>
  )
}

function MoonIcon ({ size, color, className }) {
  return (
    <svg
      className={ className }
      stroke="currentColor" 
      fill={ color || "currentColor" } 
      strokeWidth="0" 
      viewBox="0 0 24 24" 
      height={ size }
      width={ size }
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 11.807A9.002 9.002 0 0 1 10.049 2a9.942 9.942 0 0 0-5.12 2.735c-3.905 3.905-3.905 10.237 0 14.142 3.906 3.906 10.237 3.905 14.143 0a9.946 9.946 0 0 0 2.735-5.119A9.003 9.003 0 0 1 12 11.807z"
      ></path>
    </svg>
  )
}

function EditIcon ({ size, color, className }) {
  return (
    <svg 
      className={ className }
      stroke={ color || "currentColor" } 
      fill="none" 
      strokeWidth="2" 
      viewBox="0 0 24 24" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      height={ size } 
      width={ size }
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
        ></path>
      <path 
        d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
      ></path>
    </svg>
  )
}

function SaveIcon ({ size, color }) {
  return (
    <svg 
      stroke="currentColor" 
      fill={ color } 
      strokeWidth="0" 
      viewBox="0 0 24 24" 
      height={ size } 
      width={ size } 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="none" d="M0 0h24v24H0z"></path><path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path>
    </svg>
  )
}


export { CrayonIcon, MdIcon, MoonIcon, EditIcon, SaveIcon };