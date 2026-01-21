/**
 * Dream Persona HUD Remaster - ARWES-Inspired Drawing Module
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 이 파일은 arwes/arwes 저장소의 다음 패키지들에서 영감을 받아 구현:
 * 
 * [1] packages/frames/createFrameCornersSettings - 코너 프레임 라인
 * [2] packages/bgs/createBackgroundGridLines - 그리드 라인 배경
 * [3] packages/bgs/createBackgroundDots - 도트 패턴 배경
 * [4] packages/bgs/createBackgroundMovingLines - 움직이는 라인 효과
 * [5] packages/bgs/createBackgroundPuffs - 파티클/연기 효과
 * [6] packages/effects/createEffectIlluminator - 마우스 추적 글로우
 * [7] packages/text/animateTextDecipher - 텍스트 암호해독 효과
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  type ScenarioId,
  THEMES,
  FRAME_SETTINGS,
  GRID_SETTINGS,
  DOTS_SETTINGS,
  MOVING_LINES_SETTINGS,
  PUFFS_SETTINGS,
  CIPHER_CHARACTERS,
  GLITCH_CHARACTERS,
  SCENARIO_CHARACTERS,
  SCENARIOS,
  CHARACTERS,
  easing,
  FONTS,
  WIN98_THEMES,
  SCENARIO_COLORS,
  type Win98Theme,
} from './constants'

export type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HUD 상태 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HUDState {
  scenario: ScenarioId
  time: number
  mouse: { x: number; y: number }
  isLocked: boolean
  lockProgress: number
  isFiring: boolean  // 공격 중 (Hit Marker 용)
  
  player: {
    health: number
    maxHealth: number
    syncRate: number
    infectionLevel: number
    evolutionProgress: number
  }
  
  target: {
    name: string
    health: number
    maxHealth: number
    distance: number
    threatLevel: 'low' | 'medium' | 'high' | 'boss'
  } | null
  
  effects: {
    damageFlash: number
    glitchIntensity: number
    transitionProgress: number
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/frames] Frame Corners - 코너 프레임 라인
// 출처: packages/frames/src/createFrameCornersSettings/createFrameCornersSettings.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawFrameCorners(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  scenario: ScenarioId,
  time: number,
  options: {
    cornerLength?: number
    strokeWidth?: number
    padding?: number
    animated?: boolean
    progress?: number // 0-1, for draw animation
  } = {}
) {
  const theme = THEMES[scenario]
  const {
    cornerLength = FRAME_SETTINGS.cornerLength,
    strokeWidth = FRAME_SETTINGS.strokeWidth,
    padding = FRAME_SETTINGS.padding,
    animated = true,
    progress = 1,
  } = options

  const p = padding
  const sw = strokeWidth
  const cl = cornerLength
  const co = sw / 2  // center offset

  ctx.save()
  
  // ARWES 스타일: 필터 및 글로우 효과
  ctx.strokeStyle = theme.main(3)
  ctx.lineWidth = sw
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.shadowColor = theme.main(4)
  ctx.shadowBlur = animated ? 8 + Math.sin(time * 3) * 4 : 8

  // 애니메이션 진행도에 따른 라인 길이 계산 (ARWES animateDraw 패턴)
  const animatedLength = cl * easing.outCubic(progress)

  // 8개의 코너 라인 (ARWES 패턴 - 각 코너에 L자 형태)
  const corners = [
    // Left top
    { start: [x + p + co, y + p + co], horiz: [x + p + co + animatedLength, y + p + co], vert: [x + p + co, y + p + co + animatedLength] },
    // Right top
    { start: [x + w - p - co, y + p + co], horiz: [x + w - p - co - animatedLength, y + p + co], vert: [x + w - p - co, y + p + co + animatedLength] },
    // Right bottom
    { start: [x + w - p - co, y + h - p - co], horiz: [x + w - p - co - animatedLength, y + h - p - co], vert: [x + w - p - co, y + h - p - co - animatedLength] },
    // Left bottom
    { start: [x + p + co, y + h - p - co], horiz: [x + p + co + animatedLength, y + h - p - co], vert: [x + p + co, y + h - p - co - animatedLength] },
  ]

  corners.forEach(corner => {
    // Horizontal line
    ctx.beginPath()
    ctx.moveTo(corner.start[0], corner.start[1])
    ctx.lineTo(corner.horiz[0], corner.horiz[1])
    ctx.stroke()
    
    // Vertical line
    ctx.beginPath()
    ctx.moveTo(corner.start[0], corner.start[1])
    ctx.lineTo(corner.vert[0], corner.vert[1])
    ctx.stroke()
  })

  ctx.shadowBlur = 0
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/frames] Frame Background
// 출처: packages/frames/src/createFrameCornersSettings - bg rect element
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawFrameBackground(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  scenario: ScenarioId,
  alpha: number = 0.8
) {
  const theme = THEMES[scenario]
  const p = FRAME_SETTINGS.padding + FRAME_SETTINGS.strokeWidth

  ctx.save()
  ctx.fillStyle = theme.bg(Math.round(alpha * 5))
  ctx.fillRect(x + p, y + p, w - p * 2, h - p * 2)
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/bgs] Grid Lines Background
// 출처: packages/bgs/src/createBackgroundGridLines/createBackgroundGridLines.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawGridLines(
  ctx: DrawContext,
  w: number, h: number,
  scenario: ScenarioId,
  time: number,
  alpha: number = 1
) {
  const theme = THEMES[scenario]
  const { lineWidth, distance, horizontalLineDash, verticalLineDash } = GRID_SETTINGS

  const xLength = 1 + Math.floor(w / distance)
  const yLength = 1 + Math.floor(h / distance)
  const xMargin = w % distance
  const yMargin = h % distance

  ctx.save()
  ctx.globalAlpha = alpha * 0.3
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = theme.deco(1)

  // Horizontal lines with dash
  ctx.setLineDash(horizontalLineDash)
  for (let yIndex = 0; yIndex < yLength; yIndex++) {
    const y = yMargin / 2 + yIndex * distance
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Vertical lines with different dash
  ctx.setLineDash(verticalLineDash)
  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    const xPos = xMargin / 2 + xIndex * distance
    ctx.beginPath()
    ctx.moveTo(xPos, 0)
    ctx.lineTo(xPos, h)
    ctx.stroke()
  }

  ctx.setLineDash([])
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/bgs] Dots Pattern Background
// 출처: packages/bgs/src/createBackgroundDots/createBackgroundDots.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawDots(
  ctx: DrawContext,
  w: number, h: number,
  scenario: ScenarioId,
  time: number,
  origin: { x: number; y: number } = { x: w / 2, y: h / 2 },
  progress: number = 1
) {
  const theme = THEMES[scenario]
  const { type, distance, size, crossSize } = DOTS_SETTINGS

  const xLength = 1 + Math.floor(w / distance)
  const yLength = 1 + Math.floor(h / distance)
  const xMargin = w % distance
  const yMargin = h % distance

  // 최대 거리 계산 (대각선)
  const maxDist = Math.sqrt(w * w + h * h)

  ctx.save()
  ctx.fillStyle = theme.deco(2)

  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    const x = xMargin / 2 + xIndex * distance

    for (let yIndex = 0; yIndex < yLength; yIndex++) {
      const y = yMargin / 2 + yIndex * distance

      // ARWES 패턴: origin에서 거리에 따른 알파 계산
      const distFromOrigin = Math.sqrt(Math.pow(x - origin.x, 2) + Math.pow(y - origin.y, 2))
      const distProgress = distFromOrigin / maxDist
      const alphaProgress = progress / Math.max(0.1, distProgress)
      const alpha = Math.max(0, Math.min(1, alphaProgress))

      ctx.globalAlpha = alpha * 0.6

      ctx.beginPath()

      if (type === 'circle') {
        ctx.arc(x, y, size, 0, 2 * Math.PI)
      } else if (type === 'cross') {
        // ARWES cross 패턴
        const l = size / 2
        const b = crossSize / 2
        ctx.moveTo(x - l, y + b)
        ctx.lineTo(x - l, y - b)
        ctx.lineTo(x - b, y - b)
        ctx.lineTo(x - b, y - l)
        ctx.lineTo(x + b, y - l)
        ctx.lineTo(x + b, y - b)
        ctx.lineTo(x + l, y - b)
        ctx.lineTo(x + l, y + b)
        ctx.lineTo(x + b, y + b)
        ctx.lineTo(x + b, y + l)
        ctx.lineTo(x - b, y + l)
        ctx.lineTo(x - b, y + b)
        ctx.closePath()
      } else {
        ctx.rect(x - size / 2, y - size / 2, size, size)
      }

      ctx.fill()
    }
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/bgs] Moving Lines Effect
// 출처: packages/bgs/src/createBackgroundMovingLines/createBackgroundMovingLines.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MovingLine {
  x: number
  yStart: number
  length: number
  speed: number
}

const movingLinesCache: MovingLine[] = []

export function drawMovingLines(
  ctx: DrawContext,
  w: number, h: number,
  scenario: ScenarioId,
  time: number,
  alpha: number = 1
) {
  const theme = THEMES[scenario]
  const { lineWidth, distance, sets, speed } = MOVING_LINES_SETTINGS

  // 라인 초기화 (ARWES randomizeList 패턴)
  if (movingLinesCache.length === 0) {
    const xLength = Math.floor(w / distance)
    for (let set = 0; set < sets; set++) {
      const numLines = Math.floor(xLength * (0.1 + Math.random() * 0.3))
      for (let i = 0; i < numLines; i++) {
        movingLinesCache.push({
          x: Math.random() * w,
          yStart: Math.random() * h,
          length: 20 + Math.random() * 60,
          speed: speed * (0.5 + Math.random()),
        })
      }
    }
  }

  ctx.save()
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = theme.main(2)
  ctx.shadowColor = theme.main(3)
  ctx.shadowBlur = 6
  ctx.globalAlpha = alpha * 0.5

  movingLinesCache.forEach((line, i) => {
    // ARWES 패턴: 세트별 오프셋
    const setOffset = (i % sets) / sets
    const progress = ((time * line.speed + setOffset) % 1)
    const y = (line.yStart + progress * h * 2) % (h + line.length) - line.length

    ctx.beginPath()
    ctx.moveTo(line.x, y)
    ctx.lineTo(line.x, y + line.length)
    ctx.stroke()
  })

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/bgs] Puffs Particle Effect
// 출처: packages/bgs/src/createBackgroundPuffs/createBackgroundPuffs.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Puff {
  x: number
  y: number
  r: number
  xOffset: number
  yOffset: number
  rOffset: number
  phase: number
}

const puffsCache: Puff[] = []

export function drawPuffs(
  ctx: DrawContext,
  w: number, h: number,
  scenario: ScenarioId,
  time: number,
  alpha: number = 1
) {
  const theme = THEMES[scenario]
  const { quantity, padding, xOffset, yOffset, radiusInitial, radiusOffset } = PUFFS_SETTINGS

  // Puff 초기화
  if (puffsCache.length < quantity) {
    for (let i = puffsCache.length; i < quantity; i++) {
      puffsCache.push({
        x: padding + Math.random() * (w - padding * 2),
        y: padding + Math.random() * (h - padding * 2),
        r: radiusInitial,
        xOffset: xOffset[0] + Math.random() * xOffset[1],
        yOffset: yOffset[0] + Math.random() * yOffset[1],
        rOffset: radiusOffset[0] + Math.random() * radiusOffset[1],
        phase: Math.random(),
      })
    }
  }

  ctx.save()

  puffsCache.forEach(puff => {
    // ARWES 패턴: 시간에 따른 진행
    const progress = easing.outSine(((time * 0.2 + puff.phase) % 1))
    
    // 0 at 0%, 1 at 50%, 0 at 100%
    const puffAlpha = progress <= 0.5 ? progress * 2 : -2 * progress + 2

    const x = puff.x + progress * puff.xOffset
    const y = puff.y + progress * puff.yOffset
    const r = puff.r + progress * puff.rOffset

    // Radial gradient (ARWES 패턴)
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, theme.main(2))
    grd.addColorStop(1, 'transparent')

    ctx.globalAlpha = alpha * puffAlpha * 0.6
    ctx.beginPath()
    ctx.fillStyle = grd
    ctx.arc(x, y, r, 0, 2 * Math.PI)
    ctx.fill()
  })

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/effects] Illuminator Effect
// 출처: packages/effects/src/createEffectIlluminator/createEffectIlluminator.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawIlluminator(
  ctx: DrawContext,
  mouseX: number, mouseY: number,
  scenario: ScenarioId,
  size: number = 200,
  alpha: number = 0.15
) {
  const theme = THEMES[scenario]

  const gradient = ctx.createRadialGradient(
    mouseX, mouseY, 0,
    mouseX, mouseY, size / 2
  )
  gradient.addColorStop(0, theme.main(3).replace(')', `, ${alpha})`).replace('hsl', 'hsla'))
  gradient.addColorStop(1, 'transparent')

  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(mouseX - size / 2, mouseY - size / 2, size, size)
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [ARWES/text] Text Decipher Effect
// 출처: packages/text/src/animateTextDecipher/animateTextDecipher.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function decipherText(
  text: string,
  progress: number,
  characters: string = CIPHER_CHARACTERS
): string {
  const length = text.length
  const decipheredCount = Math.round(length * progress)
  
  // ARWES 패턴: 랜덤 순서로 문자 해독
  const chars = text.split('')
  return chars.map((char, index) => {
    if (char === ' ') return ' '
    if (index < decipheredCount) return char
    return characters[Math.floor(Math.random() * characters.length)]
  }).join('')
}

export function drawDecipherText(
  ctx: DrawContext,
  text: string,
  x: number, y: number,
  scenario: ScenarioId,
  progress: number,
  options: {
    font?: string
    size?: number
    align?: CanvasTextAlign
  } = {}
) {
  const theme = THEMES[scenario]
  const {
    font = FONTS.mono,
    size = 14,
    align = 'left',
  } = options

  const deciphered = decipherText(text, progress)

  ctx.save()
  ctx.font = `${size}px ${font}`
  ctx.fillStyle = theme.text(3)
  ctx.textAlign = align
  ctx.shadowColor = theme.main(3)
  ctx.shadowBlur = 4
  ctx.fillText(deciphered, x, y)
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Glitch Text Effect (Infected 시나리오용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function glitchText(text: string, intensity: number): string {
  if (intensity <= 0) return text
  
  return text.split('').map(char => {
    if (char === ' ') return ' '
    if (Math.random() < intensity * 0.3) {
      return GLITCH_CHARACTERS[Math.floor(Math.random() * GLITCH_CHARACTERS.length)]
    }
    return char
  }).join('')
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scanline Effect (ARWES에서 영감) - 문서 기준 강화
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawScanlines(
  ctx: DrawContext,
  w: number, h: number,
  time: number,
  alpha: number = 0.03
) {
  ctx.save()
  
  // 정적 스캔라인 (2px 간격 - 문서 기준)
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1)
  }

  // 움직이는 스캔라인 (위에서 아래로 천천히 이동)
  const scanSpeed = 0.5 // 초당 이동 비율 (문서 기준)
  const scanY = ((time * scanSpeed * h) % (h * 1.5)) - h * 0.25
  const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 3})`)
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, scanY - 20, w, 40)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hologram Effect (문서 기준: 깜빡임, 색수차, 노이즈)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawHologramEffect(
  ctx: DrawContext,
  w: number, h: number,
  time: number,
  options: {
    flickerFrequency?: number  // 깜빡임 빈도 (0-1)
    chromaticOffset?: number   // 색수차 오프셋 (px)
    noiseDensity?: number      // 노이즈 밀도 (0-1)
    baseColor?: string         // 기본 색상
  } = {}
) {
  const {
    flickerFrequency = 0.1,
    chromaticOffset = 1,
    noiseDensity = 0.02,
    baseColor = '#FFD700'
  } = options

  ctx.save()

  // 1. 랜덤 깜빡임 (10% 확률, 50ms 효과)
  const flickerPhase = Math.floor(time * 20) // 50ms 단위
  const shouldFlicker = Math.sin(flickerPhase * 0.1 + flickerPhase * 7.3) > (1 - flickerFrequency * 2)
  
  if (shouldFlicker) {
    ctx.fillStyle = `${baseColor}15`
    ctx.fillRect(0, 0, w, h)
  }

  // 2. 색수차 효과 (가장자리에서 더 강하게)
  if (chromaticOffset > 0) {
    ctx.globalCompositeOperation = 'screen'
    
    // 상단 색수차
    const topGradient = ctx.createLinearGradient(0, 0, 0, 50)
    topGradient.addColorStop(0, 'rgba(255, 0, 100, 0.08)')
    topGradient.addColorStop(1, 'transparent')
    ctx.fillStyle = topGradient
    ctx.fillRect(chromaticOffset, 0, w, 50)
    
    // 하단 색수차
    const bottomGradient = ctx.createLinearGradient(0, h - 50, 0, h)
    bottomGradient.addColorStop(0, 'transparent')
    bottomGradient.addColorStop(1, 'rgba(0, 100, 255, 0.08)')
    ctx.fillStyle = bottomGradient
    ctx.fillRect(-chromaticOffset, h - 50, w, 50)
    
    ctx.globalCompositeOperation = 'source-over'
  }

  // 3. 랜덤 노이즈 (2% 밀도)
  if (noiseDensity > 0) {
    const numNoise = Math.floor(w * h * noiseDensity * 0.001)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    
    for (let i = 0; i < numNoise; i++) {
      // 시드 기반 랜덤 (매 프레임 다른 위치)
      const seed = time * 1000 + i
      const rx = ((Math.sin(seed) + 1) / 2) * w
      const ry = ((Math.cos(seed * 1.1) + 1) / 2) * h
      ctx.fillRect(rx, ry, 1, 1)
    }
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Curved Screen Effect (CRT 모니터 느낌)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawCurvedScreenEffect(
  ctx: DrawContext,
  w: number, h: number,
  intensity: number = 0.15
) {
  ctx.save()

  // 코너 어둡게 (CRT 커브 시뮬레이션)
  const gradient = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.3,
    w / 2, h / 2, Math.max(w, h) * 0.8
  )
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Vignette Effect
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawVignette(
  ctx: DrawContext,
  w: number, h: number,
  scenario: ScenarioId,
  intensity: number = 0.4
) {
  const theme = THEMES[scenario]
  const centerX = w / 2
  const centerY = h / 2
  const radius = Math.max(w, h) * 0.7

  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`)

  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Win98 스타일 프레임 시스템 (GUIDE-MODULE-02-WIN98-FRAME.md 기준)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Win98FrameOptions {
  x: number
  y: number
  width: number
  height: number
  title: string
  theme: Win98Theme
  showControls?: boolean  // ─ □ ✕ 버튼
  animated?: boolean      // 글로우 애니메이션
}

/**
 * Win98 스타일 창 프레임 그리기
 * 가이드 모듈 2 기반: 이중 테두리, 그라데이션 타이틀바, 입체 버튼
 */
