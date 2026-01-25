/**
 * 🎬 프레임 동기화 애니메이션 시스템 v2
 * 
 * Remotion 렌더링과 호환되는 애니메이션 컴포넌트
 * - 일반 모드: Framer Motion 사용 (부드러운 애니메이션)
 * - 렌더 모드: AnimationEventLog 기반 정확한 타이밍 계산
 * 
 * 핵심 개선:
 * 1. 미리보기 중 애니메이션 이벤트 자동 기록
 * 2. 렌더링 시 기록된 시작 시간 사용
 * 3. 프레임 정확한 재생
 */

import * as React from 'react'
import { motion, type MotionProps } from 'framer-motion'
import { useIsRenderMode, useExternalTimestamp } from '../HexaTacticalHUD'
import { animationEventLog } from '../../../theatre/animations/AnimationEventLog'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Easing 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 애니메이션 값 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AnimationValues {
  opacity?: number
  x?: number
  y?: number
  scale?: number
  rotate?: number
}

// 자동 ID 생성용 카운터
let autoIdCounter = 0

interface FrameAnimatedDivProps {
  /** 요소 고유 ID (이벤트 로그용) - 없으면 자동 생성 */
  elementId?: string
  /** 애니메이션 시작 시간 (ms) - 자동 설정됨 (렌더 모드) */
  startTime?: number
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** Easing 함수 */
  easing?: keyof typeof easing
  /** 시작 상태 */
  from?: AnimationValues
  /** 종료 상태 */
  to?: AnimationValues
  /** 자식 요소 */
  children?: React.ReactNode
  /** 추가 스타일 */
  style?: React.CSSProperties
  /** 클래스 */
  className?: string
  /** 렌더 안 됨 조건 (visible = false면 안 보임) */
  visible?: boolean
  /** Framer Motion exit 시 사용 */
  exitDuration?: number
}

/**
 * 🎬 FrameAnimatedDiv
 * 
 * Remotion 렌더링과 호환되는 애니메이션 div
 * 
 * @example
 * // 0.5초에 시작해서 0.3초 동안 fade in + slide up
 * <FrameAnimatedDiv
 *   startTime={500}
 *   duration={300}
 *   from={{ opacity: 0, y: 20 }}
 *   to={{ opacity: 1, y: 0 }}
 * >
 *   <Content />
 * </FrameAnimatedDiv>
 */
