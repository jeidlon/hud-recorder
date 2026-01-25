/**
 * HexBackdrop - 육각형 그리드 배경
 * 
 * 레퍼런스 이미지 기준:
 * - 육각형(Hexagon) 그리드 패턴
 * - 중앙은 성기게, 좌우 가장자리 밀집
 * - 가장자리에 밝은 빛 번짐 (bloom)
 * - 마우스 기반 패럴랙스 효과
 */

import * as React from 'react'
import { useRef, useEffect, useCallback, useMemo } from 'react'
import {
  HUD_COLORS,
  HEX_BACKDROP,
  type HexaScenarioId,
  getScenarioTheme,
} from '../constants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HexBackdropProps {
  width: number
  height: number
  scenario?: HexaScenarioId
  mouseX?: number
  mouseY?: number
  time?: number
  
  // 옵션
  enableParallax?: boolean
  enableEdgeBloom?: boolean
  hexSize?: number
  opacity?: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 헥사곤 그리기 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const drawHexagon = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  lineColor: string,
  fillColor: string | null,
  lineWidth: number = 1
) => {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()

  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  ctx.strokeStyle = lineColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 밀도 계산 (중앙 sparse, 가장자리 dense)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const getDensityFactor = (x: number, width: number): number => {
  // 중앙에서 가장자리까지의 거리 (0~1)
  const centerDist = Math.abs(x - width / 2) / (width / 2)
  // 가장자리에 가까울수록 밀도 높음
  return 0.3 + centerDist * 0.7
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HexBackdrop: React.FC<HexBackdropProps> = ({
  width,
  height,
  scenario = 'idle',
  mouseX = width / 2,
  mouseY = height / 2,
  time = 0,
  enableParallax = true,
  enableEdgeBloom = true,
  hexSize = HEX_BACKDROP.hexSize,
  opacity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useMemo(() => getScenarioTheme(scenario), [scenario])

  // 헥사곤 그리드 생성
  const hexGrid = useMemo(() => {
    const grid: Array<{ x: number; y: number; visible: boolean }> = []
    
    // 수평/수직 간격 계산
    const hSpacing = hexSize * 1.5
    const vSpacing = hexSize * Math.sqrt(3)
    
    const cols = Math.ceil(width / hSpacing) + 2
    const rows = Math.ceil(height / vSpacing) + 2

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * hSpacing
        const y = row * vSpacing + (col % 2 === 0 ? 0 : vSpacing / 2)
        
        // 밀도 기반 표시 여부
        const density = getDensityFactor(x, width)
        const visible = Math.random() < density

        grid.push({ x, y, visible })
      }
    }

    return grid
  }, [width, height, hexSize])

  // 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    // 패럴랙스 오프셋 계산
    let offsetX = 0
    let offsetY = 0
    if (enableParallax && HEX_BACKDROP.parallax.enabled) {
      const normalizedX = (mouseX - width / 2) / width
      const normalizedY = (mouseY - height / 2) / height
      offsetX = normalizedX * width * (HEX_BACKDROP.parallax.strength / 100)
      offsetY = normalizedY * height * (HEX_BACKDROP.parallax.strength / 100)
    }

    // 테마에 따른 색상
    const lineColor = theme.primaryGlow || HUD_COLORS.hexLine
    const fillColor = HUD_COLORS.hexFill

    // 헥사곤 그리기
    ctx.globalAlpha = opacity
    hexGrid.forEach(({ x, y, visible }) => {
      if (!visible) return

      const px = x + offsetX
      const py = y + offsetY

      // 화면 밖은 스킵
      if (px < -hexSize || px > width + hexSize) return
      if (py < -hexSize || py > height + hexSize) return

      // 약간의 펄스 애니메이션
      const pulseSize = hexSize * (1 + Math.sin(time * 0.5 + x * 0.01 + y * 0.01) * 0.02)

      drawHexagon(ctx, px, py, pulseSize, lineColor, fillColor, HEX_BACKDROP.lineWidth)
    })

    // 가장자리 블룸 효과
    if (enableEdgeBloom && HEX_BACKDROP.edgeBloom.enabled) {
      const bloomWidth = HEX_BACKDROP.edgeBloom.width

      // 왼쪽 블룸
      const leftGradient = ctx.createLinearGradient(0, 0, bloomWidth, 0)
      leftGradient.addColorStop(0, 'rgba(255,255,255,0.12)')
      leftGradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = leftGradient
      ctx.fillRect(0, 0, bloomWidth, height)

      // 오른쪽 블룸
      const rightGradient = ctx.createLinearGradient(width - bloomWidth, 0, width, 0)
      rightGradient.addColorStop(0, 'rgba(255,255,255,0)')
      rightGradient.addColorStop(1, 'rgba(255,255,255,0.12)')
      ctx.fillStyle = rightGradient
      ctx.fillRect(width - bloomWidth, 0, bloomWidth, height)
    }

    ctx.globalAlpha = 1
  }, [width, height, hexGrid, hexSize, mouseX, mouseY, time, theme, opacity, enableParallax, enableEdgeBloom])

  // 애니메이션 프레임
  useEffect(() => {
    render()
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

export default HexBackdrop
