import { useState, type ChangeEvent } from 'react'

function App() {
  const [file, setFile] = useState<File | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
  }

  return (
    <main>
      <h1>Tenmeg</h1>
      <input type="file" accept="video/*" onChange={handleChange} />
      {file && (
        <p>
          {file.name}: {(file.size / 1024 / 1024).toFixed(1)} МБ
        </p>
      )}
    </main>
  )
}

export default App