export const FrameAnimatedDiv: React.FC<FrameAnimatedDivProps> = ({
  elementId: propElementId,
  startTime: propStartTime,
  duration = 300,
  easing: easingName = 'easeOutCubic',
  from = { opacity: 0 },
  to = { opacity: 1 },
  children,
  style,
  className,
  visible = true,
  exitDuration = 200,
}) => {
  const isRenderMode = useIsRenderMode()
  const externalTime = useExternalTimestamp()
  const hasLoggedRef = React.useRef(false)
  const mountTimeRef = React.useRef<number>(0)
  
  // 자동 ID 생성 (한 번만)
  const autoIdRef = React.useRef<string | null>(null)
  if (!autoIdRef.current) {
    autoIdRef.current = propElementId ?? `auto-${++autoIdCounter}`
  }
  const elementId = autoIdRef.current
  
  // 🎬 미리보기 모드: 마운트 시 이벤트 기록
  React.useEffect(() => {
    if (!isRenderMode && !hasLoggedRef.current && visible) {
      animationEventLog.logEnter(elementId, undefined, duration)
      mountTimeRef.current = performance.now()
      hasLoggedRef.current = true
    }
    
    return () => {
      if (!isRenderMode && hasLoggedRef.current) {
        animationEventLog.logExit(elementId)
      }
    }
  }, [elementId, isRenderMode, visible, duration])
  
  if (!visible) return null
  
  // 시작 시간 결정: 렌더 모드에서는 이벤트 로그에서 가져옴
  const startTime = isRenderMode 
    ? (animationEventLog.getLastEnterTime(elementId, externalTime) ?? propStartTime ?? 0)
    : 0 // 미리보기에서는 마운트 즉시 시작
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎬 렌더 모드: 프레임 기반 계산
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isRenderMode) {
    // 진행률 계산
    const elapsed = externalTime - startTime
    const rawProgress = Math.min(1, Math.max(0, elapsed / duration))
    const easingFn = easing[easingName] || easing.easeOutCubic
    const progress = easingFn(rawProgress)
    
    // 값 보간 - 🔧 scale은 기본값 1, 나머지는 0
    const interpolate = (fromVal: number | undefined, toVal: number | undefined, defaultVal = 0) => {
      const f = fromVal ?? defaultVal
      const t = toVal ?? defaultVal
      return f + (t - f) * progress
    }
    
    const currentOpacity = interpolate(from.opacity, to.opacity, 1)  // opacity 기본 1
    const currentX = interpolate(from.x, to.x, 0)
    const currentY = interpolate(from.y, to.y, 0)
    const currentScale = interpolate(from.scale, to.scale, 1)  // 🔧 scale 기본값 1!
    const currentRotate = interpolate(from.rotate, to.rotate, 0)
    
    // 아직 시작 안 됨 - 초기 상태 렌더링
    if (elapsed < 0) {
      return (
        <div
          className={className}
          style={{
            ...style,
            opacity: from.opacity ?? 1,
            transform: buildTransform(from.x ?? 0, from.y ?? 0, from.scale ?? 1, from.rotate ?? 0),
          }}
        >
          {children}
        </div>
      )
    }
    
    return (
      <div
        className={className}
        style={{
          ...style,
          opacity: currentOpacity,
          transform: buildTransform(currentX, currentY, currentScale, currentRotate),
        }}
      >
        {children}
      </div>
    )
  }
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🎮 일반 모드: Framer Motion
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <motion.div
      className={className}
      initial={{
        opacity: from.opacity ?? 0,
        x: from.x ?? 0,
        y: from.y ?? 0,
        scale: from.scale ?? 1,
        rotate: from.rotate ?? 0,
      }}
      animate={{
        opacity: to.opacity ?? 1,
        x: to.x ?? 0,
        y: to.y ?? 0,
        scale: to.scale ?? 1,
        rotate: to.rotate ?? 0,
      }}
      exit={{
        opacity: 0,
        transition: { duration: exitDuration / 1000 },
      }}
      transition={{
        duration: duration / 1000,
        ease: easingName === 'spring' ? 'easeOut' : easingName.replace('ease', '').toLowerCase(),
      }}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// Transform 문자열 빌드
