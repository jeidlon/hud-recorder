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
  _time: number,
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
  _time: number,
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
  _scenario: ScenarioId,
  intensity: number = 0.4
) {
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
// [MODULE-03] 홀로그램 플리커 효과
// 출처: GUIDE-MODULE-03-HOLOGRAM-EFFECTS.md
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 홀로그램 깜빡임 효과
 * - 랜덤한 간격으로 전체 화면이 살짝 깜빡임
 * - 깜빡일 때 약간의 밝기 변화
 */
export function drawHologramFlicker(
  ctx: DrawContext,
  width: number,
  height: number,
  time: number,
  options: {
    flickerFrequency?: number  // 깜빡임 빈도 (0-1, 높을수록 자주)
    flickerIntensity?: number  // 깜빡임 강도 (0-1)
    baseColor?: string         // 기본 색상
  } = {}
): void {
  const {
    flickerFrequency = 0.05,
    flickerIntensity = 0.1,
    baseColor = 'rgba(255, 255, 255, 0.02)'
  } = options

  ctx.save()

  // 랜덤 플리커 계산 (노이즈 기반)
  const noise = Math.sin(time * 47.3) * Math.cos(time * 23.7)
  const flicker = noise > (1 - flickerFrequency * 2) ? 1 : 0

  if (flicker) {
    // 전체 화면에 밝은 오버레이
    ctx.fillStyle = baseColor
    ctx.globalAlpha = flickerIntensity * (0.5 + Math.random() * 0.5)
    ctx.fillRect(0, 0, width, height)
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-03] 색수차 (Chromatic Aberration) 효과
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 색수차 효과
 * - RGB 채널이 약간씩 분리되어 보이는 효과
 * - 가장자리에서 더 강하게 나타남
 */
export function drawChromaticAberration(
  ctx: DrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    offset?: number           // RGB 분리 거리 (기본 2px)
    opacity?: number          // 효과 투명도
  } = {}
): void {
  const { offset = 2, opacity = 0.3 } = options

  ctx.save()
  ctx.globalAlpha = opacity

  // 빨간색 오프셋 (왼쪽으로)
  ctx.strokeStyle = '#FF0000'
  ctx.lineWidth = 1
  ctx.strokeRect(x - offset, y - offset, width, height)

  // 파란색 오프셋 (오른쪽으로)
  ctx.strokeStyle = '#0000FF'
  ctx.strokeRect(x + offset, y + offset, width, height)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-03] 홀로그램 노이즈 텍스처
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 홀로그램 노이즈 텍스처
 * - 미세한 노이즈 패턴으로 홀로그램 질감 표현
 */
export function drawHologramNoise(
  ctx: DrawContext,
  width: number,
  height: number,
  time: number,
  options: {
    density?: number          // 노이즈 밀도 (기본 0.002)
    color?: string            // 노이즈 색상
    animated?: boolean        // 애니메이션 여부
  } = {}
): void {
  const {
    density = 0.002,
    color = 'rgba(255, 255, 255, 0.1)',
    animated = true
  } = options

  ctx.save()
  ctx.fillStyle = color

  // 노이즈 시드 (애니메이션용)
  const seed = animated ? Math.floor(time * 10) : 0

  // 랜덤 픽셀 노이즈
  const pixelCount = Math.floor(width * height * density)

  for (let i = 0; i < pixelCount; i++) {
    // 의사 랜덤 (시드 기반)
    const pseudoRandom = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
    const rx = (pseudoRandom % 1) * width
    const ry = (Math.sin(pseudoRandom) * 0.5 + 0.5) * height

    ctx.fillRect(Math.floor(rx), Math.floor(ry), 1, 1)
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-03] 통합 홀로그램 효과 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 모든 홀로그램 효과를 한번에 적용
 * 이 함수를 매 프레임 마지막에 호출
 * 
 * 시나리오별 효과 강도:
 * | 시나리오 | 스캔라인 | 플리커 | 노이즈 | 색수차 |
 * |---------|---------|--------|--------|--------|
 * | NORMAL  | ●○○ | ●○○ | ○○○ | ○○○ |
 * | SYNC    | ●●○ | ●●○ | ●○○ | ○○○ |
 * | COMBAT  | ●●○ | ●○○ | ○○○ | ●○○ |
 * | INFECTED| ●●● | ●●● | ●●● | ●●● |
 * | TRAUMA  | ●○○ | ○○○ | ○○○ | ○○○ |
 * | EVOLVED | ●●○ | ●○○ | ○○○ | ○○○ |
 */
export function applyHologramEffects(
  ctx: DrawContext,
  width: number,
  height: number,
  time: number,
  scenario: ScenarioId
): void {
  // 시나리오별 효과 강도 조절
  const effectIntensity: Record<ScenarioId, number> = {
    normal: 0.5,    // 기본 홀로그램
    sync: 0.8,      // 접속 중이므로 강하게
    combat: 0.7,    // 전투 중
    infected: 1.5,  // 감염 상태 - 매우 강하게
    trauma: 0.3,    // 절망적 - 약하게
    evolved: 0.6,   // 진화 상태
    tactical_diagnostic: 0.5,
    tactical_desktop: 0.5,
  }

  const intensity = effectIntensity[scenario]

  // 1. 스캔라인 (항상 적용)
  drawScanlines(ctx, width, height, time, 0.03 * intensity)

  // 2. 홀로그램 플리커 (INFECTED에서 강하게)
  drawHologramFlicker(ctx, width, height, time, {
    flickerFrequency: scenario === 'infected' ? 0.15 : 0.05,
    flickerIntensity: 0.1 * intensity,
  })

  // 3. 노이즈 (INFECTED, SYNC에서만)
  if (scenario === 'infected' || scenario === 'sync') {
    drawHologramNoise(ctx, width, height, time, {
      density: scenario === 'infected' ? 0.005 : 0.002,
    })
  }

  // 4. 색수차 (INFECTED, COMBAT에서만)
  if (scenario === 'infected' || scenario === 'combat') {
    const chromaticOffset = scenario === 'infected' ? 3 : 1
    const chromaticOpacity = scenario === 'infected' ? 0.4 : 0.2
    drawChromaticAberration(ctx, 0, 0, width, height, {
      offset: chromaticOffset,
      opacity: chromaticOpacity,
    })
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-06] INFECTED 시나리오 전용 효과
// 출처: GUIDE-MODULE-06-INFECTED-SCENARIO.md
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 감염 레벨에 따른 글리치 문자셋
const GLITCH_CHARS_SET = {
  light: ['▓', '▒', '░'],
  medium: ['█', '▓', '▒', '░', '?', '#'],
  heavy: ['█', '▓', '▒', '░', '?', '#', '@', '!', '$', '%', '^', '&', '*', 'E', 'R', 'O'],
}

interface GlitchTextOptions {
  corruptionLevel: number  // 0 ~ 1 (감염도)
  time: number
  scrambleRate: number     // 글리치 빈도 (0 ~ 1)
}

/**
 * 감염 레벨에 따른 글리치 텍스트 생성
 * 예: STATUS: UNDEAD → S█▓US▒ UND░AD
 */
export function getGlitchedText(
  originalText: string,
  options: GlitchTextOptions
): string {
  const { corruptionLevel, time, scrambleRate } = options

  // 글리치 문자셋 선택
  const charSet = corruptionLevel > 0.7
    ? GLITCH_CHARS_SET.heavy
    : corruptionLevel > 0.4
      ? GLITCH_CHARS_SET.medium
      : GLITCH_CHARS_SET.light

  return originalText.split('').map((char, index) => {
    // 공백은 유지
    if (char === ' ') return ' '

    // 시간에 따른 글리치 확률
    const noise = Math.sin(index * 12.9898 + time * 20) * 0.5 + 0.5
    const shouldGlitch = noise < corruptionLevel * scrambleRate

    if (shouldGlitch) {
      // 추가 노이즈로 문자 선택
      const charNoise = Math.sin(index * 78.233 + time * 50)
      const charIndex = Math.floor(Math.abs(charNoise) * charSet.length) % charSet.length
      return charSet[charIndex]
    }

    return char
  }).join('')
}

interface MeltEffectOptions {
  meltIntensity: number    // 0 ~ 1
  time: number
  dripsPerWidth: number    // 폭당 물방울 수
}

/**
 * UI 녹아내림(드립) 효과
 * 패널 하단에 액체처럼 흐르는 효과
 */
export function drawMeltEffect(
  ctx: DrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  options: MeltEffectOptions
): void {
  const { meltIntensity, time, dripsPerWidth } = options

  ctx.save()

  // 하단에 녹아내리는 드립 효과
  const dripCount = Math.floor(width / dripsPerWidth)

  for (let i = 0; i < dripCount; i++) {
    // 드립 위치 (시드 기반 랜덤)
    const seed = i * 123.456
    const dripX = x + (i / dripCount) * width + Math.sin(seed) * 10

    // 드립 길이 (시간에 따라 변화)
    const baseDripLength = 20 + Math.sin(seed * 2) * 30
    const animatedLength = baseDripLength * meltIntensity *
      (0.5 + 0.5 * Math.sin(time * 2 + seed))

    // 드립 그리기
    const gradient = ctx.createLinearGradient(
      dripX, y + height,
      dripX, y + height + animatedLength
    )
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, 'transparent')

    ctx.fillStyle = gradient

    // 물방울 형태
    ctx.beginPath()
    ctx.moveTo(dripX - 3, y + height)
    ctx.quadraticCurveTo(
      dripX, y + height + animatedLength,
      dripX + 3, y + height
    )
    ctx.fill()
  }

  ctx.restore()
}

interface PixelDropoutOptions {
  dropoutRate: number  // 0 ~ 1 (누락률)
  pixelSize: number
  time: number
}

/**
 * 픽셀 누락 효과
 * 랜덤하게 픽셀이 사라지는 효과 (감염 50% 이상에서 활성화)
 */
export function drawPixelDropout(
  ctx: DrawContext,
  width: number,
  height: number,
  options: PixelDropoutOptions
): void {
  const { dropoutRate, pixelSize, time } = options

  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 1)' // 검은색으로 마스킹

  const cols = Math.ceil(width / pixelSize)
  const rows = Math.ceil(height / pixelSize)

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 시드 기반 랜덤 (시간에 따라 변화)
      const seed = row * 1000 + col + Math.floor(time * 3)
      const noise = Math.sin(seed * 12.9898) * 43758.5453 % 1

      if (Math.abs(noise) < dropoutRate) {
        ctx.fillRect(
          col * pixelSize,
          row * pixelSize,
          pixelSize,
          pixelSize
        )
      }
    }
  }

  ctx.restore()
}

