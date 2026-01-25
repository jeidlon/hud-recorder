import { OfflineHUDRenderer } from './OfflineHUDRenderer'
import { LiveCaptureRenderer } from './LiveCaptureRenderer'
import { isReactBasedPreset } from './ReactHUDRenderer'
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
 * React 기반 프리셋은 html-to-image로 캡처하여 미리보기와 동일한 퀄리티 보장
 * 
 * @param session - 녹화 세션
 * @param callbacks - 콜백
 * @param scale - 해상도 스케일 (기본 2x, 고해상도 출력)
 */
export async function exportHUDToPNGSequence(
  session: RecordingSession,
  callbacks: HUDExportCallbacks,
  scale: number = 2 // 기본 2x 해상도 (확대해도 선명)
): Promise<void> {
  const { videoInfo, inputLog, hudStateLog, duration, hudInfo } = session
  const { width: baseWidth, height: baseHeight, fps } = videoInfo

  // 고해상도 출력을 위한 스케일 적용
  const width = Math.round(baseWidth * scale)
  const height = Math.round(baseHeight * scale)

  // HUD URL에서 프리셋 ID 추출
  const hudUrl = hudInfo?.url || ''
  const presetId = hudUrl.startsWith('__inline__:') 
    ? hudUrl.replace('__inline__:', '') 
    : 'target-lock'
  
  const useLiveCapture = isReactBasedPreset(presetId)
  console.log(`PNG Export using HUD preset: ${presetId}, scale: ${scale}x (${width}x${height})`)
  console.log(`Using ${useLiveCapture ? 'LiveCapture (미리보기 동일)' : 'Canvas 2D'} renderer`)

  // 입력 보간기 생성
  const interpolator = new InputInterpolator(inputLog, hudStateLog)

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

  if (useLiveCapture) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // React 기반 HUD: LiveCaptureRenderer로 실제 화면 캡처 (미리보기와 100% 동일)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const liveCaptureRenderer = new LiveCaptureRenderer({ 
      width: baseWidth,
      height: baseHeight, 
    })
    
    try {
      await liveCaptureRenderer.initialize()
      liveCaptureRenderer.startCapture()
      
      // 순차 처리
      for (let i = 0; i < totalFrames; i++) {
        const state = frameStates[i]
        const frameName = `frame_${String(i + 1).padStart(5, '0')}.png`
        const timestampMs = (i / fps) * 1000  // 밀리초
        
        // 실제 화면에서 HUD 캡처
        const canvas = await liveCaptureRenderer.captureHUDOnly(state, timestampMs)
        
        if (canvas) {
          // Canvas를 Blob으로 변환
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b) => {
              if (b) resolve(b)
              else reject(new Error('Failed to convert canvas to blob'))
            }, 'image/png')
          })
          
          folder.file(frameName, blob)
        }
        
        // 진행률 업데이트
        const progress = ((i + 1) / totalFrames) * 100
        callbacks.onProgress(progress, i + 1, totalFrames)
        liveCaptureRenderer.updateProgress(progress)
        
        // UI 업데이트를 위한 yield
        if (i % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0))
        }
      }
      
      liveCaptureRenderer.stopCapture()
      liveCaptureRenderer.destroy()
    } catch (error) {
      liveCaptureRenderer.stopCapture()
      liveCaptureRenderer.destroy()
      throw error
    }
  } else {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Canvas 기반 HUD: 기존 OfflineHUDRenderer 사용
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const hudRenderer = new OfflineHUDRenderer({ width, height, presetId, scale })
    
    const BATCH_SIZE = 10
    
    for (let batchStart = 0; batchStart < totalFrames; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, totalFrames)
      
      const batchPromises: Promise<{ name: string; blob: Blob }>[] = []
      
      for (let i = batchStart; i < batchEnd; i++) {
        const state = frameStates[i]
        const frameName = `frame_${String(i + 1).padStart(5, '0')}.png`
        
        const hudCanvas = hudRenderer.render(state)
        
        const pngPromise = hudCanvas.convertToBlob({ type: 'image/png' })
          .then(blob => ({ name: frameName, blob }))
        
        batchPromises.push(pngPromise)
      }
      
      const batchResults = await Promise.all(batchPromises)
      
      for (const { name, blob } of batchResults) {
        folder.file(name, blob)
      }
      
      const progress = (batchEnd / totalFrames) * 100
      callbacks.onProgress(progress, batchEnd, totalFrames)
      
      await new Promise((r) => setTimeout(r, 0))
    }
    
    hudRenderer.destroy()
  }
  
  const renderTime = ((performance.now() - startTime) / 1000).toFixed(1)
  console.log(`Rendering complete in ${renderTime}s. Creating ZIP...`)

  // ZIP 생성
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE',
  })

  console.log(`PNG sequence exported: ${(zipBlob.size / 1024 / 1024).toFixed(2)} MB`)
  callbacks.onComplete(zipBlob)
}

