/**
 * 🎭 Remotion ↔ Theatre.js 어댑터
 * 
 * Remotion의 useCurrentFrame()을 Theatre.js 시퀀스와 동기화합니다.
 * 이 어댑터를 통해 Theatre.js 애니메이션이 Remotion 렌더링과 완벽히 동기화됩니다.
 */

import React, { useEffect, createContext, useContext, useMemo } from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import { setSequencePosition, mainSheet } from './setup'

interface TheatreFrameContextValue {
  /** 현재 프레임 번호 */
  frame: number
  /** FPS */
  fps: number
  /** 현재 시간 (초) */
  time: number
  /** 총 프레임 수 */
  totalFrames: number
  /** 진행률 (0~1) */
  progress: number
}

const TheatreFrameContext = createContext<TheatreFrameContextValue>({
  frame: 0,
  fps: 60,
  time: 0,
  totalFrames: 1,
  progress: 0,
})

/**
 * Remotion 프레임을 Theatre.js 시퀀스와 동기화하는 Provider
 * 
 * @example
 * ```tsx
 * // Remotion 컴포지션 내부에서 사용
 * <RemotionTheatreProvider>
 *   <HUDOverlay />
 * </RemotionTheatreProvider>
 * ```
 */
export function RemotionTheatreProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Theatre.js 시퀀스 위치 업데이트
  useEffect(() => {
    setSequencePosition(frame, fps)
  }, [frame, fps])

  const contextValue = useMemo<TheatreFrameContextValue>(() => ({
    frame,
    fps,
    time: frame / fps,
    totalFrames: durationInFrames,
    progress: frame / durationInFrames,
  }), [frame, fps, durationInFrames])

  return (
    <TheatreFrameContext.Provider value={contextValue}>
      {children}
    </TheatreFrameContext.Provider>
  )
}

/**
 * 현재 Theatre 프레임 정보를 가져오는 훅
 */
export function useTheatreFrame(): TheatreFrameContextValue {
  return useContext(TheatreFrameContext)
}

/**
 * 외부 타임스탬프를 사용하는 Provider (Remotion 외부에서 사용)
 * 
 * @example
 * ```tsx
 * // 일반 React 앱에서 사용
 * <TheatreTimeProvider timestamp={Date.now() - startTime}>
 *   <HUDOverlay />
 * </TheatreTimeProvider>
 * ```
 */
export function TheatreTimeProvider({ 
  timestamp,
  fps = 60,
  totalDuration = 10000, // 기본 10초
  children,
}: { 
  timestamp: number
  fps?: number
  totalDuration?: number
  children: React.ReactNode 
}) {
  const frame = Math.floor((timestamp / 1000) * fps)
  const totalFrames = Math.ceil((totalDuration / 1000) * fps)

  // Theatre.js 시퀀스 위치 업데이트
  useEffect(() => {
    setSequencePosition(frame, fps)
  }, [frame, fps])

  const contextValue = useMemo<TheatreFrameContextValue>(() => ({
    frame,
    fps,
    time: timestamp / 1000,
    totalFrames,
    progress: Math.min(1, timestamp / totalDuration),
  }), [frame, fps, timestamp, totalFrames, totalDuration])

  return (
    <TheatreFrameContext.Provider value={contextValue}>
      {children}
    </TheatreFrameContext.Provider>
  )
}

/**
 * Theatre.js 시퀀스 상태를 직접 제어하는 훅
 */
export function useTheatreSequence() {
  return {
    /** 특정 위치로 이동 */
    seek: (timeInSeconds: number) => {
      mainSheet.sequence.position = timeInSeconds
    },
    
    /** 재생 */
    play: async (options?: { rate?: number; range?: [number, number] }) => {
      return mainSheet.sequence.play({
        rate: options?.rate ?? 1,
        range: options?.range,
      })
    },
    
    /** 일시정지 */
    pause: () => {
      mainSheet.sequence.pause()
    },
    
    /** 현재 위치 */
    get position() {
      return mainSheet.sequence.position
    },
  }
}

export { TheatreFrameContext }
