import type { FrameState } from './InputInterpolator'

export interface HUDRendererConfig {
  width: number
  height: number
  presetId?: string // 프리셋 ID 추가
}

// 색상 팔레트 - DreamPersonaHUD와 동일
const COLORS = {
  primary: '#FFD700',
  primaryGlow: '#FFEA00',
  secondary: '#00FFFF',
  danger: '#FF4444',
  success: '#00FF88',
  warning: '#FF8800',
  background: 'rgba(0, 0, 0, 0.6)',
}

/**
 * Offline Rendering 시 HUD 상태를 Canvas에 그리는 렌더러
 * 프리셋에 따라 다른 HUD 스타일 적용
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
   */
  render(state: FrameState): OffscreenCanvas {
    const presetId = this.config.presetId || 'target-lock'

    // 프리셋에 따라 다른 렌더링
    switch (presetId) {
      case 'dream-persona':
        return this.renderDreamPersona(state)
      case 'target-lock':
      default:
        return this.renderTargetLock(state)
    }
  }

  /**
   * DreamPersona HUD 렌더링
   */
  private renderDreamPersona(state: FrameState): OffscreenCanvas {
    const { width, height } = this.config
    const ctx = this.ctx
    const time = this.frameIndex / 60 // 시간 (초)

    ctx.clearRect(0, 0, width, height)

    const { mouse, targets, customData } = state
    const targetX = targets?.main?.x ?? mouse.x
    const targetY = targets?.main?.y ?? mouse.y
    const isLocked = targets?.main?.locked ?? false

    // customData에서 시나리오와 스탯 추출
    const scenario = (customData as any)?.scenario || 'exploration'
    const stats = (customData as any)?.stats || {
      hp: 100, maxHp: 100,
      stamina: 85, maxStamina: 100,
      energy: 60, maxEnergy: 100,
      level: 4, exp: 750, maxExp: 1000,
    }
    const enemy = (customData as any)?.enemy || {
      name: '앨리스', distance: 45.5, threatLevel: '높음', hp: 850, maxHp: 1000
    }

    // 스캔라인 효과
    this.drawScanlines(ctx, width, height)

    // 좌상단: 플레이어 스탯
    this.drawPlayerStats(ctx, stats, scenario, time)

    // 우상단: 미니맵
    this.drawMinimap(ctx, width, scenario, time)

    // 상단 중앙: 시나리오 인디케이터
    this.drawScenarioIndicator(ctx, width, scenario, time)

    // 하단: 상태 바
    this.drawStatusBar(ctx, width, height, scenario, stats, time)

    // 크로스헤어
    if (scenario !== 'level_up') {
      this.drawCrosshair(ctx, targetX, targetY, scenario, isLocked, time)
    }

    // 시나리오별 특수 효과
    if (scenario === 'damage_received') {
      this.drawDamageEffect(ctx, width, height, time)
    } else if (scenario === 'low_health') {
      this.drawLowHealthEffect(ctx, width, height, stats, time)
    } else if (scenario === 'level_up') {
      this.drawLevelUpEffect(ctx, width, height, stats, time)
    } else if (scenario === 'enemy_detected' || scenario === 'target_lock' || scenario === 'combat_attack') {
      this.drawEnemyInfo(ctx, width, enemy, scenario, time)
    }

    // 하단: 키 힌트
    this.drawKeyHints(ctx, width, height)

    this.frameIndex++
    return this.canvas
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // DreamPersona 드로잉 함수들
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private drawScanlines(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number) {
    ctx.save()
    ctx.globalAlpha = 0.03
    for (let y = 0; y < h; y += 4) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, y, w, 2)
    }
    ctx.restore()
  }

  private drawPlayerStats(ctx: OffscreenCanvasRenderingContext2D, stats: any, _scenario: string, _time: number) {
    const x = 30
    const y = 30
    const barWidth = 180
    const barHeight = 16

    // 배경 패널
    ctx.save()
    ctx.fillStyle = COLORS.background
    ctx.fillRect(x - 10, y - 10, barWidth + 40, 120)
    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 1
    ctx.strokeRect(x - 10, y - 10, barWidth + 40, 120)

    // 헤더
    ctx.fillStyle = COLORS.primary
    ctx.font = 'bold 12px monospace'
    ctx.fillText('[ 플레이어 상태 ]', x, y)

    // 캐릭터 이름 + 레벨
    ctx.fillStyle = COLORS.primaryGlow
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`◆ 매지코  Lv.${stats.level}`, x, y + 22)

    // HP 바
    const hpRatio = stats.hp / stats.maxHp
    const hpColor = hpRatio < 0.3 ? COLORS.danger : hpRatio < 0.5 ? COLORS.warning : COLORS.success
    this.drawBar(ctx, x, y + 35, barWidth, barHeight, hpRatio, hpColor, 'HP', `${stats.hp}/${stats.maxHp}`)

    // 스태미나 바
    const stmRatio = stats.stamina / stats.maxStamina
    this.drawBar(ctx, x, y + 55, barWidth, barHeight, stmRatio, COLORS.secondary, 'STM', `${Math.floor(stats.stamina)}/${stats.maxStamina}`)

    // 에너지 바
    const enrRatio = stats.energy / stats.maxEnergy
    this.drawBar(ctx, x, y + 75, barWidth, barHeight, enrRatio, COLORS.warning, 'ENR', `${Math.floor(stats.energy)}/${stats.maxEnergy}`)

    // EXP 바
    const expRatio = stats.exp / stats.maxExp
    this.drawBar(ctx, x, y + 95, barWidth, barHeight * 0.6, expRatio, COLORS.primary, 'EXP', `${stats.exp}/${stats.maxExp}`)

    ctx.restore()
  }

  private drawBar(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    ratio: number, color: string, label: string, valueText: string
  ) {
    // 배경
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(x, y, w, h)

    // 게이지
    ctx.fillStyle = color
    ctx.fillRect(x, y, w * ratio, h)

    // 테두리
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, w, h)

    // 라벨
    ctx.fillStyle = '#fff'
    ctx.font = '10px monospace'
    ctx.fillText(label, x + 4, y + h - 4)

    // 값
    ctx.textAlign = 'right'
    ctx.fillText(valueText, x + w - 4, y + h - 4)
    ctx.textAlign = 'left'
  }

  private drawMinimap(ctx: OffscreenCanvasRenderingContext2D, w: number, scenario: string, time: number) {
    const size = 100
    const x = w - size - 30
    const y = 30

    ctx.save()

    // 배경
    ctx.fillStyle = COLORS.background
    ctx.beginPath()
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2)
    ctx.fill()

    // 테두리
    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 2
    ctx.stroke()

    // 그리드
    ctx.strokeStyle = COLORS.primary
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2)
    ctx.stroke()

    // 스캔 라인
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 2
    ctx.save()
    ctx.translate(x + size/2, y + size/2)
    ctx.rotate(time * 0.5)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(size/2 - 5, 0)
    ctx.stroke()
    ctx.restore()

    // 플레이어 (중앙)
    ctx.globalAlpha = 1
    ctx.fillStyle = COLORS.primaryGlow
    ctx.beginPath()
    ctx.arc(x + size/2, y + size/2, 4, 0, Math.PI * 2)
    ctx.fill()

    // 적 (시나리오에 따라)
    if (scenario !== 'exploration') {
      const enemyAngle = time * 0.3
      const enemyDist = 25
      const ex = x + size/2 + Math.cos(enemyAngle) * enemyDist
      const ey = y + size/2 + Math.sin(enemyAngle) * enemyDist
      ctx.fillStyle = COLORS.danger
      ctx.beginPath()
      ctx.arc(ex, ey, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // 라벨
    ctx.fillStyle = COLORS.primary
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('[ 미니맵 ]', x + size/2, y - 5)

    ctx.restore()
  }

  private drawScenarioIndicator(ctx: OffscreenCanvasRenderingContext2D, w: number, scenario: string, time: number) {
    const scenarioNames: Record<string, string> = {
      exploration: '탐색 모드',
      enemy_detected: '적 감지',
      target_lock: '타겟 고정',
      combat_attack: '전투 중',
      damage_received: '피격',
      level_up: '레벨 업',
      low_health: '위험 상태',
    }

    const name = scenarioNames[scenario] || scenario
    const color = (scenario === 'low_health' || scenario === 'damage_received') 
      ? COLORS.danger 
      : (scenario === 'level_up' ? COLORS.success : COLORS.primary)

    ctx.save()
    ctx.textAlign = 'center'
    ctx.font = 'bold 14px monospace'
    ctx.fillStyle = color

    // 글리터 효과
    const glitter = Math.sin(time * 5) * 0.2 + 0.8
    ctx.globalAlpha = glitter

    ctx.fillText(`[ DREAM PERSONA :: ${name} ]`, w / 2, 25)
    ctx.restore()
  }

  private drawStatusBar(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, _scenario: string, _stats: any, _time: number) {
    const y = h - 40

    ctx.save()
    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, y, w, 40)

    ctx.strokeStyle = COLORS.primary
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()

    // 상태 텍스트
    ctx.fillStyle = COLORS.primary
    ctx.font = '11px monospace'
    ctx.fillText(`[1] 탐색 [2] 감지 [3] 락온 [4] 공격 [5] 피격 [6] 레벨업 [7] 위험 | [Q] 성능`, 20, y + 25)

    ctx.restore()
  }

  private drawCrosshair(ctx: OffscreenCanvasRenderingContext2D, x: number, y: number, scenario: string, isLocked: boolean, time: number) {
    ctx.save()

    const color = (scenario === 'low_health' || scenario === 'damage_received') 
      ? COLORS.danger 
      : (isLocked ? COLORS.danger : COLORS.primary)

    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2

    // 중앙 점
    ctx.beginPath()
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()

    // 십자선
    const len = 15
    ctx.beginPath()
    ctx.moveTo(x - len - 5, y)
    ctx.lineTo(x - 5, y)
    ctx.moveTo(x + 5, y)
    ctx.lineTo(x + len + 5, y)
    ctx.moveTo(x, y - len - 5)
    ctx.lineTo(x, y - 5)
    ctx.moveTo(x, y + 5)
    ctx.lineTo(x, y + len + 5)
    ctx.stroke()

    // 외곽 원
    ctx.beginPath()
    ctx.arc(x, y, 25, 0, Math.PI * 2)
    ctx.stroke()

    // 락온 시 추가 효과
    if (isLocked || scenario === 'target_lock') {
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5 + Math.sin(time * 10) * 0.3

      ctx.beginPath()
      ctx.arc(x, y, 35, 0, Math.PI * 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(x, y, 45, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  private drawDamageEffect(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, _time: number) {
    ctx.save()

    // 화면 가장자리 빨간 비네팅
    const gradient = ctx.createRadialGradient(w/2, h/2, h * 0.3, w/2, h/2, h * 0.7)
    gradient.addColorStop(0, 'rgba(255,0,0,0)')
    gradient.addColorStop(1, 'rgba(255,0,0,0.4)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // 랜덤 노이즈
    ctx.globalAlpha = 0.1
    for (let i = 0; i < 50; i++) {
      const nx = Math.random() * w
      const ny = Math.random() * h
      const size = Math.random() * 10 + 2
      ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#000'
      ctx.fillRect(nx, ny, size, size)
    }

    // 글리치 라인
    ctx.globalAlpha = 0.3
    for (let i = 0; i < 5; i++) {
      const ly = Math.random() * h
      const lh = Math.random() * 5 + 1
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, ly, w, lh)
    }

    ctx.restore()
  }

  private drawLowHealthEffect(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, _stats: any, time: number) {
    ctx.save()

    // 심장박동 효과
    const beat = Math.pow(Math.abs(Math.sin(time * 4)), 3)
    
    // 빨간 비네팅
    const gradient = ctx.createRadialGradient(w/2, h/2, h * 0.2, w/2, h/2, h * 0.6)
    gradient.addColorStop(0, 'rgba(255,0,0,0)')
    gradient.addColorStop(1, `rgba(255,0,0,${0.3 + beat * 0.2})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    // 경고 텍스트
    ctx.textAlign = 'center'
    ctx.font = 'bold 24px monospace'
    ctx.fillStyle = `rgba(255,0,0,${0.5 + beat * 0.5})`
    ctx.fillText('⚠ 위험! HP 부족 ⚠', w/2, h/2)

    ctx.restore()
  }

  private drawLevelUpEffect(ctx: OffscreenCanvasRenderingContext2D, w: number, h: number, stats: any, time: number) {
    ctx.save()

    // 골드 파티클
    ctx.fillStyle = COLORS.primaryGlow
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2 + time
      const dist = 100 + Math.sin(time * 3 + i) * 30
      const px = w/2 + Math.cos(angle) * dist
      const py = h/2 + Math.sin(angle) * dist
      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // 레벨업 텍스트
    ctx.textAlign = 'center'
    ctx.font = 'bold 36px monospace'
    ctx.fillStyle = COLORS.primaryGlow
    ctx.fillText('✨ LEVEL UP! ✨', w/2, h/2 - 20)

    ctx.font = 'bold 24px monospace'
    ctx.fillStyle = COLORS.primary
    ctx.fillText(`Lv.${stats.level - 1} → Lv.${stats.level}`, w/2, h/2 + 20)

    ctx.restore()
  }

  private drawEnemyInfo(ctx: OffscreenCanvasRenderingContext2D, w: number, enemy: any, _scenario: string, _time: number) {
    ctx.save()

    const x = w - 220
    const y = 150

    // 배경
    ctx.fillStyle = COLORS.background
    ctx.fillRect(x, y, 190, 80)
    ctx.strokeStyle = COLORS.danger
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, 190, 80)

    // 헤더
    ctx.fillStyle = COLORS.danger
    ctx.font = 'bold 12px monospace'
    ctx.fillText('[ 타겟 정보 ]', x + 10, y + 18)

    // 이름
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px monospace'
    ctx.fillText(`◆ ${enemy.name}`, x + 10, y + 38)

    // HP 바
    const hpRatio = enemy.hp / enemy.maxHp
    this.drawBar(ctx, x + 10, y + 48, 170, 12, hpRatio, COLORS.danger, '', `${enemy.hp}/${enemy.maxHp}`)

    // 거리
    ctx.fillStyle = COLORS.secondary
    ctx.font = '10px monospace'
    ctx.fillText(`거리: ${enemy.distance}m | 위협: ${enemy.threatLevel}`, x + 10, y + 72)

    ctx.restore()
  }

  private drawKeyHints(_ctx: OffscreenCanvasRenderingContext2D, _w: number, _h: number) {
    // 이미 drawStatusBar에서 처리
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Target Lock HUD 렌더링 (기존)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  private renderTargetLock(state: FrameState): OffscreenCanvas {
    const { width, height } = this.config
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
