/**
 * ARWES Core - arwes/arwes 라이브러리에서 직접 가져온 코드
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 출처: https://github.com/arwes/arwes
 * 라이선스: MIT
 * 
 * 다음 파일들에서 직접 가져옴:
 * - packages/animated/src/easing/easing.ts
 * - packages/frames/src/createFrameOctagonSettings
 * - packages/frames/src/createFrameKranoxSettings
 * - packages/bgs/src/createBackgroundGridLines
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  WIN98_THEMES,
  FONTS,
  type Win98Theme,
} from './constants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES Easing Functions - packages/animated/src/easing/easing.ts
// 직접 복사
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const pow = Math.pow
const sqrt = Math.sqrt
const sin = Math.sin
const cos = Math.cos
const PI = Math.PI
const c1 = 1.70158
const c2 = c1 * 1.525
const c3 = c1 + 1
const c4 = (2 * PI) / 3
const c5 = (2 * PI) / 4.5

const bounceOut = (x: number): number => {
  const n1 = 7.5625
  const d1 = 2.75

  if (x < 1 / d1) {
    return n1 * x * x
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375
  }
  return n1 * (x -= 2.625 / d1) * x + 0.984375
}

export type EasingFn = (x: number) => number

export type EasingName =
  | 'linear'
  | 'inQuad' | 'outQuad' | 'inOutQuad'
  | 'inCubic' | 'outCubic' | 'inOutCubic'
  | 'inQuart' | 'outQuart' | 'inOutQuart'
  | 'inQuint' | 'outQuint' | 'inOutQuint'
  | 'inSine' | 'outSine' | 'inOutSine'
  | 'inExpo' | 'outExpo' | 'inOutExpo'
  | 'inCirc' | 'outCirc' | 'inOutCirc'
  | 'inBack' | 'outBack' | 'inOutBack'
  | 'inElastic' | 'outElastic' | 'inOutElastic'
  | 'inBounce' | 'outBounce' | 'inOutBounce'

// ARWES easing - 직접 복사
export const arwesEasing: Record<EasingName, EasingFn> = {
  linear: (x: number): number => x,
  inQuad: (x: number): number => x * x,
  outQuad: (x: number): number => 1 - (1 - x) * (1 - x),
  inOutQuad: (x: number): number => x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2,
  inCubic: (x: number): number => x * x * x,
  outCubic: (x: number): number => 1 - pow(1 - x, 3),
  inOutCubic: (x: number): number => x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2,
  inQuart: (x: number): number => x * x * x * x,
  outQuart: (x: number): number => 1 - pow(1 - x, 4),
  inOutQuart: (x: number): number => x < 0.5 ? 8 * x * x * x * x : 1 - pow(-2 * x + 2, 4) / 2,
  inQuint: (x: number): number => x * x * x * x * x,
  outQuint: (x: number): number => 1 - pow(1 - x, 5),
  inOutQuint: (x: number): number => x < 0.5 ? 16 * x * x * x * x * x : 1 - pow(-2 * x + 2, 5) / 2,
  inSine: (x: number): number => 1 - cos((x * PI) / 2),
  outSine: (x: number): number => sin((x * PI) / 2),
  inOutSine: (x: number): number => -(cos(PI * x) - 1) / 2,
  inExpo: (x: number): number => x === 0 ? 0 : pow(2, 10 * x - 10),
  outExpo: (x: number): number => x === 1 ? 1 : 1 - pow(2, -10 * x),
  inOutExpo: (x: number): number =>
    x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? pow(2, 20 * x - 10) / 2 : (2 - pow(2, -20 * x + 10)) / 2,
  inCirc: (x: number): number => 1 - sqrt(1 - pow(x, 2)),
  outCirc: (x: number): number => sqrt(1 - pow(x - 1, 2)),
  inOutCirc: (x: number): number =>
    x < 0.5 ? (1 - sqrt(1 - pow(2 * x, 2))) / 2 : (sqrt(1 - pow(-2 * x + 2, 2)) + 1) / 2,
  inBack: (x: number): number => c3 * x * x * x - c1 * x * x,
  outBack: (x: number): number => 1 + c3 * pow(x - 1, 3) + c1 * pow(x - 1, 2),
  inOutBack: (x: number): number =>
    x < 0.5
      ? (pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,
  inElastic: (x: number): number =>
    x === 0 ? 0 : x === 1 ? 1 : -pow(2, 10 * x - 10) * sin((x * 10 - 10.75) * c4),
  outElastic: (x: number): number =>
    x === 0 ? 0 : x === 1 ? 1 : pow(2, -10 * x) * sin((x * 10 - 0.75) * c4) + 1,
  inOutElastic: (x: number): number =>
    x === 0
      ? 0
      : x === 1
        ? 1
        : x < 0.5
          ? -(pow(2, 20 * x - 10) * sin((20 * x - 11.125) * c5)) / 2
          : (pow(2, -20 * x + 10) * sin((20 * x - 11.125) * c5)) / 2 + 1,
  inBounce: (x: number): number => 1 - bounceOut(1 - x),
  outBounce: bounceOut,
  inOutBounce: (x: number): number =>
    x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES Frame Types - packages/frames/src/types.ts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FrameSettingsPathCommand = string | number | [number | string, number | string]
export type FrameSettingsPathDefinition = Array<FrameSettingsPathCommand | FrameSettingsPathCommand[]>

export interface FrameSettingsElement {
  type?: 'path' | 'g'
  name?: string
  style?: Record<string, string | undefined>
  animated?: false | string[]
  path?: FrameSettingsPathDefinition
  elements?: FrameSettingsElement[]
}

export interface FrameSettings {
  elements: FrameSettingsElement[]
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES createFrameOctagonSettings - packages/frames/src/createFrameOctagonSettings
// 직접 복사 및 Canvas용 변환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface OctagonFrameProps {
  x: number
  y: number
  w: number
  h: number
  squareSize?: number
  strokeWidth?: number
  padding?: number
  leftTop?: boolean
  rightTop?: boolean
  rightBottom?: boolean
  leftBottom?: boolean
}

/**
 * ARWES Octagon Frame을 Canvas에 그리는 함수
 * 원본: packages/frames/src/createFrameOctagonSettings
 */