/**
 * 감염 오버레이 (보라색 비네트 + 수평 글리치 라인)
 */
export function drawInfectedOverlay(
  ctx: DrawContext,
  width: number,
  height: number,
  time: number,
  infectionLevel: number
): void {
  ctx.save()

  // 보라색 비네트
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  )
  gradient.addColorStop(0, 'rgba(153, 0, 255, 0)')
  gradient.addColorStop(0.5, `rgba(153, 0, 255, ${0.1 * infectionLevel})`)
  gradient.addColorStop(1, `rgba(153, 0, 255, ${0.4 * infectionLevel})`)

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // 수평 글리치 라인 (랜덤 위치)
  const lineCount = Math.floor(10 * infectionLevel)
  ctx.fillStyle = `rgba(0, 255, 100, ${0.3 * infectionLevel})`

  for (let i = 0; i < lineCount; i++) {
    const seed = i * 123 + Math.floor(time * 10)
    const y = (Math.sin(seed) * 0.5 + 0.5) * height
    const lineHeight = 1 + Math.random() * 3

    // 가끔씩만 표시 (깜빡임)
    if (Math.sin(seed + time * 20) > 0.7) {
      ctx.fillRect(0, y, width, lineHeight)
    }
  }

  ctx.restore()
}

interface ChromaticPanelOptions {
  aberrationOffset: number  // RGB 분리 거리 (px)
  time: number
  flickerRate: number
}

