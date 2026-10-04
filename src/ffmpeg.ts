import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

const CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm'

let ffmpeg: FFmpeg | null = null

export async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg

  const instance = new FFmpeg()
  await instance.load({
    coreURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${CORE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
  })

  ffmpeg = instance
  return instance
}

export async function compressTest(file: File): Promise<Blob> {
  const ff = await loadFFmpeg()

  await ff.writeFile('input', await fetchFile(file))

  const code = await ff.exec([
    '-i', 'input',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-b:v', '500k',
    '-vf', 'scale=-2:360',
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
}