/**
 * HUD만 투명 배경 WebM 비디오로 출력 (VP9 with alpha)
 * React 기반 프리셋은 html-to-image로 캡처
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
  
  const useLiveCapture = isReactBasedPreset(presetId)
  console.log(`WebM Export using HUD preset: ${presetId}`)
  console.log(`Using ${useLiveCapture ? 'LiveCapture (미리보기 동일)' : 'Canvas 2D'} renderer`)

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

  if (useLiveCapture) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // React 기반 HUD: LiveCaptureRenderer로 실제 화면 캡처
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const liveCaptureRenderer = new LiveCaptureRenderer({ width, height })
    
    try {
      await liveCaptureRenderer.initialize()
      liveCaptureRenderer.startCapture()
      
      for (let i = 0; i < totalFrames; i++) {
        const state = frameStates[i]
        const timestamp = (i / fps) * 1_000_000  // microseconds
        const timestampMs = (i / fps) * 1000     // milliseconds
        
        // 실제 화면에서 HUD 캡처
        const canvas = await liveCaptureRenderer.captureHUDOnly(state, timestampMs)
        
        if (canvas) {
          // VideoFrame 생성
          const frame = new VideoFrame(canvas, {
            timestamp,
            alpha: config.alpha === 'keep' ? 'keep' : 'discard',
          })
          
          encoder.encode(frame, { keyFrame: i % 60 === 0 })
          frame.close()
        }
        
        // 진행률 업데이트
        const progress = ((i + 1) / totalFrames) * 100
        callbacks.onProgress(progress, i + 1, totalFrames)
        liveCaptureRenderer.updateProgress(progress)
        
        if (i % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0))
        }
      }
      
      liveCaptureRenderer.stopCapture()
      liveCaptureRenderer.destroy()
    } catch (error) {
      liveCaptureRenderer.stopCapture()
      liveCaptureRenderer.destroy()
      throw error
    }
  } else {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Canvas 기반 HUD: 기존 OfflineHUDRenderer 사용
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const hudRenderer = new OfflineHUDRenderer({ width, height, presetId })
    
    for (let i = 0; i < totalFrames; i++) {
      const state = frameStates[i]
      const timestamp = (i / fps) * 1_000_000

      const hudCanvas = hudRenderer.render(state)

      const frame = new VideoFrame(hudCanvas, {
        timestamp,
        alpha: config.alpha === 'keep' ? 'keep' : 'discard',
      })

      encoder.encode(frame, { keyFrame: i % 60 === 0 })
      frame.close()

      const progress = ((i + 1) / totalFrames) * 100
      callbacks.onProgress(progress, i + 1, totalFrames)

      if (i % 30 === 0) {
        await new Promise((r) => setTimeout(r, 0))
      }
    }
    
    hudRenderer.destroy()
  }

  await encoder.flush()
  encoder.close()

  // WebM Muxer로 변환
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
