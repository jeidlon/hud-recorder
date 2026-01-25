/**
 * ScanlineOverlay - 스캔라인 효과 오버레이 (Remotion 호환 버전)
 * 
 * 레퍼런스 이미지 기준:
 * - 미묘한 수평 스캔라인 (CRT 모니터 느낌)
 * - 반투명 오버레이
 * - 가끔씩 반짝이는 라인 (하이라이트)
 * 
 * 🎬 Remotion 호환:
 * - Preview 모드: CSS animation 사용 (성능 최적화)
 * - Render 모드: 프레임 기반 인라인 스타일
 */

import * as React from 'react'
import { useMemo, type CSSProperties } from 'react'
import { SCANLINE_SETTINGS } from '../constants'

export interface ScanlineOverlayProps {
  opacity?: number
  spacing?: number
  animated?: boolean
  animationSpeed?: number
  highlightLine?: boolean  // 무작위 밝은 라인
  isRenderMode?: boolean   // 🎬 Remotion 렌더링 모드
  externalTimestamp?: number // 🎬 외부 타임스탬프 (ms)
}

export const ScanlineOverlay: React.FC<ScanlineOverlayProps> = ({
  opacity = SCANLINE_SETTINGS.opacity,
  spacing = SCANLINE_SETTINGS.spacing,
  animated = false,
  animationSpeed = 0.5,
  highlightLine = true,
  isRenderMode = false,
  externalTimestamp = 0,
}) => {
  // 현재 시간 (ms) - Render 모드에서는 외부 타임스탬프 사용
  const currentTime = isRenderMode ? externalTimestamp : 0
  
  // 🎬 프레임 기반 스캔라인 위치 계산
  const scanlineY = useMemo(() => {
    if (!animated || !isRenderMode) return 0
    const period = 1000 / animationSpeed // ms per cycle
    const progress = (currentTime % period) / period
    return progress * spacing * 2
  }, [animated, animationSpeed, currentTime, spacing, isRenderMode])
  
  // 🎬 프레임 기반 하이라이트 계산
  const highlightState = useMemo(() => {
    if (!highlightLine || !isRenderMode) return { opacity: 0.03, translateY: 0 }
    const period = 4000 // 4s cycle
    const progress = (currentTime % period) / period
    // ease-in-out: sin curve
    const eased = Math.sin(progress * Math.PI)
    return {
      opacity: 0.02 + eased * 0.04,
      translateY: eased * 5,
    }
  }, [highlightLine, currentTime, isRenderMode])

  // 메인 스캔라인 스타일
  const scanlineStyle: CSSProperties = useMemo(() => {
    const baseStyle: CSSProperties = {
      position: 'fixed' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      opacity,
      background: `repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 1px,
        rgba(0,0,0,0.12) 1px,
        rgba(0,0,0,0.12) 2px
      )`,
      mixBlendMode: 'multiply' as const,
      zIndex: 9998,
    }
    
    if (isRenderMode && animated) {
      // 🎬 Render 모드: 인라인 스타일로 애니메이션
      return {
        ...baseStyle,
        backgroundPositionY: `${scanlineY}px`,
      }
    } else {
      // Preview 모드: CSS animation
      return {
        ...baseStyle,
        animation: animated ? `scanline-scroll ${1 / animationSpeed}s linear infinite` : 'none',
      }
    }
  }, [opacity, animated, animationSpeed, isRenderMode, scanlineY])

  // 하이라이트 스캔라인 (가끔 반짝이는 밝은 라인)
  const highlightStyle: CSSProperties = useMemo(() => {
    const baseStyle: CSSProperties = {
      position: 'fixed' as const,
      inset: 0,
      pointerEvents: 'none' as const,
      background: `repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 3px,
        rgba(255,215,0,0.15) 3px,
        transparent 4px,
        transparent 40px
      )`,
      zIndex: 9999,
    }
    
    if (isRenderMode) {
      // 🎬 Render 모드: 인라인 스타일로 애니메이션
      return {
        ...baseStyle,
        opacity: highlightState.opacity,
        transform: `translateY(${highlightState.translateY}%)`,
      }
    } else {
      // Preview 모드: CSS animation
      return {
        ...baseStyle,
        opacity: 0.03,
        animation: highlightLine ? 'highlight-sweep 4s ease-in-out infinite' : 'none',
      }
    }
  }, [highlightLine, isRenderMode, highlightState])

  // 비네트 효과 (가장자리 어둡게)
  const vignetteStyle: CSSProperties = useMemo(() => ({
    position: 'fixed' as const,
    inset: 0,
    pointerEvents: 'none' as const,
    background: `radial-gradient(
      ellipse at center,
      transparent 0%,
      transparent 50%,
      rgba(0,0,0,0.2) 80%,
      rgba(0,0,0,0.4) 100%
    )`,
    zIndex: 9997,
  }), [])

  return (
    <>
      {/* CSS keyframes - 항상 렌더링 */}
      <style>{`
        @keyframes scanline-scroll {
          0% { background-position-y: 0px; }
          100% { background-position-y: ${spacing * 2}px; }
        }
        
        @keyframes highlight-sweep {
          0%, 100% { 
            opacity: 0.02;
            transform: translateY(0%);
          }
          50% { 
            opacity: 0.06;
            transform: translateY(5%);
          }
        }
      `}</style>
      
      {/* 비네트 (가장 아래) */}
      <div style={vignetteStyle} />
      
      {/* 메인 스캔라인 */}
      <div style={scanlineStyle} />
      
      {/* 하이라이트 스캔라인 */}
      {highlightLine && <div style={highlightStyle} />}
    </>
  )
}

export default ScanlineOverlay
