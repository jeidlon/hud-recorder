/**
 * 🎬 Remotion 프레임 기반 애니메이션 유틸리티
 * 
 * CSS @keyframes 애니메이션을 Remotion 프레임 기반으로 변환
 * 
 * 사용법:
 * - useCurrentFrame()으로 현재 프레임 가져오기
 * - 이 유틸리티로 CSS transform/opacity 등 계산
 */

import { interpolate } from "remotion";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Spin 애니메이션 (로딩 스피너)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CSS spin 애니메이션 대체
 * 
 * @example
 * // CSS: animation: spin 1s linear infinite
 * const rotation = getSpinRotation(frame, fps, 1000);
 * <div style={{ transform: `rotate(${rotation}deg)` }} />
 */
export function getSpinRotation(
  frame: number,
  fps: number,
  durationMs: number = 1000
): number {
  const framesPerRotation = (durationMs / 1000) * fps;
  const progress = (frame % framesPerRotation) / framesPerRotation;
  return progress * 360;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Glitch 애니메이션 (사망 효과)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CSS glitch 애니메이션 대체
 * 
 * @keyframes glitch {
 *   0% { transform: translate(0); }
 *   20% { transform: translate(-3px, 3px); }
 *   40% { transform: translate(-3px, -3px); }
 *   60% { transform: translate(3px, 3px); }
 *   80% { transform: translate(3px, -3px); }
 *   100% { transform: translate(0); }
 * }
 */
export function getGlitchTransform(
  frame: number,
  fps: number,
  durationMs: number = 150
): { x: number; y: number } {
  const framesPerCycle = (durationMs / 1000) * fps;
  const progress = (frame % framesPerCycle) / framesPerCycle;
  
  // Keyframe 위치
  if (progress < 0.2) {
    return { x: interpolate(progress, [0, 0.2], [0, -3]), y: interpolate(progress, [0, 0.2], [0, 3]) };
  } else if (progress < 0.4) {
    return { x: -3, y: interpolate(progress, [0.2, 0.4], [3, -3]) };
  } else if (progress < 0.6) {
    return { x: interpolate(progress, [0.4, 0.6], [-3, 3]), y: interpolate(progress, [0.4, 0.6], [-3, 3]) };
  } else if (progress < 0.8) {
    return { x: 3, y: interpolate(progress, [0.6, 0.8], [3, -3]) };
  } else {
    return { x: interpolate(progress, [0.8, 1], [3, 0]), y: interpolate(progress, [0.8, 1], [-3, 0]) };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Noise 애니메이션 (노이즈 오버레이)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CSS noise 애니메이션 대체 (opacity 변화)
 * 
 * @keyframes noise {
 *   0%, 100% { opacity: 0.03; }
 *   10% { opacity: 0.08; }
 *   20% { opacity: 0.04; }
 *   ...
 * }
 */
export function getNoiseOpacity(frame: number, fps: number): number {
  const noisePattern = [0.03, 0.08, 0.04, 0.1, 0.02, 0.07, 0.04, 0.09, 0.03, 0.06];
  const framesPerStep = fps * 0.02; // 20ms per step
  const stepIndex = Math.floor(frame / framesPerStep) % noisePattern.length;
  return noisePattern[stepIndex];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scanline 애니메이션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CSS scanline 애니메이션 대체
 * 
 * @keyframes scanline {
 *   0% { transform: translateY(-100%); }
 *   100% { transform: translateY(100%); }
 * }
 */
export function getScanlineY(
  frame: number,
  fps: number,
  durationMs: number = 2000,
  heightPercent: number = 200
): number {
  const framesPerCycle = (durationMs / 1000) * fps;
  const progress = (frame % framesPerCycle) / framesPerCycle;
  return interpolate(progress, [0, 1], [-heightPercent / 2, heightPercent / 2]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Monster Banner 애니메이션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 몬스터 배너 컨테이너 애니메이션
 * 
 * @keyframes monster-banner-container {
 *   0% { opacity: 0; transform: translateY(-50%) scaleY(0); }
 *   10% { opacity: 1; transform: translateY(-50%) scaleY(1); }
 *   90% { opacity: 1; transform: translateY(-50%) scaleY(1); }
 *   100% { opacity: 0; transform: translateY(-50%) scaleY(0); }
 * }
 */
export function getMonsterBannerContainer(
  frame: number,
  startFrame: number,
  fps: number,
  durationMs: number = 1500
): { opacity: number; scaleY: number } {
  const framesTotal = (durationMs / 1000) * fps;
  const elapsed = frame - startFrame;
  
  if (elapsed < 0) return { opacity: 0, scaleY: 0 };
  if (elapsed >= framesTotal) return { opacity: 0, scaleY: 0 };
  
  const progress = elapsed / framesTotal;
  
  if (progress < 0.1) {
    // 0-10%: Enter
    const t = progress / 0.1;
    return { opacity: t, scaleY: t };
  } else if (progress < 0.9) {
    // 10-90%: Visible
    return { opacity: 1, scaleY: 1 };
  } else {
    // 90-100%: Exit
    const t = (progress - 0.9) / 0.1;
    return { opacity: 1 - t, scaleY: 1 - t };
  }
}

/**
 * 몬스터 배너 텍스트 슬라이드 애니메이션
 * 
 * @keyframes monster-banner-text {
 *   0% { transform: translateX(-150%); }
 *   20% { transform: translateX(0%); }
 *   65% { transform: translateX(0%); }
 *   100% { transform: translateX(150%); }
 * }
 */
export function getMonsterBannerTextX(
  frame: number,
  startFrame: number,
  fps: number,
  durationMs: number = 1500,
  widthPercent: number = 150
): number {
  const framesTotal = (durationMs / 1000) * fps;
  const elapsed = frame - startFrame;
  
  if (elapsed < 0) return -widthPercent;
  if (elapsed >= framesTotal) return widthPercent;
  
  const progress = elapsed / framesTotal;
  
  if (progress < 0.2) {
    // 0-20%: Slide in
    return interpolate(progress, [0, 0.2], [-widthPercent, 0]);
  } else if (progress < 0.65) {
    // 20-65%: Stay
    return 0;
  } else {
    // 65-100%: Slide out
    return interpolate(progress, [0.65, 1], [0, widthPercent]);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 펄스 애니메이션 (블링크 효과)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 불규칙한 블링크 효과 (DANGER 텍스트 등)
 */
export function getBlinkOpacity(
  frame: number,
  fps: number,
  intervalMs: number = 300
): number {
  const framesPerBlink = (intervalMs / 1000) * fps;
  const step = Math.floor(frame / framesPerBlink);
  return step % 2 === 0 ? 1 : 0.3;
}

/**
 * 부드러운 펄스 효과 (glow 등)
 */
export function getPulseValue(
  frame: number,
  fps: number,
  durationMs: number = 2000,
  min: number = 0.8,
  max: number = 1
): number {
  const framesPerCycle = (durationMs / 1000) * fps;
  const progress = (frame % framesPerCycle) / framesPerCycle;
  // Sine wave for smooth pulse
  const t = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
  return min + t * (max - min);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 타이머 기반 시퀀스를 프레임 기반으로 변환
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 온보딩 시퀀스 단계 계산
 * 
 * 원본 타이밍:
 * - 0ms: code
 * - 3000ms: voice
 * - 7000ms: enter (voice + 4000)
 * - 8200ms: connecting (enter + 1200)
 * - 10200ms: success (connecting + 2000)
 * - 11700ms: sync (success + 1500)
 */
export type OnboardingStep = 'hidden' | 'code' | 'voice' | 'enter' | 'connecting' | 'success' | 'sync' | 'complete';

export function getOnboardingStep(
  frame: number,
  startFrame: number,
  fps: number
): OnboardingStep {
  const elapsed = frame - startFrame;
  if (elapsed < 0) return 'hidden';
  
  const ms = (elapsed / fps) * 1000;
  
  if (ms < 3000) return 'code';
  if (ms < 7000) return 'voice';
  if (ms < 8200) return 'enter';
  if (ms < 10200) return 'connecting';
  if (ms < 11700) return 'success';
  if (ms < 16700) return 'sync'; // 5초 동안 sync
  return 'complete';
}

/**
 * 몬스터 모드 시퀀스 단계 계산
 * 
 * 원본 타이밍:
 * - 0ms: 배너 표시
 * - 1500ms: UI 나가기 (uiAnimState = 'exiting')
 * - 1900ms: 테마 변경 + UI 들어오기 (themeMode = 'danger')
 * - 2300ms: 정상 상태 (uiAnimState = 'normal')
 */
export interface MonsterModeState {
  bannerVisible: boolean;
  uiAnimState: 'normal' | 'exiting' | 'entering';
  themeMode: 'normal' | 'danger';
  chatVisible: boolean;
}

export function getMonsterModeState(
  frame: number,
  startFrame: number,
  fps: number
): MonsterModeState {
  const elapsed = frame - startFrame;
  if (elapsed < 0) {
    return {
      bannerVisible: false,
      uiAnimState: 'normal',
      themeMode: 'normal',
      chatVisible: false,
    };
  }
  
  const ms = (elapsed / fps) * 1000;
  
  if (ms < 1500) {
    return {
      bannerVisible: true,
      uiAnimState: 'normal',
      themeMode: 'normal',
      chatVisible: false,
    };
  }
  
  if (ms < 1900) {
    return {
      bannerVisible: false,
      uiAnimState: 'exiting',
      themeMode: 'normal',
      chatVisible: false,
    };
  }
  
  if (ms < 2300) {
    return {
      bannerVisible: false,
      uiAnimState: 'entering',
      themeMode: 'danger',
      chatVisible: true,
    };
  }
  
  return {
    bannerVisible: false,
    uiAnimState: 'normal',
    themeMode: 'danger',
    chatVisible: true,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fire 시퀀스 프레임 계산
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Fire 시퀀스의 현재 프레임 번호 계산
 * 
 * @param currentFrame - Remotion 현재 프레임
 * @param startFrame - Fire 시작 프레임
 * @param fps - 비디오 FPS
 * @param fireSeqFps - Fire 시퀀스 FPS (기본 30)
 * @param totalFireFrames - Fire 시퀀스 총 프레임 수 (기본 360 = 12초)
 */
export function getFireSequenceFrame(
  currentFrame: number,
  startFrame: number,
  fps: number,
  fireSeqFps: number = 30,
  totalFireFrames: number = 360,
  loop: boolean = true
): number | null {
  const elapsed = currentFrame - startFrame;
  if (elapsed < 0) return null;
  
  // 비디오 FPS와 시퀀스 FPS가 다를 경우 보정
  const fireFrame = Math.floor(elapsed * (fireSeqFps / fps));
  
  if (loop) {
    return fireFrame % totalFireFrames;
  }
  
  return fireFrame >= totalFireFrames ? null : fireFrame;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLI 로딩바 진행률 계산
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * CLI 스타일 로딩바 진행률 계산
 * 
 * @param frame - 현재 프레임
 * @param startFrame - 로딩 시작 프레임
 * @param fps - FPS
 * @param durationMs - 로딩 지속 시간 (기본 5000ms)
 */
export function getLoadingProgress(
  frame: number,
  startFrame: number,
  fps: number,
  durationMs: number = 5000
): { progress: number; completed: boolean } {
  const elapsed = frame - startFrame;
  if (elapsed < 0) return { progress: 0, completed: false };
  
  const ms = (elapsed / fps) * 1000;
  const progress = Math.min(ms / durationMs, 1);
  
  return {
    progress: progress * 100,
    completed: progress >= 1,
  };
}

/**
 * CLI 로딩바 문자열 생성
 */
export function getLoadingBarString(
  progress: number,
  totalBlocks: number = 20
): string {
  const filledBlocks = Math.floor((progress / 100) * totalBlocks);
  return '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);
}
