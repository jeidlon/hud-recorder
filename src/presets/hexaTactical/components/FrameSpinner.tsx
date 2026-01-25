/**
 * 프레임 기반 스피너 (Remotion 호환)
 * 
 * - Preview 모드: requestAnimationFrame으로 회전
 * - Render 모드: 외부 타임스탬프 기반 회전
 */

import * as React from 'react'
import { useIsRenderMode, useExternalTimestamp } from '../HexaTacticalHUD'
import { HUD_COLORS } from '../constants'

interface FrameSpinnerProps {
  size?: number
  borderWidth?: number
  color?: string
  highlightColor?: string
  speed?: number // rotations per second
  style?: React.CSSProperties
}

export const FrameSpinner: React.FC<FrameSpinnerProps> = ({
  size = 40,
  borderWidth = 3,
  color = HUD_COLORS.cyanGlow,
  highlightColor = HUD_COLORS.cyanBright,
  speed = 1, // 1 rotation per second
  style,
}) => {
  const isRenderMode = useIsRenderMode()
  const externalTimestamp = useExternalTimestamp()
  const [internalAngle, setInternalAngle] = React.useState(0)
  const startTimeRef = React.useRef<number>(0)
  const animFrameRef = React.useRef<number>(0)
  
  // Preview 모드: requestAnimationFrame으로 회전
  React.useEffect(() => {
    if (isRenderMode) return
    
    startTimeRef.current = performance.now()
    
    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current
      const rotations = (elapsed / 1000) * speed
      const angle = (rotations * 360) % 360
      setInternalAngle(angle)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isRenderMode, speed])
  
  // 각도 계산
  const angle = React.useMemo(() => {
    if (isRenderMode) {
      // Render 모드: 외부 타임스탬프 기반 회전
      const rotations = (externalTimestamp / 1000) * speed
      return (rotations * 360) % 360
    }
    return internalAngle
  }, [isRenderMode, externalTimestamp, internalAngle, speed])
  
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `${borderWidth}px solid ${color}`,
        borderTop: `${borderWidth}px solid ${highlightColor}`,
        borderRadius: '50%',
        transform: `rotate(${angle}deg)`,
        ...style,
      }}
    />
  )
}

export default FrameSpinner
