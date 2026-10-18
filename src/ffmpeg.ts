import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'

let ffmpeg: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null
let coreUrls: Promise<{ coreURL: string; wasmURL: string }> | null = null

function getCoreUrls() {
  coreUrls ??= Promise.all([
    toBlobURL(`${CORE_URL}/ffmpeg-core.js`, 'text/javascript'),
    toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  ]).then(([coreURL, wasmURL]) => ({ coreURL, wasmURL }))
  coreUrls.catch(() => {
    coreUrls = null
  })
  return coreUrls
}

export function loadFFmpeg(): Promise<FFmpeg> {
  if (loading) return loading

  const instance = new FFmpeg()
  ffmpeg = instance
  loading = (async () => {
    const urls = await getCoreUrls()
    if (ffmpeg !== instance) throw new Error('Загрузка FFmpeg отменена')
    await instance.load(urls)
    return instance
  })()
  loading.catch(() => {
    if (ffmpeg === instance) cancelCompression()
  })
  return loading
}

export function cancelCompression() {
  ffmpeg?.terminate()
  ffmpeg = null
  loading = null
}

export async function compress(
  file: File,
  videoBitrate: number,
  height: number,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const ff = await loadFFmpeg()

  const handler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)))
  }
  ff.on('progress', handler)

  try {
    await ff.writeFile('input', await fetchFile(file))

    const code = await ff.exec([
      '-i', 'input',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-b:v', String(videoBitrate),
      '-vf', `scale=-2:'min(ih,${height})'`,
      '-c:a', 'aac',
      '-b:a', '64k',
      '-movflags', '+faststart',
      'output.mp4',
    ])
    if (code !== 0) throw new Error(`FFmpeg завершился с кодом ${code}`)

    const data = await ff.readFile('output.mp4')
    await ff.deleteFile('input')
    await ff.deleteFile('output.mp4')

    return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' })
  } finally {
    ff.off('progress', handler)
  }
}