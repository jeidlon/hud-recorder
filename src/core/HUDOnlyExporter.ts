import { OfflineHUDRenderer } from './OfflineHUDRenderer'
import { InputInterpolator } from './InputInterpolator'
import type { RecordingSession } from '@/types/input-log'
import JSZip from 'jszip'

export interface HUDExportCallbacks {
  onProgress: (progress: number, currentFrame: number, totalFrames: number) => void
  onComplete: (result: Blob) => void
  onError: (error: Error) => void
}

/**
 * HUD만 투명 배경으로 PNG 시퀀스 출력
 */
export async function exportHUDToPNGSequence(
  session: RecordingSession,
  callbacks: HUDExportCallbacks
): Promise<void> {
  const { videoInfo, inputLog, hudStateLog, duration, hudInfo } = session
  const { width, height, fps } = videoInfo

  // HUD URL에서 프리셋 ID 추출
  const hudUrl = hudInfo?.url || ''
  const presetId = hudUrl.startsWith('__inline__:') 
    ? hudUrl.replace('__inline__:', '') 
    : 'target-lock'
  console.log(`PNG Export using HUD preset: ${presetId}`)

  // 입력 보간기 생성
  const interpolator = new InputInterpolator(inputLog, hudStateLog)

  // HUD 렌더러 생성 (프리셋 ID 전달!)
  const hudRenderer = new OfflineHUDRenderer({ width, height, presetId })

  // 프레임별 상태 계산
  const frameStates = interpolator.generateFrameStates(fps, duration)
  const totalFrames = frameStates.length

  console.log(`Exporting ${totalFrames} HUD frames as PNG sequence...`)
  const startTime = performance.now()

  // ZIP 파일 생성
  const zip = new JSZip()
  const folder = zip.folder('hud-sequence')

  if (!folder) {
    callbacks.onError(new Error('Failed to create ZIP folder'))
    return
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 배치 병렬 처리 (한 번에 BATCH_SIZE 프레임씩 처리)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const BATCH_SIZE = 10 // 동시에 처리할 프레임 수
  
  for (let batchStart = 0; batchStart < totalFrames; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalFrames)
    
    // 배치 내 프레임들을 병렬로 렌더링 + PNG 변환
    const batchPromises: Promise<{ name: string; blob: Blob }>[] = []
    
    for (let i = batchStart; i < batchEnd; i++) {
      const state = frameStates[i]
      const frameName = `frame_${String(i + 1).padStart(5, '0')}.png`
      
      // HUD 렌더링 (동기)
      const hudCanvas = hudRenderer.render(state)
      
      // PNG 변환은 Promise로 (비동기 병렬)
      const pngPromise = hudCanvas.convertToBlob({ type: 'image/png' })
        .then(blob => ({ name: frameName, blob }))
      
      batchPromises.push(pngPromise)
    }
    
    // 배치 완료 대기
    const batchResults = await Promise.all(batchPromises)
    
    // ZIP에 추가
    for (const { name, blob } of batchResults) {
      folder.file(name, blob)
    }
    
    // 진행률 업데이트
    const progress = (batchEnd / totalFrames) * 100
    callbacks.onProgress(progress, batchEnd, totalFrames)
    
    // UI 업데이트를 위한 yield
    await new Promise((r) => setTimeout(r, 0))
  }

  hudRenderer.destroy()
  
  const renderTime = ((performance.now() - startTime) / 1000).toFixed(1)
  console.log(`Rendering complete in ${renderTime}s. Creating ZIP...`)

  // ZIP 생성 (PNG는 이미 압축되어 있으므로 STORE 모드 사용 - 더 빠름!)
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE', // 무압축 - PNG는 이미 압축됨!
  })

  console.log(`PNG sequence exported: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`)
  callbacks.onComplete(zipBlob)
}

/**
 * HUD만 투명 배경 WebM 비디오로 출력 (VP9 with alpha)
 */
