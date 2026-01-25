/**
 * Remotion Root - Composition 등록
 * 
 * 이 파일은 Remotion CLI가 렌더링할 때 사용하는 entry point입니다.
 * 
 * Compositions:
 * - HexaTactical: hexa-tactical 프리셋 전용 (추천)
 * - HexaTacticalOnboarding: 온보딩 시퀀스 데모
 * - HexaTacticalMonster: 몬스터 모드 데모
 * - HUDOverlay: 비디오 + HUD 합성 (레거시)
 * - HUDOnly: HUD만 투명 배경 (레거시)
 */

import { Composition, staticFile } from "remotion";
import { HUDOverlayComposition, calculateHUDMetadata } from "./compositions/HUDOverlayComposition";
import { HUDOnlyComposition, calculateHUDOnlyMetadata } from "./compositions/HUDOnlyComposition";
import { HexaTacticalComposition, calculateHexaTacticalMetadata } from "./compositions/HexaTacticalComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 🎮 Hexa-Tactical 전용 Compositions (추천) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      
      {/* 기본 HUD (투명 배경) */}
      <Composition
        id="HexaTactical"
        component={HexaTacticalComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenario: 'idle',
          playerHealth: 1500,
          playerMana: 800,
        }}
        calculateMetadata={calculateHexaTacticalMetadata}
      />

      {/* 비디오 오버레이 */}
      <Composition
        id="HexaTacticalVideo"
        component={HexaTacticalComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "sample.mp4",
          scenario: 'idle',
          playerHealth: 1500,
          playerMana: 800,
        }}
        calculateMetadata={calculateHexaTacticalMetadata}
      />

      {/* 온보딩 시퀀스 데모 */}
      <Composition
        id="HexaTacticalOnboarding"
        component={HexaTacticalComposition}
        durationInFrames={600} // 20초
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenario: 'onboarding',
          onboardingStartFrame: 0,
          playerHealth: 1500,
          playerMana: 800,
        }}
        calculateMetadata={calculateHexaTacticalMetadata}
      />

      {/* 몬스터 모드 데모 */}
      <Composition
        id="HexaTacticalMonster"
        component={HexaTacticalComposition}
        durationInFrames={300} // 10초
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenario: 'monster',
          monsterStartFrame: 30, // 1초 후 시작
          playerHealth: 1200,
          playerMana: 600,
        }}
        calculateMetadata={calculateHexaTacticalMetadata}
      />

      {/* Fire 효과 데모 */}
      <Composition
        id="HexaTacticalFire"
        component={HexaTacticalComposition}
        durationInFrames={450} // 15초
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenario: 'idle',
          fireRubianStartFrame: 60, // 2초 후 루비안 Fire
          fireSubinStartFrame: 90, // 3초 후 수빈사랑 Fire
          playerHealth: 1500,
          playerMana: 800,
        }}
        calculateMetadata={calculateHexaTacticalMetadata}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 레거시 Compositions */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      
      {/* 메인 HUD 오버레이 Composition (비디오 + HUD) */}
      <Composition
        id="HUDOverlay"
        component={HUDOverlayComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "",
          hudPresetId: "hexa-tactical",
          inputLogJson: "[]",
          hudStateLogJson: "[]",
        }}
        calculateMetadata={calculateHUDMetadata}
      />

      {/* HUD Only Composition (투명 배경, PNG 시퀀스용) */}
      <Composition
        id="HUDOnly"
        component={HUDOnlyComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          hudPresetId: "hexa-tactical",
          hudStateLogJson: "[]",
          scenario: "idle",
        }}
        calculateMetadata={calculateHUDOnlyMetadata}
      />
    </>
  );
};
