/**
 * 🎭 FrameAnimated - 프레임 정확한 애니메이션 컴포넌트
 * 
 * motion.div를 대체하는 Theatre.js 기반 애니메이션 컴포넌트입니다.
 * Remotion 렌더링과 완벽히 동기화됩니다.
 * 
 * @example
 * ```tsx
 * // 기존 motion.div
 * <motion.div
 *   initial={{ opacity: 0, y: 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 *   transition={{ duration: 0.3 }}
 * />
 * 
 * // 새로운 FrameAnimated
 * <FrameAnimated
 *   preset="fadeIn"
 *   startTime={0.5}
 *   currentTime={currentTimeInSeconds}
 * />
 * ```
 */

import React, { useMemo } from 'react'
import { ANIMATION_PRESETS } from './presets'
import type { AnimationPresetName, AnimationKeyframes } from './presets'
import { interpolateKeyframes, valuesToStyle } from './interpolate'

interface FrameAnimatedProps {
  /** 애니메이션 프리셋 이름 */
  preset?: AnimationPresetName
  /** 커스텀 키프레임 (프리셋 대신 사용) */
  keyframes?: AnimationKeyframes
  /** 애니메이션 시작 시간 (초) */
  startTime?: number
  /** 현재 시간 (초) - 외부에서 제공 */
  currentTime: number
  /** 추가 CSS 스타일 */
  style?: React.CSSProperties
  /** 클래스명 */
  className?: string
  /** 자식 요소 */
  children?: React.ReactNode
  /** HTML 태그 */
  as?: keyof JSX.IntrinsicElements
}

export const FrameAnimated: React.FC<FrameAnimatedProps> = ({
  preset,
  keyframes: customKeyframes,
  startTime = 0,
  currentTime,
  style,
  className,
  children,
  as: Component = 'div',
}) => {
  // 키프레임 결정 (커스텀 > 프리셋)
  const keyframes = useMemo(() => {
    if (customKeyframes) return customKeyframes
    if (preset) return ANIMATION_PRESETS[preset]
    return {} as AnimationKeyframes
  }, [customKeyframes, preset])

  // 현재 시간에 맞는 값 보간
  const values = useMemo(() => {
    return interpolateKeyframes(keyframes, currentTime, startTime)
  }, [keyframes, currentTime, startTime])

  // CSS 스타일 생성
  const animatedStyle = useMemo(() => {
    return {
      ...valuesToStyle(values),
      ...style,
    }
  }, [values, style])

  return React.createElement(
    Component,
    { className, style: animatedStyle },
    children
  )
}

/**
 * 조건부 애니메이션 (show/hide)
 */
interface ConditionalFrameAnimatedProps extends Omit<FrameAnimatedProps, 'preset'> {
  /** 표시 여부 */
  show: boolean
  /** 표시될 때 애니메이션 */
  enterPreset?: AnimationPresetName
  /** 숨겨질 때 애니메이션 */
  exitPreset?: AnimationPresetName
  /** 상태 변경 시간 (초) - show가 변경된 시점 */
  stateChangeTime?: number
}

export const ConditionalFrameAnimated: React.FC<ConditionalFrameAnimatedProps> = ({
  show,
  enterPreset = 'fadeIn',
  exitPreset = 'fadeOut',
  stateChangeTime = 0,
  currentTime,
  style,
  className,
  children,
  as: Component = 'div',
}) => {
  const keyframes = show 
    ? ANIMATION_PRESETS[enterPreset] 
    : ANIMATION_PRESETS[exitPreset]

  const values = useMemo(() => {
    return interpolateKeyframes(keyframes, currentTime, stateChangeTime)
  }, [keyframes, currentTime, stateChangeTime])

  // hide 애니메이션이 완료되면 렌더링하지 않음
  if (!show && values.opacity <= 0) {
    return null
  }

  const animatedStyle = {
    ...valuesToStyle(values),
    ...style,
  }

  return React.createElement(
    Component,
    { className, style: animatedStyle },
    children
  )
}

/**
 * 루프 애니메이션 (pulse 등)
 */
interface LoopFrameAnimatedProps extends Omit<FrameAnimatedProps, 'startTime'> {
  /** 루프 주기 (초) */
  loopDuration?: number
}

export const LoopFrameAnimated: React.FC<LoopFrameAnimatedProps> = ({
  preset = 'pulse',
  keyframes: customKeyframes,
  currentTime,
  loopDuration,
  style,
  className,
  children,
  as: Component = 'div',
}) => {
  const keyframes = customKeyframes ?? ANIMATION_PRESETS[preset]
  
  // 루프 시간 계산
  const duration = loopDuration ?? 1 // 기본 1초
  const loopedTime = currentTime % duration

  const values = useMemo(() => {
    return interpolateKeyframes(keyframes, loopedTime, 0)
  }, [keyframes, loopedTime])

  const animatedStyle = {
    ...valuesToStyle(values),
    ...style,
  }

  return React.createElement(
    Component,
    { className, style: animatedStyle },
    children
  )
}

export default FrameAnimated
