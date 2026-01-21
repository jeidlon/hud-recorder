/**
 * DreamPersona HUD 공유 드로잉 함수들
 * 실시간 HUD(DreamPersonaHUD.tsx)와 오프라인 렌더러(OfflineHUDRenderer.ts) 모두에서 사용
 */

// Canvas Context 타입 통합 (실시간 + 오프라인)
export type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 타입 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type HUDScenario = 
  | 'exploration'
  | 'enemy_detected' 
  | 'target_lock'
  | 'combat_attack'
  | 'damage_received'
  | 'level_up'
  | 'low_health'

export interface PlayerStats {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  maxExp: number
}

export interface EnemyData {
  name: string
  distance: number
  threatLevel: '낮음' | '중간' | '높음' | '치명적'
  hp: number
  maxHp: number
}

export interface DamageIndicator {
  id: number
  direction: number
  timestamp: number
  amount: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCENARIO_NAMES: Record<HUDScenario, string> = {
  exploration: '탐색 모드',
  enemy_detected: '적 감지',
  target_lock: '타겟 고정',
  combat_attack: '전투 중',
  damage_received: '피격',
  level_up: '레벨 업',
  low_health: '위험 상태',
}

export const CHARACTERS = {
  player: '매지코',
  ally1: '루비안',
  ally2: '현정사랑',
  enemy: '앨리스',
  boss: '미진부',
}

export const COLORS = {
  primary: '#FFD700',
  primaryGlow: '#FFEA00',
  secondary: '#00FFFF',
  danger: '#FF4444',
  dangerGlow: '#FF6666',
  success: '#00FF88',
  warning: '#FF8800',
  bg: 'rgba(20, 20, 30, 0.85)',
  bgPanel: 'rgba(40, 40, 60, 0.9)',
  border: '#FFD700',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기본 드로잉 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawCurvedScreenEffect(ctx: DrawContext, w: number, h: number) {
  const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)'
  ctx.lineWidth = 2
  
  const cornerRadius = 80
  const offset = 20
  
  ctx.beginPath()
  ctx.arc(offset + cornerRadius, offset + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(w - offset - cornerRadius, offset + cornerRadius, cornerRadius, -Math.PI * 0.5, 0)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(offset + cornerRadius, h - offset - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(w - offset - cornerRadius, h - offset - cornerRadius, cornerRadius, 0, Math.PI * 0.5)
  ctx.stroke()
}

export function drawScanlines(ctx: DrawContext, w: number, h: number, time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1)
  }

  const scanY = (time * 100) % h
  const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
  scanGradient.addColorStop(0, 'rgba(255, 215, 0, 0)')
  scanGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.05)')
  scanGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
  ctx.fillStyle = scanGradient
  ctx.fillRect(0, scanY - 20, w, 40)
}

export function drawRetroPanel(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  title: string
) {
  ctx.fillStyle = COLORS.bgPanel
  ctx.fillRect(x, y, w, h)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  ctx.moveTo(x + w, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.stroke()

  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 1
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)

  const titleGradient = ctx.createLinearGradient(x + 5, y + 5, x + w - 5, y + 5)
  titleGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
  titleGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)')
  ctx.fillStyle = titleGradient
  ctx.fillRect(x + 5, y + 5, w - 10, 20)

  ctx.font = 'bold 11px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.fillText(title, x + 10, y + 19)
}

export function drawStatBar(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  label: string, value: number, max: number,
  color: string,
  flash: boolean
) {
  const ratio = value / max

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(x, y, w, h)

  if (!flash || Math.sin(Date.now() / 100) > 0) {
    const gradient = ctx.createLinearGradient(x, y, x + w * ratio, y)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, `${color}88`)
    ctx.fillStyle = gradient
    ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)

    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)
    ctx.shadowBlur = 0
  }

  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  ctx.font = 'bold 10px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(label, x + 5, y + h - 5)

  ctx.textAlign = 'right'
  ctx.fillText(`${Math.floor(value)}/${max}`, x + w - 5, y + h - 5)
  ctx.textAlign = 'left'
}

