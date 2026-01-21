export interface CompositorConfig {
  width: number
  height: number
}

/**
 * 비디오 프레임 위에 HUD를 합성
 * Canvas 2D를 사용하여 두 레이어를 합침
 */
export class FrameCompositor {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private config: CompositorConfig

  constructor(config: CompositorConfig) {
    this.config = config
    this.canvas = new OffscreenCanvas(config.width, config.height)

    const ctx = this.canvas.getContext('2d', {
      alpha: false, // 최종 출력은 불투명
      desynchronized: true, // 성능 최적화
    })

    if (!ctx) {
      throw new Error('Failed to create 2D context')
    }

    this.ctx = ctx
  }

  /**
   * 비디오 프레임과 HUD를 합성
   * @param videoFrame - VideoFrame 또는 ImageBitmap
   * @param hudFrame - HUD 렌더링 결과 (ImageBitmap 또는 Canvas)
   * @param timestamp - 타임스탬프 (microseconds)
   * @returns 합성된 VideoFrame
   */
  composite(
    videoFrame: VideoFrame | ImageBitmap,
    hudFrame: ImageBitmap | HTMLCanvasElement | OffscreenCanvas | null,
    timestamp: number
  ): VideoFrame {
    // 1. 비디오 프레임 그리기
    this.ctx.drawImage(videoFrame, 0, 0, this.config.width, this.config.height)

    // 2. HUD 오버레이 (있으면)
    if (hudFrame) {
      this.ctx.drawImage(hudFrame, 0, 0, this.config.width, this.config.height)
    }

    // 3. 새 VideoFrame 생성
    const compositeFrame = new VideoFrame(this.canvas, {
      timestamp: timestamp, // microseconds
      alpha: 'discard',
    })

    return compositeFrame
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    // OffscreenCanvas는 별도 정리 불필요
  }
}
