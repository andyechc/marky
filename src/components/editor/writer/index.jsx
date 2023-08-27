import './writer.css'

const Writer = ({ setText }) => {
  const handleChange = e => {
    const newText = e.target.value
    setText(newText)
  }
  
  return (
    <section className="writer">
    <h2 className="title">Code</h2>
      <textarea onChange={ handleChange } placeholder="Start Coding Markdown Here..." />
    </section>
  )
}

export default Writer;