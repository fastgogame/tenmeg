const TARGET_BYTES = 9_500_000
const AUDIO_BITRATE = 64_000

export function calcVideoBitrate(durationSec: number): number {
  if (durationSec <= 0) {
    throw new Error('Длительность должна быть больше нуля')
  }
  const totalBitrate = (TARGET_BYTES * 8) / durationSec
  return Math.floor(totalBitrate - AUDIO_BITRATE)
}

export function pickHeight(videoBitrate: number): number {
  if (videoBitrate > 2_500_000) return 1080
  if (videoBitrate > 1_200_000) return 720
  if (videoBitrate > 600_000) return 540
  return 360
}