/**
 * 🎭 Theatre.js 애니메이션 프리셋
 * 
 * Framer Motion에서 사용하던 애니메이션을 Theatre.js 키프레임으로 정의합니다.
 * 이 키프레임들은 Theatre.js Studio에서 편집하거나,
 * 코드에서 직접 적용할 수 있습니다.
 */

/**
 * 키프레임 타입 정의
 */
export interface Keyframe {
  time: number  // 초 단위
  value: number
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface AnimationKeyframes {
  opacity?: Keyframe[]
  x?: Keyframe[]
  y?: Keyframe[]
  scale?: Keyframe[]
  rotate?: Keyframe[]
}

/**
 * 애니메이션 프리셋 정의
 */
export const ANIMATION_PRESETS = {
  // 페이드인 (0.3초)
  fadeIn: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.3, value: 1, easing: 'easeOut' },
    ],
    y: [
      { time: 0, value: 20 },
      { time: 0.3, value: 0, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 페이드아웃 (0.3초)
  fadeOut: {
    opacity: [
      { time: 0, value: 1 },
      { time: 0.3, value: 0, easing: 'easeIn' },
    ],
    y: [
      { time: 0, value: 0 },
      { time: 0.3, value: -20, easing: 'easeIn' },
    ],
  } as AnimationKeyframes,

  // 슬라이드 인 (왼쪽에서)
  slideInLeft: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.4, value: 1, easing: 'easeOut' },
    ],
    x: [
      { time: 0, value: -50 },
      { time: 0.4, value: 0, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 슬라이드 인 (오른쪽에서)
  slideInRight: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.4, value: 1, easing: 'easeOut' },
    ],
    x: [
      { time: 0, value: 50 },
      { time: 0.4, value: 0, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 스케일 인
  scaleIn: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.3, value: 1, easing: 'easeOut' },
    ],
    scale: [
      { time: 0, value: 0.8 },
      { time: 0.3, value: 1, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 스케일 아웃
  scaleOut: {
    opacity: [
      { time: 0, value: 1 },
      { time: 0.2, value: 0, easing: 'easeIn' },
    ],
    scale: [
      { time: 0, value: 1 },
      { time: 0.2, value: 0.8, easing: 'easeIn' },
    ],
  } as AnimationKeyframes,

  // 펄스 (반복용)
  pulse: {
    scale: [
      { time: 0, value: 1 },
      { time: 0.5, value: 1.05, easing: 'easeInOut' },
      { time: 1, value: 1, easing: 'easeInOut' },
    ],
  } as AnimationKeyframes,

  // 흔들림 (damage 효과)
  shake: {
    x: [
      { time: 0, value: 0 },
      { time: 0.05, value: -10 },
      { time: 0.1, value: 10 },
      { time: 0.15, value: -10 },
      { time: 0.2, value: 10 },
      { time: 0.25, value: 0, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 바운스
  bounce: {
    y: [
      { time: 0, value: -20 },
      { time: 0.15, value: 0, easing: 'easeOut' },
      { time: 0.3, value: -8 },
      { time: 0.45, value: 0, easing: 'easeOut' },
      { time: 0.6, value: -3 },
      { time: 0.75, value: 0, easing: 'easeOut' },
    ],
    opacity: [
      { time: 0, value: 0 },
      { time: 0.15, value: 1 },
    ],
  } as AnimationKeyframes,

  // 몬스터 배너 (위에서 내려옴)
  monsterBannerIn: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.5, value: 1, easing: 'easeOut' },
    ],
    y: [
      { time: 0, value: -100 },
      { time: 0.5, value: 0, easing: 'easeOut' },
    ],
    scale: [
      { time: 0, value: 0.9 },
      { time: 0.5, value: 1, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 타겟 락온 (스케일 + 회전)
  targetLock: {
    opacity: [
      { time: 0, value: 0 },
      { time: 0.2, value: 1 },
    ],
    scale: [
      { time: 0, value: 1.5 },
      { time: 0.3, value: 1, easing: 'easeOut' },
    ],
    rotate: [
      { time: 0, value: 45 },
      { time: 0.3, value: 0, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,

  // 히트마커
  hitMarker: {
    opacity: [
      { time: 0, value: 1 },
      { time: 0.1, value: 1 },
      { time: 0.3, value: 0, easing: 'easeOut' },
    ],
    scale: [
      { time: 0, value: 0.5 },
      { time: 0.1, value: 1.2, easing: 'easeOut' },
      { time: 0.3, value: 1 },
    ],
  } as AnimationKeyframes,

  // 데스 스크린
  deathScreen: {
    opacity: [
      { time: 0, value: 0 },
      { time: 1, value: 1, easing: 'easeOut' },
    ],
    scale: [
      { time: 0, value: 1.1 },
      { time: 1, value: 1, easing: 'easeOut' },
    ],
  } as AnimationKeyframes,
}

export type AnimationPresetName = keyof typeof ANIMATION_PRESETS

/**
 * 프리셋 이름으로 키프레임 가져오기
 */
export function getPresetKeyframes(name: AnimationPresetName): AnimationKeyframes {
  return ANIMATION_PRESETS[name]
}

/**
 * 키프레임을 특정 시작 시간에 오프셋
 */
export function offsetKeyframes(
  keyframes: AnimationKeyframes,
  offsetTime: number
): AnimationKeyframes {
  const result: AnimationKeyframes = {}
  
  for (const [prop, kfs] of Object.entries(keyframes)) {
    if (kfs) {
      result[prop as keyof AnimationKeyframes] = kfs.map(kf => ({
        ...kf,
        time: kf.time + offsetTime,
      }))
    }
  }
  
  return result
}
