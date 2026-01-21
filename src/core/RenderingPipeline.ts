import { MP4Demuxer } from './MP4Demuxer'
import { VideoDecoderWrapper } from './VideoDecoderWrapper'
import { VideoEncoderWrapper } from './VideoEncoderWrapper'
import { FrameCompositor } from './FrameCompositor'
import { WebGPUCompositor, type WebGPUCompositorConfig } from './WebGPUCompositor'
import { checkWebGPUSupport } from './WebGPUSupport'
import { OfflineHUDRenderer } from './OfflineHUDRenderer'
import { InputInterpolator } from './InputInterpolator'
import type { RecordingSession } from '@/types/input-log'

export type CompositorMode = 'auto' | 'webgpu' | 'canvas2d'

export interface RenderingCallbacks {
  onProgress: (progress: number, currentFrame: number, totalFrames: number) => void
  onComplete: (chunks: EncodedVideoChunk[], metadata: EncodedVideoChunkMetadata[]) => void
  onError: (error: Error) => void
}

export interface RenderingOptions {
  /** 컴포지터 모드: 'auto' (기본값), 'webgpu', 'canvas2d' */
  compositorMode?: CompositorMode
  /** WebGPU 포스트 프로세싱 효과 */
  effects?: WebGPUCompositorConfig['effects']
}

/**
 * 스트리밍 방식 렌더링 파이프라인
 * 메모리 효율을 위해 프레임을 하나씩 디코딩 → 합성 → 인코딩 → 해제
 * 
 * WebGPU 또는 Canvas 2D 컴포지터를 선택적으로 사용 가능
 */
export class RenderingPipeline {
  private session: RecordingSession
  private videoFile: File
  private callbacks: RenderingCallbacks
  private options: RenderingOptions

  private encodedChunks: EncodedVideoChunk[] = []
  private chunkMetadata: EncodedVideoChunkMetadata[] = []

  constructor(
    session: RecordingSession,
    videoFile: File,
    callbacks: RenderingCallbacks,
    options: RenderingOptions = {}
  ) {
    this.session = session
    this.videoFile = videoFile
    this.callbacks = callbacks
    this.options = {
      compositorMode: options.compositorMode ?? 'auto',
      effects: options.effects,
    }
  }

  async start(): Promise<void> {
    const { videoInfo, inputLog, hudStateLog, duration } = this.session
    const { width, height, fps } = videoInfo
    const { compositorMode, effects } = this.options

    console.log('Starting streaming rendering pipeline...')
    console.log(`Resolution: ${width}x${height}, FPS: ${fps}, Duration: ${duration}ms`)

    // 1. 입력 보간기 생성
    const interpolator = new InputInterpolator(inputLog, hudStateLog)

    // 2. 컴포지터 생성 (WebGPU 우선, 폴백으로 Canvas 2D)
    let compositor: FrameCompositor | WebGPUCompositor
    let useWebGPU = false

    if (compositorMode === 'canvas2d') {
      console.log('[Pipeline] Using Canvas 2D compositor (forced)')
      compositor = new FrameCompositor({ width, height })
    } else {
      // WebGPU 지원 확인
      const webgpuSupport = await checkWebGPUSupport()
      
      if (webgpuSupport.supported && webgpuSupport.device) {
        try {
          compositor = await WebGPUCompositor.create(webgpuSupport.device, {
            width,
            height,
            effects,
          })
          useWebGPU = true
          console.log('[Pipeline] ✨ Using WebGPU compositor with effects:', effects)
        } catch (err) {
          console.warn('[Pipeline] WebGPU compositor creation failed, falling back to Canvas 2D:', err)
          compositor = new FrameCompositor({ width, height })
        }
      } else {
        if (compositorMode === 'webgpu') {
          throw new Error(`WebGPU requested but not available: ${webgpuSupport.error}`)
        }
        console.log('[Pipeline] WebGPU not available, using Canvas 2D compositor')
        compositor = new FrameCompositor({ width, height })
      }
    }
    
    // HUD URL에서 프리셋 ID 추출
    const hudUrl = this.session.hudInfo?.url || ''
    const presetId = hudUrl.startsWith('__inline__:') 
      ? hudUrl.replace('__inline__:', '') 
      : 'target-lock'
    console.log(`Using HUD preset: ${presetId}`)
    
    const hudRenderer = new OfflineHUDRenderer({ width, height, presetId })

    // 3. 인코더 초기화
    const encoder = new VideoEncoderWrapper(
      { width, height, framerate: fps, bitrate: 20_000_000 }, // 20Mbps로 낮춤
      {
        onChunk: (chunk, meta) => {
          this.encodedChunks.push(chunk)
          this.chunkMetadata.push(meta)
        },
        onError: (err) => this.callbacks.onError(err),
      }
    )
    await encoder.initialize()

    // 4. 프레임별 상태 미리 계산
    const frameStates = interpolator.generateFrameStates(fps, duration)
    const totalFrames = frameStates.length

    console.log(`Total frames to render: ${totalFrames}`)

    // 5. 스트리밍 디코딩 + 합성 + 인코딩
    let frameIndex = 0

    await new Promise<void>((resolve, reject) => {
      const decoder = new VideoDecoderWrapper({
        onFrame: async (frame) => {
          try {
            // 현재 프레임 인덱스가 범위 내인지 확인
            if (frameIndex >= totalFrames) {
              frame.close()
              return
            }

            const state = frameStates[frameIndex]
            const timestamp = (frameIndex / fps) * 1_000_000 // microseconds

            // HUD 렌더링
            const hudCanvas = hudRenderer.render(state)

            // 합성
            const compositeFrame = compositor.composite(frame, hudCanvas, timestamp)

            // 인코딩
            encoder.encodeFrame(compositeFrame, frameIndex === 0)

            // 즉시 메모리 해제
            compositeFrame.close()
            frame.close()

            // 진행률 업데이트
            const progress = ((frameIndex + 1) / totalFrames) * 100
            this.callbacks.onProgress(progress, frameIndex + 1, totalFrames)

            frameIndex++

            // UI 업데이트를 위한 yield (매 30프레임마다)
            if (frameIndex % 30 === 0) {
              await new Promise((r) => setTimeout(r, 0))
            }
          } catch (err) {
            reject(err)
          }
        },
        onError: reject,
      })

      const demuxer = new MP4Demuxer({
        onConfig: (config) => decoder.configure(config),
        onChunk: (chunk) => decoder.decode(chunk),
        onComplete: async () => {
          try {
            await decoder.flush()
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        onError: reject,
      })

      demuxer.loadFile(this.videoFile)
    })

    // 6. 인코딩 완료 대기
    await encoder.flush()
    encoder.close()

    // 7. 정리
    compositor.destroy()
    hudRenderer.destroy()

    const compositorType = useWebGPU ? 'WebGPU' : 'Canvas 2D'
    console.log(`[Pipeline] ✅ Encoding complete with ${compositorType} compositor`)
    console.log(`[Pipeline] Total chunks: ${this.encodedChunks.length}`)
    this.callbacks.onComplete(this.encodedChunks, this.chunkMetadata)
  }

  /**
   * 인코딩된 청크 가져오기 (Muxer에서 사용)
   */
  getEncodedChunks(): {
    chunks: EncodedVideoChunk[]
    metadata: EncodedVideoChunkMetadata[]
  } {
    return {
      chunks: this.encodedChunks,
      metadata: this.chunkMetadata,
    }
  }
}
