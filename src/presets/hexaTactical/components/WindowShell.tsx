/**
 * WindowShell - Win98 스타일 윈도우 프레임 (레퍼런스 정밀 반영 v12 - 색상 복구 및 축소)
 * 
 * 수정 사항:
 * - titleColor prop 추가: 테두리와 별개로 텍스트 색상 지정 가능
 * - borderColor prop: 테두리 색상 지정 가능 (현재는 사용 안 함 -> 기본 골드 스타일)
 */

import * as React from 'react'
import { useMemo, type CSSProperties } from 'react'
import {
  FONTS,
  type HexaScenarioId,
} from '../constants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 레퍼런스 정밀 반영 규격 (1.5배 축소 버전 유지)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TITLEBAR_HEIGHT = 16
const CONTROL_BUTTON_SIZE = 11
const CONTROL_BUTTON_GAP = 2
const BUTTON_BORDER_RADIUS = 3

// 색상 (레퍼런스 기반 시네마틱 강화)
const COLORS = {
  titleBgTop: 'rgba(220, 200, 150, 0.28)', 
  titleBgBot: 'rgba(160, 140, 80, 0.35)',
  borderOuter: 'rgba(255, 248, 225, 0.72)',
  borderInner: 'rgba(255, 255, 255, 0.35)',
  // 🔥 버튼 색상 시네마틱 강화
  buttonBg: 'linear-gradient(180deg, rgba(255, 245, 220, 0.12) 0%, rgba(180, 150, 100, 0.08) 100%)',
  buttonBgHover: 'linear-gradient(180deg, rgba(255, 245, 220, 0.25) 0%, rgba(200, 170, 120, 0.18) 100%)',
  buttonBorder: 'rgba(255, 248, 225, 0.75)',
  buttonBorderHover: 'rgba(255, 255, 255, 0.95)',
  buttonIcon: '#FFFDD0',
  buttonIconHover: '#FFFFFF',
  // 🔥 버튼 glow 효과 추가
  buttonGlow: '0 0 4px rgba(255, 230, 180, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
  buttonGlowHover: '0 0 8px rgba(255, 230, 180, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
  titleText: 'rgba(255, 255, 255, 0.95)',
  bodyBg: 'rgba(5, 5, 4, 0.6)',  // 원래대로 반투명
}

const scanlinePattern = `repeating-linear-gradient(
  0deg,
  rgba(255, 255, 255, 0.04) 0px,
  rgba(255, 255, 255, 0.04) 1px,
  rgba(0, 0, 0, 0.12) 1px, 
  rgba(0, 0, 0, 0.12) 2px
)`

