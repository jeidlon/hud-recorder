/**
 * HUD Overlay Composition
 * 
 * 비디오 위에 HUD를 오버레이하는 Remotion Composition
 * 
 * 특징:
 * - 프레임 정확한 HUD 렌더링
 * - 🎬 Event Sourcing으로 상태 복원
 * - 비디오 + HUD 합성
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
} from "remotion";
import { HexaTacticalHUD, ImagePathProvider } from "../../presets/hexaTactical";
import type { ExternalHUDState } from "../../presets";
import { EventReplayer, type HUDEvent } from "../../core/EventSourceLog";
import { GlobalRemotionFix } from "../utils/GlobalAnimationFix";

// Props 타입
export interface HUDOverlayProps {
  /** 비디오 소스 (staticFile 경로 또는 URL) */
  videoSrc: string;
  /** HUD 프리셋 ID */
  hudPresetId: string;
  /** 입력 로그 JSON 문자열 */
  inputLogJson: string;
  /** HUD 상태 로그 JSON 문자열 */
  hudStateLogJson: string;
  /** 🎬 HUD 이벤트 로그 JSON 문자열 (Event Sourcing) */
  hudEventsJson?: string;
}

// 상태 스냅샷 타입
interface HUDStateSnapshot {
  timestamp: number;
  mouse: { x: number; y: number; buttons: number };
  targets?: Record<string, { x: number; y: number; locked: boolean }>;
  customData?: unknown;
}

/**
 * 특정 타임스탬프의 HUD 상태를 보간
 */
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

  // 이진 탐색으로 직전 상태 찾기
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

  // 선형 보간
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

// 폰트 CSS 스타일
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

  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;

/**
 * 메인 HUD 오버레이 Composition
 */
export const HUDOverlayComposition: React.FC<HUDOverlayProps> = ({
  videoSrc,
  hudPresetId,
  hudStateLogJson,
  hudEventsJson,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [handle] = useState(() => delayRender("Loading fonts and assets"));

  // JSON 파싱 (memoized)
  const hudStateLog = useMemo<HUDStateSnapshot[]>(() => {
    try {
      return JSON.parse(hudStateLogJson);
    } catch {
      return [];
    }
  }, [hudStateLogJson]);

  // 🎬 Event Sourcing: HUD 이벤트 파싱
  const hudEvents = useMemo<HUDEvent[]>(() => {
    try {
      if (!hudEventsJson) return [];
      return JSON.parse(hudEventsJson);
    } catch {
      return [];
    }
  }, [hudEventsJson]);

  // 🎬 Event Sourcing: 리플레이어 생성
  const eventReplayer = useMemo(() => {
    return new EventReplayer(hudEvents);
  }, [hudEvents]);

  // 현재 프레임의 타임스탬프 (ms)
  const timestampMs = (frame / fps) * 1000;

  // 🎬 Event Sourcing: 현재 프레임의 상태 복원
  const replayedState = useMemo(() => {
    if (hudEvents.length > 0) {
      return eventReplayer.getStateAt(timestampMs);
    }
    return null;
  }, [eventReplayer, timestampMs, hudEvents.length]);

  // 현재 프레임의 HUD 상태 계산 (기존 보간 + Event Sourcing 병합)
  const externalState = useMemo(() => {
    const baseState = interpolateHUDState(hudStateLog, timestampMs);
    
    // Event Sourcing 데이터가 있으면 병합
    if (replayedState) {
      return {
        ...baseState,
        customData: {
          ...(baseState.customData || {}),
          // 🎬 Event Sourcing에서 복원된 상태
          scenario: replayedState.scenario,
          themeMode: replayedState.theme,
          onboardingStep: replayedState.onboardingStep,
          monsterMode: replayedState.scenario === 'monster_combat',
          isDead: replayedState.isDead,
          player: {
            health: replayedState.hp,
            maxHealth: replayedState.maxHp,
            mana: replayedState.mp,
            maxMana: replayedState.maxMp,
          },
          // 🔥 Fire 효과 - 시작 시간 포함!
          showFireRubian: replayedState.fireRubian,
          showFireSubin: replayedState.fireSubin,
          fireStartTime: replayedState.fireStartTime,
          // 타겟 정보
          targets: Array.from(replayedState.targets.entries()).map(([id, t]) => ({
            id,
            x: t.x,
            y: t.y,
            startTime: t.startTime,
          })),
          // UI 요소 정보
          uiElements: Object.fromEntries(replayedState.uiElements),
          // 애니메이션 정보
          animations: Object.fromEntries(replayedState.animations),
        },
      };
    }
    
    return baseState;
  }, [hudStateLog, timestampMs, replayedState]);

  // Remotion 환경용 이미지 경로
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
        
        // fire-seq 첫 몇 프레임도 프리로드
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
        console.log('[HUDOverlayComposition] All images loaded');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
          console.log('[HUDOverlayComposition] Fonts loaded');
        }
        
        setAssetsLoaded(true);
        continueRender(handle);
      } catch (error) {
        console.error('[HUDOverlayComposition] Asset loading error:', error);
        setAssetsLoaded(true);
        continueRender(handle);
      }
    };
    
    loadAssets();
  }, [handle, imagePaths]);

  // HUD 컴포넌트 선택
  const HUDComponent = hudPresetId === "hexa-tactical" ? HexaTacticalHUD : HexaTacticalHUD;

  return (
    <AbsoluteFill>
      {/* 🎬 CSS Animation 자동 프레임 동기화 */}
      <GlobalRemotionFix frame={frame} fps={fps} disableTransitions={true} />
      
      {/* 폰트 스타일 */}
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

      {/* HUD 오버레이 - Theatre.js 프레임 기반 렌더링 */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{
          width: width,
          height: height,
        }}>
          <ImagePathProvider value={imagePaths}>
            <HUDComponent
              width={width}
              height={height}
              isPlaying={true}
              externalState={externalState}
              onStateUpdate={() => {}}
              onReady={() => {}}
              renderMode={{
                isRendering: true,
                currentFrame: frame,
                fps: fps,
              }}
            />
          </ImagePathProvider>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Composition 메타데이터 계산 (동적 duration)
 */
export const calculateHUDMetadata: CalculateMetadataFunction<HUDOverlayProps & { durationInFrames?: number }> = async ({
  props,
}) => {
  // props에 durationInFrames가 있으면 사용
  if (props.durationInFrames && props.durationInFrames > 0) {
    return {
      durationInFrames: props.durationInFrames,
    };
  }
  
  // HUD 상태 로그에서 duration 계산
  try {
    const hudStateLog: HUDStateSnapshot[] = JSON.parse(props.hudStateLogJson);
    if (hudStateLog.length > 0) {
      const lastTimestamp = hudStateLog[hudStateLog.length - 1].timestamp;
      const durationInFrames = Math.ceil((lastTimestamp / 1000) * 30);
      return {
        durationInFrames: Math.max(durationInFrames, 30), // 최소 1초
      };
    }
  } catch {
    // 파싱 실패 시 기본값
  }

  return {
    durationInFrames: 300, // 기본 10초
  };
};
