import { useState, type ChangeEvent } from 'react'
import { compress } from './ffmpeg'
import { getVideoDuration } from './duration'
import { calcVideoBitrate, pickHeight } from './bitrate'

type Status = 'idle' | 'compressing' | 'done' | 'error'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState<number | null>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(selected)
    setDuration(null)
    setResultUrl(null)
    setResultSize(null)
    setStatus('idle')

    if (!selected) return
    try {
      setDuration(await getVideoDuration(selected))
    } catch (error) {
      console.error(error)
    }
  }

  async function handleCompress() {
  if (!file || duration === null) return
  setStatus('compressing')
  try {
    const bitrate = calcVideoBitrate(duration)
    const blob = await compress(file, bitrate, pickHeight(bitrate))
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
      {duration !== null && (
        <p>
          Длительность: {duration.toFixed(1)} с. Битрейт видео под 10 МБ:{' '}
          {Math.round(calcVideoBitrate(duration) / 1000)} кбит/с
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