function buildTransform(
  x?: number,
  y?: number,
  scale?: number,
  rotate?: number
): string {
  const parts: string[] = []
  if (x !== undefined && x !== 0) parts.push(`translateX(${x}px)`)
  if (y !== undefined && y !== 0) parts.push(`translateY(${y}px)`)
  if (scale !== undefined && scale !== 1) parts.push(`scale(${scale})`)
  if (rotate !== undefined && rotate !== 0) parts.push(`rotate(${rotate}deg)`)
  return parts.length > 0 ? parts.join(' ') : 'none'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 애니메이션 타이밍 관리자
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AnimationTiming {
  key: string
  startTime: number
  duration: number
}

/**
 * 애니메이션 타이밍을 관리하는 Context
 * hudStateLog에 저장될 애니메이션 시작 시간을 추적
 */
const AnimationTimingContext = React.createContext<{
  timings: Map<string, AnimationTiming>
  registerAnimation: (key: string, duration: number) => number
  getStartTime: (key: string) => number | undefined
}>({
  timings: new Map(),
  registerAnimation: () => 0,
  getStartTime: () => undefined,
})

export const useAnimationTiming = () => React.useContext(AnimationTimingContext)

interface AnimationTimingProviderProps {
  children: React.ReactNode
  /** 현재 타임스탬프 (렌더 모드에서는 externalTime) */
  currentTime: number
  /** 타이밍 변경 콜백 (hudStateLog 저장용) */
  onTimingChange?: (timings: AnimationTiming[]) => void
}

export const AnimationTimingProvider: React.FC<AnimationTimingProviderProps> = ({
  children,
  currentTime,
  onTimingChange,
}) => {
  const timingsRef = React.useRef<Map<string, AnimationTiming>>(new Map())
  
  const registerAnimation = React.useCallback((key: string, duration: number) => {
    if (!timingsRef.current.has(key)) {
      const timing: AnimationTiming = {
        key,
        startTime: currentTime,
        duration,
      }
      timingsRef.current.set(key, timing)
      onTimingChange?.(Array.from(timingsRef.current.values()))
    }
    return timingsRef.current.get(key)?.startTime ?? currentTime
  }, [currentTime, onTimingChange])
  
  const getStartTime = React.useCallback((key: string) => {
    return timingsRef.current.get(key)?.startTime
  }, [])
  
  return (
    <AnimationTimingContext.Provider value={{
      timings: timingsRef.current,
      registerAnimation,
      getStartTime,
    }}>
      {children}
    </AnimationTimingContext.Provider>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 자동 등록 애니메이션 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface AutoAnimatedDivProps extends Omit<FrameAnimatedDivProps, 'startTime'> {
  /** 애니메이션 고유 키 (같은 키면 같은 시작 시간) */
  animKey: string
}

/**
 * 🎬 AutoAnimatedDiv
 * 
 * 마운트 시 자동으로 애니메이션 시작 시간을 등록하고,
 * 렌더 모드에서 해당 시간을 사용하여 애니메이션을 재생
 */
export const AutoAnimatedDiv: React.FC<AutoAnimatedDivProps> = ({
  animKey,
  duration = 300,
  ...props
}) => {
  const { registerAnimation, getStartTime } = useAnimationTiming()
  const isRenderMode = useIsRenderMode()
  const externalTime = useExternalTimestamp()
  
  // 마운트 시 애니메이션 등록 (일반 모드에서만)
  React.useEffect(() => {
    if (!isRenderMode) {
      registerAnimation(animKey, duration)
    }
  }, [animKey, duration, isRenderMode, registerAnimation])
  
  // 렌더 모드에서는 저장된 시작 시간 사용
  const startTime = isRenderMode ? (getStartTime(animKey) ?? 0) : 0
  
  return (
    <FrameAnimatedDiv
      startTime={startTime}
      duration={duration}
      {...props}
    />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티: 기존 motion.div를 쉽게 변환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * motion.div 대체 훅
 * 
 * @example
 * // 기존
 * <motion.div animate={{ opacity: 1 }} />
 * 
 * // 변환
 * const { style, Component } = useFrameMotion({
 *   animate: { opacity: 1 },
 *   initial: { opacity: 0 },
 *   duration: 300,
 * })
 * <Component style={style}>...</Component>
 */
export function useFrameMotion(options: {
  initial?: AnimationValues
  animate?: AnimationValues
  duration?: number
  startTime?: number
  easing?: keyof typeof easing
}) {
  const isRenderMode = useIsRenderMode()
  const externalTime = useExternalTimestamp()
  
  const {
    initial = { opacity: 0 },
    animate = { opacity: 1 },
    duration = 300,
    startTime = 0,
    easing: easingName = 'easeOutCubic',
  } = options
  
  if (isRenderMode) {
    const elapsed = externalTime - startTime
    const rawProgress = Math.min(1, Math.max(0, elapsed / duration))
    const easingFn = easing[easingName] || easing.easeOutCubic
    const progress = easingFn(rawProgress)
    
    // 🔧 scale은 기본값 1, opacity도 기본 1
    const interpolate = (from: number | undefined, to: number | undefined, defaultVal = 0) => {
      const f = from ?? defaultVal
      const t = to ?? defaultVal
      return f + (t - f) * progress
    }
    
    return {
      Component: 'div' as const,
      style: {
        opacity: interpolate(initial.opacity, animate.opacity, 1),
        transform: buildTransform(
          interpolate(initial.x, animate.x, 0),
          interpolate(initial.y, animate.y, 0),
          interpolate(initial.scale, animate.scale, 1),
          interpolate(initial.rotate, animate.rotate, 0)
        ),
      },
    }
  }
  
  return {
    Component: motion.div,
    motionProps: {
      initial,
      animate,
      transition: { duration: duration / 1000 },
    },
    style: {},
  }
}

export default FrameAnimatedDiv