/**
 * 색수차 패널 효과 (RGB 채널 분리)
 */
export function drawChromaticPanel(
  ctx: DrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ChromaticPanelOptions
): void {
  const { aberrationOffset, time } = options

  // 시간에 따라 오프셋 변화
  const dynamicOffset = aberrationOffset * (0.5 + 0.5 * Math.sin(time * 5))

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  // 빨간 채널 (왼쪽으로)
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'
  ctx.lineWidth = 2
  ctx.strokeRect(x - dynamicOffset, y - dynamicOffset, width, height)

  // 파란 채널 (오른쪽으로)
  ctx.strokeStyle = 'rgba(0, 100, 255, 0.4)'
  ctx.strokeRect(x + dynamicOffset, y + dynamicOffset, width, height)

  // 녹색 채널 (제자리)
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)'
  ctx.strokeRect(x, y, width, height)

  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

/**
 * 글리치 크로스헤어 (INFECTED 전용)
 */
export function drawGlitchedCrosshair(
  ctx: DrawContext,
  cx: number,
  cy: number,
  time: number,
  glitchIntensity: number
): void {
  ctx.save()

  // 랜덤 오프셋 (글리치)
  const offsetX = (Math.sin(time * 30) * glitchIntensity) * 10
  const offsetY = (Math.cos(time * 25) * glitchIntensity) * 5

  ctx.strokeStyle = '#9900FF'
  ctx.lineWidth = 2

  // 떨리는 십자선
  ctx.beginPath()
  ctx.moveTo(cx + offsetX - 30, cy + offsetY)
  ctx.lineTo(cx + offsetX - 10, cy + offsetY)
  ctx.moveTo(cx + offsetX + 10, cy + offsetY)
  ctx.lineTo(cx + offsetX + 30, cy + offsetY)
  ctx.moveTo(cx + offsetX, cy + offsetY - 30)
  ctx.lineTo(cx + offsetX, cy + offsetY - 10)
  ctx.moveTo(cx + offsetX, cy + offsetY + 10)
  ctx.lineTo(cx + offsetX, cy + offsetY + 30)
  ctx.stroke()

  // 추가 글리치 레이어 (다른 색상)
  ctx.strokeStyle = '#00FF66'
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(cx - offsetX - 30, cy - offsetY)
  ctx.lineTo(cx - offsetX - 10, cy - offsetY)
  ctx.moveTo(cx - offsetX + 10, cy - offsetY)
  ctx.lineTo(cx - offsetX + 30, cy - offsetY)
  ctx.stroke()

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-07] TRAUMA 시나리오 전용 효과
// 출처: GUIDE-MODULE-07-TRAUMA-SCENARIO.md
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ECGOptions {
  x: number
  y: number
  width: number
  height: number
  time: number
  color: string
  beatRate: number  // 심박수 (BPM)
}

