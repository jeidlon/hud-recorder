import { MP4Demuxer } from './MP4Demuxer'
import { VideoDecoderWrapper } from './VideoDecoderWrapper'
import { VideoEncoderWrapper } from './VideoEncoderWrapper'
import { FrameCompositor } from './FrameCompositor'
import { OfflineHUDRenderer } from './OfflineHUDRenderer'
import { InputInterpolator } from './InputInterpolator'
import type { RecordingSession } from '@/types/input-log'

export interface RenderingCallbacks {
  onProgress: (progress: number, currentFrame: number, totalFrames: number) => void
  onComplete: (chunks: EncodedVideoChunk[], metadata: EncodedVideoChunkMetadata[]) => void
  onError: (error: Error) => void
}

/**
 * 스트리밍 방식 렌더링 파이프라인
 * 메모리 효율을 위해 프레임을 하나씩 디코딩 → 합성 → 인코딩 → 해제
 */
export class RenderingPipeline {
  private session: RecordingSession
  private videoFile: File
  private callbacks: RenderingCallbacks

  private encodedChunks: EncodedVideoChunk[] = []
  private chunkMetadata: EncodedVideoChunkMetadata[] = []

  constructor(session: RecordingSession, videoFile: File, callbacks: RenderingCallbacks) {
    this.session = session
    this.videoFile = videoFile
    this.callbacks = callbacks
  }

  async start(): Promise<void> {
    const { videoInfo, inputLog, hudStateLog, duration } = this.session
    const { width, height, fps } = videoInfo

    console.log('Starting streaming rendering pipeline...')
    console.log(`Resolution: ${width}x${height}, FPS: ${fps}, Duration: ${duration}ms`)

    // 1. 입력 보간기 생성
    const interpolator = new InputInterpolator(inputLog, hudStateLog)

    // 2. 컴포지터 및 HUD 렌더러 생성
    const compositor = new FrameCompositor({ width, height })
    const hudRenderer = new OfflineHUDRenderer({ width, height })

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

    console.log(`Encoding complete. ${this.encodedChunks.length} chunks`)
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
