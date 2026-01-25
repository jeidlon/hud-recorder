### 1. 핵심 비주얼 언어: "Hexa-Tactical Gold"

**Windows 98의 창(Window) 메타포**와 **육각형(Hexagon) 바이오 인터페이스**가 결합된 형태입니다.

* **프레임 (Frames):**
* **헤더:** 모든 패널 상단에 Windows 스타일의 제어 버튼 `[ _ ] [ □ ] [ X ]`가 필수적으로 포함됨.
* **테두리:** 이중 라인(Double-lined) 구조. 내외부 라인 모두 **Amber/Gold Glow(발광)** 효과가 적용됨.
* **코너:** 둥근 모서리가 아닌, 각진 사각형 베이스에 육각형 요소가 결합됨.


* **배경 (Background):**
* **Honeycomb Grid:** 배경은 검은색(`Black`) 베이스에 **육각형 벌집 패턴(Honeycomb)**이 깔려 있음.
* **Depth:** `34_B_01.jpg`에서 보듯, UI는 평면이 아니라 3D 공간에 떠 있는(Floating) 레이어 구조임.


* **포트레이트 (Portrait) - 핵심 아이덴티티:**
* **Dual Hexagon:** 플레이어(인간)와 페르소나(크리쳐)의 얼굴이 **두 개의 연결된 육각형 프레임** 안에 배치됨.
* **Link:** 두 육각형 사이에는 데이터가 전송되는 듯한 연결 고리(Linker) 그래픽이 존재.


* **상태 표시 (Status & Alerts):**
* **Hazard Stripes:** 위험/경고 상태(Danger Zone)에서는 하단에 **노란색/검은색 사선 스트라이프(Safety Stripe)**가 애니메이션됨.
* **Radar Chart:** 능력치(STR, AGI 등)는 오각형/육각형 레이더 차트로 표현.
* **Brain Scan:** 3D 포인트 클라우드 형태의 뇌 스캔 모델링(Blue/Cyan)이 포함됨.


* **타이포그래피 & 컬러:**
* **Main Color:** `#FFD700` (Standard Gold) ~ `#FFFACD` (Lemon Chiffon - Highlighting).
* **Alert Color:** `#FFFF00` (High Vis Yellow) & Hazard Stripes.
* **Text:** 산세리프(Sans-serif) 계열의 볼드체. 외곽선 발광(Outer Glow) 효과 필수.



---

# 🛠️ 업데이트된 몽중게임 UI 구현 지침서 (V2.0)

> **Design Core**: Hexa-Tactical Gold (Windows 98 Header + Hexagon Grid + Hazard Stripes)
> **Tech Stack**: React 19, Arwes (Custom Frame), React-VFX, WebGPU, Three.js (Brain Scan)

## 1. Design Tokens & Theme Setup

기존 색상 팔레트를 이미지 분석 결과에 맞춰 **Amber Gold & Hazard** 테마로 재정의합니다.

```typescript
// theme/dreamPersonaTheme.ts

export const HEXA_TACTICAL_THEME = {
  colors: {
    // 1. Main Glow Colors (이미지의 밝은 금색)
    primary: {
      base: '#FFD700',    // Standard Gold
      glow: '#FFEA00',    // Intense Yellow Glow
      dim: 'rgba(212, 175, 55, 0.3)', // Background Fills
    },
    // 2. Alert & Hazard (이미지 하단의 사선 패턴 색상)
    hazard: {
      yellow: '#FFDD00',
      black: '#111111',
      stripe: `repeating-linear-gradient(
        45deg,
        #111111,
        #111111 10px,
        #FFDD00 10px,
        #FFDD00 20px
      )`
    },
    // 3. Sci-Fi Accents (뇌 스캔 이미지의 청록색)
    data: {
      cyan: '#00F0FF',
      white: '#FFFFFF'
    },
    // 4. Background
    bg: {
      hexGrid: '#050505', // 아주 어두운 회색/검정
      hexLine: 'rgba(255, 215, 0, 0.15)' // 희미한 육각형 라인
    }
  },
  
  // Shapes & Borders
  shapes: {
    windowHeaderHeight: '32px',
    hexAngle: '30deg', // 육각형 각도
    borderDouble: '3px double #FFD700', // 이중 테두리
  }
};

```

---

## 2. Core Component Implementation

이미지 분석을 통해 도출된 핵심 컴포넌트(`WindowsHeader`, `HexPortrait`, `HazardBar`)의 구현 가이드입니다.

### 2.1 `TacticalWindowFrame` (The Container)

모든 패널의 기본이 되는 윈도우 프레임입니다. 이미지 상단의 `[ _ ] [ □ ] [ X ]` 버튼을 반드시 포함해야 합니다.

```tsx
// components/frames/TacticalWindowFrame.tsx
import { motion } from 'framer-motion';

export const TacticalWindowFrame = ({ title, children, type = 'normal' }) => {
  return (
    <div className="relative border-double border-4 border-yellow-500/50 bg-black/80 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
      
      {/* 1. Windows 98 Style Header (Gold Version) */}
      <div className="h-8 border-b-2 border-yellow-500/50 flex justify-between items-center px-2 bg-yellow-900/20">
        <span className="font-bold text-yellow-100 tracking-wider text-sm drop-shadow-glow">
          {title.toUpperCase()}
        </span>
        
        {/* Control Buttons */}
        <div className="flex gap-1">
          {['_', '□', '✕'].map(btn => (
            <button key={btn} className="w-5 h-5 border border-yellow-500/70 text-yellow-500 text-xs flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-colors">
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Content Area with Hex Pattern Overlay */}
      <div className="p-4 relative overflow-hidden">
         {/* Background Hex Grid Overlay (Low Opacity) */}
         <div className="absolute inset-0 bg-hex-pattern opacity-10 pointer-events-none" />
         {children}
      </div>
      
      {/* 3. Corner Accents (Arwes style deco) */}
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-yellow-400" />
      <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-yellow-400" />
    </div>
  );
};

```