export function drawPlayerStats(
  ctx: DrawContext, 
  stats: PlayerStats, 
  scenario: HUDScenario,
  time: number
) {
  const x = 20
  const y = 20
  const panelWidth = 280
  const panelHeight = 160

  drawRetroPanel(ctx, x, y, panelWidth, panelHeight, '[ 페르소나 상태 ]')

  ctx.font = 'bold 16px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.fillText(`◆ ${CHARACTERS.player}`, x + 15, y + 45)
  ctx.shadowBlur = 0

  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(`Lv.${stats.level}`, x + panelWidth - 50, y + 45)

  const isLowHealth = scenario === 'low_health' || stats.hp < stats.maxHp * 0.3
  drawStatBar(
    ctx, x + 15, y + 60, panelWidth - 30, 18,
    'HP', stats.hp, stats.maxHp,
    isLowHealth ? COLORS.danger : COLORS.success,
    isLowHealth && Math.sin(time * 10) > 0
  )

  drawStatBar(
    ctx, x + 15, y + 85, panelWidth - 30, 18,
    'STM', stats.stamina, stats.maxStamina,
    COLORS.secondary,
    false
  )

  drawStatBar(
    ctx, x + 15, y + 110, panelWidth - 30, 18,
    'ENR', stats.energy, stats.maxEnergy,
    COLORS.warning,
    false
  )

  const expRatio = stats.exp / stats.maxExp
  ctx.fillStyle = COLORS.textDim
  ctx.font = '10px "Consolas", monospace'
  ctx.fillText(`EXP: ${stats.exp}/${stats.maxExp}`, x + 15, y + 145)
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
  ctx.fillRect(x + 100, y + 137, (panelWidth - 130) * expRatio, 8)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.strokeRect(x + 100, y + 137, panelWidth - 130, 8)
}

