/**
 * 🎭 Theatre.js 애니메이션 모듈
 */

// 프리셋
export {
  ANIMATION_PRESETS,
  getPresetKeyframes,
  offsetKeyframes,
} from './presets'
export type { AnimationKeyframes, Keyframe, AnimationPresetName } from './presets'

// 보간
export {
  interpolateKeyframes,
  valuesToStyle,
  getAnimationDuration,
} from './interpolate'
export type { InterpolatedValues } from './interpolate'

// 컴포넌트
export {
  FrameAnimated,
  ConditionalFrameAnimated,
  LoopFrameAnimated,
} from './FrameAnimated'

// 애니메이션 이벤트 로그
export { animationEventLog, useAnimationEventLog } from './AnimationEventLog'
export type { AnimationEvent, AnimationEventType } from './AnimationEventLog'
