/**
 * 불 PNG 시퀀스 애니메이션 컴포넌트
 * - 368장의 PNG를 순차적으로 재생
 * - 30fps 기준
 * - 🎬 Remotion 렌더링 모드에서는 외부 타임스탬프로 프레임 동기화
 */

import React, { useEffect, useState, useRef, type CSSProperties } from 'react'
import { useImagePath, useIsRenderMode, useExternalTimestamp } from '../HexaTacticalHUD'

interface FireSequenceProps {
  /** 재생 여부 */
  playing?: boolean
  /** FPS (기본 30) */
  fps?: number
  /** 총 프레임 수 */
  totalFrames?: number
  /** 루프 여부 */
  loop?: boolean
  /** 크기 */
  width?: number | string
  height?: number | string
  /** 블렌드 모드 (screen, add 등 - 검은 배경 제거용) */
  blendMode?: CSSProperties['mixBlendMode']
  /** 투명도 */
  opacity?: number
  /** 스타일 */
  style?: CSSProperties
  /** 클래스 */
  className?: string
  /** 이미지 기본 경로 (Remotion 환경용) */
  basePath?: string
  /** 불 시작 타임스탬프 (ms) - 렌더링 모드에서 동기화용 */
  startTimestamp?: number
}

export const FireSequence: React.FC<FireSequenceProps> = ({
  playing = true,
  fps = 30,
  totalFrames = 368,
  loop = true,
  width = '100%',
  height = '100%',
  blendMode = 'screen', // 검은 배경 자동 제거
  opacity = 1,
  style,
  className,
  basePath,
  startTimestamp = 0,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0)
  const intervalRef = useRef<number | null>(null)
  const isRenderMode = useIsRenderMode()
  const externalTimestamp = useExternalTimestamp()
  
  // Context에서 경로 가져오기 (Remotion 환경용)
  const fireBasePath = useImagePath('fireSeq', basePath || '/fire-seq')

  // 이미지 경로 생성
  const getFireImagePath = (frameNum: number) => {
    const frameStr = String(frameNum).padStart(4, '0')
    return `${fireBasePath}/fire_${frameStr}.png`
  }

  // 프레임 미리 로드 (성능 최적화)
  useEffect(() => {
    // 처음 몇 프레임만 미리 로드
    for (let i = 0; i < Math.min(30, totalFrames); i++) {
      const img = new Image()
      img.src = getFireImagePath(i)
    }
  }, [totalFrames, fireBasePath])

  // 🎬 렌더링 모드: 외부 타임스탬프로 프레임 계산 (타이머 없음)
  useEffect(() => {
    if (!isRenderMode || !playing) return
    
    // 불 효과 시작 후 경과 시간 (ms)
    const elapsed = externalTimestamp - startTimestamp
    if (elapsed < 0) {
      setCurrentFrame(0)
      return
    }
    
    // 프레임 계산 (30fps 기준)
    const frameDuration = 1000 / fps
    let frameIndex = Math.floor(elapsed / frameDuration)
    
    if (loop) {
      frameIndex = frameIndex % totalFrames
    } else {
      frameIndex = Math.min(frameIndex, totalFrames - 1)
    }
    
    setCurrentFrame(frameIndex)
  }, [isRenderMode, playing, externalTimestamp, startTimestamp, fps, totalFrames, loop])

  // 🎮 일반 모드: setInterval로 프레임 진행
  useEffect(() => {
    // 렌더링 모드에서는 타이머 사용 안 함
    if (isRenderMode) return
    
    if (!playing) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const frameDuration = 1000 / fps

    intervalRef.current = window.setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1
        if (next >= totalFrames) {
          return loop ? 0 : totalFrames - 1
        }
        return next
      })
    }, frameDuration)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRenderMode, playing, fps, totalFrames, loop])

  const imageSrc = getFireImagePath(currentFrame)

  return (
    <img
      src={imageSrc}
      alt=""
      className={className}
      style={{
        width,
        height,
        objectFit: 'contain',
        mixBlendMode: blendMode,
        opacity,
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

export default FireSequence
