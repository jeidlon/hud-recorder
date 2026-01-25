/**
 * 🎬 GlobalAnimationFix - CSS Animation 자동 프레임 동기화
 * 
 * 이 컴포넌트가 있으면 어떤 CSS animation을 추가해도 자동으로 처리됩니다.
 * 
 * ## 문제
 * Remotion은 각 프레임을 독립적으로 렌더링합니다.
 * CSS animation은 시간 기반이라, 프레임 N을 렌더링할 때 animation이 0ms부터 시작해버립니다.
 * 
 * ## 해결책
 * animation-delay를 현재 프레임의 시간(음수)으로 설정하면,
 * 애니메이션이 그 시점부터 시작하는 것처럼 보입니다.
 * animation-play-state: paused로 해당 시점에서 멈춥니다.
 * 
 * ## 사용법
 * Remotion Composition 안에서 사용:
 * ```tsx
 * <GlobalAnimationFix frame={frame} fps={fps} />
 * ```
 * 
 * ## 장점
 * - 어떤 CSS animation을 추가해도 자동 처리
 * - 코드 수정 없이 Preview = Export 동일
 * - 모든 *, *::before, *::after에 적용
 */

import React from 'react';

interface GlobalAnimationFixProps {
  /** 현재 프레임 번호 (useCurrentFrame) */
  frame: number;
  /** FPS (useVideoConfig) */
  fps: number;
  /** 활성화 여부 (기본: true) */
  enabled?: boolean;
}

/**
 * CSS Animation을 현재 프레임에 맞게 자동 고정
 * 
 * @example
 * const frame = useCurrentFrame();
 * const { fps } = useVideoConfig();
 * 
 * return (
 *   <AbsoluteFill>
 *     <GlobalAnimationFix frame={frame} fps={fps} />
 *     <YourHUDComponent />
 *   </AbsoluteFill>
 * );
 */
export const GlobalAnimationFix: React.FC<GlobalAnimationFixProps> = ({
  frame,
  fps,
  enabled = true,
}) => {
  if (!enabled) return null;

  // 현재 프레임의 시간 (밀리초)
  const currentTimeMs = (frame / fps) * 1000;

  // 모든 요소의 animation을 현재 시간에 맞게 고정
  const cssOverride = `
    *, *::before, *::after {
      animation-delay: -${currentTimeMs}ms !important;
      animation-play-state: paused !important;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssOverride }} />;
};

/**
 * CSS Transition도 비활성화 (선택적)
 * 
 * Transition은 상태 변화 시 발생하므로, 프레임 기반 렌더링에서는
 * 이미 "변화된 상태"로 렌더링되어야 합니다.
 */
export const GlobalTransitionDisable: React.FC<{ enabled?: boolean }> = ({
  enabled = true,
}) => {
  if (!enabled) return null;

  const cssOverride = `
    *, *::before, *::after {
      transition: none !important;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssOverride }} />;
};

/**
 * 통합 컴포넌트 - Animation + Transition 모두 처리
 */
export const GlobalRemotionFix: React.FC<GlobalAnimationFixProps & {
  disableTransitions?: boolean;
}> = ({ frame, fps, enabled = true, disableTransitions = true }) => {
  if (!enabled) return null;

  const currentTimeMs = (frame / fps) * 1000;

  const cssOverride = `
    /* 🎬 Remotion Global Animation Fix */
    *, *::before, *::after {
      animation-delay: -${currentTimeMs}ms !important;
      animation-play-state: paused !important;
      ${disableTransitions ? 'transition: none !important;' : ''}
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: cssOverride }} />;
};

export default GlobalAnimationFix;
