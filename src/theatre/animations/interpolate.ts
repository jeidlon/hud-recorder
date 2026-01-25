/**
 * 🎭 키프레임 보간 시스템
 * 
 * 정의된 키프레임을 현재 시간에 맞게 보간합니다.
 * 이것이 프레임 정확한 애니메이션의 핵심입니다.
 */

import type { AnimationKeyframes, Keyframe } from './presets'

/**
 * 이징 함수들
 */
const easingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
}

/**
 * 두 키프레임 사이에서 현재 시간의 값을 보간
 */
function interpolateValue(
  prevKf: Keyframe,
  nextKf: Keyframe,
  currentTime: number
): number {
  const duration = nextKf.time - prevKf.time
  if (duration === 0) return nextKf.value
  
  const progress = (currentTime - prevKf.time) / duration
  const clampedProgress = Math.max(0, Math.min(1, progress))
  
  // 이징 적용
  const easing = easingFunctions[nextKf.easing || 'linear']
  const easedProgress = easing(clampedProgress)
  
  // 선형 보간
  return prevKf.value + (nextKf.value - prevKf.value) * easedProgress
}

/**
 * 키프레임 배열에서 현재 시간의 값을 계산
 */
function getValueAtTime(keyframes: Keyframe[], time: number): number {
  if (keyframes.length === 0) return 0
  if (keyframes.length === 1) return keyframes[0].value
  
  // 첫 키프레임 이전
  if (time <= keyframes[0].time) {
    return keyframes[0].value
  }
  
  // 마지막 키프레임 이후
  if (time >= keyframes[keyframes.length - 1].time) {
    return keyframes[keyframes.length - 1].value
  }
  
  // 두 키프레임 사이 찾기
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
      return interpolateValue(keyframes[i], keyframes[i + 1], time)
    }
  }
  
  return keyframes[keyframes.length - 1].value
}

/**
 * 애니메이션 값 타입
 */
export interface InterpolatedValues {
  opacity: number
  x: number
  y: number
  scale: number
  rotate: number
}

/**
 * 키프레임 세트를 현재 시간에 맞게 보간
 * 
 * @param keyframes 키프레임 정의
 * @param time 현재 시간 (초)
 * @param startTime 애니메이션 시작 시간 (초)
 */
export function interpolateKeyframes(
  keyframes: AnimationKeyframes,
  time: number,
  startTime: number = 0
): InterpolatedValues {
  const relativeTime = time - startTime
  
  return {
    opacity: keyframes.opacity 
      ? getValueAtTime(keyframes.opacity, relativeTime) 
      : 1,
    x: keyframes.x 
      ? getValueAtTime(keyframes.x, relativeTime) 
      : 0,
    y: keyframes.y 
      ? getValueAtTime(keyframes.y, relativeTime) 
      : 0,
    scale: keyframes.scale 
      ? getValueAtTime(keyframes.scale, relativeTime) 
      : 1,
    rotate: keyframes.rotate 
      ? getValueAtTime(keyframes.rotate, relativeTime) 
      : 0,
  }
}

/**
 * 보간된 값을 CSS 스타일로 변환
 */
export function valuesToStyle(values: InterpolatedValues): React.CSSProperties {
  return {
    opacity: values.opacity,
    transform: `translate(${values.x}px, ${values.y}px) scale(${values.scale}) rotate(${values.rotate}deg)`,
  }
}

/**
 * 키프레임 애니메이션의 총 길이 계산 (초)
 */
export function getAnimationDuration(keyframes: AnimationKeyframes): number {
  let maxTime = 0
  
  for (const kfs of Object.values(keyframes)) {
    if (kfs && kfs.length > 0) {
      const lastKf = kfs[kfs.length - 1]
      if (lastKf.time > maxTime) {
        maxTime = lastKf.time
      }
    }
  }
  
  return maxTime
}
