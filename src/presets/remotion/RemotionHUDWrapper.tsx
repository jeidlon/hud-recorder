/**
 * Remotion HUD Wrapper
 * 
 * Remotion의 useCurrentFrame() 기반 HUD를 hud-recorder 시스템과 통합하는 래퍼
 * 
 * 두 가지 모드:
 * 1. 실시간 미리보기: Remotion Player 사용
 * 2. 오프라인 렌더링: 프레임 인덱스를 직접 전달받아 렌더링
 */

import * as React from 'react'
import { createContext, useContext } from 'react'
import type { HUDComponentProps } from '@/presets/index'
import type { HUDState } from '@/types/hud-protocol'

// ===== Context for frame injection =====
// 오프라인 렌더링 시 Remotion의 useCurrentFrame() 대신 사용할 프레임 값
interface RemotionFrameContextValue {
  frame: number
  fps: number
  durationInFrames: number
  width: number
  height: number
  // HUD 상태 (마우스 위치, 타겟 등)
  hudState?: HUDState
}

const RemotionFrameContext = createContext<RemotionFrameContextValue | null>(null)

/**
 * Remotion 스타일의 useCurrentFrame() 훅
 * - Remotion 환경에서는 실제 Remotion의 useCurrentFrame() 사용
 * - 오프라인 렌더링 시에는 Context에서 주입된 값 사용
 */
export function useHUDFrame(): number {
  const ctx = useContext(RemotionFrameContext)
  if (ctx) {
    return ctx.frame
  }
  // Remotion 환경이면 실제 훅 사용 (동적 import 필요)
  // 여기서는 fallback으로 0 반환
  return 0
}

/**
 * Remotion 스타일의 useVideoConfig() 훅
 */
export function useHUDConfig() {
  const ctx = useContext(RemotionFrameContext)
  if (ctx) {
    return {
      fps: ctx.fps,
      durationInFrames: ctx.durationInFrames,
      width: ctx.width,
      height: ctx.height,
    }
  }
  return { fps: 60, durationInFrames: 1800, width: 1920, height: 1080 }
}

/**
 * HUD 상태 (마우스, 타겟 등) 가져오기
 */
export function useHUDState(): HUDState | undefined {
  const ctx = useContext(RemotionFrameContext)
  return ctx?.hudState
}

// ===== Provider for offline rendering =====
interface RemotionHUDProviderProps {
  frame: number
  fps: number
  durationInFrames: number
  width: number
  height: number
  hudState?: HUDState
  children: React.ReactNode
}

export const RemotionHUDProvider: React.FC<RemotionHUDProviderProps> = ({
  frame,
  fps,
  durationInFrames,
  width,
  height,
  hudState,
  children,
}) => {
  const value = React.useMemo(
    () => ({ frame, fps, durationInFrames, width, height, hudState }),
    [frame, fps, durationInFrames, width, height, hudState]
  )
  
  return (
    <RemotionFrameContext.Provider value={value}>
      {children}
    </RemotionFrameContext.Provider>
  )
}

// ===== Interpolation utilities (Remotion-compatible) =====

export interface InterpolateOptions {
  extrapolateLeft?: 'clamp' | 'extend'
  extrapolateRight?: 'clamp' | 'extend'
  easing?: (t: number) => number
}

/**
 * Remotion의 interpolate() 함수 호환 구현
 */
export function interpolate(
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options: InterpolateOptions = {}
): number {
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing } = options

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length')
  }

  // 범위 내 위치 찾기
  let i = 1
  for (; i < inputRange.length - 1; i++) {
    if (inputRange[i] >= input) break
  }

  const inputMin = inputRange[i - 1]
  const inputMax = inputRange[i]
  const outputMin = outputRange[i - 1]
  const outputMax = outputRange[i]

  // 정규화된 진행도 (0-1)
  let t = (input - inputMin) / (inputMax - inputMin)

  // Extrapolation 처리
  if (t < 0) {
    t = extrapolateLeft === 'clamp' ? 0 : t
  } else if (t > 1) {
    t = extrapolateRight === 'clamp' ? 1 : t
  }

  // Easing 적용
  if (easing) {
    t = easing(Math.max(0, Math.min(1, t)))
  }

  return outputMin + t * (outputMax - outputMin)
}

