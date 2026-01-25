import { MP4Demuxer } from './MP4Demuxer'
import { VideoDecoderWrapper } from './VideoDecoderWrapper'
import { VideoEncoderWrapper } from './VideoEncoderWrapper'
import { FrameCompositor } from './FrameCompositor'
import { WebGPUCompositor, type WebGPUCompositorConfig } from './WebGPUCompositor'
import { checkWebGPUSupport } from './WebGPUSupport'
import { OfflineHUDRenderer } from './OfflineHUDRenderer'
import { LiveCaptureRenderer } from './LiveCaptureRenderer'
import { isReactBasedPreset } from './ReactHUDRenderer'
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
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // React 기반 프리셋은 LiveCaptureRenderer로 실제 미리보기 화면 캡처
    // (새로 컴포넌트 마운트하지 않고, 화면에 렌더링된 것을 그대로 캡처)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const useLiveCapture = isReactBasedPreset(presetId)
    console.log(`[Pipeline] Using ${useLiveCapture ? 'LiveCapture - 미리보기와 100% 동일' : 'Canvas 2D'} HUD renderer`)
    
    // HUD 렌더러 초기화
    let liveCaptureRenderer: LiveCaptureRenderer | null = null
    let canvasHudRenderer: OfflineHUDRenderer | null = null
    
    if (useLiveCapture) {
      liveCaptureRenderer = new LiveCaptureRenderer({ width, height })
      await liveCaptureRenderer.initialize()
      liveCaptureRenderer.startCapture()
      console.log('[Pipeline] ✅ LiveCaptureRenderer initialized - 실제 화면 캡처 방식')
    } else {
      canvasHudRenderer = new OfflineHUDRenderer({ width, height, presetId })
    }

    // 3. 인코더 초기화
    const encoder = new VideoEncoderWrapper(
      { width, height, framerate: fps, bitrate: 20_000_000 }, // 20Mbps
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // LiveCapture 렌더러 사용 시: 실제 화면에서 HUD 캡처
    // 비디오 프레임을 버퍼에 저장하고, HUD는 화면에서 캡처
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (useLiveCapture && liveCaptureRenderer) {
      // 비디오 프레임을 버퍼에 저장
      const videoFrameBuffer: { frame: VideoFrame; index: number }[] = []
      let decodingComplete = false
      let bufferResolve: (() => void) | null = null
      
      // 디코딩 시작
      const decodingPromise = new Promise<void>((resolve, reject) => {
        const decoder = new VideoDecoderWrapper({
          onFrame: (frame) => {
            videoFrameBuffer.push({ frame, index: videoFrameBuffer.length })
            bufferResolve?.()
          },
          onError: reject,
        })

        const demuxer = new MP4Demuxer({
          onConfig: (config) => decoder.configure(config),
          onChunk: (chunk) => decoder.decode(chunk),
          onComplete: async () => {
            try {
              await decoder.flush()
              decodingComplete = true
              bufferResolve?.()
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onError: reject,
        })

        demuxer.loadFile(this.videoFile)
      })

      // 프레임 순차 처리 루프
      let frameIndex = 0
      let lastVideoFrame: VideoFrame | null = null // 마지막 비디오 프레임 보관
      
      while (frameIndex < totalFrames) {
        // 버퍼에 처리할 프레임이 없으면 대기
        while (videoFrameBuffer.length === 0 && !decodingComplete) {
          await new Promise<void>((r) => { bufferResolve = r })
        }
        
        // 버퍼가 비어있고 디코딩도 완료됐으면 마지막 프레임 재사용
        let frame: VideoFrame
        if (videoFrameBuffer.length === 0 && decodingComplete) {
          if (lastVideoFrame) {
            // 마지막 비디오 프레임 복제하여 사용 (freeze frame)
            frame = lastVideoFrame.clone()
            console.log(`[Pipeline] Frame ${frameIndex}: 비디오 프레임 소진, 마지막 프레임 재사용`)
          } else {
            console.warn('[Pipeline] 비디오 프레임 없음, 렌더링 종료')
            break
          }
        } else {
          const item = videoFrameBuffer.shift()!
          frame = item.frame
          
          // 마지막 프레임 보관 (이전 것은 해제)
          if (lastVideoFrame) {
            lastVideoFrame.close()
          }
          lastVideoFrame = frame.clone()
        }
        const state = frameStates[frameIndex]
        const timestamp = (frameIndex / fps) * 1_000_000 // microseconds

        try {
          // 실제 화면에서 HUD 캡처 (미리보기와 100% 동일!)
          const timestampMs = (frameIndex / fps) * 1000  // 밀리초
          const hudCanvas = await liveCaptureRenderer.captureHUDOnly(state, timestampMs)
          
          if (hudCanvas) {
            // 합성
            const compositeFrame = compositor.composite(frame, hudCanvas, timestamp)
            
            // 인코딩
            encoder.encodeFrame(compositeFrame, frameIndex === 0)
            
            // 메모리 해제
            compositeFrame.close()
          } else {
            // HUD 캡처 실패 시 비디오만 인코딩
            console.warn(`[Pipeline] Frame ${frameIndex}: HUD 캡처 실패, 비디오만 인코딩`)
            const videoOnlyFrame = new VideoFrame(frame, { timestamp })
            encoder.encodeFrame(videoOnlyFrame, frameIndex === 0)
            videoOnlyFrame.close()
          }
          
          frame.close()
          
          // 진행률 업데이트
          const progress = ((frameIndex + 1) / totalFrames) * 100
          this.callbacks.onProgress(progress, frameIndex + 1, totalFrames)
          liveCaptureRenderer.updateProgress(progress)
          
          frameIndex++
          
          // UI 업데이트를 위한 yield
          if (frameIndex % 5 === 0) {
            await new Promise((r) => setTimeout(r, 0))
          }
        } catch (err) {
          frame.close()
          throw err
        }
      }
      
      // 디코딩 완료 대기
      await decodingPromise
      
      // 마지막 비디오 프레임 정리
      if (lastVideoFrame) {
        lastVideoFrame.close()
      }
      
      // 정리
      liveCaptureRenderer.stopCapture()
      liveCaptureRenderer.destroy()
      
    } else {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Canvas 렌더러: 기존 스트리밍 방식 (동기 렌더링)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      let frameIndex = 0

      await new Promise<void>((resolve, reject) => {
        const decoder = new VideoDecoderWrapper({
          onFrame: async (frame) => {
            try {
              if (frameIndex >= totalFrames) {
                frame.close()
                return
              }

              const state = frameStates[frameIndex]
              const timestamp = (frameIndex / fps) * 1_000_000

              // HUD 렌더링 (Canvas 2D - 동기)
              const hudCanvas = canvasHudRenderer!.render(state)

              // 합성
              const compositeFrame = compositor.composite(frame, hudCanvas, timestamp)

              // 인코딩
              encoder.encodeFrame(compositeFrame, frameIndex === 0)

              // 메모리 해제
              compositeFrame.close()
              frame.close()

              // 진행률 업데이트
              const progress = ((frameIndex + 1) / totalFrames) * 100
              this.callbacks.onProgress(progress, frameIndex + 1, totalFrames)

              frameIndex++

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
      
      canvasHudRenderer?.destroy()
    }

    // 6. 인코딩 완료 대기
    await encoder.flush()
    encoder.close()

    // 7. 정리
    compositor.destroy()

    const compositorType = useWebGPU ? 'WebGPU' : 'Canvas 2D'
    const hudRendererType = useLiveCapture ? 'LiveCapture (미리보기 동일)' : 'Canvas 2D'
    console.log(`[Pipeline] ✅ Encoding complete`)
    console.log(`[Pipeline] Compositor: ${compositorType}, HUD Renderer: ${hudRendererType}`)
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