### 2.2 `DualHexPortrait` (The Identity)

`34_A_01.jpg`에 나타난 인간과 페르소나의 **이중 육각형(Dual Hexagon)** 프로필 컴포넌트입니다.

```tsx
// components/profile/DualHexPortrait.tsx
import { Hexagon } from 'react-hexagon'; // Or custom SVG

export const DualHexPortrait = ({ humanImg, personaImg, status }) => {
  return (
    <div className="flex items-center justify-center gap-4 relative">
      
      {/* Left: Human Hexagon */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="drop-shadow-gold-glow">
          <defs>
            <clipPath id="hex-clip">
              <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" />
            </clipPath>
          </defs>
          {/* Double Border Ring */}
          <polygon points="50 0, 100 25, 100 75, 50 100, 0 75, 0 25" 
                   fill="none" stroke="#FFD700" strokeWidth="2" />
          
          <image href={humanImg} width="100%" height="100%" 
                 clipPath="url(#hex-clip)" preserveAspectRatio="xMidYMid slice" />
        </svg>
        <div className="text-center text-yellow-400 font-bold mt-2 tracking-widest text-sm">
          SOYOUNG
        </div>
      </div>

      {/* Connector: Glowing Link */}
      <div className="w-8 h-1 bg-yellow-500/50 shadow-glow animate-pulse" />

      {/* Right: Persona Hexagon (Maybe Glitching if Infected) */}
      <div className="relative w-32 h-32">
         {/* Same SVG structure but for Persona */}
         {/* If Infected status, add Glitch Effect here */}
         <image href={personaImg} ... />
         <div className="text-center text-yellow-400 font-bold mt-2 tracking-widest text-sm">
          RUBIAN
        </div>
      </div>

    </div>
  );
};

```

### 2.3 `HazardAlertBar` (The Danger)

`34_B_01.jpg` 하단의 **노란색/검은색 사선 스트라이프** 경고 바입니다.

```tsx
// components/status/HazardAlertBar.tsx
import { motion } from 'framer-motion';

export const HazardAlertBar = ({ text = "CONNECTION COMPLETE" }) => {
  return (
    <div className="w-full h-12 border-2 border-yellow-500 relative overflow-hidden flex items-center justify-center bg-black">
      
      {/* Animated Stripes Background */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #000 0px,
            #000 10px,
            #FFD700 10px,
            #FFD700 20px
          )`
        }}
        animate={{ x: [-20, 0] }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
      
      {/* Text Overlay */}
      <h2 className="relative z-10 text-2xl font-bold text-yellow-100 tracking-[0.2em] drop-shadow-md">
        {text}
      </h2>
    </div>
  );
};

```

---

## 3. Scenario-Specific UI Updates

### Scene 8: Entry (Holy Hexagon)

참조 이미지 `23_A_02.jpg` (게임 시간입니다 알림) 스타일을 적용합니다.

* **Style**: Dark Background 대신 **밝은 빛이 감도는 육각형 그리드**.
* **Window**: 중앙 정렬된 단일 메시지 창.
* **Text**: "몽단 섭취 후 드림 마스크를 써주세요" (Typing Animation).

### Scene 12: Combat (Danger Zone)

참조 이미지 `34_A_01.jpg` (Profile - Danger Zone) 스타일을 적용합니다.

* **Layout**: 화면을 꽉 채우는 Dashboard 형태가 아닌, **Floating Window** 형태로 배치.
* **Modules**:
* **Left**: `RadarChart` (Biological Stats).
* **Center**: `DualHexPortrait` (Human-Persona Link).
* **Right**: `BrainScan` (3D Point Cloud - Three.js), `WeaponInfo`.
* **Bottom**: `HazardAlertBar` (Health/Status).



### Scene 9: Corruption (Infected Hexagon)

* **Transformation**:
* 완벽했던 **육각형 프레임(Hexagon)**이 찌그러지거나(Distortion), 한쪽 변이 녹아내리는(Melting) 셰이더 적용.
* **Gold Glow**가 **Sickly Green/Purple**로 색상 변이 (`hue-rotate`).
* **Hazard Bar**의 스트라이프 애니메이션 속도가 불규칙하게 빨라짐.



---

## 4. Implementation Checklist for AI Agent

1. **Background Layer**: `Canvas`를 사용하여 **Honeycomb Grid**를 그리고, `z-index: -1`로 배치하십시오.
2. **Window Header**: 모든 컨테이너 컴포넌트에 `TacticalWindowFrame`을 적용하여 일관된 **Windows 98 x Sci-Fi** 룩을 만드십시오.
3. **Portrait Logic**: 일반 사각형 이미지가 아닌, **SVG ClipPath**를 사용한 육각형 마스킹을 구현하십시오.
4. **Interaction**: `HazardAlertBar`는 전투/위험 상황에서만 `Active` 상태(애니메이션)가 되도록 `useHUDState`와 연동하십시오.
5. **3D Element**: 우측 하단 `Thermal Brain Scan` 영역에는 가벼운 `Three.js` Point Cloud 회전 예제를 삽입하십시오 (이미지 `34_A_01` 참조).