// ===== Spring animation (Remotion-compatible) =====

export interface SpringConfig {
  damping?: number
  stiffness?: number
  mass?: number
}

export interface SpringOptions {
  frame: number
  fps: number
  config?: SpringConfig
  delay?: number
  durationInFrames?: number
  from?: number
  to?: number
}

/**
 * Remotion의 spring() 함수 호환 구현
 * 물리 기반 스프링 애니메이션
 */
export function spring(options: SpringOptions): number {
  const {
    frame,
    fps,
    config = {},
    delay = 0,
    durationInFrames,
    from = 0,
    to = 1,
  } = options

  const { damping = 10, stiffness = 100, mass = 1 } = config

  // 딜레이 처리
  const effectiveFrame = frame - delay
  if (effectiveFrame < 0) return from

  // duration이 지정되면 해당 프레임 수에 맞춰 스케일링
  const timeScale = durationInFrames ? fps / (durationInFrames / 1) : 1
  const time = (effectiveFrame / fps) * timeScale

  // 스프링 물리 계산 (감쇠 진동)
  const omega = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  let value: number
  if (zeta < 1) {
    // Underdamped (oscillating)
    const omegaD = omega * Math.sqrt(1 - zeta * zeta)
    value = 1 - Math.exp(-zeta * omega * time) * (Math.cos(omegaD * time) + (zeta * omega / omegaD) * Math.sin(omegaD * time))
  } else if (zeta === 1) {
    // Critically damped
    value = 1 - Math.exp(-omega * time) * (1 + omega * time)
  } else {
    // Overdamped
    const s1 = -omega * (zeta - Math.sqrt(zeta * zeta - 1))
    const s2 = -omega * (zeta + Math.sqrt(zeta * zeta - 1))
    value = 1 - (s2 * Math.exp(s1 * time) - s1 * Math.exp(s2 * time)) / (s2 - s1)
  }

  // Clamp to [0, 1] and map to [from, to]
  value = Math.max(0, Math.min(1, value))
  return from + value * (to - from)
}

// ===== Easing functions =====

export const Easing = {
  linear: (t: number) => t,
  
  // Quadratic
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  // Custom easing factory
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    // Simplified cubic bezier (approximation)
    return (t: number) => {
      const cx = 3 * x1
      const bx = 3 * (x2 - x1) - cx
      const ax = 1 - cx - bx
      const cy = 3 * y1
      const by = 3 * (y2 - y1) - cy
      const ay = 1 - cy - by
      
      // Solve for t given x (Newton-Raphson approximation)
      let x = t
      for (let i = 0; i < 5; i++) {
        const xEst = ((ax * x + bx) * x + cx) * x
        const dx = (3 * ax * x + 2 * bx) * x + cx
        if (Math.abs(dx) < 1e-6) break
        x -= (xEst - t) / dx
      }
      
      return ((ay * x + by) * x + cy) * x
    }
  },
}

// ===== Sequence helper =====

interface SequenceProps {
  from: number
  durationInFrames?: number
  children: React.ReactNode
}

/**
 * Remotion의 <Sequence> 컴포넌트 호환 구현
 */
export const Sequence: React.FC<SequenceProps> = ({ from, durationInFrames, children }) => {
  const frame = useHUDFrame()
  
  // from 이전이면 렌더링하지 않음
  if (frame < from) return null
  
  // duration이 있고 그 이후면 렌더링하지 않음
  if (durationInFrames !== undefined && frame >= from + durationInFrames) return null
  
  return <>{children}</>
}

// ===== Type definitions for Remotion-style HUD =====

export interface RemotionHUDProps extends HUDComponentProps {
  // 추가 props가 필요하면 여기에
}
