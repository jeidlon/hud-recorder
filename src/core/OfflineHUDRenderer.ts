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
      case 'dream-persona-remaster':
        return this.renderDreamPersona(state)
      case 'hexa-tactical':
        return this.renderHexaTactical(state)
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

  /**
   * Hexa-Tactical OS 98 HUD 렌더링
   * Win98 홀로그램 크롬 스타일의 퓨처리즘 + 레트로 UI
   */
  private renderHexaTactical(state: FrameState): OffscreenCanvas {
    const width = this.config.width / this.scale
    const height = this.config.height / this.scale
    const ctx = this.ctx
    const frame = this.frameIndex
    const time = frame / 60

    ctx.clearRect(0, 0, width, height)

    const { mouse, customData } = state

    // 색상 팔레트 - Win98 홀로그램 크롬
    const COLORS = {
      gold: '#FFD700',
      goldDim: 'rgba(255, 215, 0, 0.6)',
      goldGlow: 'rgba(255, 215, 0, 0.3)',
      borderOuter: 'rgba(255, 248, 225, 0.5)',
      borderInner: 'rgba(255, 215, 0, 0.35)',
      bgPanel: 'rgba(20, 18, 14, 0.85)',
      textMain: '#FFF8E1',
      textDim: 'rgba(255, 248, 225, 0.7)',
      cyan: '#40C4FF',
      red: '#FF4444',
    }

    // 시나리오 확인
    const scenario = (customData as { scenario?: string })?.scenario || 'idle'
    const isDanger = scenario === 'monster_combat' || scenario === 'infected'

    // 테마 색상
    const themeColor = isDanger ? COLORS.red : COLORS.gold
    const themeDim = isDanger ? 'rgba(255, 68, 68, 0.6)' : COLORS.goldDim

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 글로벌 효과: 스캔라인
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ctx.save()
    ctx.globalAlpha = 0.03
    for (let y = 0; y < height; y += 3) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, y, width, 1)
    }
    ctx.restore()

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 헬퍼 함수: WindowShell 스타일 패널 그리기
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const drawPanel = (x: number, y: number, w: number, h: number, title: string, borderColor: string = themeColor) => {
      const titleBarHeight = 14

      // 배경
      ctx.fillStyle = COLORS.bgPanel
      ctx.fillRect(x, y, w, h)

      // 외곽 테두리
      ctx.strokeStyle = COLORS.borderOuter
      ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)

      // 타이틀바 배경
      const titleGrad = ctx.createLinearGradient(x, y, x + w, y)
      titleGrad.addColorStop(0, `${borderColor}40`)
      titleGrad.addColorStop(1, `${borderColor}10`)
      ctx.fillStyle = titleGrad
      ctx.fillRect(x + 1, y + 1, w - 2, titleBarHeight)

      // 타이틀바 하단 선
      ctx.strokeStyle = `${borderColor}50`
      ctx.beginPath()
      ctx.moveTo(x, y + titleBarHeight)
      ctx.lineTo(x + w, y + titleBarHeight)
      ctx.stroke()

      // 타이틀 텍스트
      ctx.font = 'bold 8px "Outfit", "Orbitron", sans-serif'
      ctx.fillStyle = COLORS.textMain
      ctx.textAlign = 'left'
      ctx.fillText(title.toUpperCase(), x + 6, y + 10)

      // 윈도우 컨트롤 버튼 (최소화, 최대화, 닫기)
      const btnSize = 6
      const btnY = y + 4
      const btnSpacing = 9
      const startX = x + w - 28

      // 최소화
      ctx.strokeStyle = themeDim
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(startX, btnY + btnSize / 2)
      ctx.lineTo(startX + btnSize, btnY + btnSize / 2)
      ctx.stroke()

      // 최대화
      ctx.strokeRect(startX + btnSpacing, btnY, btnSize, btnSize)

      // 닫기 (X)
      ctx.beginPath()
      ctx.moveTo(startX + btnSpacing * 2, btnY)
      ctx.lineTo(startX + btnSpacing * 2 + btnSize, btnY + btnSize)
      ctx.moveTo(startX + btnSpacing * 2 + btnSize, btnY)
      ctx.lineTo(startX + btnSpacing * 2, btnY + btnSize)
      ctx.stroke()

      return { contentY: y + titleBarHeight + 4, contentH: h - titleBarHeight - 8 }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 헬퍼 함수: 세그먼트 바 그리기
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const drawSegmentedBar = (x: number, y: number, w: number, h: number, fillPercent: number, color: string) => {
      const segments = 18
      const gap = 1
      const segWidth = (w - (segments - 1) * gap) / segments
      const filledCount = Math.round((fillPercent / 100) * segments)

      for (let i = 0; i < segments; i++) {
        const segX = x + i * (segWidth + gap)
        const isFilled = i < filledCount

        if (isFilled) {
          // 채워진 세그먼트 (위가 밝고 아래가 어두운 그라데이션)
          const segGrad = ctx.createLinearGradient(segX, y, segX, y + h)
          segGrad.addColorStop(0, color)
          segGrad.addColorStop(1, `${color}88`)
          ctx.fillStyle = segGrad
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
        }
        ctx.fillRect(segX, y, segWidth, h)
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 좌측 상단: Player Status (HP/MP)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const statusX = 15
    const statusY = 15
    const statusW = 140
    const statusH = 95

    // 프로필 영역
    const profileSize = 50
    const { contentY: statusContentY } = drawPanel(statusX, statusY, statusW, statusH, 'STATUS', themeColor)

    // 프로필 육각형 배경
    ctx.save()
    ctx.beginPath()
    const cx = statusX + 8 + profileSize / 2
    const cy = statusContentY + 3 + profileSize / 2
    const r = profileSize / 2 - 2
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const px = cx + r * Math.cos(angle)
      const py = cy + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(50, 45, 35, 0.8)'
    ctx.fill()
    ctx.strokeStyle = COLORS.borderOuter
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()

    // 프로필 아이콘 (간단한 사람 아이콘)
    ctx.fillStyle = COLORS.textDim
    ctx.beginPath()
    ctx.arc(cx, cy - 8, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx, cy + 12, 14, 12, 0, Math.PI, 0)
    ctx.fill()

    // HP 바
    const barX = statusX + 65
    const barW = 65
    const barH = 12
    const hpY = statusContentY + 8

    ctx.font = 'bold 8px "Outfit", sans-serif'
    ctx.fillStyle = COLORS.gold
    ctx.textAlign = 'left'
    ctx.fillText('HP:', barX, hpY + 9)
    drawSegmentedBar(barX + 18, hpY, barW, barH, 100, COLORS.gold)

    // MP 바
    const mpY = hpY + 20
    ctx.fillStyle = COLORS.cyan
    ctx.fillText('MP:', barX, mpY + 9)
    drawSegmentedBar(barX + 18, mpY, barW, barH, 100, COLORS.cyan)

    // 레벨 표시
    ctx.fillStyle = COLORS.textMain
    ctx.font = 'bold 10px "Outfit", sans-serif'
    ctx.fillText('Lv.1', barX, mpY + 32)

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우측 상단: Tactical Map
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const mapW = 110
    const mapH = 110
    const mapX = width - mapW - 15
    const mapY = 15

    const { contentY: mapContentY, contentH: mapContentH } = drawPanel(mapX, mapY, mapW, mapH, 'TACTICAL MAP', themeColor)

    // 미니맵 배경 (그리드)
    ctx.strokeStyle = `${themeColor}20`
    ctx.lineWidth = 0.5
    const gridSize = 15
    for (let gx = mapX + 4; gx < mapX + mapW - 4; gx += gridSize) {
      ctx.beginPath()
      ctx.moveTo(gx, mapContentY)
      ctx.lineTo(gx, mapContentY + mapContentH)
      ctx.stroke()
    }
    for (let gy = mapContentY; gy < mapContentY + mapContentH; gy += gridSize) {
      ctx.beginPath()
      ctx.moveTo(mapX + 4, gy)
      ctx.lineTo(mapX + mapW - 4, gy)
      ctx.stroke()
    }

    // 플레이어 위치 (중앙 점)
    ctx.fillStyle = themeColor
    ctx.beginPath()
    ctx.arc(mapX + mapW / 2, mapContentY + mapContentH / 2, 4, 0, Math.PI * 2)
    ctx.fill()

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 하단 중앙: Skill Modules
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const skillW = 180
    const skillH = 45
    const skillX = (width - skillW) / 2
    const skillY = height - skillH - 15

    const { contentY: skillContentY } = drawPanel(skillX, skillY, skillW, skillH, 'MODULES', themeColor)

    // 스킬 슬롯
    const slotSize = 22
    const slotGap = 6
    const totalSlotsW = slotSize * 4 + slotGap * 3
    const slotsStartX = skillX + (skillW - totalSlotsW) / 2

    for (let i = 0; i < 4; i++) {
      const slotX = slotsStartX + i * (slotSize + slotGap)
      ctx.strokeStyle = COLORS.borderInner
      ctx.lineWidth = 1
      ctx.strokeRect(slotX, skillContentY, slotSize, slotSize)

      // 슬롯 번호
      ctx.fillStyle = COLORS.textDim
      ctx.font = '9px "Outfit", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${i + 1}`, slotX + slotSize / 2, skillContentY + 14)
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 좌측 하단: System Log
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const logW = 170
    const logH = 85
    const logX = 15
    const logY = height - logH - 15

    const { contentY: logContentY } = drawPanel(logX, logY, logW, logH, 'SYSTEM LOG', themeColor)

    ctx.fillStyle = COLORS.textDim
    ctx.font = '8px "JetBrains Mono", monospace'
    ctx.textAlign = 'left'
    const logs = [
      '> Neural link established.',
      '> Sync rate: 98.4%',
      `> Scenario: ${scenario}`,
      isDanger ? '> Threat level: CRITICAL' : '> Threat level: NORMAL',
    ]
    logs.forEach((log, i) => {
      if (i === 3) ctx.fillStyle = themeColor
      ctx.fillText(log, logX + 6, logContentY + 10 + i * 12)
    })

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 우측 하단: Quick Access
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const quickW = 130
    const quickH = 55
    const quickX = width - quickW - 15
    const quickY = height - quickH - 15

    const { contentY: quickContentY } = drawPanel(quickX, quickY, quickW, quickH, 'QUICK', themeColor)

    // 퀵 슬롯
    const qSlotSize = 20
    const qGap = 5
    const qTotalW = qSlotSize * 4 + qGap * 3
    const qStartX = quickX + (quickW - qTotalW) / 2

    for (let i = 0; i < 4; i++) {
      const qx = qStartX + i * (qSlotSize + qGap)
      ctx.strokeStyle = COLORS.borderInner
      ctx.lineWidth = 1
      ctx.strokeRect(qx, quickContentY + 3, qSlotSize, qSlotSize)
      ctx.fillStyle = COLORS.textDim
      ctx.font = '8px "Outfit", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${i + 1}`, qx + qSlotSize / 2, quickContentY + 15)
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 마우스 크로스헤어 (있는 경우)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (mouse && mouse.x > 0 && mouse.y > 0) {
      const mx = mouse.x
      const my = mouse.y

      ctx.strokeStyle = themeColor
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.8

      // 십자선
      ctx.beginPath()
      ctx.moveTo(mx - 15, my)
      ctx.lineTo(mx - 5, my)
      ctx.moveTo(mx + 5, my)
      ctx.lineTo(mx + 15, my)
      ctx.moveTo(mx, my - 15)
      ctx.lineTo(mx, my - 5)
      ctx.moveTo(mx, my + 5)
      ctx.lineTo(mx, my + 15)
      ctx.stroke()

      // 중앙 점
      ctx.beginPath()
      ctx.arc(mx, my, 2, 0, Math.PI * 2)
      ctx.fillStyle = themeColor
      ctx.fill()

      ctx.globalAlpha = 1
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 코너 프레임 (ARWES 스타일)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cornerSize = 30
    ctx.strokeStyle = `${themeColor}60`
    ctx.lineWidth = 1.5

    // 좌상단
    ctx.beginPath()
    ctx.moveTo(0, cornerSize)
    ctx.lineTo(0, 0)
    ctx.lineTo(cornerSize, 0)
    ctx.stroke()

    // 우상단
    ctx.beginPath()
    ctx.moveTo(width - cornerSize, 0)
    ctx.lineTo(width, 0)
    ctx.lineTo(width, cornerSize)
    ctx.stroke()

    // 좌하단
    ctx.beginPath()
    ctx.moveTo(0, height - cornerSize)
    ctx.lineTo(0, height)
    ctx.lineTo(cornerSize, height)
    ctx.stroke()

    // 우하단
    ctx.beginPath()
    ctx.moveTo(width - cornerSize, height)
    ctx.lineTo(width, height)
    ctx.lineTo(width, height - cornerSize)
    ctx.stroke()

    // 시간 기반 애니메이션 효과 (코너 글로우)
    const pulse = 0.5 + Math.sin(time * 2) * 0.2
    ctx.globalAlpha = pulse
    ctx.strokeStyle = themeColor
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(5, 5 + cornerSize / 2)
    ctx.lineTo(5, 5)
    ctx.lineTo(5 + cornerSize / 2, 5)
    ctx.stroke()

    ctx.globalAlpha = 1

    this.frameIndex++
    return this.canvas
  }

  destroy(): void {
    this.frameIndex = 0
  }
}