/**
 * 심전도(ECG) PQRST 파형 그리기
 * 정확한 심전도 패턴으로 스크롤되는 파형
 */
export function drawECGWaveform(
  ctx: DrawContext,
  options: ECGOptions
): void {
  const { x, y, width, height, time, color, beatRate } = options
  const centerY = y + height / 2

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(x, centerY)

  // 심전도 패턴 (PQRST 파형)
  const beatWidth = width / 4 // 화면에 4박자
  const scrollOffset = (time * beatRate / 60 * beatWidth) % beatWidth

  for (let i = -1; i < 5; i++) {
    const beatX = x + i * beatWidth - scrollOffset

    // P파 (작은 올라감)
    const p1 = beatX + beatWidth * 0.1
    const p2 = beatX + beatWidth * 0.15
    const p3 = beatX + beatWidth * 0.2

    // QRS 콤플렉스 (큰 스파이크)
    const q = beatX + beatWidth * 0.35
    const r = beatX + beatWidth * 0.4  // 정점
    const s = beatX + beatWidth * 0.45

    // T파 (완만한 올라감)
    const t2 = beatX + beatWidth * 0.7
    const t3 = beatX + beatWidth * 0.8

    // 베이스라인
    ctx.lineTo(p1, centerY)

    // P파
    ctx.quadraticCurveTo(p2, centerY - height * 0.1, p3, centerY)

    // 베이스라인 → Q
    ctx.lineTo(q, centerY)
    ctx.lineTo(q, centerY + height * 0.1)

    // R 스파이크 (위로)
    ctx.lineTo(r, centerY - height * 0.4)

    // S (아래로)
    ctx.lineTo(s, centerY + height * 0.15)
    ctx.lineTo(s + beatWidth * 0.05, centerY)

    // T파
    ctx.quadraticCurveTo(t2, centerY - height * 0.15, t3, centerY)

    // 다음 박자까지 베이스라인
    ctx.lineTo(beatX + beatWidth, centerY)
  }

  ctx.stroke()
  ctx.restore()
}