export function drawArwesOctagonFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  props: OctagonFrameProps,
  color: string,
  bgColor: string,
  time: number,
  progress: number = 1
): void {
  const {
    x, y, w, h,
    squareSize = 16,
    strokeWidth = 2,
    padding = 0,
    leftTop = true,
    rightTop = true,
    rightBottom = true,
    leftBottom = true
  } = props

  const p = padding
  const ss = squareSize
  const so = strokeWidth / 2

  ctx.save()

  // Background path - ARWES Octagon 패턴 직접 구현
  ctx.beginPath()

  // Start from left side
  if (leftTop) {
    ctx.moveTo(x + p + so, y + p + so + ss)
    ctx.lineTo(x + p + so + ss, y + p + so)
  } else {
    ctx.moveTo(x + p + so, y + p + so)
  }

  // Top side to right
  if (rightTop) {
    ctx.lineTo(x + w - p - so - ss, y + p + so)
    ctx.lineTo(x + w - p - so, y + p + so + ss)
  } else {
    ctx.lineTo(x + w - p - so, y + p + so)
  }

  // Right side to bottom
  if (rightBottom) {
    ctx.lineTo(x + w - p - so, y + h - p - so - ss)
    ctx.lineTo(x + w - p - so - ss, y + h - p - so)
  } else {
    ctx.lineTo(x + w - p - so, y + h - p - so)
  }

  // Bottom side to left
  if (leftBottom) {
    ctx.lineTo(x + p + so + ss, y + h - p - so)
    ctx.lineTo(x + p + so, y + h - p - so - ss)
  } else {
    ctx.lineTo(x + p + so, y + h - p - so)
  }

  ctx.closePath()

  // Fill background
  ctx.fillStyle = bgColor
  ctx.fill()

  // Draw animated stroke lines - ARWES animateDraw 패턴
  if (progress > 0) {
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 8 + Math.sin(time * 3) * 4

    // Calculate stroke dash for animation
    const totalLength = (w + h) * 2
    const dashLength = totalLength * arwesEasing.outExpo(progress)

    ctx.setLineDash([dashLength, totalLength])
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES createFrameKranoxSettings - packages/frames/src/createFrameKranoxSettings
// 직접 복사 및 Canvas용 변환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface KranoxFrameProps {
  x: number
  y: number
  w: number
  h: number
  squareSize?: number
  smallLineLength?: number
  largeLineLength?: number
  strokeWidth?: number
  padding?: number
}

/**
 * ARWES Kranox Frame (복잡한 SF 프레임) - Canvas용
 * 원본: packages/frames/src/createFrameKranoxSettings
 */
export function drawArwesKranoxFrame(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  props: KranoxFrameProps,
  color: string,
  bgColor: string,
  time: number,
  progress: number = 1
): void {
  const {
    x, y, w, h,
    squareSize = 16,
    smallLineLength = 16,
    largeLineLength = 64,
    strokeWidth = 2,
    padding = 0
  } = props

  const p = padding
  const ss = squareSize
  const sll = smallLineLength
  const lll = largeLineLength
  const so = strokeWidth / 2

  ctx.save()

  // Background - Kranox 복잡한 다각형
  ctx.beginPath()

  // Left-bottom to left-top
  ctx.moveTo(x + p + ss * 2, y + h - p - strokeWidth * 2)
  ctx.lineTo(x + p + ss, y + h - p - strokeWidth * 2 - ss)
  ctx.lineTo(x + p + ss, y + p + strokeWidth * 2 + lll + ss * 3 + sll)
  ctx.lineTo(x + p, y + p + strokeWidth * 2 + lll + ss * 2 + sll)
  ctx.lineTo(x + p, y + p + strokeWidth * 2 + ss * 2 + sll)
  ctx.lineTo(x + p + ss, y + p + strokeWidth * 2 + sll + ss)
  ctx.lineTo(x + p + ss, y + p + strokeWidth + ss)
  ctx.lineTo(x + p + ss * 2 - strokeWidth, y + p + strokeWidth * 2)

  // Left-top to right-top
  ctx.lineTo(x + w - p - ss * 2, y + p + strokeWidth * 2)

  // Right-top to right-bottom
  ctx.lineTo(x + w - p - ss, y + p + strokeWidth * 2 + ss)
  ctx.lineTo(x + w - p - ss, y + h - p - strokeWidth * 2 - ss * 3 - sll - lll)
  ctx.lineTo(x + w - p, y + h - p - strokeWidth * 2 - ss * 2 - sll - lll)
  ctx.lineTo(x + w - p, y + h - p - strokeWidth * 2 - ss * 2 - sll)
  ctx.lineTo(x + w - p - ss, y + h - p - strokeWidth * 2 - ss - sll)
  ctx.lineTo(x + w - p - ss, y + h - p - strokeWidth - ss)
  ctx.lineTo(x + w - p - ss * 2 + strokeWidth, y + h - p - strokeWidth * 2)

  ctx.closePath()

  ctx.fillStyle = bgColor
  ctx.fill()

  // Draw corner lines with animation
  if (progress > 0) {
    ctx.strokeStyle = color
    ctx.lineWidth = strokeWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = 10 + Math.sin(time * 2) * 5

    const animProgress = arwesEasing.outExpo(progress)

    // Left-top corner line
    ctx.beginPath()
    ctx.moveTo(x + p + so - strokeWidth * 2 + ss, y + p + so + ss + sll)
    ctx.lineTo(x + p + so - strokeWidth * 2 + ss, y + p + so + ss)
    ctx.lineTo(x + p + so - strokeWidth * 2 + ss * 2, y + p + so)
    ctx.lineTo(x + p + so - strokeWidth * 2 + ss * 2 + lll * animProgress, y + p + so)
    ctx.stroke()

    // Right-bottom corner line
    ctx.beginPath()
    ctx.moveTo(x + w - p - so - ss + strokeWidth * 2, y + h - p - so - ss - sll)
    ctx.lineTo(x + w - p - so - ss + strokeWidth * 2, y + h - p - so - ss)
    ctx.lineTo(x + w - p - so - ss * 2 + strokeWidth * 2, y + h - p - so)
    ctx.lineTo(x + w - p - so - ss * 2 - lll * animProgress + strokeWidth * 2, y + h - p - so)
    ctx.stroke()
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES createBackgroundGridLines - packages/bgs/src/createBackgroundGridLines
// 직접 복사 및 Canvas용 변환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ArwesGridLinesSettings {
  lineWidth?: number
  lineColor?: string
  horizontalLineDash?: number[]
  verticalLineDash?: number[]
  distance?: number
}

const defaultGridSettings: Required<ArwesGridLinesSettings> = {
  lineWidth: 1,
  lineColor: '#777',
  horizontalLineDash: [4],
  verticalLineDash: [],
  distance: 30
}

/**
 * ARWES Grid Lines Background - Canvas용
 * 원본: packages/bgs/src/createBackgroundGridLines
 */
export function drawArwesGridLines(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number, h: number,
  settings: ArwesGridLinesSettings = {},
  alpha: number = 1
): void {
  const { lineWidth, lineColor, horizontalLineDash, verticalLineDash, distance } = {
    ...defaultGridSettings,
    ...settings
  }

  const xLength = 1 + Math.floor(w / distance)
  const yLength = 1 + Math.floor(h / distance)
  const xMargin = w % distance
  const yMargin = h % distance

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.lineWidth = lineWidth
  ctx.strokeStyle = lineColor

  // Horizontal lines - ARWES 패턴
  ctx.setLineDash(horizontalLineDash)
  for (let yIndex = 0; yIndex < yLength; yIndex++) {
    const y = yMargin / 2 + yIndex * distance
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.closePath()
  }

  // Vertical lines - ARWES 패턴
  ctx.setLineDash(verticalLineDash)
  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    const x = xMargin / 2 + xIndex * distance
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
    ctx.closePath()
  }

  ctx.setLineDash([])
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Transition Animation System
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TransitionState {
  progress: number  // 0-1
  phase: 'entering' | 'entered' | 'exiting' | 'exited'
  startTime: number
  duration: number
}

/**
 * 시나리오 전환 트랜지션 애니메이션 계산
 */
export function calculateTransition(
  state: TransitionState,
  currentTime: number
): { progress: number; complete: boolean } {
  const elapsed = (currentTime - state.startTime) / 1000
  const rawProgress = Math.min(1, elapsed / state.duration)

  let progress: number
  switch (state.phase) {
    case 'entering':
      progress = arwesEasing.outExpo(rawProgress)
      break
    case 'exiting':
      progress = 1 - arwesEasing.inExpo(rawProgress)
      break
    default:
      progress = state.phase === 'entered' ? 1 : 0
  }

  return {
    progress,
    complete: rawProgress >= 1
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OS Window Controls (최소화/최대화/닫기)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface WindowControlsProps {
  x: number
  y: number
  theme: 'cyan' | 'red' | 'purple' | 'grey' | 'gold'
}

const controlColors: Record<string, { minimize: string; maximize: string; close: string }> = {
  cyan: { minimize: '#00B8D4', maximize: '#00E5FF', close: '#FF5252' },
  red: { minimize: '#FF6D00', maximize: '#FFAB00', close: '#FF1744' },
  purple: { minimize: '#AA00FF', maximize: '#E040FB', close: '#FF4081' },
  grey: { minimize: '#757575', maximize: '#9E9E9E', close: '#616161' },
  gold: { minimize: '#FFD600', maximize: '#FFFF00', close: '#FF6E40' }
}

/**
 * OS 스타일 창 컨트롤 버튼 (최소화/최대화/닫기)
 */
export function drawWindowControls(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  props: WindowControlsProps,
  _time: number,
  hoverIndex: number = -1 // -1: none, 0: minimize, 1: maximize, 2: close
): void {
  const { x, y, theme } = props
  const colors = controlColors[theme]
  const size = 10
  const gap = 6

  ctx.save()

  // 버튼 그리기 함수
  const drawButton = (bx: number, color: string, icon: 'min' | 'max' | 'close', index: number) => {
    const isHovered = hoverIndex === index

    // 버튼 배경
    ctx.fillStyle = isHovered ? color : `${color}88`
    ctx.beginPath()
    ctx.arc(bx, y, size / 2, 0, Math.PI * 2)
    ctx.fill()

    // 글로우 효과
    if (isHovered) {
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // 아이콘
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1.5
    const iconSize = 4

    if (icon === 'min') {
      ctx.beginPath()
      ctx.moveTo(bx - iconSize, y)
      ctx.lineTo(bx + iconSize, y)
      ctx.stroke()
    } else if (icon === 'max') {
      ctx.strokeRect(bx - iconSize, y - iconSize, iconSize * 2, iconSize * 2)
    } else {
      ctx.beginPath()
      ctx.moveTo(bx - iconSize, y - iconSize)
      ctx.lineTo(bx + iconSize, y + iconSize)
      ctx.moveTo(bx + iconSize, y - iconSize)
      ctx.lineTo(bx - iconSize, y + iconSize)
      ctx.stroke()
    }
  }

  drawButton(x, colors.minimize, 'min', 0)
  drawButton(x + size + gap, colors.maximize, 'max', 1)
  drawButton(x + (size + gap) * 2, colors.close, 'close', 2)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hit Marker Effect (공격 시 피격 효과)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HitMarker {
  x: number
  y: number
  startTime: number
  type: 'normal' | 'critical' | 'headshot'
  damage?: number
}

/**
 * Hit Marker 효과 그리기
 */
export function drawHitMarker(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  marker: HitMarker,
  currentTime: number
): boolean {
  const elapsed = (currentTime - marker.startTime) / 1000
  const duration = marker.type === 'critical' ? 0.5 : 0.3

  if (elapsed > duration) return false

  const progress = elapsed / duration
  const fade = 1 - arwesEasing.outQuad(progress)
  const scale = 1 + arwesEasing.outElastic(progress) * 0.3
  const size = (marker.type === 'critical' ? 20 : 15) * scale

  ctx.save()
  ctx.translate(marker.x, marker.y)
  ctx.globalAlpha = fade

  // 색상 설정
  const color = marker.type === 'critical' ? '#FF0000' :
    marker.type === 'headshot' ? '#FFFF00' : '#FFFFFF'

  ctx.strokeStyle = color
  ctx.lineWidth = marker.type === 'critical' ? 3 : 2
  ctx.shadowColor = color
  ctx.shadowBlur = 10

  // X 모양 히트 마커
  const halfSize = size / 2
  const innerGap = 4

  ctx.beginPath()
  // 좌상 -> 우하
  ctx.moveTo(-halfSize, -halfSize)
  ctx.lineTo(-innerGap, -innerGap)
  ctx.moveTo(innerGap, innerGap)
  ctx.lineTo(halfSize, halfSize)
  // 우상 -> 좌하
  ctx.moveTo(halfSize, -halfSize)
  ctx.lineTo(innerGap, -innerGap)
  ctx.moveTo(-innerGap, innerGap)
  ctx.lineTo(-halfSize, halfSize)
  ctx.stroke()

  // 크리티컬/헤드샷 시 추가 링
  if (marker.type !== 'normal') {
    ctx.beginPath()
    ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2)
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // 데미지 숫자 표시
  if (marker.damage && marker.damage > 0) {
    const floatY = -20 - progress * 30
    ctx.font = `bold ${marker.type === 'critical' ? 16 : 12}px "JetBrains Mono", monospace`
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(`-${marker.damage}`, 0, floatY)
  }

  ctx.restore()
  return true
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Win98 스타일 창 프레임 (문서 기준: Windows 98 + Holographic Yellow)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Win98WindowProps {
  x: number
  y: number
  w: number
  h: number
  title: string
  theme: Win98Theme
  showControls?: boolean
}

/**
 * Win98 스타일 창 프레임 그리기
 * 문서: "Win98 스타일 창 프레임 + 미래 홀로그램 융합"
 * GUIDE-MODULE-02-WIN98-FRAME.md 기준으로 업데이트
 */
export function drawWin98Window(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  props: Win98WindowProps,
  time: number
): void {
  const { x, y, w, h, title, theme, showControls = true } = props
  const colors = WIN98_THEMES[theme]
  const titleBarHeight = 24
  const borderWidth = 2

  ctx.save()

  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 테두리 (어두운색) - Win98 스타일 이중 테두리
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.outerBorder
  ctx.lineWidth = borderWidth
  ctx.strokeRect(x, y, w, h)

  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 테두리 (밝은색) - 1px 안쪽
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.innerBorder
  ctx.lineWidth = 1
  ctx.strokeRect(x + borderWidth, y + borderWidth, w - borderWidth * 2, h - borderWidth * 2)

  // ═══════════════════════════════════════════════════════════════
  // 3. 타이틀바 그라데이션
  // ═══════════════════════════════════════════════════════════════
  const titleBarX = x + borderWidth + 1
  const titleBarY = y + borderWidth + 1
  const titleBarWidth = w - borderWidth * 2 - 2

  const gradient = ctx.createLinearGradient(titleBarX, titleBarY, titleBarX + titleBarWidth, titleBarY)
  gradient.addColorStop(0, colors.titleGradientStart)
  gradient.addColorStop(1, colors.titleGradientEnd)
  ctx.fillStyle = gradient
  ctx.fillRect(titleBarX, titleBarY, titleBarWidth, titleBarHeight)

  // ═══════════════════════════════════════════════════════════════
  // 4. 타이틀 텍스트
  // ═══════════════════════════════════════════════════════════════
  ctx.font = `bold 11px ${FONTS.mono}`
  ctx.fillStyle = colors.titleText
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(`[ ${title.toUpperCase()} ]`, titleBarX + 8, titleBarY + titleBarHeight / 2)

  // ═══════════════════════════════════════════════════════════════
  // 5. 컨트롤 버튼 (─ □ ✕) - Win98 스타일 입체 버튼
  // ═══════════════════════════════════════════════════════════════
  if (showControls) {
    const controlButtonSize = 16
    const buttonY = titleBarY + (titleBarHeight - controlButtonSize) / 2
    const buttonSpacing = 2
    const buttons = ['─', '□', '✕']
    const buttonColors = [colors.controlBg, colors.controlBg, '#CC3333']

    for (let i = 0; i < 3; i++) {
      const buttonX = titleBarX + titleBarWidth - (3 - i) * (controlButtonSize + buttonSpacing) - 4

      // 버튼 배경
      ctx.fillStyle = buttonColors[i]
      ctx.fillRect(buttonX, buttonY, controlButtonSize, controlButtonSize)

      // 입체감 - 밝은 면 (좌상단)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(buttonX, buttonY + controlButtonSize)
      ctx.lineTo(buttonX, buttonY)
      ctx.lineTo(buttonX + controlButtonSize, buttonY)
      ctx.stroke()

      // 입체감 - 어두운 면 (우하단)
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
      ctx.fillText(buttons[i], buttonX + controlButtonSize / 2, buttonY + controlButtonSize / 2)
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. 컨텐츠 영역 배경
  // ═══════════════════════════════════════════════════════════════
  const contentX = titleBarX
  const contentY = titleBarY + titleBarHeight + 2
  const contentWidth = titleBarWidth
  const contentHeight = h - borderWidth * 2 - titleBarHeight - 6

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
  ctx.moveTo(x + w - borderWidth - cornerLength, y + borderWidth)
  ctx.lineTo(x + w - borderWidth, y + borderWidth)
  ctx.lineTo(x + w - borderWidth, y + borderWidth + cornerLength)
  ctx.stroke()

  // 좌하단
  ctx.beginPath()
  ctx.moveTo(x + borderWidth, y + h - borderWidth - cornerLength)
  ctx.lineTo(x + borderWidth, y + h - borderWidth)
  ctx.lineTo(x + borderWidth + cornerLength, y + h - borderWidth)
  ctx.stroke()

  // 우하단
  ctx.beginPath()
  ctx.moveTo(x + w - borderWidth - cornerLength, y + h - borderWidth)
  ctx.lineTo(x + w - borderWidth, y + h - borderWidth)
  ctx.lineTo(x + w - borderWidth, y + h - borderWidth - cornerLength)
  ctx.stroke()

  // ═══════════════════════════════════════════════════════════════
  // 8. 홀로그램 글로우 효과
  // ═══════════════════════════════════════════════════════════════
  ctx.shadowColor = colors.titleGradientStart
  ctx.shadowBlur = 8 + Math.sin(time * 3) * 4
  ctx.strokeStyle = colors.titleGradientStart + '44'
  ctx.lineWidth = 1
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2)
  ctx.shadowBlur = 0

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DAY 표시 (게임 진행일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawDayIndicator(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number, y: number,
  day: number,
  color: string,
  time: number
): void {
  ctx.save()

  ctx.font = 'bold 14px "JetBrains Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'right'
  ctx.shadowColor = color
  ctx.shadowBlur = 8 + Math.sin(time * 2) * 3
  ctx.fillText(`DAY ${day}`, x, y)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 팀원 상태 패널
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TeamMember {
  realName: string
  personaName: string
  type: string
  hp: number
  maxHp: number
}

export function drawTeamPanel(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number, y: number, w: number,
  team: TeamMember[],
  color: string,
  bgColor: string,
  _time: number
): void {
  const rowHeight = 22
  const h = 30 + team.length * rowHeight

  ctx.save()

  // 배경
  ctx.fillStyle = bgColor
  ctx.fillRect(x, y, w, h)

  // 프레임
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.shadowColor = color
  ctx.shadowBlur = 6
  ctx.strokeRect(x, y, w, h)

  // 타이틀
  ctx.font = 'bold 10px "JetBrains Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.shadowBlur = 0
  ctx.fillText('[ TEAM ]', x + 8, y + 14)

  // 팀원 목록
  ctx.font = '11px "JetBrains Mono", monospace'
  team.forEach((member, i) => {
    const my = y + 26 + i * rowHeight

    // 이름
    ctx.fillStyle = color
    ctx.fillText(`[${member.realName}/${member.personaName}]`, x + 8, my + 6)

    // HP 바
    const barX = x + 140
    const barW = w - 150
    const barH = 10
    const ratio = member.hp / member.maxHp

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(barX, my - 2, barW, barH)

    const hpColor = ratio < 0.3 ? '#FF4444' : color
    ctx.fillStyle = hpColor
    ctx.fillRect(barX + 1, my - 1, (barW - 2) * ratio, barH - 2)

    ctx.fillText(`${member.hp}%`, barX + barW + 8, my + 6)
  })

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 퀘스트 표시
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface Quest {
  name: string
  progress: number
  total: number
}

export function drawQuestPanel(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number, y: number, _w: number,
  quest: Quest,
  color: string,
  _time: number
): void {
  ctx.save()

  ctx.font = '10px "JetBrains Mono", monospace'
  ctx.fillStyle = color
  ctx.textAlign = 'left'
  ctx.fillText('QUEST:', x, y)

  ctx.font = '11px "Noto Sans KR", sans-serif'
  ctx.fillText(`${quest.name} (${quest.progress}/${quest.total})`, x, y + 16)

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login/Connection Popup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface LoginPopupState {
  visible: boolean
  phase: 'connecting' | 'syncing' | 'complete'
  progress: number
  personaName: string
}

/**
 * 로그인/접속 팝업 UI
 * 시나리오: 몽단 섭취 → 드림마스크 착용 → 페르소나 연결
 */
export function drawLoginPopup(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  w: number, h: number,
  state: LoginPopupState,
  time: number
): void {
  if (!state.visible) return

  const popupW = 400
  const popupH = 250
  const popupX = (w - popupW) / 2
  const popupY = (h - popupH) / 2

  ctx.save()

  // 배경 오버레이
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.fillRect(0, 0, w, h)

  // 팝업 프레임 (ARWES Octagon)
  drawArwesOctagonFrame(
    ctx,
    { x: popupX, y: popupY, w: popupW, h: popupH, squareSize: 20 },
    '#00E5FF',
    'rgba(0, 20, 40, 0.95)',
    time,
    arwesEasing.outExpo(Math.min(1, state.progress * 3))
  )

  // 타이틀
  ctx.font = 'bold 18px "Orbitron", sans-serif'
  ctx.fillStyle = '#00E5FF'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#00E5FF'
  ctx.shadowBlur = 10
  ctx.fillText('DREAM PERSONA :: NEURAL LINK', w / 2, popupY + 45)

  // 상태 표시
  ctx.font = '14px "JetBrains Mono", monospace'
  ctx.fillStyle = '#88DDFF'
  ctx.shadowBlur = 0

  let statusText = ''
  let statusDetail = ''

  switch (state.phase) {
    case 'connecting':
      statusText = '몽단 효과 활성화...'
      statusDetail = 'DREAM MASK SYNCHRONIZING'
      break
    case 'syncing':
      statusText = `"${state.personaName}" 호출 중...`
      statusDetail = 'NEURAL PATHWAY ESTABLISHING'
      break
    case 'complete':
      statusText = '연결 완료!'
      statusDetail = 'PERSONA LINKED SUCCESSFULLY'
      break
  }

  ctx.fillText(statusDetail, w / 2, popupY + 85)

  ctx.font = '16px "Noto Sans KR", sans-serif'
  ctx.fillText(statusText, w / 2, popupY + 115)

  // 프로그레스 바
  const barW = 300
  const barH = 8
  const barX = (w - barW) / 2
  const barY = popupY + 150

  ctx.fillStyle = 'rgba(0, 229, 255, 0.2)'
  ctx.fillRect(barX, barY, barW, barH)

  ctx.fillStyle = '#00E5FF'
  ctx.shadowColor = '#00E5FF'
  ctx.shadowBlur = 10
  ctx.fillRect(barX, barY, barW * state.progress, barH)

  // 프로그레스 퍼센트
  ctx.font = 'bold 20px "JetBrains Mono", monospace'
  ctx.fillText(`${Math.floor(state.progress * 100)}%`, w / 2, popupY + 195)

  // 힌트 텍스트
  ctx.font = '11px "JetBrains Mono", monospace'
  ctx.fillStyle = 'rgba(136, 221, 255, 0.6)'
  ctx.shadowBlur = 0
  ctx.fillText('Press [SPACE] to proceed | [ESC] to cancel', w / 2, popupY + 230)

  ctx.restore()
}