// 🔥 시네마틱 타이틀바: 더 풍부한 그라데이션 + 하이라이트 라인
const titlebarBackground = `
  ${scanlinePattern},
  linear-gradient(180deg, 
    rgba(255, 255, 255, 0.08) 0%,
    ${COLORS.titleBgTop} 15%, 
    ${COLORS.titleBgBot} 85%,
    rgba(0, 0, 0, 0.15) 100%
  )
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface WindowShellProps {
  title: string
  width?: number | string
  height?: number | string
  x?: number | string
  y?: number | string
  children?: React.ReactNode
  scenario?: HexaScenarioId
  showTitlebar?: boolean
  showControls?: boolean
  showResizeHandles?: boolean
  isActive?: boolean
  glowIntensity?: 'none' | 'soft' | 'normal' | 'strong'
  style?: CSSProperties
  bodyStyle?: CSSProperties
  className?: string
  borderColor?: string // 테두리 색상
  titleColor?: string // 타이틀 텍스트 색상 (추가)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컨트롤 버튼
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WindowControlButton: React.FC<{
  symbol: 'minimize' | 'maximize' | 'close'
  onClick?: () => void
  color?: string
}> = ({ symbol, onClick, color }) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const renderIcon = () => {
    const iconColor = isHovered ? COLORS.buttonIconHover : (color || COLORS.buttonIcon)
    const iconStyle: CSSProperties = {
      stroke: iconColor,
      strokeWidth: 1.4, // 🔥 약간 두껍게
      fill: 'none',
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      // 🔥 아이콘에도 그림자 추가
      filter: isHovered ? 'drop-shadow(0 0 2px rgba(255,255,255,0.6))' : 'none',
    }

    switch (symbol) {
      case 'minimize':
        return (
          <svg width="7" height="7" viewBox="0 0 10 10">
            <line x1="2" y1="5" x2="8" y2="5" style={iconStyle} />
          </svg>
        )
      case 'maximize':
        return (
          <svg width="7" height="7" viewBox="0 0 10 10">
            <rect x="2" y="2" width="6" height="6" rx="1" style={{...iconStyle, fill: 'none'}} />
            <line x1="2" y1="3.5" x2="8" y2="3.5" style={{...iconStyle, strokeWidth: 0.8}} />
          </svg>
        )
      case 'close':
        return (
          <svg width="7" height="7" viewBox="0 0 10 10">
            <line x1="2" y1="2" x2="8" y2="8" style={iconStyle} />
            <line x1="8" y1="2" x2="2" y2="8" style={iconStyle} />
          </svg>
        )
    }
  }

  // 🔥 시네마틱 버튼 스타일 강화
  const buttonStyle: CSSProperties = {
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BUTTON_BORDER_RADIUS,
    // 🔥 다중 테두리 효과 (inner + outer)
    border: `1px solid ${isHovered ? COLORS.buttonBorderHover : (color || COLORS.buttonBorder)}`,
    // 🔥 그라데이션 배경
    background: isHovered ? COLORS.buttonBgHover : COLORS.buttonBg,
    cursor: 'pointer',
    transition: 'all 0.12s ease',
    // 🔥 핵심: 다층 box-shadow로 inner glow + outer glow
    boxShadow: isHovered ? COLORS.buttonGlowHover : COLORS.buttonGlow,
    // 🔥 유리 효과
    backdropFilter: 'blur(2px)',
  }

  return (
    <div
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderIcon()}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const WindowShell: React.FC<WindowShellProps> = ({
  title,
  width = 'auto',
  height = 'auto',
  x,
  y,
  children,
  scenario: _scenario = 'idle',
  showTitlebar = true,
  showControls = true,
  showResizeHandles: _showResizeHandles = true,
  isActive = true,
  glowIntensity: _glowIntensity = 'soft',
  style,
  bodyStyle,
  className,
  borderColor,
  titleColor, // 추가
}) => {
  // Suppress unused variable warnings (reserved for future use)
  void _scenario; void _showResizeHandles; void _glowIntensity;
  const containerStyle: CSSProperties = useMemo(() => ({
    position: x !== undefined || y !== undefined ? 'absolute' : 'relative',
    left: x,
    top: y,
    width,
    height,
    display: 'flex',
    flexDirection: 'column',
    // 🔥 시네마틱 테두리: 더 선명한 테두리
    border: `1px solid ${borderColor || COLORS.borderOuter}`,
    // 🔥 시네마틱 glow: 다층 그림자로 입체감 + inner glow
    boxShadow: isActive 
      ? `0 0 8px rgba(255, 220, 100, 0.2), 
         0 0 15px rgba(255, 220, 100, 0.08),
         inset 0 1px 1px rgba(255, 255, 255, 0.1),
         inset 0 0 3px rgba(255, 248, 225, 0.08)` 
      : 'inset 0 0 2px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    backgroundColor: 'transparent',  // 원래대로 투명
    backdropFilter: 'blur(4px)',
    ...style,
  }), [x, y, width, height, isActive, style, borderColor])

  const titlebarStyle: CSSProperties = useMemo(() => ({
    height: TITLEBAR_HEIGHT,
    minHeight: TITLEBAR_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 3px 0 6px',
    background: titlebarBackground,
    borderBottom: `1px solid ${borderColor || COLORS.borderInner}`,
    // 🔥 시네마틱: 다층 inner shadow로 입체감
    boxShadow: `inset 0 1px 0 rgba(255, 255, 255, 0.35), 
                inset 0 -1px 0 rgba(0, 0, 0, 0.15)`,
    userSelect: 'none',
  }), [borderColor])

  const titleTextStyle: CSSProperties = useMemo(() => ({
    fontSize: 9, // 8 -> 9
    fontFamily: FONTS.display, // FONTS.ui -> FONTS.display (Orbitron)
    fontWeight: 700,
    letterSpacing: '0.1em', // 0.08em -> 0.1em
    textTransform: 'uppercase' as const,
    // titleColor가 있으면 우선 적용, 없으면 borderColor, 없으면 기본값
    color: titleColor || borderColor || COLORS.titleText, 
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 'calc(100% - 60px)',
    textShadow: '0 0 2px rgba(0,0,0,0.3)',
  }), [borderColor, titleColor])

  const contentBodyStyle: CSSProperties = useMemo(() => ({
    flex: 1,
    background: `${scanlinePattern}, ${COLORS.bodyBg}`,
    // 🔥 시네마틱: 더 깊은 inner shadow + 상단 하이라이트
    boxShadow: `inset 0 2px 8px rgba(0,0,0,0.35), 
                inset 0 1px 0 rgba(255,255,255,0.04)`,
    padding: 6,
    overflow: 'hidden', // 스크롤바 숨김
    ...bodyStyle,
  }), [bodyStyle])

  return (
    <div style={containerStyle} className={className}>
      {showTitlebar && (
        <div style={titlebarStyle}>
          <span style={titleTextStyle}>{title}</span>
          {showControls && (
            <div style={{ display: 'flex', gap: CONTROL_BUTTON_GAP }}>
              <WindowControlButton symbol="minimize" color={borderColor} />
              <WindowControlButton symbol="maximize" color={borderColor} />
              <WindowControlButton symbol="close" color={borderColor} />
            </div>
          )}
        </div>
      )}
      <div style={contentBodyStyle}>{children}</div>
    </div>
  )
}

export default WindowShell