interface StockChartOptions {
  x: number
  y: number
  width: number
  height: number
  time: number
  crashPoint: number  // 0 ~ 1 (급락 시점)
}

/**
 * 주식 차트 (캔들스틱) - 급락 표현
 * -99.7% 급락 포인트 시각화
 */
export function drawStockChart(
  ctx: DrawContext,
  options: StockChartOptions
): void {
  const { x, y, width, height, crashPoint } = options

  ctx.save()

  // 차트 데이터 생성 (급락 포함)
  const candleCount = 20
  const candleWidth = width / candleCount * 0.7
  const candleGap = width / candleCount * 0.3

  let price = 100
  const prices: number[] = []

  for (let i = 0; i < candleCount; i++) {
    const progress = i / candleCount

    if (progress > crashPoint) {
      // 급락
      const crashProgress = (progress - crashPoint) / (1 - crashPoint)
      price = 100 * Math.pow(0.003, crashProgress) // -99.7%
    } else {
      // 평범한 변동
      price = 100 + Math.sin(i * 0.5) * 10 + Math.cos(i * 0.3) * 5
    }

    prices.push(price)
  }

  const maxPrice = Math.max(...prices)
  const minPrice = Math.min(...prices)
  const priceRange = maxPrice - minPrice || 1

  // 캔들 그리기
  for (let i = 0; i < candleCount; i++) {
    const candleX = x + i * (candleWidth + candleGap)
    const currentPrice = prices[i]
    const prevPrice = prices[i - 1] ?? currentPrice

    const priceY = y + height - ((currentPrice - minPrice) / priceRange) * height
    const prevPriceY = y + height - ((prevPrice - minPrice) / priceRange) * height

    const isDown = currentPrice < prevPrice

    // 심지 (wick)
    ctx.strokeStyle = isDown ? '#FF3333' : '#33FF33'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(candleX + candleWidth / 2, Math.min(priceY, prevPriceY) - 5)
    ctx.lineTo(candleX + candleWidth / 2, Math.max(priceY, prevPriceY) + 5)
    ctx.stroke()

    // 몸통 (body)
    ctx.fillStyle = isDown ? '#FF3333' : '#33FF33'
    const bodyTop = Math.min(priceY, prevPriceY)
    const bodyHeight = Math.abs(priceY - prevPriceY) || 2
    ctx.fillRect(candleX, bodyTop, candleWidth, bodyHeight)
  }

  // -99.7% 표시
  ctx.fillStyle = '#FF3333'
  ctx.font = `bold 24px ${FONTS.mono}`
  ctx.textAlign = 'right'
  ctx.fillText('-99.7%', x + width - 10, y + height - 20)

  ctx.restore()
}

type MorphPhase = 'ecg' | 'morphing' | 'chart'

interface MorphOptions {
  phase: MorphPhase
  morphProgress: number  // 0 ~ 1 (모핑 진행도)
}

/**
 * ECG → Chart 모프 애니메이션
 * 심전도가 주식 차트로 변환되는 효과
 */
export function drawECGToChartMorph(
  ctx: DrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  options: MorphOptions
): void {
  const { phase, morphProgress } = options
  const colors = SCENARIO_COLORS.trauma

  ctx.save()

  // 패널 배경
  ctx.fillStyle = colors.bgPrimary
  ctx.fillRect(x, y, width, height)

  // 패널 테두리
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, width, height)

  // 타이틀
  ctx.fillStyle = colors.textPrimary
  ctx.font = `bold 12px ${FONTS.mono}`
  ctx.textAlign = 'left'
  ctx.fillText('[ VITAL MONITOR ]', x + 10, y + 20)

  const contentX = x + 10
  const contentY = y + 40
  const contentWidth = width - 20
  const contentHeight = height - 60

  if (phase === 'ecg') {
    // 심전도만 표시
    drawECGWaveform(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      color: colors.ecgColor,
      beatRate: 72,
    })
  } else if (phase === 'morphing') {
    // 모핑 중 (두 파형 블렌딩)
    ctx.globalAlpha = 1 - morphProgress
    drawECGWaveform(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      color: colors.ecgColor,
      beatRate: 72,
    })

    ctx.globalAlpha = morphProgress
    drawStockChart(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      crashPoint: 0.6,
    })

    ctx.globalAlpha = 1
  } else {
    // 차트만 표시
    drawStockChart(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      crashPoint: 0.6,
    })
  }

  ctx.restore()
}

