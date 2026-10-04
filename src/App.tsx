import { useState, type ChangeEvent } from 'react'
import { compressTest } from './ffmpeg'

type Status = 'idle' | 'compressing' | 'done' | 'error'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState<number | null>(null)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setResultUrl(null)
    setResultSize(null)
    setStatus('idle')
  }

  async function handleCompress() {
    if (!file) return
    setStatus('compressing')
    try {
      const blob = await compressTest(file)
      setResultUrl(URL.createObjectURL(blob))
      setResultSize(blob.size)
      setStatus('done')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
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
      <button
        onClick={handleCompress}
        disabled={!file || status === 'compressing'}
      >
        Сжать
      </button>
      <p>Статус: {status}</p>
      {resultUrl && resultSize !== null && (
        <p>
          Результат: {(resultSize / 1024 / 1024).toFixed(2)} МБ.{' '}
          <a href={resultUrl} download="tenmeg-output.mp4">
            Скачать
          </a>
        </p>
      )}
    </main>
  )
}

export default App