/**
 * 🎭 Theatre.js React 훅
 * 
 * Theatre.js 애니메이션을 React 컴포넌트에서 사용하기 쉽게 래핑합니다.
 * Remotion의 useCurrentFrame()과 자동 동기화됩니다.
 */

import { useEffect, useState, useRef, useMemo } from 'react'
import { ISheetObject, UnknownShorthandCompoundProps } from '@theatre/core'
import { mainSheet, createHUDObject, setSequencePosition, AnimationProps } from './setup'

type AnimationType = keyof typeof AnimationProps

interface UseTheatreAnimationOptions {
  /** 고유 오브젝트 ID */
  objectId: string
  /** 애니메이션 타입 */
  type?: AnimationType
  /** 외부 프레임 (Remotion 연동용) */
  externalFrame?: number
  /** FPS */
  fps?: number
}

interface AnimationValues {
  opacity: number
  x: number
  y: number
  scale: number
  rotate: number
}

/**
 * Theatre.js 애니메이션 훅
 * 
 * @example
 * ```tsx
 * const { values, style } = useTheatreAnimation({
 *   objectId: 'OnboardingPopup',
 *   type: 'fadeIn',
 *   externalFrame: currentFrame,
 * })
 * 
 * return <div style={style}>...</div>
 * ```
 */
export function useTheatreAnimation(options: UseTheatreAnimationOptions) {
  const { objectId, type = 'transform', externalFrame, fps = 60 } = options
  
  const [values, setValues] = useState<AnimationValues>({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
  })

  const objectRef = useRef<ISheetObject<UnknownShorthandCompoundProps> | null>(null)

  // Sheet Object 생성 (한 번만)
  useEffect(() => {
    if (!objectRef.current) {
      objectRef.current = createHUDObject(objectId, type)
    }

    // 값 변화 구독
    const unsubscribe = objectRef.current.onValuesChange((newValues) => {
      setValues({
        opacity: (newValues as any).opacity ?? 1,
        x: (newValues as any).x ?? 0,
        y: (newValues as any).y ?? 0,
        scale: (newValues as any).scale ?? 1,
        rotate: (newValues as any).rotate ?? 0,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [objectId, type])

  // 외부 프레임과 동기화
  useEffect(() => {
    if (externalFrame !== undefined) {
      setSequencePosition(externalFrame, fps)
    }
  }, [externalFrame, fps])

  // CSS 스타일 객체 생성
  const style = useMemo(() => ({
    opacity: values.opacity,
    transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)`,
  }), [values])

  return {
    values,
    style,
    object: objectRef.current,
  }
}

/**
 * 간단한 Theatre.js 래퍼 컴포넌트
 */
interface TheatreAnimatedProps {
  objectId: string
  type?: AnimationType
  externalFrame?: number
  fps?: number
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function TheatreAnimated({
  objectId,
  type = 'transform',
  externalFrame,
  fps = 60,
  children,
  className,
  style: customStyle,
}: TheatreAnimatedProps) {
  const { style } = useTheatreAnimation({
    objectId,
    type,
    externalFrame,
    fps,
  })

  return (
    <div 
      className={className} 
      style={{ ...style, ...customStyle }}
    >
      {children}
    </div>
  )
}

export default useTheatreAnimation
