/**
 * ARWES Frame Corners - Ported from https://github.com/arwes/arwes
 * SF 스타일 코너 프레임 (SVG)
 */
import React, { useState, useEffect } from 'react'

interface FrameCornersProps {
  strokeWidth?: number
  cornerLength?: number
  color?: string
  glowColor?: string
  padding?: number
  animated?: boolean
  animationDuration?: number
  style?: React.CSSProperties
}

export const FrameCorners: React.FC<FrameCornersProps> = ({
  strokeWidth = 1,
  cornerLength = 16,
  color = 'rgba(255, 248, 225, 0.65)',
  glowColor = 'rgba(255, 215, 0, 0.4)',
  padding = 0,
  animated = true,
  animationDuration = 300,
  style,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1)

  useEffect(() => {
    if (!animated) {
      setProgress(1)
      return
    }

    const startTime = performance.now()
    let animationFrame: number

    const animate = () => {
      const elapsed = performance.now() - startTime
      const p = Math.min(elapsed / animationDuration, 1)
      setProgress(p)

      if (p < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [animated, animationDuration])

  const co = strokeWidth / 2 // center offset
  const p = padding
  const cl = cornerLength

  // 각 코너의 라인 정의 (8개)
  const lines = [
    // Left top - vertical
    { x1: co + p, y1: co + p, x2: co + p, y2: cl + p },
    // Left top - horizontal
    { x1: co + p, y1: co + p, x2: cl + p, y2: co + p },
    // Right top - horizontal
    { x1: `calc(100% - ${co + p}px)`, y1: co + p, x2: `calc(100% - ${cl + p}px)`, y2: co + p },
    // Right top - vertical
    { x1: `calc(100% - ${co + p}px)`, y1: co + p, x2: `calc(100% - ${co + p}px)`, y2: cl + p },
    // Right bottom - vertical
    { x1: `calc(100% - ${co + p}px)`, y1: `calc(100% - ${co + p}px)`, x2: `calc(100% - ${co + p}px)`, y2: `calc(100% - ${cl + p}px)` },
    // Right bottom - horizontal
    { x1: `calc(100% - ${co + p}px)`, y1: `calc(100% - ${co + p}px)`, x2: `calc(100% - ${cl + p}px)`, y2: `calc(100% - ${co + p}px)` },
    // Left bottom - horizontal
    { x1: co + p, y1: `calc(100% - ${co + p}px)`, x2: cl + p, y2: `calc(100% - ${co + p}px)` },
    // Left bottom - vertical
    { x1: co + p, y1: `calc(100% - ${co + p}px)`, x2: co + p, y2: `calc(100% - ${cl + p}px)` },
  ]

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        ...style,
      }}
    >
      <defs>
        <filter id="corner-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#corner-glow)"
        style={{
          filter: `drop-shadow(0 0 3px ${glowColor})`,
        }}
      >
        {lines.map((line, index) => {
          // CSS calc 값 처리를 위해 line 컴포넌트 사용
          const isVertical = line.x1 === line.x2
          const lineLength = isVertical ? cl - co : cl - co

          return (
            <line
              key={index}
              x1={typeof line.x1 === 'number' ? line.x1 : 0}
              y1={typeof line.y1 === 'number' ? line.y1 : 0}
              x2={typeof line.x2 === 'number' ? line.x2 : 0}
              y2={typeof line.y2 === 'number' ? line.y2 : 0}
              style={{
                strokeDasharray: lineLength,
                strokeDashoffset: lineLength * (1 - progress),
                transition: animated ? 'none' : undefined,
              }}
            />
          )
        })}
      </g>
    </svg>
  )
}

// 순수 CSS/div 기반 코너 프레임 (더 간단하고 정확함)
export const FrameCornersCSS: React.FC<FrameCornersProps> = ({
  strokeWidth = 1,
  cornerLength = 16,
  color = 'rgba(255, 248, 225, 0.65)',
  glowColor = 'rgba(255, 215, 0, 0.4)',
  padding = 0,
  animated = true,
  animationDuration = 300,
  style,
}) => {
  const [progress, setProgress] = useState(animated ? 0 : 1)

  useEffect(() => {
    if (!animated) {
      setProgress(1)
      return
    }

    const startTime = performance.now()
    let animationFrame: number

    const animate = () => {
      const elapsed = performance.now() - startTime
      const p = Math.min(elapsed / animationDuration, 1)
      setProgress(p)

      if (p < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [animated, animationDuration])

  const cornerStyle = (
    top: boolean,
    left: boolean
  ): React.CSSProperties => ({
    position: 'absolute',
    top: top ? padding : undefined,
    bottom: !top ? padding : undefined,
    left: left ? padding : undefined,
    right: !left ? padding : undefined,
    width: cornerLength * progress,
    height: cornerLength * progress,
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
    borderTopWidth: top ? strokeWidth : 0,
    borderBottomWidth: !top ? strokeWidth : 0,
    borderLeftWidth: left ? strokeWidth : 0,
    borderRightWidth: !left ? strokeWidth : 0,
    boxShadow: `0 0 4px ${glowColor}`,
    transition: animated ? 'none' : undefined,
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {/* Top Left */}
      <div style={cornerStyle(true, true)} />
      {/* Top Right */}
      <div style={cornerStyle(true, false)} />
      {/* Bottom Right */}
      <div style={cornerStyle(false, false)} />
      {/* Bottom Left */}
      <div style={cornerStyle(false, true)} />
    </div>
  )
}

export default FrameCornersCSS