export function drawWin98Frame(
  ctx: DrawContext,
  options: Win98FrameOptions,
  time: number = 0
): void {
  const { x, y, width, height, title, theme, showControls = true, animated = true } = options
  const colors = WIN98_THEMES[theme]
  const titleBarHeight = 24
  const borderWidth = 2
  const controlButtonSize = 16
  
  ctx.save()
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 테두리 (어두운색) - Win98 스타일 이중 테두리
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.outerBorder
  ctx.lineWidth = borderWidth
  ctx.strokeRect(x, y, width, height)
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 테두리 (밝은색) - 1px 안쪽
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.innerBorder
  ctx.lineWidth = 1
  ctx.strokeRect(
    x + borderWidth, 
    y + borderWidth, 
    width - borderWidth * 2, 
    height - borderWidth * 2
  )
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 타이틀 바 (그라데이션) - Win98 핵심 요소
  // ═══════════════════════════════════════════════════════════════
  const titleBarX = x + borderWidth + 1
  const titleBarY = y + borderWidth + 1
  const titleBarWidth = width - borderWidth * 2 - 2
  
  // 그라데이션 생성
  const titleGradient = ctx.createLinearGradient(
    titleBarX, titleBarY,
    titleBarX + titleBarWidth, titleBarY
  )
  titleGradient.addColorStop(0, colors.titleGradientStart)
  titleGradient.addColorStop(1, colors.titleGradientEnd)
  
  ctx.fillStyle = titleGradient
  ctx.fillRect(titleBarX, titleBarY, titleBarWidth, titleBarHeight)
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 타이틀 텍스트
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = colors.titleText
  ctx.font = `bold 11px ${FONTS.mono}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    `[ ${title.toUpperCase()} ]`,
    titleBarX + 8,
    titleBarY + titleBarHeight / 2
  )
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 컨트롤 버튼 (─ □ ✕) - Win98 스타일
  // ═══════════════════════════════════════════════════════════════
  if (showControls) {
    const buttonY = titleBarY + (titleBarHeight - controlButtonSize) / 2
    const buttonSpacing = 2
    
    // 버튼 3개: Minimize(─), Maximize(□), Close(✕)
    const buttons = ['─', '□', '✕']
    const buttonColors = [colors.controlBg, colors.controlBg, '#CC3333']
    
    for (let i = 0; i < 3; i++) {
      const buttonX = titleBarX + titleBarWidth - 
                      (3 - i) * (controlButtonSize + buttonSpacing) - 4
      
      // 버튼 배경
      ctx.fillStyle = buttonColors[i]
      ctx.fillRect(buttonX, buttonY, controlButtonSize, controlButtonSize)
      
      // 버튼 테두리 (입체감) - 밝은 면
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(buttonX, buttonY + controlButtonSize)
      ctx.lineTo(buttonX, buttonY)
      ctx.lineTo(buttonX + controlButtonSize, buttonY)
      ctx.stroke()
      
      // 버튼 테두리 (입체감) - 어두운 면
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      ctx.moveTo(buttonX + controlButtonSize, buttonY)
      ctx.lineTo(buttonX + controlButtonSize, buttonY + controlButtonSize)
      ctx.lineTo(buttonX, buttonY + controlButtonSize)
      ctx.stroke()
      
      // 버튼 아이콘
      ctx.fillStyle = colors.titleText
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(
        buttons[i],
        buttonX + controlButtonSize / 2,
        buttonY + controlButtonSize / 2
      )
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 6. 컨텐츠 영역 배경
  // ═══════════════════════════════════════════════════════════════
  const contentX = titleBarX
  const contentY = titleBarY + titleBarHeight + 2
  const contentWidth = titleBarWidth
  const contentHeight = height - borderWidth * 2 - titleBarHeight - 6
  
  ctx.fillStyle = colors.contentBg
  ctx.fillRect(contentX, contentY, contentWidth, contentHeight)
  
  // ═══════════════════════════════════════════════════════════════
  // 7. 코너 장식 (L자 코너) - ARWES 스타일
  // ═══════════════════════════════════════════════════════════════
  const cornerLength = 12
  ctx.strokeStyle = colors.innerBorder
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  
  // 좌상단
  ctx.beginPath()
  ctx.moveTo(x + borderWidth, y + borderWidth + cornerLength)
  ctx.lineTo(x + borderWidth, y + borderWidth)
  ctx.lineTo(x + borderWidth + cornerLength, y + borderWidth)
  ctx.stroke()
  
  // 우상단
  ctx.beginPath()
  ctx.moveTo(x + width - borderWidth - cornerLength, y + borderWidth)
  ctx.lineTo(x + width - borderWidth, y + borderWidth)
  ctx.lineTo(x + width - borderWidth, y + borderWidth + cornerLength)
  ctx.stroke()
  
  // 좌하단
  ctx.beginPath()
  ctx.moveTo(x + borderWidth, y + height - borderWidth - cornerLength)
  ctx.lineTo(x + borderWidth, y + height - borderWidth)
  ctx.lineTo(x + borderWidth + cornerLength, y + height - borderWidth)
  ctx.stroke()
  
  // 우하단
  ctx.beginPath()
  ctx.moveTo(x + width - borderWidth - cornerLength, y + height - borderWidth)
  ctx.lineTo(x + width - borderWidth, y + height - borderWidth)
  ctx.lineTo(x + width - borderWidth, y + height - borderWidth - cornerLength)
  ctx.stroke()
  
  // ═══════════════════════════════════════════════════════════════
  // 8. 홀로그램 글로우 효과 (애니메이션)
  // ═══════════════════════════════════════════════════════════════
  if (animated) {
    ctx.shadowColor = colors.titleGradientStart
    ctx.shadowBlur = 8 + Math.sin(time * 3) * 4
    ctx.strokeStyle = colors.titleGradientStart + '44'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 1, y + 1, width - 2, height - 2)
    ctx.shadowBlur = 0
  }
  
  ctx.restore()
}

/**
 * Win98 프레임의 컨텐츠 영역 좌표 계산
 */
export function getWin98ContentArea(x: number, y: number, width: number, height: number) {
  const borderWidth = 2
  const titleBarHeight = 24
  
  return {
    x: x + borderWidth + 2,
    y: y + borderWidth + titleBarHeight + 4,
    width: width - borderWidth * 2 - 4,
    height: height - borderWidth * 2 - titleBarHeight - 8,
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 텍스트 해독 (문자셋 활용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 시나리오에 맞는 문자셋으로 텍스트 해독 효과
 */
export function decipherTextForScenario(
  text: string,
  progress: number,
  scenario: ScenarioId
): string {
  const characters = SCENARIO_CHARACTERS[scenario] || CIPHER_CHARACTERS
  return decipherText(text, progress, characters)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export all drawing functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { THEMES, SCENARIOS, CHARACTERS, FONTS, easing, SCENARIO_COLORS, WIN98_THEMES }
export type { ScenarioId, Win98Theme }