export function drawMinimap(
  ctx: DrawContext,
  screenWidth: number,
  _mousePos: { x: number; y: number },
  scenario: HUDScenario,
  enemy: EnemyData,
  time: number
) {
  const mapSize = 150
  const x = screenWidth - mapSize - 20
  const y = 20

  drawRetroPanel(ctx, x, y, mapSize, mapSize, '[ 미니맵 ]')

  const mapCenterX = x + mapSize / 2
  const mapCenterY = y + mapSize / 2 + 10

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)'
  ctx.lineWidth = 0.5
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(mapCenterX + i * 25, y + 30)
    ctx.lineTo(mapCenterX + i * 25, y + mapSize - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + 10, mapCenterY + i * 25)
    ctx.lineTo(x + mapSize - 10, mapCenterY + i * 25)
    ctx.stroke()
  }

  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(mapCenterX, mapCenterY, 5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.beginPath()
  ctx.moveTo(mapCenterX, mapCenterY - 8)
  ctx.lineTo(mapCenterX - 4, mapCenterY - 2)
  ctx.lineTo(mapCenterX + 4, mapCenterY - 2)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  if (scenario !== 'exploration') {
    const enemyAngle = time * 0.5
    const enemyDist = 40
    const enemyX = mapCenterX + Math.cos(enemyAngle) * enemyDist
    const enemyY = mapCenterY + Math.sin(enemyAngle) * enemyDist

    ctx.fillStyle = COLORS.danger
    ctx.shadowColor = COLORS.danger
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(enemyX, enemyY, 4, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.3
    ctx.beginPath()
    ctx.arc(enemyX, enemyY, 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }

  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(`거리: ${enemy.distance.toFixed(1)}m`, x + 10, y + mapSize - 15)
}

export function drawStatusBar(
  ctx: DrawContext,
  w: number, h: number,
  scenario: HUDScenario,
  _stats: PlayerStats,
  cooldown: number,
  maxCooldown: number,
  _time: number
) {
  const barWidth = 400
  const barHeight = 40
  const x = (w - barWidth) / 2
  const y = h - barHeight - 30

  ctx.fillStyle = 'rgba(20, 20, 40, 0.8)'
  ctx.fillRect(x, y, barWidth, barHeight)

  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, barWidth, barHeight)

  const cornerSize = 8
  ctx.fillStyle = COLORS.primary
  ctx.fillRect(x - 2, y - 2, cornerSize, 3)
  ctx.fillRect(x - 2, y - 2, 3, cornerSize)
  ctx.fillRect(x + barWidth - cornerSize + 2, y - 2, cornerSize, 3)
  ctx.fillRect(x + barWidth - 1, y - 2, 3, cornerSize)
  ctx.fillRect(x - 2, y + barHeight - 1, cornerSize, 3)
  ctx.fillRect(x - 2, y + barHeight - cornerSize + 2, 3, cornerSize)
  ctx.fillRect(x + barWidth - cornerSize + 2, y + barHeight - 1, cornerSize, 3)
  ctx.fillRect(x + barWidth - 1, y + barHeight - cornerSize + 2, 3, cornerSize)

  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.textAlign = 'center'
  ctx.fillText(`▣ ${SCENARIO_NAMES[scenario]} ▣`, w / 2, y + 25)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  if (scenario === 'combat_attack' && cooldown > 0) {
    const cdRatio = cooldown / maxCooldown
    ctx.fillStyle = 'rgba(255, 136, 0, 0.3)'
    ctx.fillRect(x + 2, y + 2, (barWidth - 4) * cdRatio, barHeight - 4)
  }
}

export function drawScenarioIndicator(
  ctx: DrawContext,
  w: number,
  scenario: HUDScenario,
  _time: number
) {
  const text = `[ DREAM PERSONA :: ${SCENARIO_NAMES[scenario]} ]`
  
  ctx.font = 'bold 12px "Consolas", monospace'
  ctx.textAlign = 'center'
  
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 15
  ctx.fillStyle = COLORS.primaryGlow
  ctx.fillText(text, w / 2, 45)
  
  ctx.shadowBlur = 0
  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText('프리윌소프트 | 드림 페르소나: 리마스터', w / 2, 60)
  
  ctx.textAlign = 'left'
}

export function drawKeyHints(ctx: DrawContext, _w: number, h: number) {
  const hints = [
    '[1] 탐색',
    '[2] 감지',
    '[3] 락온',
    '[4] 전투',
    '[5] 피격',
    '[6] 레벨업',
    '[7] 위험',
    '[R] 회복',
    '[Space] 공격'
  ]

  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  
  const startX = 20
  const y = h - 15
  let currentX = startX
  
  hints.forEach((hint) => {
    ctx.fillText(hint, currentX, y)
    currentX += ctx.measureText(hint).width + 15
  })
}

export function drawCrosshair(
  ctx: DrawContext,
  _mousePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  scenario: HUDScenario,
  isLocked: boolean,
  time: number
) {
  const x = targetPos.x
  const y = targetPos.y

  let color = COLORS.primary
  if (scenario === 'low_health' || scenario === 'damage_received') {
    color = COLORS.danger
  } else if (isLocked) {
    color = COLORS.danger
  } else if (scenario === 'combat_attack') {
    color = COLORS.warning
  } else if (scenario === 'enemy_detected') {
    color = COLORS.warning
  }

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.shadowColor = color
  ctx.shadowBlur = 10

  const crossSize = isLocked ? 25 : 20
  ctx.beginPath()
  ctx.moveTo(x - crossSize, y)
  ctx.lineTo(x - 8, y)
  ctx.moveTo(x + 8, y)
  ctx.lineTo(x + crossSize, y)
  ctx.moveTo(x, y - crossSize)
  ctx.lineTo(x, y - 8)
  ctx.moveTo(x, y + 8)
  ctx.lineTo(x, y + crossSize)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()

  if (isLocked || scenario === 'target_lock') {
    const boxSize = 50 + Math.sin(time * 5) * 5
    const cornerLen = 12
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(x - boxSize, y - boxSize + cornerLen)
    ctx.lineTo(x - boxSize, y - boxSize)
    ctx.lineTo(x - boxSize + cornerLen, y - boxSize)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x + boxSize - cornerLen, y - boxSize)
    ctx.lineTo(x + boxSize, y - boxSize)
    ctx.lineTo(x + boxSize, y - boxSize + cornerLen)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x - boxSize, y + boxSize - cornerLen)
    ctx.lineTo(x - boxSize, y + boxSize)
    ctx.lineTo(x - boxSize + cornerLen, y + boxSize)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(x + boxSize - cornerLen, y + boxSize)
    ctx.lineTo(x + boxSize, y + boxSize)
    ctx.lineTo(x + boxSize, y + boxSize - cornerLen)
    ctx.stroke()
  }

  if (scenario === 'combat_attack') {
    const radius = 40 + Math.sin(time * 3) * 3
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.shadowBlur = 0

  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(`X:${x.toFixed(0)} Y:${y.toFixed(0)}`, x + 30, y - 30)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VFX 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawNoise(
  ctx: DrawContext,
  w: number, h: number,
  intensity: number
) {
  const pixelSize = 4
  ctx.globalAlpha = intensity
  
  for (let y = 0; y < h; y += pixelSize) {
    for (let x = 0; x < w; x += pixelSize) {
      if (Math.random() > 0.7) {
        const brightness = Math.random() * 255
        ctx.fillStyle = `rgb(${brightness}, ${brightness * 0.9}, ${brightness * 0.9})`
        ctx.fillRect(x, y, pixelSize, pixelSize)
      }
    }
  }
  
  ctx.globalAlpha = 1
}

export function drawGlitchBars(
  ctx: DrawContext,
  w: number, h: number,
  _time: number
) {
  const numBars = Math.floor(Math.random() * 5) + 2
  
  for (let i = 0; i < numBars; i++) {
    const y = Math.random() * h
    const barHeight = Math.random() * 10 + 2
    const offsetX = (Math.random() - 0.5) * 30
    
    ctx.fillStyle = `rgba(255, 0, 100, ${Math.random() * 0.5 + 0.2})`
    ctx.fillRect(offsetX, y, w, barHeight)
    
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(0, 255, 255, 0.3)`
    ctx.fillRect(offsetX + 5, y, w, barHeight / 2)
    ctx.globalCompositeOperation = 'source-over'
  }
  
  if (Math.random() > 0.7) {
    const sliceY = Math.random() * h
    const sliceHeight = Math.random() * 50 + 20
    
    ctx.fillStyle = `rgba(20, 20, 30, 0.8)`
    ctx.fillRect(0, sliceY, w, sliceHeight)
    
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, sliceY)
    ctx.lineTo(w, sliceY)
    ctx.moveTo(0, sliceY + sliceHeight)
    ctx.lineTo(w, sliceY + sliceHeight)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

export function drawBloodDrip(
  ctx: DrawContext,
  w: number, _h: number,
  time: number,
  intensity: number
) {
  const numDrips = Math.floor(intensity * 8)
  
  for (let i = 0; i < numDrips; i++) {
    const x = (i / numDrips) * w + Math.sin(time + i) * 30
    const dripLength = 50 + Math.sin(time * 2 + i) * 30
    const dripWidth = 3 + Math.random() * 4
    
    const gradient = ctx.createLinearGradient(x, 0, x, dripLength)
    gradient.addColorStop(0, `rgba(180, 0, 0, ${intensity * 0.8})`)
    gradient.addColorStop(0.5, `rgba(120, 0, 0, ${intensity * 0.5})`)
    gradient.addColorStop(1, 'rgba(80, 0, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(x, dripLength / 2, dripWidth, dripLength / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  
  const topGradient = ctx.createLinearGradient(0, 0, 0, 30)
  topGradient.addColorStop(0, `rgba(150, 0, 0, ${intensity * 0.6})`)
  topGradient.addColorStop(1, 'rgba(100, 0, 0, 0)')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, w, 30)
}

export function drawEKGLine(
  ctx: DrawContext,
  w: number, h: number,
  time: number
) {
  const y = h - 80
  const lineWidth = 300
  const startX = w - lineWidth - 30
  
  ctx.strokeStyle = COLORS.danger
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 10
  ctx.lineWidth = 2
  ctx.beginPath()
  
  for (let i = 0; i < lineWidth; i++) {
    const x = startX + i
    const phase = (i / lineWidth) * Math.PI * 4 - time * 10
    
    let yOffset = 0
    const beat = (phase % (Math.PI * 2)) / (Math.PI * 2)
    if (beat > 0.4 && beat < 0.45) {
      yOffset = -20
    } else if (beat > 0.45 && beat < 0.5) {
      yOffset = 30
    } else if (beat > 0.5 && beat < 0.55) {
      yOffset = -15
    } else if (beat > 0.55 && beat < 0.6) {
      yOffset = 5
    } else {
      yOffset = Math.sin(phase * 0.5) * 2
    }
    
    if (i === 0) {
      ctx.moveTo(x, y + yOffset)
    } else {
      ctx.lineTo(x, y + yOffset)
    }
  }
  
  ctx.stroke()
  ctx.shadowBlur = 0
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 HUD 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawExplorationHUD(
  ctx: DrawContext,
  w: number, h: number,
  mousePos: { x: number; y: number },
  _time: number
) {
  const compassX = w - 100
  const compassY = h - 100
  const compassRadius = 40

  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)
  ctx.stroke()

  const directions = ['N', 'E', 'S', 'W']
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.textAlign = 'center'
  directions.forEach((d, i) => {
    const angle = (i * Math.PI / 2) - Math.PI / 2
    const dx = Math.cos(angle) * (compassRadius + 12)
    const dy = Math.sin(angle) * (compassRadius + 12)
    ctx.fillText(d, compassX + dx, compassY + dy + 4)
  })
  ctx.textAlign = 'left'

  const needleAngle = Math.atan2(mousePos.y - h/2, mousePos.x - w/2)
  ctx.save()
  ctx.translate(compassX, compassY)
  ctx.rotate(needleAngle)
  ctx.fillStyle = COLORS.danger
  ctx.beginPath()
  ctx.moveTo(30, 0)
  ctx.lineTo(-10, -5)
  ctx.lineTo(-10, 5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.font = '14px "Consolas", monospace'
  ctx.fillStyle = COLORS.success
  ctx.fillText('● 상태: 정상', 20, h - 60)
  ctx.fillStyle = COLORS.textDim
  ctx.font = '12px "Consolas", monospace'
  ctx.fillText('위협 없음 | 안전 구역', 20, h - 40)
}

export function drawEnemyDetectedHUD(
  ctx: DrawContext,
  w: number, _h: number,
  mousePos: { x: number; y: number },
  enemy: EnemyData,
  time: number
) {
  const flash = Math.sin(time * 8) > 0

  if (flash) {
    ctx.fillStyle = 'rgba(255, 68, 68, 0.2)'
    ctx.fillRect(0, 70, w, 40)
  }

  ctx.font = 'bold 18px "Consolas", monospace'
  ctx.fillStyle = flash ? COLORS.danger : COLORS.dangerGlow
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = flash ? 20 : 10
  ctx.textAlign = 'center'
  ctx.fillText('⚠ 적 감지 ⚠', w / 2, 95)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  const panelX = w - 220
  const panelY = 180
  drawRetroPanel(ctx, panelX, panelY, 200, 100, '[ 위협 분석 ]')

  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(`대상: ${enemy.name}`, panelX + 15, panelY + 50)
  ctx.fillText(`거리: ${enemy.distance.toFixed(1)}m`, panelX + 15, panelY + 68)
  
  ctx.fillStyle = COLORS.warning
  ctx.fillText(`위험도: ${enemy.threatLevel}`, panelX + 15, panelY + 86)

  const pulseRadius = ((time * 100) % 200)
  ctx.strokeStyle = `rgba(255, 68, 68, ${1 - pulseRadius / 200})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(mousePos.x, mousePos.y, pulseRadius, 0, Math.PI * 2)
  ctx.stroke()
}

export function drawTargetLockHUD(
  ctx: DrawContext,
  _w: number, h: number,
  mousePos: { x: number; y: number },
  isLocked: boolean,
  lockedPos: { x: number; y: number },
  lockProgress: number,
  enemy: EnemyData,
  _time: number
) {
  const targetPos = isLocked ? lockedPos : mousePos

  if (!isLocked && lockProgress > 0) {
    ctx.strokeStyle = COLORS.warning
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(targetPos.x, targetPos.y, 60, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lockProgress / 100))
    ctx.stroke()

    ctx.font = 'bold 14px "Consolas", monospace'
    ctx.fillStyle = COLORS.warning
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.floor(lockProgress)}%`, targetPos.x, targetPos.y + 80)
    ctx.textAlign = 'left'
  }

  if (isLocked) {
    const panelX = targetPos.x + 70
    const panelY = targetPos.y - 60
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'
    ctx.fillRect(panelX, panelY, 150, 80)
    ctx.strokeStyle = COLORS.danger
    ctx.lineWidth = 1
    ctx.strokeRect(panelX, panelY, 150, 80)

    ctx.font = 'bold 12px "Consolas", monospace'
    ctx.fillStyle = COLORS.danger
    ctx.fillText('◆ 타겟 고정 ◆', panelX + 10, panelY + 20)

    ctx.font = '11px "Consolas", monospace'
    ctx.fillStyle = COLORS.text
    ctx.fillText(`${enemy.name}`, panelX + 10, panelY + 40)
    
    const hpRatio = enemy.hp / enemy.maxHp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(panelX + 10, panelY + 50, 130, 12)
    ctx.fillStyle = COLORS.danger
    ctx.fillRect(panelX + 10, panelY + 50, 130 * hpRatio, 12)
    ctx.strokeStyle = COLORS.danger
    ctx.strokeRect(panelX + 10, panelY + 50, 130, 12)
    
    ctx.font = '9px "Consolas", monospace'
    ctx.fillStyle = COLORS.text
    ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, panelX + 12, panelY + 60)
  }

  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = isLocked ? COLORS.danger : COLORS.warning
  ctx.fillText(isLocked ? '● 타겟 고정' : '○ 추적 중...', 20, h - 60)
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(isLocked ? '클릭하여 해제' : '마우스 홀드하여 락온', 20, h - 40)
}

export function drawCombatHUD(
  ctx: DrawContext,
  w: number, h: number,
  mousePos: { x: number; y: number },
  cooldown: number,
  maxCooldown: number,
  stats: PlayerStats,
  _enemy: EnemyData,
  time: number
) {
  const targetX = mousePos.x
  const targetY = mousePos.y
  const isAttacking = cooldown > maxCooldown - 0.2

  if (isAttacking) {
    const flashIntensity = (cooldown - (maxCooldown - 0.2)) / 0.2
    
    ctx.fillStyle = `rgba(255, 200, 100, ${flashIntensity * 0.2})`
    ctx.fillRect(0, 0, w, h)
    
    ctx.strokeStyle = `rgba(255, 200, 0, ${flashIntensity})`
    ctx.lineWidth = 4
    ctx.shadowColor = COLORS.warning
    ctx.shadowBlur = 30
    const impactRadius = 30 + (1 - flashIntensity) * 80
    ctx.beginPath()
    ctx.arc(targetX, targetY, impactRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const dist = 20 + (1 - flashIntensity) * 60
      const sparkX = targetX + Math.cos(angle) * dist
      const sparkY = targetY + Math.sin(angle) * dist
      
      ctx.fillStyle = `rgba(255, 255, 200, ${flashIntensity * 0.8})`
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, 3 * flashIntensity, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (cooldown > 0) {
    const progress = 1 - cooldown / maxCooldown
    
    ctx.strokeStyle = 'rgba(255, 136, 0, 0.2)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(targetX, targetY, 48, 0, Math.PI * 2)
    ctx.stroke()
    
    ctx.strokeStyle = `rgba(255, 136, 0, ${0.5 + progress * 0.5})`
    ctx.lineWidth = 6
    ctx.shadowColor = COLORS.warning
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(targetX, targetY, 48, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress))
    ctx.stroke()
    ctx.shadowBlur = 0
    
    ctx.font = 'bold 14px "Consolas", monospace'
    ctx.fillStyle = COLORS.warning
    ctx.textAlign = 'center'
    ctx.fillText(`${cooldown.toFixed(1)}s`, targetX, targetY + 70)
    ctx.textAlign = 'left'
  }

  ctx.save()
  ctx.translate(targetX, targetY)
  ctx.rotate(time * 2)
  
  ctx.strokeStyle = COLORS.warning
  ctx.lineWidth = 2
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.restore()

  const weaponPanelX = 20
  const weaponPanelY = h - 180
  drawRetroPanel(ctx, weaponPanelX, weaponPanelY, 180, 80, '[ 무기 시스템 ]')

  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText('공격 유형: 근접', weaponPanelX + 15, weaponPanelY + 50)
  ctx.fillText(`에너지: ${Math.floor(stats.energy)}%`, weaponPanelX + 15, weaponPanelY + 68)

  const ready = cooldown <= 0
  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = ready ? COLORS.success : COLORS.warning
  ctx.shadowColor = ready ? COLORS.success : COLORS.warning
  ctx.shadowBlur = 10
  ctx.fillText(ready ? '● 공격 준비 완료' : '○ 쿨다운 중...', 20, h - 60)
  ctx.shadowBlur = 0
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText('[Space] 공격', 20, h - 40)
}

export function drawDamageHUD(
  ctx: DrawContext,
  w: number, h: number,
  indicators: DamageIndicator[],
  time: number
) {
  const centerX = w / 2
  const centerY = h / 2
  const hasRecentDamage = indicators.some(i => Date.now() - i.timestamp < 500)
  const damageIntensity = hasRecentDamage ? 1 : 0.3

  if (hasRecentDamage) {
    const shakeX = (Math.random() - 0.5) * 12 * damageIntensity
    const shakeY = (Math.random() - 0.5) * 12 * damageIntensity
    ctx.save()
    ctx.translate(shakeX, shakeY)
  }

  const rgbOffset = hasRecentDamage ? 8 : 3
  
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = `rgba(255, 0, 0, ${0.15 * damageIntensity})`
  ctx.fillRect(-rgbOffset, 0, w + rgbOffset * 2, h)
  
  ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * damageIntensity})`
  ctx.fillRect(rgbOffset, 0, w - rgbOffset * 2, h)
  
  ctx.globalCompositeOperation = 'source-over'

  drawNoise(ctx, w, h, damageIntensity * 0.15)

  if (hasRecentDamage && Math.random() > 0.5) {
    drawGlitchBars(ctx, w, h, time)
  }

  const vignetteIntensity = 0.4 + damageIntensity * 0.3
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) * 0.6)
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(255, 0, 0, ${vignetteIntensity})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    if (age < 0.1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (1 - age * 10)})`
      ctx.fillRect(0, 0, w, h)
    }
  })

  drawBloodDrip(ctx, w, h, time, damageIntensity)

  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    const alpha = 1 - age
    
    const dist = 150
    const ix = centerX + Math.cos(indicator.direction) * dist
    const iy = centerY + Math.sin(indicator.direction) * dist

    ctx.save()
    ctx.translate(ix, iy)
    ctx.rotate(indicator.direction + Math.PI / 2)

    ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`
    ctx.shadowColor = COLORS.danger
    ctx.shadowBlur = 30 * alpha
    ctx.beginPath()
    ctx.moveTo(0, -40)
    ctx.lineTo(-20, 20)
    ctx.lineTo(0, 8)
    ctx.lineTo(20, 20)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 50 * alpha
    ctx.fill()

    ctx.restore()
  })

  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    if (age < 0.8) {
      const yOffset = age * 80
      const scale = 1 + age * 0.5
      
      ctx.save()
      ctx.translate(centerX, centerY - 50 - yOffset)
      ctx.scale(scale, scale)
      
      ctx.font = 'bold 28px "Consolas", monospace'
      ctx.textAlign = 'center'
      
      ctx.globalAlpha = (1 - age) * 0.5
      ctx.fillStyle = '#FF0000'
      ctx.fillText(`-${indicator.amount}`, -2, 0)
      ctx.fillStyle = '#00FFFF'
      ctx.fillText(`-${indicator.amount}`, 2, 0)
      
      ctx.globalAlpha = 1 - age
      ctx.fillStyle = COLORS.danger
      ctx.shadowColor = COLORS.danger
      ctx.shadowBlur = 20
      ctx.fillText(`-${indicator.amount}`, 0, 0)
      
      ctx.restore()
    }
  })

  const glitchX = hasRecentDamage ? (Math.random() - 0.5) * 4 : 0
  ctx.font = 'bold 18px "Consolas", monospace'
  ctx.fillStyle = COLORS.danger
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 15
  ctx.textAlign = 'center'
  ctx.fillText('⚠ 피해 발생 ⚠', w / 2 + glitchX, 100)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  if (hasRecentDamage) {
    ctx.restore()
  }
}

