/**
 * 🎭 Theatre.js 모듈 통합 export
 */

// 기본 설정
export {
  hudProject,
  mainSheet,
  AnimationProps,
  createHUDObject,
  setSequencePosition,
  playSequence,
  pauseSequence,
  getSequencePosition,
  initTheatreStudio,
  types,
} from './setup'

// React 훅
export {
  useTheatreAnimation,
  TheatreAnimated,
} from './useTheatreAnimation'

// Remotion 어댑터
export {
  RemotionTheatreProvider,
  TheatreTimeProvider,
  TheatreFrameContext,
  useTheatreFrame,
  useTheatreSequence,
} from './RemotionTheatreAdapter'

// 애니메이션 시스템
export {
  // 프리셋
  ANIMATION_PRESETS,
  getPresetKeyframes,
  offsetKeyframes,
  type AnimationKeyframes,
  type Keyframe,
  type AnimationPresetName,
  // 보간
  interpolateKeyframes,
  valuesToStyle,
  getAnimationDuration,
  type InterpolatedValues,
  // 컴포넌트
  FrameAnimated,
  ConditionalFrameAnimated,
  LoopFrameAnimated,
} from './animations'
