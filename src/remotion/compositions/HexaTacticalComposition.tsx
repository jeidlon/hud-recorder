/**
 * 🎮 Hexa-Tactical HUD Composition
 * 
 * hexa-tactical 프리셋 전용 Remotion Composition
 * 
 * 특징:
 * - 완전한 시나리오 시퀀스 지원 (온보딩, 몬스터 모드, 사망 등)
 * - Event Sourcing 기반 상태 복원
 * - CSS 애니메이션 → 프레임 기반 변환
 * - 비디오 오버레이 또는 투명 배경 지원
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Video,
  staticFile,
  CalculateMetadataFunction,
  delayRender,
  continueRender,
  Sequence,
} from "remotion";
import { HexaTacticalHUD, ImagePathProvider } from "../../presets/hexaTactical";
import type { ExternalHUDState } from "../../presets";
import { EventReplayer, type HUDEvent } from "../../core/EventSourceLog";
import {
  getOnboardingStep,
  getMonsterModeState,
  getFireSequenceFrame,
  getLoadingProgress,
} from "../utils/frameAnimations";
import { GlobalRemotionFix } from "../utils/GlobalAnimationFix";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface HexaTacticalProps {
  /** 비디오 소스 (없으면 투명 배경) */
  videoSrc?: string;
  
  /** 시나리오 모드 */
  scenario?: 'idle' | 'onboarding' | 'monster' | 'custom';
  
  /** 온보딩 시작 프레임 (scenario가 'onboarding'일 때) */
  onboardingStartFrame?: number;
  
  /** 몬스터 모드 시작 프레임 (scenario가 'monster'일 때) */
  monsterStartFrame?: number;
  
  /** Fire 효과 시작 프레임 (루비안) */
  fireRubianStartFrame?: number;
  
  /** Fire 효과 시작 프레임 (수빈사랑) */
  fireSubinStartFrame?: number;
  
  /** HUD 상태 로그 JSON (custom 시나리오용) */
  hudStateLogJson?: string;
  
  /** HUD 이벤트 로그 JSON (Event Sourcing) */
  hudEventsJson?: string;
  
  /** 플레이어 체력 (0-1500) */
  playerHealth?: number;
  
  /** 플레이어 마나 (0-800) */
  playerMana?: number;
  
  /** 사망 상태 */
  isDead?: boolean;
  
  /** 배경 색상 (투명 배경일 때) */
  backgroundColor?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상태 스냅샷 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface HUDStateSnapshot {
  timestamp: number;
  mouse: { x: number; y: number; buttons: number };
  targets?: Record<string, { x: number; y: number; locked: boolean }>;
  customData?: unknown;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 폰트 스타일
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Black+Han+Sans&family=Orbitron:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;700&display=swap');

  @font-face {
    font-family: 'AstaSans';
    src: url('${staticFile('fonts/AstaSans-VariableFont_wght.ttf')}') format('truetype');
    font-weight: 100 900;
    font-style: normal;
    font-display: block;
  }
  
  @font-face {
    font-family: 'Outfit';
    src: url('${staticFile('fonts/Outfit-SemiBold.ttf')}') format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: block;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상태 보간 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function interpolateHUDState(
  hudStateLog: HUDStateSnapshot[],
  timestampMs: number
): ExternalHUDState {
  if (hudStateLog.length === 0) {
    return {
      timestamp: timestampMs,
      mouse: { x: 960, y: 540 },
    };
  }

  let beforeIdx = -1;
  let left = 0;
  let right = hudStateLog.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (hudStateLog[mid].timestamp <= timestampMs) {
      beforeIdx = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (beforeIdx < 0) {
    const state = hudStateLog[0];
    return {
      timestamp: timestampMs,
      mouse: { x: state.mouse.x, y: state.mouse.y },
      customData: state.customData as Record<string, unknown>,
    };
  }

  if (beforeIdx >= hudStateLog.length - 1) {
    const state = hudStateLog[hudStateLog.length - 1];
    return {
      timestamp: timestampMs,
      mouse: { x: state.mouse.x, y: state.mouse.y },
      customData: state.customData as Record<string, unknown>,
    };
  }

  const before = hudStateLog[beforeIdx];
  const after = hudStateLog[beforeIdx + 1];
  const t = (timestampMs - before.timestamp) / (after.timestamp - before.timestamp);

  return {
    timestamp: timestampMs,
    mouse: {
      x: before.mouse.x + (after.mouse.x - before.mouse.x) * t,
      y: before.mouse.y + (after.mouse.y - before.mouse.y) * t,
    },
    customData: before.customData as Record<string, unknown>,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 Composition
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HexaTacticalComposition: React.FC<HexaTacticalProps> = ({
  videoSrc,
  scenario = 'idle',
  onboardingStartFrame = 0,
  monsterStartFrame = 0,
  fireRubianStartFrame,
  fireSubinStartFrame,
  hudStateLogJson = '[]',
  hudEventsJson,
  playerHealth = 1500,
  playerMana = 800,
  isDead = false,
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [handle] = useState(() => delayRender("Loading fonts and assets"));

  // JSON 파싱
  const hudStateLog = useMemo<HUDStateSnapshot[]>(() => {
    try {
      return JSON.parse(hudStateLogJson);
    } catch {
      return [];
    }
  }, [hudStateLogJson]);

  const hudEvents = useMemo<HUDEvent[]>(() => {
    try {
      if (!hudEventsJson) return [];
      return JSON.parse(hudEventsJson);
    } catch {
      return [];
    }
  }, [hudEventsJson]);

  // Event Replayer
  const eventReplayer = useMemo(() => {
    return new EventReplayer(hudEvents);
  }, [hudEvents]);

  // 현재 타임스탬프
  const timestampMs = (frame / fps) * 1000;

  // 시나리오별 상태 계산
  const scenarioState = useMemo(() => {
    if (scenario === 'onboarding') {
      const step = getOnboardingStep(frame, onboardingStartFrame, fps);
      const loadingProgress = getLoadingProgress(frame, onboardingStartFrame + Math.floor(fps * 11.7), fps, 5000);
      
      return {
        onboardingStep: step,
        syncProgress: loadingProgress.progress,
        syncComplete: loadingProgress.completed,
      };
    }
    
    if (scenario === 'monster') {
      const monsterState = getMonsterModeState(frame, monsterStartFrame, fps);
      return {
        ...monsterState,
        monsterMode: true,
      };
    }
    
    return {};
  }, [scenario, frame, onboardingStartFrame, monsterStartFrame, fps]);

  // Fire 효과 상태
  const fireState = useMemo(() => {
    const rubianFrame = fireRubianStartFrame !== undefined
      ? getFireSequenceFrame(frame, fireRubianStartFrame, fps)
      : null;
    const subinFrame = fireSubinStartFrame !== undefined
      ? getFireSequenceFrame(frame, fireSubinStartFrame, fps)
      : null;
    
    return {
      showFireRubian: rubianFrame !== null,
      showFireSubin: subinFrame !== null,
      fireStartTimes: {
        rubian: fireRubianStartFrame !== undefined ? (fireRubianStartFrame / fps) * 1000 : null,
        subin: fireSubinStartFrame !== undefined ? (fireSubinStartFrame / fps) * 1000 : null,
      },
    };
  }, [frame, fireRubianStartFrame, fireSubinStartFrame, fps]);

  // Event Sourcing 상태 복원
  const replayedState = useMemo(() => {
    if (hudEvents.length > 0) {
      return eventReplayer.getStateAt(timestampMs);
    }
    return null;
  }, [eventReplayer, timestampMs, hudEvents.length]);

  // 기본 상태 계산
  const baseState = useMemo(() => {
    return hudStateLog.length > 0
      ? interpolateHUDState(hudStateLog, timestampMs)
      : { timestamp: timestampMs, mouse: { x: 960, y: 540 } };
  }, [hudStateLog, timestampMs]);

  // 최종 External State 계산
  const externalState = useMemo<ExternalHUDState>(() => {
    const customData: Record<string, unknown> = {
      ...(baseState.customData || {}),
      // 시나리오 상태
      ...scenarioState,
      // Fire 상태
      ...fireState,
      // 플레이어 상태
      player: {
        health: playerHealth,
        maxHealth: 1500,
        energy: playerMana,
        maxEnergy: 800,
        level: 45,
        exp: 75,
      },
      isDead,
    };
    
    // Event Sourcing 데이터 병합
    if (replayedState) {
      customData.scenario = replayedState.scenario;
      customData.themeMode = replayedState.theme;
      customData.isDead = replayedState.isDead;
      customData.player = {
        health: replayedState.hp,
        maxHealth: replayedState.maxHp,
        energy: replayedState.mp,
        maxEnergy: replayedState.maxMp,
        level: 45,
        exp: 75,
      };
      customData.showFireRubian = replayedState.fireRubian;
      customData.showFireSubin = replayedState.fireSubin;
      customData.fireStartTimes = replayedState.fireStartTime;
    }
    
    return {
      ...baseState,
      customData,
    };
  }, [baseState, scenarioState, fireState, replayedState, playerHealth, playerMana, isDead]);

  // 이미지 경로
  const imagePaths = useMemo(() => ({
    jihoon: staticFile('jihoon_profile_1.png'),
    soyeong: staticFile('soyeong_pr_1.png'),
    minjun: staticFile('minjun_pr_1.png'),
    fireSeq: staticFile('fire-seq'),
  }), []);

  // 에셋 로딩
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const profileImages = [imagePaths.jihoon, imagePaths.soyeong, imagePaths.minjun];
        const imagePromises = profileImages.map(src => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
          });
        });
        
        // Fire 시퀀스 프리로드 (첫 10프레임)
        for (let i = 0; i < 10; i++) {
          const frameNum = String(i).padStart(4, '0');
          const fireSrc = `${imagePaths.fireSeq}/fire_${frameNum}.png`;
          imagePromises.push(
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = fireSrc;
            })
          );
        }
        
        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
        }
        
        continueRender(handle);
      } catch (error) {
        console.error('[HexaTacticalComposition] Asset loading error:', error);
        continueRender(handle);
      }
    };
    
    loadAssets();
  }, [handle, imagePaths]);

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {/* 🎬 CSS Animation 자동 프레임 동기화 - 모든 animation을 현재 프레임에 맞게 고정 */}
      <GlobalRemotionFix frame={frame} fps={fps} disableTransitions={true} />
      
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      
      {/* 배경 비디오 */}
      {videoSrc && (
        <Video
          src={videoSrc.startsWith("http") ? videoSrc : staticFile(videoSrc)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}

      {/* HUD 오버레이 */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ width, height }}>
          <ImagePathProvider value={imagePaths}>
            <HexaTacticalHUD
              width={width}
              height={height}
              isPlaying={true}
              externalState={externalState}
              onStateUpdate={() => {}}
              onReady={() => {}}
              renderMode={{
                isRendering: true,
                currentFrame: frame,
                fps,
              }}
            />
          </ImagePathProvider>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Metadata 계산
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const calculateHexaTacticalMetadata: CalculateMetadataFunction<
  HexaTacticalProps & { durationInFrames?: number }
> = async ({ props }) => {
  if (props.durationInFrames && props.durationInFrames > 0) {
    return {
      durationInFrames: props.durationInFrames,
    };
  }
  
  // 시나리오별 기본 길이
  if (props.scenario === 'onboarding') {
    return {
      durationInFrames: 30 * 20, // 20초
    };
  }
  
  if (props.scenario === 'monster') {
    return {
      durationInFrames: 30 * 10, // 10초
    };
  }
  
  // HUD 상태 로그에서 계산
  try {
    if (props.hudStateLogJson) {
      const hudStateLog: HUDStateSnapshot[] = JSON.parse(props.hudStateLogJson);
      if (hudStateLog.length > 0) {
        const lastTimestamp = hudStateLog[hudStateLog.length - 1].timestamp;
        return {
          durationInFrames: Math.max(Math.ceil((lastTimestamp / 1000) * 30), 30),
        };
      }
    }
  } catch {
    // 파싱 실패
  }

  return {
    durationInFrames: 300, // 기본 10초
  };
};

export default HexaTacticalComposition;
