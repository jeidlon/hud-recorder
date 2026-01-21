import type { FrameState } from './InputInterpolator'

export interface HUDRendererConfig {
  width: number
  height: number
}

/**
 * Offline Rendering 시 HUD 상태를 Canvas에 그리는 렌더러
 * InlineTargetLockHUD와 동일한 렌더링 로직 사용
 */
export class OfflineHUDRenderer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private config: HUDRendererConfig
  private frameIndex = 0

  constructor(config: HUDRendererConfig) {
    this.config = config
    this.canvas = new OffscreenCanvas(config.width, config.height)

    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      throw new Error('Failed to create 2D context')
    }
    this.ctx = ctx
  }

  /**
   * 주어진 상태로 HUD 프레임 렌더링
   * InlineTargetLockHUD와 동일한 스타일
   */
  render(state: FrameState): OffscreenCanvas {
    const { width, height } = this.config
    const ctx = this.ctx

    // 캔버스 클리어 (투명)
    ctx.clearRect(0, 0, width, height)

    const { mouse, targets } = state
    const targetX = targets?.main?.x ?? mouse.x
    const targetY = targets?.main?.y ?? mouse.y
    const isLocked = targets?.main?.locked ?? false

    const color = isLocked ? '#ff0000' : '#00ff00'

    // --- Target Lock HUD 렌더링 ---
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.fillStyle = color
    ctx.font = 'bold 12px monospace'

    // 십자선
    ctx.beginPath()
    ctx.moveTo(targetX - 20, targetY)
    ctx.lineTo(targetX + 20, targetY)
    ctx.moveTo(targetX, targetY - 20)
    ctx.lineTo(targetX, targetY + 20)
    ctx.stroke()

    // 원형 레티클
    ctx.beginPath()
    ctx.arc(targetX, targetY, 30, 0, Math.PI * 2)
    ctx.stroke()

    // 외곽 사각형
    ctx.strokeRect(targetX - 50, targetY - 50, 100, 100)

    // 코너 마커
    const cornerSize = 10
    const corners = [
      { x: targetX - 50, y: targetY - 50, dx: 1, dy: 1 },
      { x: targetX + 50, y: targetY - 50, dx: -1, dy: 1 },
      { x: targetX - 50, y: targetY + 50, dx: 1, dy: -1 },
      { x: targetX + 50, y: targetY + 50, dx: -1, dy: -1 },
    ]
    ctx.lineWidth = 3
    corners.forEach(({ x, y, dx, dy }) => {
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + cornerSize * dx, y)
      ctx.moveTo(x, y)
      ctx.lineTo(x, y + cornerSize * dy)
      ctx.stroke()
    })
    ctx.lineWidth = 2

    if (isLocked) {
      // LOCKED 텍스트
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('LOCKED', targetX + 55, targetY - 40)

      // 추가 원
      ctx.beginPath()
      ctx.arc(targetX, targetY, 40, 0, Math.PI * 2)
      ctx.stroke()

      // 펄스 효과 (프레임 인덱스 기반)
      const pulse = Math.sin(this.frameIndex / 5) * 0.3 + 0.7
      ctx.globalAlpha = pulse
      ctx.beginPath()
      ctx.arc(targetX, targetY, 55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // 좌표 표시
    ctx.fillStyle = color
    ctx.font = '12px monospace'
    ctx.fillText(`X: ${targetX.toFixed(0)} Y: ${targetY.toFixed(0)}`, 10, 20)
    ctx.fillText(isLocked ? '🔒 LOCKED' : '🎯 TRACKING', 10, 40)

    this.frameIndex++

    return this.canvas
  }

  destroy(): void {
    // OffscreenCanvas는 별도 정리 불필요
    this.frameIndex = 0
  }
}
