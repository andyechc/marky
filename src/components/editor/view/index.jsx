import ReactMarkdown from 'react-markdown'
import './view.css'

const View = ({ text }) => {
  return (
    <section className="view">
    <h2 className="title">View - Markdown</h2>
      <ReactMarkdown className="view-code">{ text }</ReactMarkdown>
    </section>
  )
}

export default View;