/**
 * 사신 보스 패널 (HP: ∞ / ∞, IMMORTAL 태그)
 */
export function drawReaperBossPanel(
  ctx: DrawContext,
  x: number,
  y: number,
  time: number
): void {
  const width = 250
  const height = 120
  const colors = SCENARIO_COLORS.trauma

  // Win98 프레임 (회색)
  drawWin98Frame(
    ctx,
    {
      x, y, width, height,
      title: '◆ BOSS: REAPER ◆',
      theme: 'grey',
    },
    time
  )

  const contentY = y + 45

  ctx.save()

  // HP: ∞ / ∞
  ctx.fillStyle = colors.chartRed
  ctx.font = `bold 20px ${FONTS.mono}`
  ctx.textAlign = 'center'

  // 무한대 기호 회전 애니메이션
  ctx.save()
  ctx.translate(x + width / 2, contentY + 10)
  ctx.rotate(Math.sin(time * 0.5) * 0.1) // 살짝 흔들림
  ctx.fillText('HP: ∞ / ∞', 0, 0)
  ctx.restore()

  // [IMMORTAL] 태그
  ctx.fillStyle = colors.textPrimary
  ctx.font = `bold 12px ${FONTS.mono}`
  ctx.fillText('[IMMORTAL]', x + width / 2, contentY + 35)

  // 절망 메시지
  ctx.fillStyle = colors.textSecondary
  ctx.font = `italic 11px ${FONTS.korean}`
  ctx.fillText('"포기하세요. 희망은 없습니다."', x + width / 2, contentY + 55)

  // 무한대 기호 반복 (장식)
  ctx.fillStyle = 'rgba(68, 68, 68, 0.2)'
  ctx.font = '48px serif'
  ctx.fillText('∞', x + width / 2, contentY + 80)

  ctx.restore()
}

/**
 * TRAUMA 시나리오용 모프 페이즈 계산
 */
