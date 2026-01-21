import type { FrameState } from './InputInterpolator'
import {
  // 타입
  type HUDScenario,
  type PlayerStats,
  type EnemyData,
  type DamageIndicator,
  
  // 드로잉 함수들
  drawCurvedScreenEffect,
  drawScanlines,
  drawPlayerStats,
  drawMinimap,
  drawStatusBar,
  drawScenarioIndicator,
  drawKeyHints,
  drawCrosshair,
  drawExplorationHUD,
  drawEnemyDetectedHUD,
  drawTargetLockHUD,
  drawCombatHUD,
  drawDamageHUD,
  drawLevelUpHUD,
  drawLowHealthHUD,
} from '@/presets/dreamPersonaDrawing'

export interface HUDRendererConfig {
  width: number
  height: number
  presetId?: string
  scale?: number // 고해상도 출력을 위한 스케일 (기본 1)
}

/**
 * Offline Rendering 시 HUD 상태를 Canvas에 그리는 렌더러
 * 공유 드로잉 모듈을 사용하여 실시간 HUD와 동일한 렌더링 품질 제공
 */
export class OfflineHUDRenderer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  private config: HUDRendererConfig
  private frameIndex = 0
  private scale: number

  constructor(config: HUDRendererConfig) {
    this.config = config
    this.scale = config.scale || 1
    this.canvas = new OffscreenCanvas(config.width, config.height)

    const ctx = this.canvas.getContext('2d', { alpha: true })
    if (!ctx) {
      throw new Error('Failed to create 2D context')
    }
    this.ctx = ctx
    
    // 고해상도 출력을 위해 컨텍스트 스케일 적용
    if (this.scale !== 1) {
      ctx.scale(this.scale, this.scale)
    }
  }

  /**
   * 주어진 상태로 HUD 프레임 렌더링
   */
  render(state: FrameState): OffscreenCanvas {
    const presetId = this.config.presetId || 'target-lock'

    switch (presetId) {
      case 'dream-persona':
        return this.renderDreamPersona(state)
      case 'target-lock':
      default:
        return this.renderTargetLock(state)
    }
  }

  /**
   * DreamPersona HUD 렌더링 - 공유 드로잉 함수 사용
   */
  private renderDreamPersona(state: FrameState): OffscreenCanvas {
    // 스케일된 해상도가 아닌 논리적 해상도 사용 (ctx.scale 적용됨)
    const width = this.config.width / this.scale
    const height = this.config.height / this.scale
    const ctx = this.ctx
    const time = this.frameIndex / 60

    ctx.clearRect(0, 0, width, height)

    const { mouse, targets, customData } = state
    const targetX = targets?.main?.x ?? mouse.x
    const targetY = targets?.main?.y ?? mouse.y
    const isLocked = targets?.main?.locked ?? false

    // customData에서 상태 추출
    const scenario: HUDScenario = (customData as any)?.scenario || 'exploration'
    const stats: PlayerStats = (customData as any)?.stats || {
      hp: 100, maxHp: 100,
      stamina: 85, maxStamina: 100,
      energy: 60, maxEnergy: 100,
      level: 4, exp: 750, maxExp: 1000,
    }
    const enemy: EnemyData = (customData as any)?.enemy || {
      name: '앨리스', distance: 45.5, threatLevel: '높음', hp: 850, maxHp: 1000
    }
    const lockProgress = (customData as any)?.lockProgress || 0
    const damageIndicators: DamageIndicator[] = (customData as any)?.damageIndicators || []
    const levelUpTimer = (customData as any)?.levelUpTimer || 0
    const attackCooldown = (customData as any)?.attackCooldown || 0
    const maxCooldown = 2

    const mousePos = { x: targetX, y: targetY }
    const lockedPos = { x: targetX, y: targetY }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 공유 드로잉 함수들 호출 (실시간 HUD와 동일!)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Curved Screen 효과 (비네팅)
    drawCurvedScreenEffect(ctx, width, height)

    // 스캔라인 효과
    drawScanlines(ctx, width, height, time)

    // 좌상단: 플레이어 스탯
    drawPlayerStats(ctx, stats, scenario, time)

    // 우상단: 미니맵
    drawMinimap(ctx, width, mousePos, scenario, enemy, time)

    // 하단 중앙: 상태 표시
    drawStatusBar(ctx, width, height, scenario, stats, attackCooldown, maxCooldown, time)

    // 시나리오별 특수 UI
    switch (scenario) {
      case 'exploration':
        drawExplorationHUD(ctx, width, height, mousePos, time)
        break
      case 'enemy_detected':
        drawEnemyDetectedHUD(ctx, width, height, mousePos, enemy, time)
        break
      case 'target_lock':
        drawTargetLockHUD(ctx, width, height, mousePos, isLocked, lockedPos, lockProgress, enemy, time)
        break
      case 'combat_attack':
        drawCombatHUD(ctx, width, height, mousePos, attackCooldown, maxCooldown, stats, enemy, time)
        break
      case 'damage_received':
        drawDamageHUD(ctx, width, height, damageIndicators, time)
        break
      case 'level_up':
        drawLevelUpHUD(ctx, width, height, stats, levelUpTimer, time)
        break
      case 'low_health':
        drawLowHealthHUD(ctx, width, height, stats, time)
        break
    }

    // 크로스헤어 (공통)
    if (scenario !== 'level_up') {
      drawCrosshair(ctx, mousePos, isLocked ? lockedPos : mousePos, scenario, isLocked, time)
    }

    // 상단: 현재 시나리오 표시
    drawScenarioIndicator(ctx, width, scenario, time)

    // 하단: 키 힌트
    drawKeyHints(ctx, width, height)

    this.frameIndex++
    return this.canvas
  }

  /**
   * Target Lock HUD 렌더링 (기본)
   */
  private renderTargetLock(state: FrameState): OffscreenCanvas {
    // 스케일된 해상도가 아닌 논리적 해상도 사용 (ctx.scale 적용됨)
    const width = this.config.width / this.scale
    const height = this.config.height / this.scale
    const ctx = this.ctx

    ctx.clearRect(0, 0, width, height)

    const { mouse, targets } = state
    const targetX = targets?.main?.x ?? mouse.x
    const targetY = targets?.main?.y ?? mouse.y
    const isLocked = targets?.main?.locked ?? false

    const color = isLocked ? '#ff0000' : '#00ff00'

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
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 14px monospace'
      ctx.fillText('LOCKED', targetX + 55, targetY - 40)

      ctx.beginPath()
      ctx.arc(targetX, targetY, 40, 0, Math.PI * 2)
      ctx.stroke()

      const pulse = Math.sin(this.frameIndex / 5) * 0.3 + 0.7
      ctx.globalAlpha = pulse
      ctx.beginPath()
      ctx.arc(targetX, targetY, 55, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    ctx.fillStyle = color
    ctx.font = '12px monospace'
    ctx.fillText(`X: ${targetX.toFixed(0)} Y: ${targetY.toFixed(0)}`, 10, 20)
    ctx.fillText(isLocked ? '🔒 LOCKED' : '🎯 TRACKING', 10, 40)

    this.frameIndex++
    return this.canvas
  }

  destroy(): void {
    this.frameIndex = 0
  }
}
