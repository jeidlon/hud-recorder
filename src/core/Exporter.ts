import { MP4MuxerWrapper } from './MP4Muxer'

export interface ExportConfig {
  width: number
  height: number
  fps: number
}

/**
 * EncodedVideoChunk[]를 MP4 Blob으로 변환
 */
export async function exportToMP4(
  encodedChunks: EncodedVideoChunk[],
  metadata: EncodedVideoChunkMetadata[],
  config: ExportConfig,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const muxer = new MP4MuxerWrapper({
    width: config.width,
    height: config.height,
    fps: config.fps,
  })

  // 첫 번째 메타데이터에서 decoder config 추출
  const firstMeta = metadata.find((m) => m.decoderConfig)
  muxer.initialize(firstMeta?.decoderConfig)

  // 비디오 청크 추가
  const total = encodedChunks.length
  for (let i = 0; i < total; i++) {
    muxer.addVideoChunk(encodedChunks[i], metadata[i])

    // 진행률 업데이트
    const progress = ((i + 1) / total) * 100
    onProgress?.(progress)

    // UI 업데이트를 위한 yield (매 100개마다)
    if (i % 100 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  // 최종 파일 생성
  return muxer.finalize()
}

/**
 * Blob을 파일로 다운로드
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