export async function exportHUDToWebMAlpha(
  session: RecordingSession,
  callbacks: HUDExportCallbacks
): Promise<void> {
  const { videoInfo, inputLog, hudStateLog, duration, hudInfo } = session
  const { width, height, fps } = videoInfo

  // HUD URL에서 프리셋 ID 추출
  const hudUrl = hudInfo?.url || ''
  const presetId = hudUrl.startsWith('__inline__:') 
    ? hudUrl.replace('__inline__:', '') 
    : 'target-lock'
  console.log(`WebM Export using HUD preset: ${presetId}`)

  // VP9 알파 지원 확인
  const config: VideoEncoderConfig = {
    codec: 'vp09.00.10.08', // VP9 Profile 0
    width,
    height,
    bitrate: 10_000_000,
    framerate: fps,
    alpha: 'keep', // 알파 채널 유지
  }

  const support = await VideoEncoder.isConfigSupported(config)
  if (!support.supported) {
    // 알파 없이 VP9 시도
    console.warn('VP9 with alpha not supported, trying without alpha...')
    config.alpha = 'discard'
    const fallbackSupport = await VideoEncoder.isConfigSupported(config)
    if (!fallbackSupport.supported) {
      callbacks.onError(new Error('VP9 encoding not supported on this browser'))
      return
    }
  }

  // 입력 보간기 생성
  const interpolator = new InputInterpolator(inputLog, hudStateLog)

  // HUD 렌더러 생성 (프리셋 ID 전달!)
  const hudRenderer = new OfflineHUDRenderer({ width, height, presetId })

  // 프레임별 상태 계산
  const frameStates = interpolator.generateFrameStates(fps, duration)
  const totalFrames = frameStates.length

  console.log(`Exporting ${totalFrames} HUD frames as WebM...`)

  // 인코딩된 청크 저장
  const chunks: EncodedVideoChunk[] = []
  const metadata: EncodedVideoChunkMetadata[] = []

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      chunks.push(chunk)
      metadata.push(meta || {})
    },
    error: (e) => {
      callbacks.onError(new Error(e.message))
    },
  })

  encoder.configure(config)

  // 각 프레임 인코딩
  for (let i = 0; i < totalFrames; i++) {
    const state = frameStates[i]
    const timestamp = (i / fps) * 1_000_000 // microseconds

    // HUD 렌더링 (투명 배경)
    const hudCanvas = hudRenderer.render(state)

    // VideoFrame 생성
    const frame = new VideoFrame(hudCanvas, {
      timestamp,
      alpha: config.alpha === 'keep' ? 'keep' : 'discard',
    })

    encoder.encode(frame, { keyFrame: i % 60 === 0 })
    frame.close()

    // 진행률 업데이트
    const progress = ((i + 1) / totalFrames) * 100
    callbacks.onProgress(progress, i + 1, totalFrames)

    // UI 업데이트를 위한 yield
    if (i % 30 === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  await encoder.flush()
  encoder.close()
  hudRenderer.destroy()

  // WebM Muxer로 변환 (간단한 구현)
  // 실제로는 webm-muxer 패키지 사용 권장
  const blob = await createWebMBlob(chunks, metadata, width, height, fps)

  console.log(`WebM exported: ${(blob.size / 1024 / 1024).toFixed(2)} MB`)
  callbacks.onComplete(blob)
}

/**
 * 간단한 WebM Blob 생성 (chunks → Blob)
 * 실제 프로덕션에서는 webm-muxer 패키지 사용 권장
 */
async function createWebMBlob(
  chunks: EncodedVideoChunk[],
  _metadata: EncodedVideoChunkMetadata[],
  _width: number,
  _height: number,
  _fps: number
): Promise<Blob> {
  // EncodedVideoChunk를 ArrayBuffer로 변환
  const buffers: ArrayBuffer[] = []
  for (const chunk of chunks) {
    const buffer = new ArrayBuffer(chunk.byteLength)
    chunk.copyTo(buffer)
    buffers.push(buffer)
  }

  // 간단히 raw 데이터로 반환 (실제로는 WebM 컨테이너 필요)
  // webm-muxer 패키지로 대체 필요
  return new Blob(buffers, { type: 'video/webm' })
}