export function calculateMorphPhase(time: number): { phase: MorphPhase; morphProgress: number } {
  const cycleTime = time % 10
  let phase: MorphPhase
  let morphProgress = 0

  if (cycleTime < 3) {
    phase = 'ecg'
  } else if (cycleTime < 5) {
    phase = 'morphing'
    morphProgress = (cycleTime - 3) / 2
  } else {
    phase = 'chart'
  }

  return { phase, morphProgress }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [MODULE-08] EVOLVED 시나리오 전용 효과
// 출처: GUIDE-MODULE-08-EVOLVED-SCENARIO.md
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface CannonReticleOptions {
  cx: number
  cy: number
  outerRadius: number
  innerRadius: number
  segments: number          // 12각형
  rotation: number          // 회전 각도
  chargeLevel: number       // 0 ~ 1 (차징 레벨)
  color: string
  glowColor: string
}

/**
 * 12각형 캐논 조준선
 * 천천히 회전하며 차징 시 세그먼트가 밝아짐
 */
export function drawCannonReticle(
  ctx: DrawContext,
  options: CannonReticleOptions
): void {
  const { cx, cy, outerRadius, innerRadius, segments, rotation, chargeLevel, color, glowColor } = options

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rotation)

  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 12각형 (세그먼트)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = color
  ctx.lineWidth = 2

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    const nextAngle = ((i + 1) / segments) * Math.PI * 2

    // 세그먼트 진행률 (차징에 따라 밝아짐)
    const segmentProgress = i / segments
    const isActive = segmentProgress <= chargeLevel

    ctx.strokeStyle = isActive ? glowColor : color
    ctx.lineWidth = isActive ? 3 : 2

    const x1 = Math.cos(angle) * outerRadius
    const y1 = Math.sin(angle) * outerRadius
    const x2 = Math.cos(nextAngle) * outerRadius
    const y2 = Math.sin(nextAngle) * outerRadius

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // 꼭지점 마커
    if (isActive) {
      ctx.fillStyle = glowColor
      ctx.beginPath()
      ctx.arc(x1, y1, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 링 (차징 표시)
  // ═══════════════════════════════════════════════════════════════

  // 배경 링
  ctx.strokeStyle = `${color}44`
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2)
  ctx.stroke()

  // 차징 링
  if (chargeLevel > 0) {
    ctx.strokeStyle = glowColor
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(0, 0, innerRadius, -Math.PI / 2, -Math.PI / 2 + chargeLevel * Math.PI * 2)
    ctx.stroke()
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. 십자 조준선
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = glowColor
  ctx.lineWidth = 2

  // 수평선
  ctx.beginPath()
  ctx.moveTo(-innerRadius + 15, 0)
  ctx.lineTo(-10, 0)
  ctx.moveTo(10, 0)
  ctx.lineTo(innerRadius - 15, 0)
  ctx.stroke()

  // 수직선
  ctx.beginPath()
  ctx.moveTo(0, -innerRadius + 15)
  ctx.lineTo(0, -10)
  ctx.moveTo(0, 10)
  ctx.lineTo(0, innerRadius - 15)
  ctx.stroke()

  // ═══════════════════════════════════════════════════════════════
  // 4. 중앙 도트
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = glowColor
  ctx.beginPath()
  ctx.arc(0, 0, 3, 0, Math.PI * 2)
  ctx.fill()

  // ═══════════════════════════════════════════════════════════════
  // 5. 글로우 효과
  // ═══════════════════════════════════════════════════════════════
  if (chargeLevel > 0.5) {
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 20 * chargeLevel
    ctx.strokeStyle = glowColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(0, 0, outerRadius + 5, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
  }

  ctx.restore()
}

// 황금 파티클 인터페이스
interface GoldenParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  twinklePhase: number
}

// 황금 파티클 캐시
let goldenParticlesCache: GoldenParticle[] = []
let goldenParticlesWidth = 0
let goldenParticlesHeight = 0

function createGoldenParticle(width: number, height: number): GoldenParticle {
  return {
    x: Math.random() * width,
    y: height + Math.random() * 100,  // 하단에서 시작
    vx: (Math.random() - 0.5) * 0.5,
    vy: -0.5 - Math.random() * 1.5,   // 위로 상승
    size: 2 + Math.random() * 3,
    alpha: 0.5 + Math.random() * 0.5,
    twinklePhase: Math.random() * Math.PI * 2,
  }
}

/**
 * 황금 파티클 (반딧불 스타일 상승)
 * 하단에서 위로 상승하며 반짝임
 */
export function drawGoldenParticles(
  ctx: DrawContext,
  width: number,
  height: number,
  _time: number,
  count: number = 50
): void {
  // 초기화 또는 크기 변경 시 재생성
  if (goldenParticlesCache.length === 0 || goldenParticlesWidth !== width || goldenParticlesHeight !== height) {
    goldenParticlesWidth = width
    goldenParticlesHeight = height
    goldenParticlesCache = []
    for (let i = 0; i < count; i++) {
      goldenParticlesCache.push(createGoldenParticle(width, height))
    }
  }

  ctx.save()

  // 파티클 업데이트 및 그리기
  goldenParticlesCache.forEach(p => {
    p.x += p.vx
    p.y += p.vy
    p.twinklePhase += 0.08

    // 화면 벗어나면 재생성
    if (p.y < -20) {
      Object.assign(p, createGoldenParticle(width, height))
    }

    // 반짝임 효과
    const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase)
    const alpha = p.alpha * twinkle

    // 그라데이션 (중앙이 밝음)
    const gradient = ctx.createRadialGradient(
      p.x, p.y, 0,
      p.x, p.y, p.size * 2
    )
    gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.5})`)
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
    ctx.fill()

    // 중앙 코어 (더 밝게)
    ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2)
    ctx.fill()
  })

  ctx.restore()
}

/**
 * 8bit 픽셀 + HD 골드 융합 프레임
 * 외부는 8bit 픽셀, 내부는 HD 골드 그라데이션
 */
export function drawPixelatedGoldFrame(
  ctx: DrawContext,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number
): void {
  const pixelSize = 4

  ctx.save()

  // ═══════════════════════════════════════════════════════════════
  // 1. 8bit 픽셀 테두리
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = '#FFD700'

  // 상단
  for (let px = x; px < x + width; px += pixelSize) {
    ctx.fillRect(px, y, pixelSize, pixelSize)
    ctx.fillRect(px, y + pixelSize, pixelSize, pixelSize)
  }

  // 하단
  for (let px = x; px < x + width; px += pixelSize) {
    ctx.fillRect(px, y + height - pixelSize, pixelSize, pixelSize)
    ctx.fillRect(px, y + height - pixelSize * 2, pixelSize, pixelSize)
  }

  // 좌측
  for (let py = y; py < y + height; py += pixelSize) {
    ctx.fillRect(x, py, pixelSize, pixelSize)
    ctx.fillRect(x + pixelSize, py, pixelSize, pixelSize)
  }

  // 우측
  for (let py = y; py < y + height; py += pixelSize) {
    ctx.fillRect(x + width - pixelSize, py, pixelSize, pixelSize)
    ctx.fillRect(x + width - pixelSize * 2, py, pixelSize, pixelSize)
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. HD 골드 그라데이션 배경
  // ═══════════════════════════════════════════════════════════════
  const innerX = x + pixelSize * 2
  const innerY = y + pixelSize * 2
  const innerWidth = width - pixelSize * 4
  const innerHeight = height - pixelSize * 4

  const bgGradient = ctx.createLinearGradient(
    innerX, innerY,
    innerX, innerY + innerHeight
  )
  bgGradient.addColorStop(0, 'rgba(50, 40, 10, 0.9)')
  bgGradient.addColorStop(0.5, 'rgba(30, 25, 5, 0.95)')
  bgGradient.addColorStop(1, 'rgba(50, 40, 10, 0.9)')

  ctx.fillStyle = bgGradient
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight)

  // ═══════════════════════════════════════════════════════════════
  // 3. HD 골드 테두리 (부드러운 선)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#FFD700'
  ctx.lineWidth = 1
  ctx.strokeRect(innerX, innerY, innerWidth, innerHeight)

  // 코너 하이라이트
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 2
  const cornerSize = 15

  // 좌상단
  ctx.beginPath()
  ctx.moveTo(innerX, innerY + cornerSize)
  ctx.lineTo(innerX, innerY)
  ctx.lineTo(innerX + cornerSize, innerY)
  ctx.stroke()

  // 우상단
  ctx.beginPath()
  ctx.moveTo(innerX + innerWidth - cornerSize, innerY)
  ctx.lineTo(innerX + innerWidth, innerY)
  ctx.lineTo(innerX + innerWidth, innerY + cornerSize)
  ctx.stroke()

  // ═══════════════════════════════════════════════════════════════
  // 4. 애니메이션 반짝임 (shimmer)
  // ═══════════════════════════════════════════════════════════════
  const shimmerX = (time * 100) % (width + 100) - 50

  const shimmerGradient = ctx.createLinearGradient(
    x + shimmerX - 30, y,
    x + shimmerX + 30, y
  )
  shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
  shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)')
  shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = shimmerGradient
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Export all drawing functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { THEMES, SCENARIOS, CHARACTERS, FONTS, easing, SCENARIO_COLORS, WIN98_THEMES }
export type { ScenarioId, Win98Theme }

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TACTICAL OS 98 UI 시스템 Re-export
// 이미지 기반 99.99% 정밀 구현 UI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  // 색상 및 폰트
  TACTICAL_COLORS,
  TACTICAL_FONTS,
  // 상태 타입
  type TacticalOSState,
  // 개별 UI 컴포넌트
  drawTacticalGrid,
  drawTopBar,
  drawTacticalDialog,
  drawSystemNormalContent,
  drawBottomBar,
  drawStartMenu,
  drawMapViewWindow,
  drawDesktopHeader,
  drawDesktopTaskbar,
  drawSidebarText,
  // 메인 렌더 함수
  renderSystemDiagnostic,
  renderTacticalDesktop,
  // 기본 상태 생성
  createDefaultTacticalState,
} from './tacticalOS98'

