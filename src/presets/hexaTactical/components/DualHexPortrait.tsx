/**
 * DualHexPortrait - 듀얼 헥사곤 포트레이트
 * 
 * 레퍼런스 이미지 기준:
 * - SOYOUNG / RUBIAN 듀얼 포트레이트
 * - 육각형 프레임 (128px, stroke 2px)
 * - 골드 글로우 (18px)
 * - 이름 라벨 (26-32px, 글로우)
 * - 연결 라인 (펄스 애니메이션)
 */

import * as React from 'react'
import { useRef, useEffect, useCallback, useMemo } from 'react'
import {
  HUD_COLORS,
  DUAL_HEX_PORTRAIT,
  FONTS,
  type HexaScenarioId,
  getScenarioTheme,
} from '../constants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface PortraitData {
  name: string
  englishName: string
  imageUrl?: string
  status?: 'normal' | 'syncing' | 'connected' | 'infected' | 'offline'
}

export interface DualHexPortraitProps {
  leftPortrait: PortraitData
  rightPortrait: PortraitData
  scenario?: HexaScenarioId
  connectionStatus?: 'disconnected' | 'connecting' | 'syncing' | 'complete'
  syncProgress?: number  // 0~100
  time?: number
  width?: number
  height?: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 헥사곤 그리기 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const drawHexagonFrame = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  strokeColor: string,
  glowColor: string,
  fillColor?: string
) => {
  ctx.save()

  // 글로우 효과
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 18
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // 육각형 그리기
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

  // 채우기
  if (fillColor) {
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  // 테두리
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = DUAL_HEX_PORTRAIT.hexStroke
  ctx.stroke()

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 연결 라인 그리기
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const drawConnectorLine = (
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  progress: number,
  time: number
) => {
  ctx.save()

  // 펄스 효과
  const pulse = 0.5 + Math.sin(time * 4) * 0.5

  // 그라디언트
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
  gradient.addColorStop(0, 'transparent')
  gradient.addColorStop(0.2, color)
  gradient.addColorStop(0.5, color)
  gradient.addColorStop(0.8, color)
  gradient.addColorStop(1, 'transparent')

  // 라인 그리기
  ctx.strokeStyle = gradient
  ctx.lineWidth = DUAL_HEX_PORTRAIT.connector.height
  ctx.globalAlpha = 0.5 + pulse * 0.5

  ctx.beginPath()
  ctx.moveTo(x1, y1)

  // 진행도에 따른 라인 길이
  const midX = x1 + (x2 - x1) * progress
  ctx.lineTo(midX, y1)

  ctx.stroke()

  // 끝점 글로우
  if (progress > 0) {
    ctx.beginPath()
    ctx.arc(midX, y1, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.fill()
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DualHexPortrait: React.FC<DualHexPortraitProps> = ({
  leftPortrait,
  rightPortrait,
  scenario = 'idle',
  connectionStatus = 'complete',
  syncProgress = 100,
  time = 0,
  width = 400,
  height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useMemo(() => getScenarioTheme(scenario), [scenario])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    const hexSize = DUAL_HEX_PORTRAIT.hexSize
    const centerY = height / 2
    const leftX = width * 0.25
    const rightX = width * 0.75
    const labelOffset = hexSize + 30

    // 색상 결정
    const primaryColor = theme.primary
    const glowColor = theme.primaryGlow || HUD_COLORS.goldGlow
    const fillColor = 'rgba(0,0,0,0.4)'

    // 왼쪽 포트레이트 (인간)
    drawHexagonFrame(ctx, leftX, centerY, hexSize, primaryColor, glowColor, fillColor)

    // 오른쪽 포트레이트 (페르소나)
    drawHexagonFrame(ctx, rightX, centerY, hexSize, primaryColor, glowColor, fillColor)

    // 연결 라인
    const lineY = centerY
    const lineX1 = leftX + hexSize + 10
    const lineX2 = rightX - hexSize - 10
    const lineProgress = connectionStatus === 'complete' ? 1 : syncProgress / 100

    drawConnectorLine(ctx, lineX1, lineY, lineX2, lineY, primaryColor, lineProgress, time)

    // 왼쪽 이름 라벨
    ctx.save()
    ctx.font = `bold ${DUAL_HEX_PORTRAIT.nameLabel.size}px ${FONTS.display}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = DUAL_HEX_PORTRAIT.nameLabel.color
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 12
    ctx.fillText(leftPortrait.englishName, leftX, centerY + labelOffset - 20)
    ctx.restore()

    // 왼쪽 한글 이름
    ctx.save()
    ctx.font = `500 16px ${FONTS.korean}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = HUD_COLORS.textDim
    ctx.fillText(leftPortrait.name, leftX, centerY + labelOffset + 15)
    ctx.restore()

    // 오른쪽 이름 라벨
    ctx.save()
    ctx.font = `bold ${DUAL_HEX_PORTRAIT.nameLabel.size}px ${FONTS.display}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = DUAL_HEX_PORTRAIT.nameLabel.color
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 12
    ctx.fillText(rightPortrait.englishName, rightX, centerY + labelOffset - 20)
    ctx.restore()

    // 오른쪽 한글 이름
    ctx.save()
    ctx.font = `500 16px ${FONTS.korean}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = HUD_COLORS.textDim
    ctx.fillText(rightPortrait.name, rightX, centerY + labelOffset + 15)
    ctx.restore()

    // 연결 상태 텍스트
    if (connectionStatus !== 'complete') {
      ctx.save()
      ctx.font = `600 14px ${FONTS.mono}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = theme.primary
      const statusText = connectionStatus === 'connecting' ? 'CONNECTING...' :
                         connectionStatus === 'syncing' ? `SYNCING ${Math.floor(syncProgress)}%` :
                         'DISCONNECTED'
      ctx.fillText(statusText, width / 2, centerY + 10)
      ctx.restore()
    }
  }, [width, height, leftPortrait, rightPortrait, theme, connectionStatus, syncProgress, time])

  useEffect(() => {
    render()
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  )
}

export default DualHexPortrait
