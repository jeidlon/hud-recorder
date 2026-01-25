/**
 * HUD Only Composition (투명 배경)
 * 
 * HUD만 렌더링하여 PNG 시퀀스 또는 투명 배경 WebM으로 출력
 * 
 * 사용법:
 * - PNG 시퀀스: npx remotion render ... HUDOnly --image-format png --sequence
 * - 투명 WebM: npx remotion render ... HUDOnly --codec vp8 (VP8/VP9 with alpha)
 */

import React, { useMemo, useEffect, useState } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  staticFile,
  CalculateMetadataFunction,
  continueRender,
  delayRender,
  prefetch,
  Img,
} from "remotion";
import { HexaTacticalHUD, ImagePathProvider } from "../../presets/hexaTactical";
import type { ExternalHUDState } from "../../presets";
import { GlobalRemotionFix } from "../utils/GlobalAnimationFix";

// Props 타입
export interface HUDOnlyProps {
  /** HUD 프리셋 ID */
  hudPresetId: string;
  /** HUD 상태 로그 JSON 문자열 */
  hudStateLogJson: string;
  /** 시나리오 (idle, persona_sync, infected, trauma, evolved 등) */
  scenario?: string;
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
  /* Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Black+Han+Sans&family=Orbitron:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+KR:wght@400;500;700&display=swap');

  /* Local fonts */
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

  /* 모든 텍스트에 안티앨리어싱 적용 */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
`;

/**
 * HUD Only Composition (투명 배경)
 */
export const HUDOnlyComposition: React.FC<HUDOnlyProps> = ({
  hudPresetId,
  hudStateLogJson,
  scenario,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  
  // 폰트와 이미지 로딩 대기
  const [handle] = useState(() => delayRender("Loading fonts and assets"));

  // JSON 파싱 (memoized)
  const hudStateLog = useMemo<HUDStateSnapshot[]>(() => {
    try {
      return JSON.parse(hudStateLogJson);
    } catch {
      return [];
    }
  }, [hudStateLogJson]);

  // 현재 프레임의 타임스탬프 (ms)
  const timestampMs = (frame / fps) * 1000;

  // 현재 프레임의 HUD 상태 계산
  const externalState = useMemo(() => {
    const state = interpolateHUDState(hudStateLog, timestampMs);
    // scenario 오버라이드
    if (scenario && state.customData) {
      (state.customData as Record<string, unknown>).scenario = scenario;
    } else if (scenario) {
      state.customData = { scenario };
    }
    return state;
  }, [hudStateLog, timestampMs, scenario]);

  // Remotion 환경용 이미지 경로
  const imagePaths = useMemo(() => ({
    jihoon: staticFile('jihoon_profile_1.png'),
    soyeong: staticFile('soyeong_pr_1.png'),
    minjun: staticFile('minjun_pr_1.png'),
    fireSeq: staticFile('fire-seq'),  // 🔥 불 시퀀스 경로 추가
  }), []);

  // 에셋 로딩
  useEffect(() => {
    const loadAssets = async () => {
      try {
        // 프로필 이미지만 프리로드 (fire-seq는 폴더이므로 제외)
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
              img.onerror = () => resolve(); // fire-seq 로드 실패해도 계속
              img.src = fireSrc;
            })
          );
        }
        
        await Promise.all(imagePromises);
        console.log('[HUDOnlyComposition] All images loaded');
        
        // 폰트 로딩 대기 (100ms 추가 대기)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // document.fonts.ready 사용 (브라우저 환경)
        if (typeof document !== 'undefined' && document.fonts) {
          await document.fonts.ready;
          console.log('[HUDOnlyComposition] Fonts loaded');
        }
        
        setAssetsLoaded(true);
        continueRender(handle);
      } catch (error) {
        console.error('[HUDOnlyComposition] Asset loading error:', error);
        // 에러가 있어도 렌더링 계속
        setAssetsLoaded(true);
        continueRender(handle);
      }
    };
    
    loadAssets();
  }, [handle, imagePaths]);

  // HUD 컴포넌트 선택
  const HUDComponent = hudPresetId === "hexa-tactical" ? HexaTacticalHUD : HexaTacticalHUD;

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      {/* 🎬 CSS Animation 자동 프레임 동기화 */}
      <GlobalRemotionFix frame={frame} fps={fps} disableTransitions={true} />
      
      {/* 폰트 로딩 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      
      {/* HUD 렌더링 - 스케일 제거 (UI가 프레임 밖으로 밀려나는 문제) */}
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
          />
        </ImagePathProvider>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Composition 메타데이터 계산 (동적 duration)
 */
export const calculateHUDOnlyMetadata: CalculateMetadataFunction<HUDOnlyProps & { durationInFrames?: number }> = async ({
  props,
}) => {
  // props에 durationInFrames가 있으면 사용
  if (props.durationInFrames && props.durationInFrames > 0) {
    return {
      durationInFrames: props.durationInFrames,
    };
  }
  
  try {
    const hudStateLog: HUDStateSnapshot[] = JSON.parse(props.hudStateLogJson);
    if (hudStateLog.length > 0) {
      const lastTimestamp = hudStateLog[hudStateLog.length - 1].timestamp;
      const durationInFrames = Math.ceil((lastTimestamp / 1000) * 30);
      return {
        durationInFrames: Math.max(durationInFrames, 30),
      };
    }
  } catch {
    // 파싱 실패 시 기본값
  }

  return {
    durationInFrames: 300,
  };
};
