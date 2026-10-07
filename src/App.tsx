import { useState, type ChangeEvent } from 'react'
import { compress } from './ffmpeg'
import { getVideoDuration } from './duration'
import {
  calcVideoBitrate,
  pickHeight,
  MIN_VIDEO_BITRATE,
  estimateMinSize,
  TARGET_BYTES,
  HARD_LIMIT_BYTES,
} from './bitrate'
import { MAX_FILE_MB, MAX_FILE_BYTES } from './limits'

type Status = 'idle' | 'compressing' | 'done' | 'error'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultSize, setResultSize] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    setFile(null)
    setDuration(null)
    setResultUrl(null)
    setResultSize(null)
    setStatus('idle')
    setMessage(null)

    if (!selected) return

    if (selected.size > MAX_FILE_BYTES) {
      setMessage(`Файл слишком большой. Максимум ${MAX_FILE_MB} МБ.`)
      return
    }

    setFile(selected)
    try {
      setDuration(await getVideoDuration(selected))
    } catch (error) {
      console.error(error)
      setMessage('Не удалось прочитать видео. Попробуйте формат MP4.')
    }
  }

  async function handleCompress() {
    if (!file || duration === null) return
    setStatus('compressing')
    setProgress(0)
    try {
      const bitrate = Math.max(calcVideoBitrate(duration), MIN_VIDEO_BITRATE)
      const onProgress = (ratio: number) => setProgress(Math.round(ratio * 100))

      let blob = await compress(file, bitrate, pickHeight(bitrate), onProgress)

      if (blob.size > HARD_LIMIT_BYTES && bitrate > MIN_VIDEO_BITRATE) {
        const corrected = Math.max(
          Math.floor(bitrate * (TARGET_BYTES / blob.size) * 0.95),
          MIN_VIDEO_BITRATE,
        )
        setProgress(0)
        blob = await compress(file, corrected, pickHeight(corrected), onProgress)
      }

      setResultUrl(URL.createObjectURL(blob))
      setResultSize(blob.size)
      setStatus('done')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink p-4 text-[#ededed]">
      <div className="w-full max-w-lg space-y-4 rounded-xl border border-line bg-[#0a0a0a] p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white text-center">Tenmeg</h1>
        <input
          type="file"
          accept="video/*"
          onChange={handleChange}
          className="block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-white/10"
        />
        {message && (
          <p className="rounded-md border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
            {message}
          </p>
        )}
        {file && (
          <p className="text-sm text-muted">
            {file.name}: {(file.size / 1024 / 1024).toFixed(1)} МБ
          </p>
        )}
        {duration !== null && (
          <p className="rounded-md border border-line p-3 text-sm">
            Длительность: {duration.toFixed(1)} с. Битрейт видео под 10 МБ:{' '}
            {Math.round(calcVideoBitrate(duration) / 1000)} кбит/с
          </p>
        )}
        {duration !== null && calcVideoBitrate(duration) < MIN_VIDEO_BITRATE && (
          <p className="rounded-md border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-300">
            До 10 МБ без сильной потери качества не сжать. Ожидаемый размер: около{' '}
            {(estimateMinSize(duration) / 1024 / 1024).toFixed(1)} МБ.
          </p>
        )}
        <button
          onClick={handleCompress}
          disabled={!file || status === 'compressing'}
          className="w-full rounded-md bg-white py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Сжать
        </button>
        <p className="font-mono text-xs text-muted">Статус: {status}</p>
        {status === 'compressing' && (
          <p className="flex items-center gap-2 text-sm">
            <progress className="h-1.5 w-full accent-white" value={progress} max={100} />{' '}
            {progress}%
          </p>
        )}
        {resultUrl && resultSize !== null && (
          <p className="rounded-md border border-line bg-white/5 p-4 text-white">
            Результат: {(resultSize / 1024 / 1024).toFixed(2)} МБ.{' '}
            <a
              href={resultUrl}
              download="tenmeg-output.mp4"
              className="font-medium underline underline-offset-4 hover:text-muted"
            >
              Скачать
            </a>
          </p>
        )}
      </div>
    </main>
  )
}

export default App