export function drawLevelUpHUD(
  ctx: DrawContext,
  w: number, h: number,
  stats: PlayerStats,
  timer: number,
  time: number
) {
  if (timer <= 0) return

  const alpha = Math.min(1, timer)
  const centerX = w / 2
  const centerY = h / 2

  ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.15})`
  ctx.fillRect(0, 0, w, h)

  ctx.font = 'bold 48px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 30 + Math.sin(time * 10) * 10
  ctx.textAlign = 'center'
  ctx.fillText('LEVEL UP!', centerX, centerY - 40)

  ctx.font = 'bold 36px "Consolas", monospace'
  ctx.fillText(`Lv.${stats.level - 1} → Lv.${stats.level}`, centerX, centerY + 20)

  ctx.font = '18px "Consolas", monospace'
  ctx.shadowBlur = 10
  ctx.fillStyle = COLORS.success
  ctx.fillText('체력 최대치 +10', centerX, centerY + 70)
  ctx.fillText('공격력 +2', centerX, centerY + 95)

  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + time * 2
    const dist = 100 + Math.sin(time * 3 + i) * 30
    const px = centerX + Math.cos(angle) * dist
    const py = centerY + Math.sin(angle) * dist

    ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`
    ctx.beginPath()
    ctx.arc(px, py, 3 + Math.sin(time * 5 + i) * 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawLowHealthHUD(
  ctx: DrawContext,
  w: number, h: number,
  stats: PlayerStats,
  time: number
) {
  const hpRatio = stats.hp / stats.maxHp
  const criticalIntensity = 1 - hpRatio

  const heartbeat = Math.abs(Math.sin(time * 4))
  const breatheScale = 1 + heartbeat * 0.01 * criticalIntensity
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(breatheScale, breatheScale)
  ctx.translate(-w / 2, -h / 2)

  if (Math.sin(time * 8) > 0.8) {
    const glitchOffset = 5 * criticalIntensity
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(255, 0, 0, 0.1)`
    ctx.fillRect(-glitchOffset, 0, w, h)
    ctx.fillStyle = `rgba(0, 255, 255, 0.08)`
    ctx.fillRect(glitchOffset, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  drawNoise(ctx, w, h, criticalIntensity * 0.08)

  const pulse = (0.3 + Math.sin(time * 6) * 0.25) * criticalIntensity + 0.1
  const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.65)
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(200, 0, 0, ${pulse})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  if (Math.random() > 0.95) {
    const glitchY = Math.random() * h
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(0, glitchY, w, Math.random() * 20 + 5)
  }

  const flash = Math.sin(time * 10) > 0
  const textGlitch = Math.sin(time * 20) > 0.9 ? (Math.random() - 0.5) * 6 : 0

  ctx.font = 'bold 26px "Consolas", monospace'
  ctx.fillStyle = flash ? COLORS.danger : COLORS.dangerGlow
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = flash ? 30 : 15
  ctx.textAlign = 'center'
  ctx.fillText('★ 위험 상태 ★', w / 2 + textGlitch, 100)
  
  ctx.font = 'bold 36px "Consolas", monospace'
  const hpText = `HP: ${stats.hp} / ${stats.maxHp}`
  
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#FF0000'
  ctx.fillText(hpText, w / 2 - 2, 145)
  ctx.fillStyle = '#00FFFF'
  ctx.fillText(hpText, w / 2 + 2, 145)
  ctx.globalAlpha = 1
  
  ctx.fillStyle = COLORS.danger
  ctx.shadowBlur = 25
  ctx.fillText(hpText, w / 2, 145)
  
  ctx.font = '16px "Consolas", monospace'
  ctx.fillStyle = COLORS.warning
  ctx.shadowBlur = 10
  ctx.fillText('[R] 키를 눌러 회복', w / 2, 185)

  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  const heartPhase = (time * 5) % (Math.PI * 2)
  const heartScale = 1 + Math.pow(Math.abs(Math.sin(heartPhase)), 3) * 0.4

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(heartScale, heartScale)
  
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 40 + heartScale * 20
  
  ctx.fillStyle = COLORS.danger
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.bezierCurveTo(-25, -40, -55, -10, 0, 35)
  ctx.bezierCurveTo(55, -10, 25, -40, 0, -10)
  ctx.fill()
  
  ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'
  ctx.beginPath()
  ctx.ellipse(-12, -15, 8, 6, -0.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()

  drawEKGLine(ctx, w, h, time)

  ctx.restore()
}
