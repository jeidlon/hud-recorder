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
      case 'cyberpunk':
        return this.renderCyberpunk(state)
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

  /**
   * Cyberpunk HUD 렌더링 - Remotion 스타일 애니메이션
   * Canvas 2D로 동일한 비주얼 재현
   */
  private renderCyberpunk(state: FrameState): OffscreenCanvas {
    const width = this.config.width / this.scale
    const height = this.config.height / this.scale
    const ctx = this.ctx
    const frame = this.frameIndex
    const fps = 60

    ctx.clearRect(0, 0, width, height)

    const { mouse, targets } = state
    const targetX = targets?.main?.x ?? mouse.x
    const targetY = targets?.main?.y ?? mouse.y
    const isLocked = targets?.main?.locked ?? false

    // 색상 팔레트
    const COLORS = {
      primary: '#00f0ff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      warning: '#ff3333',
      success: '#00ff88',
      bgPanel: 'rgba(0, 20, 40, 0.8)',
    }

    // 스프링 애니메이션 유틸
    const spring = (f: number, delay: number = 0, damping: number = 30) => {
      const t = Math.max(0, f - delay) / fps
      const omega = 10
      const zeta = damping / 20
      return Math.min(1, 1 - Math.exp(-zeta * omega * t) * Math.cos(omega * Math.sqrt(1 - zeta * zeta) * t))
    }

    // ===== 스캔라인 =====
    const scanlineOffset = (frame % (fps * 2)) * 2
    ctx.save()
    ctx.globalAlpha = 0.05
    for (let y = scanlineOffset % 4; y < height; y += 4) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, y, width, 2)
    }
    ctx.restore()

    // ===== 좌상단 패널: 스탯 =====
    const panelAlpha = spring(frame, 0)
    ctx.save()
    ctx.globalAlpha = panelAlpha
    ctx.fillStyle = COLORS.bgPanel
    ctx.strokeStyle = `${COLORS.primary}40`
    ctx.lineWidth = 1
    
    const panelX = 20
    const panelY = 20
    const panelW = 200
    const panelH = 120
    
    ctx.beginPath()
    ctx.roundRect(panelX, panelY, panelW, panelH, 4)
    ctx.fill()
    ctx.stroke()

    // 패널 제목
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = COLORS.primary
    ctx.fillText('SYSTEM STATUS', panelX + 15, panelY + 25)

    // 스탯 바들
    const bars = [
      { label: 'HP', value: 85, max: 100, color: COLORS.success, delay: 5 },
      { label: 'ENERGY', value: 60, max: 100, color: COLORS.primary, delay: 10 },
      { label: 'SHIELD', value: 45, max: 100, color: COLORS.secondary, delay: 15 },
    ]

    bars.forEach((bar, i) => {
      const barY = panelY + 45 + i * 25
      const barProgress = spring(frame, bar.delay)
      const valueWidth = (bar.value / bar.max) * 160 * barProgress

      // 레이블
      ctx.font = '10px monospace'
      ctx.fillStyle = COLORS.primary
      ctx.fillText(bar.label, panelX + 15, barY)
      
      ctx.fillStyle = bar.color
      ctx.textAlign = 'right'
      ctx.fillText(`${bar.value}/${bar.max}`, panelX + panelW - 15, barY)
      ctx.textAlign = 'left'

      // 바 배경
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(panelX + 15, barY + 5, 170, 4)

      // 바 값
      ctx.fillStyle = bar.color
      ctx.shadowColor = bar.color
      ctx.shadowBlur = 10
      ctx.fillRect(panelX + 15, barY + 5, valueWidth, 4)
      ctx.shadowBlur = 0
    })
    ctx.restore()

    // ===== 우상단: 시간 & 좌표 =====
    const timeAlpha = spring(frame, 10)
    ctx.save()
    ctx.globalAlpha = timeAlpha
    ctx.fillStyle = COLORS.bgPanel
    ctx.strokeStyle = `${COLORS.primary}40`
    
    const timeX = width - 120
    const timeY = 20
    ctx.beginPath()
    ctx.roundRect(timeX, timeY, 100, 50, 4)
    ctx.fill()
    ctx.stroke()

    const seconds = Math.floor(frame / fps)
    const minutes = Math.floor(seconds / 60)
    const displaySeconds = seconds % 60
    const timeStr = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`

    ctx.font = 'bold 20px monospace'
    ctx.fillStyle = COLORS.primary
    ctx.textAlign = 'center'
    ctx.fillText(timeStr, timeX + 50, timeY + 28)
    
    ctx.font = '9px monospace'
    ctx.fillStyle = `${COLORS.primary}aa`
    ctx.fillText(`POS: ${Math.round(targetX)}, ${Math.round(targetY)}`, timeX + 50, timeY + 42)
    ctx.textAlign = 'left'
    ctx.restore()

    // ===== 하단 상태바 =====
    const statusAlpha = spring(frame, 20)
    ctx.save()
    ctx.globalAlpha = statusAlpha
    ctx.fillStyle = COLORS.bgPanel
    ctx.strokeStyle = `${COLORS.primary}40`
    
    const statusW = 280
    const statusX = width / 2 - statusW / 2
    const statusY = height - 50
    ctx.beginPath()
    ctx.roundRect(statusX, statusY, statusW, 30, 4)
    ctx.fill()
    ctx.stroke()

    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    
    ctx.fillStyle = COLORS.accent
    ctx.fillText('◆ TRACKING', statusX + 50, statusY + 18)
    
    ctx.fillStyle = isLocked ? COLORS.warning : COLORS.success
    ctx.fillText(isLocked ? '● LOCKED' : '● SCANNING', statusX + 140, statusY + 18)
    
    ctx.fillStyle = COLORS.primary
    ctx.fillText(`FPS: ${fps}`, statusX + 230, statusY + 18)
    ctx.textAlign = 'left'
    ctx.restore()

    // ===== 크로스헤어 =====
    const color = isLocked ? COLORS.warning : COLORS.primary
    const rotation = (frame % (fps * 4)) * (360 / (fps * 4))
    const pulse = 1 + Math.sin(frame * 0.1) * 0.05

    ctx.save()
    ctx.translate(targetX, targetY)

    // 외부 링 (회전)
    ctx.save()
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.5
    ctx.setLineDash([10, 5])
    ctx.beginPath()
    ctx.arc(0, 0, 40 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // 코너 마커
    ctx.lineWidth = 2
    ctx.globalAlpha = 1
    for (let i = 0; i < 4; i++) {
      ctx.save()
      ctx.rotate((i * Math.PI) / 2)
      ctx.beginPath()
      ctx.moveTo(35, -5)
      ctx.lineTo(40, 0)
      ctx.lineTo(35, 5)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()

    // 내부 크로스헤어
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-15, 0)
    ctx.lineTo(-5, 0)
    ctx.moveTo(5, 0)
    ctx.lineTo(15, 0)
    ctx.moveTo(0, -15)
    ctx.lineTo(0, -5)
    ctx.moveTo(0, 5)
    ctx.lineTo(0, 15)
    ctx.stroke()

    // 중앙 점
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(0, 0, 2, 0, Math.PI * 2)
    ctx.fill()

    // 락온 텍스트
    if (isLocked) {
      ctx.font = 'bold 12px monospace'
      ctx.fillStyle = COLORS.warning
      ctx.shadowColor = COLORS.warning
      ctx.shadowBlur = 10
      ctx.textAlign = 'center'
      ctx.fillText('LOCKED', 0, 55)
      ctx.shadowBlur = 0
    }

    ctx.restore()

    // ===== 코너 프레임 =====
    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.5

    // 좌상단
    ctx.beginPath()
    ctx.moveTo(0, 50)
    ctx.lineTo(0, 0)
    ctx.lineTo(50, 0)
    ctx.stroke()

    // 우상단
    ctx.beginPath()
    ctx.moveTo(width - 50, 0)
    ctx.lineTo(width, 0)
    ctx.lineTo(width, 50)
    ctx.stroke()

    // 좌하단
    ctx.beginPath()
    ctx.moveTo(0, height - 50)
    ctx.lineTo(0, height)
    ctx.lineTo(50, height)
    ctx.stroke()

    // 우하단
    ctx.beginPath()
    ctx.moveTo(width - 50, height)
    ctx.lineTo(width, height)
    ctx.lineTo(width, height - 50)
    ctx.stroke()

    ctx.globalAlpha = 1

    this.frameIndex++
    return this.canvas
  }

  destroy(): void {
    this.frameIndex = 0
  }
}
