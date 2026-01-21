# Dream Persona HUD 개발 지침서 V2

> 시나리오 기반 완전 분석 및 디자인 고도화 문서  
> Version 2.1 | 2026-01-21

---

## 🔧 필수 라이브러리 설치 및 코드 통합

### 설치 명령어
```bash
npm install react-vfx @arwes/react @arwes/react-frames @arwes/react-bgs @arwes/react-text @arwes/react-effects @arwes/theme @arwes/animator --legacy-peer-deps
```

---

## 📦 react-vfx 라이브러리 완전 활용 가이드

### 기본 사용법
```tsx
import * as VFX from 'react-vfx';

// VFXProvider로 감싸서 사용
<VFX.VFXProvider>
  <VFX.VFXDiv shader="glitch">
    <HUDPanel />
  </VFX.VFXDiv>
</VFX.VFXProvider>
```

### 🎨 사용 가능한 셰이더 프리셋 (시나리오별 매핑)

| 프리셋 | 효과 | 적용 시나리오 |
|--------|------|---------------|
| `glitch` | RGB 분리 + 노이즈 + 색수차 | **COMBAT** (큰 데미지), **INFECTED** |
| `rgbShift` | RGB 채널 수평 이동 | **COMBAT** (일반 데미지) |
| `rgbGlitch` | 랜덤 RGB 분리 글리치 | **INFECTED** (메인 효과) |
| `pixelate` | 픽셀화 (크기 변동) | **SYNC** (접속 중), **INFECTED** |
| `rainbow` | 무지개 색상 순환 | **EVOLVED** (초진화 상태) |
| `shine` | 방사형 빛 효과 | **EVOLVED** (완료 상태) |
| `chromatic` | 가장자리 색수차 | **COMBAT** (락온 시) |
| `vignette` | 가장자리 어둡게 | **COMBAT** (피격), **TRAUMA** |
| `grayscale` | 흑백 전환 | **TRAUMA** (절망 상태) |
| `halftone` | 하프톤 인쇄 효과 | **TRAUMA** (병원 모니터) |
| `duotone` | 2색 톤 | 시나리오 전환 |
| `pixelateTransition` | 픽셀화 등장/퇴장 | **SYNC** (접속/종료) |
| `warpTransition` | 워프 등장/퇴장 | 시나리오 전환 |
| `blink` | 깜빡임 | **COMBAT** (위험 경고) |
| `invert` | 색상 반전 | 특수 이벤트 |

### 커스텀 셰이더 작성 예시 (INFECTED용)
```glsl
// meltGlitch.glsl - UI 녹아내림 + 글리치
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform sampler2D src;
out vec4 outColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    
    // 녹아내림 효과
    float melt = sin(uv.x * 20.0 + time * 2.0) * 0.02 * uv.y;
    uv.y += melt;
    
    // 글리치 노이즈
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    if (noise > 0.98) {
        uv.x += (noise - 0.5) * 0.1;
    }
    
    vec4 color = texture(src, uv);
    
    // 보라색/녹색 색조
    color.r *= 0.8;
    color.g *= 1.2;
    color.b *= 1.5;
    
    outColor = color;
}
```

### 시나리오별 VFX 적용 코드
```tsx
// DreamPersonaHUD.tsx
import * as VFX from 'react-vfx';

const getShaderForScenario = (scenario: ScenarioId, effects: Effects) => {
  switch (scenario) {
    case 'sync':
      return effects.syncProgress < 1 ? 'pixelateTransition' : 'none';
    case 'combat':
      if (effects.damageIntensity > 0.7) return 'glitch';
      if (effects.damageIntensity > 0.3) return 'rgbShift';
      if (effects.isLocked) return 'chromatic';
      return 'vignette';
    case 'infected':
      return 'rgbGlitch'; // 또는 커스텀 meltGlitch
    case 'trauma':
      return 'grayscale';
    case 'evolved':
      return effects.cannonCharging ? 'rainbow' : 'shine';
    default:
      return 'none';
  }
};

// 사용
<VFX.VFXProvider>
  <VFX.VFXDiv shader={getShaderForScenario(scenario, effects)}>
    <canvas ref={canvasRef} />
  </VFX.VFXDiv>
</VFX.VFXProvider>
```

---

## 📦 @arwes 라이브러리 완전 활용 가이드

### React 컴포넌트 사용

#### 1. 프레임 컴포넌트 (@arwes/react-frames)
```tsx
import { 
  FrameOctagon,    // 팔각형 프레임 (상태창, 적 정보)
  FrameCorners,    // 코너만 있는 프레임 (메인 패널)
  FrameKranox,     // Sci-Fi 스타일 프레임 (타겟팅)
  FrameNero,       // 네로 스타일 (경고창)
  FrameNefrex,     // 네프렉스 스타일
  FrameUnderline,  // 밑줄 프레임 (텍스트 강조)
  FrameLines,      // 라인 프레임
  FrameHeader,     // 헤더 프레임 (타이틀)
  FrameCircle      // 원형 프레임 (동기화 링)
} from '@arwes/react-frames';

// 시나리오별 프레임 매핑
const SCENARIO_FRAMES = {
  normal: FrameCorners,    // 기본 골드 프레임
  sync: FrameCircle,       // 동기화 링
  combat: FrameKranox,     // 전투용 타겟팅
  infected: FrameNero,     // 경고 스타일
  trauma: FrameOctagon,    // 병원 모니터
  evolved: FrameHeader     // 영웅적 프레임
};

// 사용 예시
<FrameOctagon
  style={{
    '--arwes-frames-bg-color': 'rgba(255, 215, 0, 0.1)',
    '--arwes-frames-line-color': '#FFD700',
  }}
  squareSize={16}
  strokeWidth={2}
  leftTop={true}
  rightTop={true}
  rightBottom={true}
  leftBottom={true}
>
  <div className="panel-content">
    {/* 패널 내용 */}
  </div>
</FrameOctagon>
```

#### 2. 배경 효과 컴포넌트 (@arwes/react-bgs)
```tsx
import { 
  Dots,          // 도트 패턴 배경
  Puffs,         // 연기/파프 파티클
  GridLines,     // 그리드 라인
  MovingLines    // 움직이는 라인
} from '@arwes/react-bgs';

// 시나리오별 배경 매핑
const SCENARIO_BACKGROUNDS = {
  normal: <GridLines lineColor="#FFD70033" distance={40} />,
  sync: <Dots color="#00D4FF" distance={20} />,
  combat: <MovingLines lineColor="#FF004466" />,
  infected: <Puffs color="#9900FF" quantity={30} />,
  trauma: <GridLines lineColor="#66666633" distance={30} />,
  evolved: <Puffs color="#FFD700" quantity={50} />
};

// 사용 예시
<div className="hud-background">
  <GridLines
    lineColor="#FFD70033"
    lineWidth={1}
    distance={40}
    horizontalLineDash={[4, 4]}
    verticalLineDash={[]}
  />
</div>
```

#### 3. 텍스트 애니메이션 (@arwes/text)
```tsx
import { animateTextDecipher } from '@arwes/text';

// 암호해독 스타일 텍스트 등장
const decipherText = (element: HTMLElement, duration: number) => {
  const content = element.querySelector('.content');
  return animateTextDecipher({
    rootElement: element,
    contentElement: content,
    duration: duration,
    easing: 'linear',
    isEntering: true,
    // 커스텀 문자셋 (시나리오별)
    characters: '    ----____ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▓▒░█'
  });
};

// INFECTED 시나리오용 깨진 문자셋
const INFECTED_CHARACTERS = '█▓▒░?#@!$%^&*()_+-=[]{}|;:,.<>?~`▓█▒░';

// EVOLVED 시나리오용 별 문자셋
const EVOLVED_CHARACTERS = '★☆✦✧◆◇●○■□▲△▼▽';
```

#### 4. 조명 효과 (@arwes/effects)
```tsx
import { createEffectIlluminator } from '@arwes/effects';

// 마우스를 따라다니는 글로우 효과
useEffect(() => {
  const illuminator = createEffectIlluminator({
    container: containerRef.current,
    color: getScenarioColor(scenario), // 시나리오별 색상
    size: 300
  });
  
  return () => illuminator.cancel();
}, [scenario]);

// 시나리오별 글로우 색상
const getScenarioColor = (scenario: ScenarioId) => {
  const colors = {
    normal: 'hsl(45 100% 50% / 10%)',   // Gold
    sync: 'hsl(190 100% 50% / 15%)',    // Cyan
    combat: 'hsl(350 100% 50% / 20%)',  // Red
    infected: 'hsl(280 100% 50% / 15%)', // Purple
    trauma: 'hsl(0 0% 50% / 10%)',      // Grey
    evolved: 'hsl(45 100% 60% / 20%)'   // Bright Gold
  };
  return colors[scenario];
};
```

---

## 🔗 라이브러리 코드 직접 복사 가이드

### @vfx-js/core 셰이더 코드 복사 위치
```
node_modules/@vfx-js/core/lib/esm/constants.js
```

핵심 셰이더 코드 (Canvas 2D 후처리용으로 변환 필요):
```typescript
// src/presets/dreamPersonaRemaster/shaders/vfxShaders.ts

// glitch 셰이더 - 그대로 복사
export const GLITCH_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform sampler2D src;
out vec4 outColor;

float nn(float y, float t) {
    float n = (
        sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
        sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
        sin(y * 1.1 + t * 2.8) * .4
    );
    n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;
    return n;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    vec4 color = texture(src, uv);
    // ... 전체 코드는 constants.js에서 복사
}
`;

// 나머지 셰이더들도 동일하게 복사
export const RGB_SHIFT_SHADER = `...`;
export const RGB_GLITCH_SHADER = `...`;
export const CHROMATIC_SHADER = `...`;
export const VIGNETTE_SHADER = `...`;
export const GRAYSCALE_SHADER = `...`;
export const RAINBOW_SHADER = `...`;
export const SHINE_SHADER = `...`;
```

### @arwes 프레임 코드 복사 위치
```
node_modules/@arwes/frames/build/esm/createFrameOctagonSettings/createFrameOctagonSettings.js
node_modules/@arwes/frames/build/esm/createFrameCornersSettings/createFrameCornersSettings.js
node_modules/@arwes/frames/build/esm/createFrameKranoxSettings/createFrameKranoxSettings.js
```

Canvas 2D용 변환 예시:
```typescript
// src/presets/dreamPersonaRemaster/arwes/frameDrawing.ts

// @arwes/frames의 createFrameOctagonSettings에서 변환
export const drawFrameOctagon = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  options: {
    squareSize?: number;
    strokeWidth?: number;
    bgColor?: string;
    lineColor?: string;
    corners?: { lt?: boolean; rt?: boolean; rb?: boolean; lb?: boolean };
  } = {}
) => {
  const {
    squareSize = 16,
    strokeWidth = 1,
    bgColor = 'rgba(255, 215, 0, 0.1)',
    lineColor = '#FFD700',
    corners = { lt: true, rt: true, rb: true, lb: true }
  } = options;
  
  const { lt, rt, rb, lb } = corners;
  const so = strokeWidth / 2;
  
  // 배경 경로
  ctx.beginPath();
  if (lt) {
    ctx.moveTo(x + so, y + so + squareSize);
    ctx.lineTo(x + so + squareSize, y + so);
  } else {
    ctx.moveTo(x + so, y + so);
  }
  
  if (rt) {
    ctx.lineTo(x + width - so - squareSize, y + so);
    ctx.lineTo(x + width - so, y + so + squareSize);
  } else {
    ctx.lineTo(x + width - so, y + so);
  }
  
  if (rb) {
    ctx.lineTo(x + width - so, y + height - so - squareSize);
    ctx.lineTo(x + width - so - squareSize, y + height - so);
  } else {
    ctx.lineTo(x + width - so, y + height - so);
  }
  
  if (lb) {
    ctx.lineTo(x + so + squareSize, y + height - so);
    ctx.lineTo(x + so, y + height - so - squareSize);
  } else {
    ctx.lineTo(x + so, y + height - so);
  }
  
  ctx.closePath();
  
  // 배경 채우기
  ctx.fillStyle = bgColor;
  ctx.fill();
  
  // 테두리 그리기
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

// @arwes/frames의 createFrameCornersSettings에서 변환
export const drawFrameCorners = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number, height: number,
  options: {
    cornerLength?: number;
    strokeWidth?: number;
    color?: string;
  } = {}
) => {
  const {
    cornerLength = 20,
    strokeWidth = 2,
    color = '#FFD700'
  } = options;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(x, y + cornerLength);
  ctx.lineTo(x, y);
  ctx.lineTo(x + cornerLength, y);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(x + width - cornerLength, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + cornerLength);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(x + width, y + height - cornerLength);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + width - cornerLength, y + height);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(x + cornerLength, y + height);
  ctx.lineTo(x, y + height);
  ctx.lineTo(x, y + height - cornerLength);
  ctx.stroke();
};
```

### @arwes/bgs 배경 코드 복사 위치
```
node_modules/@arwes/bgs/build/esm/createBackgroundGridLines/createBackgroundGridLines.js
node_modules/@arwes/bgs/build/esm/createBackgroundDots/createBackgroundDots.js
```

Canvas 2D용 변환:
```typescript
// src/presets/dreamPersonaRemaster/arwes/bgDrawing.ts

// @arwes/bgs의 createBackgroundGridLines에서 변환
export const drawBackgroundGridLines = (
  ctx: CanvasRenderingContext2D,
  width: number, height: number,
  options: {
    lineWidth?: number;
    lineColor?: string;
    horizontalLineDash?: number[];
    verticalLineDash?: number[];
    distance?: number;
  } = {}
) => {
  const {
    lineWidth = 1,
    lineColor = '#777',
    horizontalLineDash = [4],
    verticalLineDash = [],
    distance = 30
  } = options;
  
  const xLength = 1 + Math.floor(width / distance);
  const yLength = 1 + Math.floor(height / distance);
  const xMargin = width % distance;
  const yMargin = height % distance;
  
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = lineColor;
  
  // 수평선
  ctx.setLineDash(horizontalLineDash);
  for (let yIndex = 0; yIndex < yLength; yIndex++) {
    const y = yMargin / 2 + yIndex * distance;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // 수직선
  ctx.setLineDash(verticalLineDash);
  for (let xIndex = 0; xIndex < xLength; xIndex++) {
    const x = xMargin / 2 + xIndex * distance;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
};
```

### @arwes/text 텍스트 애니메이션 복사 위치
```
node_modules/@arwes/text/build/esm/animateTextDecipher/animateTextDecipher.js
```

Canvas 2D용 변환:
```typescript
// src/presets/dreamPersonaRemaster/arwes/textEffects.ts

const CIPHERED_CHARACTERS = '    ----____abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const getDecipheredText = (
  originalText: string,
  progress: number,  // 0 ~ 1
  characters: string = CIPHERED_CHARACTERS
): string => {
  const length = originalText.length;
  const revealedCount = Math.floor(length * progress);
  
  // 랜덤 인덱스 생성 (시드 기반으로 일관성 유지)
  const indexes = Array(length).fill(0).map((_, i) => i);
  // Fisher-Yates 셔플 (시드: 문자열 해시)
  const seed = originalText.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1);
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  
  const revealed = new Set(indexes.slice(0, revealedCount));
  
  return originalText
    .split('')
    .map((char, index) => {
      if (char === ' ') return ' ';
      if (revealed.has(index)) return char;
      return characters[Math.floor(Math.random() * characters.length)];
    })
    .join('');
};

// 시나리오별 문자셋
export const SCENARIO_CHARACTERS = {
  normal: CIPHERED_CHARACTERS,
  sync: '01010101▓▒░█████',
  combat: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  infected: '█▓▒░?#@!$%^&*▓█▒░ERROR',
  trauma: '...---___~~~',
  evolved: '★☆✦✧◆◇●○■□▲△▼▽✦✧'
};
```

---

## 🚨 현재 문제점 및 개선 방향

### 현재 구현의 문제
```
❌ 청록색(Cyan) 기반 - 차갑고 생동감 없음
❌ 단순한 선과 도형 - Windows 98 레트로 감성 부재
❌ 투명도/홀로그램 효과 미흡
❌ 시나리오 전환 시 끊김 (트랜지션 없음)
❌ 시나리오별 세부 UI 요소 누락 다수
```

### 개선 방향
```
✅ 기본 톤: 노란색/골드 (2005년 레트로 감성)
✅ Windows 98 스타일 창 프레임 + 미래 홀로그램 융합
✅ 반투명 글래스모피즘 + 스캔라인 효과
✅ 시나리오 전환 시 UI 컴포넌트 Transform 애니메이션
✅ 시나리오별 완전한 UI 요소 구현
```

---

## 📋 목차

1. [디자인 시스템](#1-디자인-시스템)
2. [시나리오 흐름 분석](#2-시나리오-흐름-분석)
3. [시나리오별 상세 UI 설계](#3-시나리오별-상세-ui-설계)
4. [트랜지션 애니메이션 시스템](#4-트랜지션-애니메이션-시스템)
5. [인터랙션 상세 설계](#5-인터랙션-상세-설계)
6. [누락 요소 체크리스트](#6-누락-요소-체크리스트)

---

## 1. 디자인 시스템

### 1.1 핵심 컬러 팔레트

```
┌─────────────────────────────────────────────────────────────────┐
│                    COLOR SYSTEM                                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  기본 테마 (NORMAL / DEFAULT)                                    │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  PRIMARY:                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ████  #FFD700  Gold (메인 프레임)                       │   │
│  │  ████  #FFC000  Amber (강조)                             │   │
│  │  ████  #FFE066  Light Gold (호버/활성)                   │   │
│  │  ████  #CC9900  Dark Gold (그림자)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  BACKGROUND:                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ░░░░  rgba(20, 15, 5, 0.85)   Dark Brown (패널 배경)    │   │
│  │  ░░░░  rgba(40, 30, 10, 0.70)  Medium (서브 패널)        │   │
│  │  ░░░░  rgba(60, 45, 15, 0.50)  Light (호버 상태)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  TEXT:                                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  #FFFFFF  Primary Text                                   │   │
│  │  #FFE066  Highlighted Text                               │   │
│  │  #CCAA66  Secondary Text                                 │   │
│  │  #886633  Disabled Text                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Windows 98 + Futuristic 융합 디자인

```
┌─────────────────────────────────────────────────────────────────┐
│                    WINDOW FRAME DESIGN                           │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║ ▣ BIOLOGICAL ANALYSIS                        ─  □  ✕ ║  │
│  ╠═══════════════════════════════════════════════════════════╣  │
│  ║░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░║  │
│  ║░░                                                      ░░║  │
│  ║░░   ┌─────────────────────────────────────────────┐   ░░║  │
│  ║░░   │                                             │   ░░║  │
│  ║░░   │        [ CONTENT AREA ]                     │   ░░║  │
│  ║░░   │                                             │   ░░║  │
│  ║░░   └─────────────────────────────────────────────┘   ░░║  │
│  ║░░                                                      ░░║  │
│  ║░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  구성 요소:                                                      │
│  ├─ Title Bar: Win98 스타일 + 골드 그라데이션                   │
│  ├─ Control Buttons: ─ □ ✕ (미니멀 기하학)                     │
│  ├─ Frame: 이중 테두리 (outer: dark, inner: light)              │
│  ├─ Background: 스캔라인 + 반투명 글래스                        │
│  └─ Content: 도트 패턴 + 홀로그램 텍스트                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 스캔라인 & 홀로그램 효과

```typescript
// 스캔라인 효과 (CRT 모니터 느낌)
const SCANLINE = {
  spacing: 2,           // 2px 간격
  opacity: 0.03,        // 3% 투명도
  color: '#000000',
  animate: true,        // 위에서 아래로 천천히 이동
  speed: 0.5            // 초당 이동 비율
}

// 홀로그램 효과
const HOLOGRAM = {
  flicker: {
    frequency: 0.1,     // 10% 확률로 깜빡임
    duration: 50,       // 50ms 지속
  },
  chromatic: {
    offset: 1,          // 1px 색수차
    colors: ['#FF0000', '#00FF00', '#0000FF']
  },
  noise: {
    density: 0.02,      // 2% 노이즈
    animate: true
  }
}
```

### 1.4 폰트 시스템

```css
/* 메인 HUD 폰트 - 모노스페이스 */
.hud-primary {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  letter-spacing: 0.05em;
}

/* 레트로 픽셀 폰트 (EVOLVED 시나리오) */
.hud-retro {
  font-family: 'Press Start 2P', 'VT323', monospace;
  image-rendering: pixelated;
}

/* 시스템 알림 */
.hud-system {
  font-family: 'MS Sans Serif', 'Tahoma', sans-serif;  /* Win98 느낌 */
}
```

---

## 2. 시나리오 흐름 분석

### 2.1 전체 게임 흐름 (시나리오 기반)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GAME FLOW TIMELINE                            │
│                                                                  │
│  DAY 1 ──────────────────────────────────────────────────────   │
│  │                                                               │
│  ├─ [SCENE 4-7] 화이트룸 입장                                   │
│  │   └─ UI: 몽단 배급 알림, 게임 시간 알림                      │
│  │                                                               │
│  ├─ [SCENE 8] 블랙룸 - 신경 접속 ★ SYNC 시나리오               │
│  │   └─ UI: 홍채 인식, 뇌파 스캔, SYNC RATE 0%→100%            │
│  │   └─ UI: 페르소나 와이어프레임 오버레이                      │
│  │   └─ ACTION: 페르소나 이름 호출 → 로그인                     │
│  │                                                               │
│  ├─ [SCENE 9-11] 드림월드 탐험                                  │
│  │   └─ UI: 기본 HUD (노란톤), 미니맵, 퀘스트                   │
│  │                                                               │
│  ├─ [SCENE 12-15] 몬스터 전투 ★ COMBAT 시나리오                │
│  │   └─ UI: 타겟팅 박스, 체력바, 피격 이펙트                    │
│  │   └─ ACTION: 마우스 클릭 → Hit Marker                        │
│  │                                                               │
│  DAY 2-3 ────────────────────────────────────────────────────   │
│  │                                                               │
│  ├─ [SCENE 16-25] 레벨업 & 진화                                 │
│  │   └─ UI: 레벨업 알림, 진화 시퀀스                            │
│  │                                                               │
│  ├─ [SCENE 26-30] 특수 몽단 남용 ★ INFECTED 시나리오           │
│  │   └─ UI: STATUS: INFECTED, 글리치, 텍스트 깨짐              │
│  │   └─ UI: 보라색/녹색 형광, UI 녹아내림                       │
│  │                                                               │
│  DAY 4 ──────────────────────────────────────────────────────   │
│  │                                                               │
│  ├─ [SCENE 40-45] 트라우마 던전 ★ TRAUMA 시나리오              │
│  │   └─ UI: 심전도→주식차트, -99% 급락                         │
│  │   └─ UI: 사신 보스 HP: ∞                                    │
│  │   └─ UI: 회색 톤, 절망적 분위기                              │
│  │                                                               │
│  DAY 5 ──────────────────────────────────────────────────────   │
│  │                                                               │
│  ├─ [SCENE 50-55] 앨리스 각성 / 현실 위기                       │
│  │   └─ UI: 블랙룸 다중 화면 (현실 뉴스)                        │
│  │   └─ UI: 해킹 경고, 비행기 추락 카운트다운                   │
│  │                                                               │
│  └─ [SCENE 56] 타임캡슐 & 초진화 ★ EVOLVED 시나리오            │
│      └─ UI: 황금빛, LIMIT RELEASED, MEMORY SYNC 100%           │
│      └─ UI: 핸드캐논 조준선, 서버코어 타겟팅                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 UI 상태 변화 요약

| 상태 | 색상 | 스타일 | 핵심 요소 |
|------|------|--------|----------|
| **NORMAL** | Gold/Yellow | Win98 Retro + Hologram | 기본 프레임, 스캔라인 |
| **SYNC** | Blue/Cyan | Bio-Digital, 의료 UI | 동기화 링, 뇌파 그래프 |
| **COMBAT** | Red/Orange | 경고, 깨진 유리 | 타겟팅, Hit Marker |
| **INFECTED** | Purple/Green | 글리치, 녹아내림 | 텍스트 깨짐, 노이즈 |
| **TRAUMA** | Grey/Dark | 병원, 금융차트 | 심전도, ∞ 체력바 |
| **EVOLVED** | Gold/White | 8bit + HD Gold | 캐논 조준, 파티클 |

---

## 3. 시나리오별 상세 UI 설계

### 3.1 NORMAL 상태 (기본 HUD)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NORMAL STATE HUD                              │
│              노란톤 / Win98 레트로 / 홀로그램                    │
│                                                                  │
│  ╔═[ DREAM PERSONA :: MAGICO ]══════════════════════════════╗  │
│  ║  프리윌소프트 │ 드림 페르소나: 리마스터     DAY 1        ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ╔═[ BIOLOGICAL ]═══════╗         ╔═[ STATUS ]═══════════════╗ │
│  ║         ─ □ ✕       ║         ║              ─ □ ✕       ║ │
│  ╠══════════════════════╣         ╠═══════════════════════════╣ │
│  ║ PERSONA: MAGICO     ║         ║ LEVEL: 42                 ║ │
│  ║ TYPE: WIZARD        ║         ║ CLASS: WIZARD             ║ │
│  ║                     ║         ║                           ║ │
│  ║ SYNC ████████ 100%  ║         ║ LOCATION:                 ║ │
│  ║                     ║         ║ 루미나우드 숲             ║ │
│  ║ ┌─────────────────┐ ║         ║                           ║ │
│  ║ │ ~^~^~^~^~^~^~^~ │ ║         ║ QUEST:                    ║ │
│  ║ │ (Pulse Graph)   │ ║         ║ 렙틸리언 처치 (3/5)       ║ │
│  ║ └─────────────────┘ ║         ║                           ║ │
│  ╚══════════════════════╝         ╚═══════════════════════════╝ │
│                                                                  │
│                    ╭─────────────╮                               │
│                    │      ┼      │                               │
│                    │    ─ ◎ ─   │  ◀── 골드 크로스헤어         │
│                    │      ┼      │                               │
│                    ╰─────────────╯                               │
│                                                                  │
│  ╔═[ TEAM ]═════════════════════════════════════════════════╗  │
│  ║  [소영/루비안] HP ████████░░ 85%                         ║  │
│  ║  [민준/현정사랑] HP ██████████ 100%                      ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗  │
│  ║ HP ████████████████████░░░░░  82/100  │  MP ████████ 40  ║  │
│  ╚══════════════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 요소:**
- 골드/옐로우 컬러 테마
- Win98 스타일 창 프레임 (이중 테두리, ─ □ ✕ 버튼)
- DAY 표시 (게임 진행일)
- 팀원 상태 표시
- 스캔라인 배경 효과
- 한글 퀘스트/위치 정보

---

### 3.2 SYNC 시나리오 (신경 접속)

**Scene 8 기반 - 블랙룸에서 드림마스크 착용 후 페르소나와 신경 동기화**

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNC SCENARIO                                 │
│              Bio-Digital Blue / 신경 접속 시각화                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │          ◎ NEURAL SYNCHRONIZATION INITIATED ◎              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ╔═[ IRIS SCAN ]════════╗         ╔═[ BRAINWAVE ]════════════╗ │
│  ║       ───────        ║         ║ ~~~∿~~~∿~~~∿~~~∿~~~∿~~  ║ │
│  ║      /       \       ║         ║     ↑ ALPHA WAVE        ║ │
│  ║     │  ◉────  │      ║         ║                         ║ │
│  ║      \       /       ║         ║ ~~~∿∿~~~∿~~~∿∿~~~∿∿~~  ║ │
│  ║       ───────        ║         ║     ↑ BETA WAVE         ║ │
│  ║   SCANNING...        ║         ║                         ║ │
│  ╚══════════════════════╝         ╚═════════════════════════╝ │
│                                                                  │
│           ╭──────────────────────────────────────╮              │
│          ╱                                        ╲             │
│         ╱    ┌─────────────────────────────┐      ╲            │
│        │     │                             │       │           │
│        │     │    ▄▄▄    ▄▄▄              │       │           │
│        │     │   ▐███▌  ▐███▌             │       │           │
│        │     │    ▀█▀    ▀█▀   MAGICO     │       │           │
│        │     │      ▄████████▄            │       │           │
│        │     │     ▐██████████▌           │       │           │
│        │     │      (wireframe)           │       │           │
│        │     └─────────────────────────────┘       │           │
│         ╲                                        ╱             │
│          ╲    ◯ ─────────────────────────── ◯  ╱              │
│           ╰──────────────────────────────────╯                 │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║                                                            ║ │
│  ║           S Y N C H R O N I Z I N G . . .                 ║ │
│  ║                                                            ║ │
│  ║           ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░  68%            ║ │
│  ║                                                            ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ▸ NEURAL LINK: ESTABLISHING...                            │ │
│  │  ▸ PULSE RATE: 72 BPM                                      │ │
│  │  ▸ PERSONA BOND: LOADING...                                │ │
│  │                                                             │ │
│  │  [ 페르소나 이름을 호출하세요 ]                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 요소:**
- 홍채 인식 애니메이션 (스캔 라인 회전)
- 뇌파 그래프 (Alpha, Beta wave)
- 페르소나 와이어프레임 실루엣
- 동기화 링 (6각형 노드, 회전)
- SYNC RATE 프로그레스 바 (0% → 100%)
- "페르소나 이름을 호출하세요" 프롬프트

**인터랙션:**
- 마우스 클릭 → 동기화 가속
- 키보드 입력 "MAGICO" → 로그인 완료 트리거

---

### 3.3 COMBAT 시나리오 (전투/피격)

**Scene 12-15 기반 - 렙틸리언 등 몬스터와 전투, 고통 피드백**

```
┌─────────────────────────────────────────────────────────────────┐
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│░                                                               ░│
│░  ╔═[ ⚠ THREAT DETECTED ]════════════════════════════════╗   ░│
│░  ║  SYSTEM WARNING: PAIN FEEDBACK ACTIVE                 ║   ░│
│░  ╚═══════════════════════════════════════════════════════╝   ░│
│░                                                               ░│
│░  ╔═[ ENEMY ]═══════════════╗                                 ░│
│░  ║ ╳ REPTILIAN            ║                                 ░│
│░  ║   LV. 45               ║                                 ░│
│░  ║   TYPE: CREATURE       ║                                 ░│
│░  ║                        ║                                 ░│
│░  ║   HP ████████░░░░░░░░  ║                                 ░│
│░  ║      1,847 / 3,500     ║                                 ░│
│░  ║                        ║                                 ░│
│░  ║   THREAT: ▓▓▓▓▓░ HIGH  ║                                 ░│
│░  ╚════════════════════════╝                                  ░│
│░                                                               ░│
│░                 ╔════════════════════╗                       ░│
│░                 ║   ┌─────────────┐  ║                       ░│
│░                 ║   │  ╳     ╳    │  ║  ◀── 락온 (적색)     ░│
│░                 ║   │ ────╋──── │  ║      회전 애니메이션   ░│
│░                 ║   │  ╳     ╳    │  ║                       ░│
│░                 ║   └─────────────┘  ║                       ░│
│░                 ╚════════════════════╝                       ░│
│░                                                               ░│
│░         ✖          ✖                                        ░│
│░            ✖    ✖      ◀── Hit Marker (공격 시 표시)        ░│
│░         ✖          ✖                                        ░│
│░                                                               ░│
│░  ╔═════════════════════════════════════════════════════════╗ ░│
│░  ║ ♥ HP ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  23/100  ⚠ ⚠ ⚠ ║ ░│
│░  ║      ↑ CRITICAL - 깜빡임 + 정적 노이즈                  ║ ░│
│░  ╚═════════════════════════════════════════════════════════╝ ░│
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────────────────────────────────────────────┘
      ↑ RED VIGNETTE (화면 가장자리 붉은 맥동)
```

**핵심 요소:**
- 적 정보창 (이름, 레벨, HP, 위협 등급)
- 타겟팅 조준선 (락온 시 적색 + 회전)
- Hit Marker (마우스 클릭 시 ✖ 표시)
- 피격 시 화면 효과:
  - Red Vignette (가장자리 붉은 펄스)
  - Crack Overlay (유리 깨짐)
  - Static Noise (지직거림)
  - 체력바 깜빡임

**인터랙션:**
- 마우스 이동 → 크로스헤어 추적
- 마우스 클릭 → Hit Marker 표시 (0.3초 유지)
- Space → 락온 토글
- 피격 시 → 화면 흔들림 + 비네트

---

### 3.4 INFECTED 시나리오 (감염 상태)

**Scene 26-30 기반 - 특수 몽단 남용으로 매지코 '언데드' 변질**

```
┌─────────────────────────────────────────────────────────────────┐
│▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░│
│                                                                  │
│  ╔═[ ST█TUS: INF█CT█D ]═══════════════════════════════════╗    │
│  ║                                                         ║    │
│  ║   ██████  SYSTEM COR█UPTED  ██████                     ║    │
│  ║                                                         ║    │
│  ╚═════════════════════════════════════════════════════════╝    │
│                                                                  │
│  ╔═[ B█OLOG█CAL ]═══════╗                                       │
│  ║ P█RSONA: MAG█CO      ║     ╔═[ S█ATUS ]══════════════════╗  │
│  ║ TYP█: UND█AD         ║     ║ VIR█L LO█D:                 ║  │
│  ║                      ║     ║ ▓▓▓▓▓▓▓▓▓░░░  78%           ║  │
│  ║ ┌──────────────────┐ ║     ║                             ║  │
│  ║ │ ~~~~\./~~~~/\~~~ │ ║     ║ D█CAY R█TE:                 ║  │
│  ║ │ (Corrupted Wave) │ ║     ║ ▓▓▓▓░░░░░░░░  40%           ║  │
│  ║ └──────────────────┘ ║     ║                             ║  │
│  ║                      ║     ║ ST█TUS: UNST█BLE            ║  │
│  ╚══════════════════════╝     ╚═════════════════════════════╝  │
│                                                                  │
│              ╭───────────────────────────╮                      │
│             ╱                             ╲                     │
│            ╱    ◈─────────◈               ╲                    │
│           │    ╱           ╲               │   ◀── 왜곡된      │
│           │   ╱   [E_RR_OR]  ╲             │       크로스헤어  │
│           │  ◈───────◎───────◈            │                    │
│            ╲                 ╱                                   │
│             ╲               ╱              ╱                     │
│              ╰─────────────╯──────────────╯                     │
│                     ↑ 형태가 계속 변형됨                         │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║ H█ ???/???  |  STA█US: UND█AD  |  WAR█ING: CO██UPT█D    ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│                                                                  │
│▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░▓▓▒░▓▒░▓▓▒░░│
└─────────────────────────────────────────────────────────────────┘
```

**핵심 요소:**
- 텍스트 깨짐 (문자를 █, ▓, ?, # 등으로 대체)
- UI 녹아내림 효과 (프레임 라인이 아래로 흘러내림)
- 색수차 (Chromatic Aberration)
- 픽셀 누락/잘못 배치
- 보라색 + 녹색 형광 색상
- STATUS: UNDEAD 경고
- 체력바 "???" 표시

**애니메이션:**
- 텍스트 랜덤 깨짐 (0.5초 주기)
- UI 프레임 떨림/왜곡
- 크로스헤어 형태 변형

---

### 3.5 TRAUMA 시나리오 (트라우마 던전)

**Scene 40-45 기반 - 민준의 트라우마: 아내 병실, 비트코인 급락**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ╔═[ TRAUMA ZONE: HOSPITAL ROOM ]═══════════════════════════╗  │
│  ║  WARNING: MENTAL DESTABILIZATION DETECTED                 ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                  │
│  ╔═[ VITAL MONITOR ]═══════════════════════════════════════╗   │
│  ║                                                          ║   │
│  ║    ┌────────────────────────────────────────────────┐   ║   │
│  ║    │                                                │   ║   │
│  ║    │   ~    ~    ~         ┬    ┬                  │   ║   │
│  ║    │     ╲  ╱╲  ╱    →    │    │    ┬    ┬       │   ║   │
│  ║    │      ╲╱  ╲╱          ├──┤ ├──┤ │    │       │   ║   │
│  ║    │                       │    │    ├──┤ ├──┤    │   ║   │
│  ║    │   [ECG]           [CANDLESTICK CHART]         │   ║   │
│  ║    │                                        ↘      │   ║   │
│  ║    │                                    -99.7%     │   ║   │
│  ║    │                                                │   ║   │
│  ║    └────────────────────────────────────────────────┘   ║   │
│  ║                                                          ║   │
│  ║    ♡ PULSE: -- BPM          ₿ LOSS: -$847,293           ║   │
│  ║                                                          ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│                                                                  │
│          ╔═[ ◈ BOSS: REAPER ◈ ]══════════════════════╗         │
│          ║                                            ║         │
│          ║              †                             ║         │
│          ║             /|\                            ║         │
│          ║              |                             ║         │
│          ║             / \                            ║         │
│          ║                                            ║         │
│          ║    HP: ∞ ────────────────────────────     ║         │
│          ║         [████████████████████████████]    ║         │
│          ║                                            ║         │
│          ║    "포기하세요. 희망은 없습니다."          ║         │
│          ║                                            ║         │
│          ╚════════════════════════════════════════════╝         │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║  HOPE: ░░░░░░░░░░░░░░░░░░░░░░░░  0%   |  ESCAPE: NONE   ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**핵심 요소:**
- 심전도 → 주식 캔들차트 모프 애니메이션
- -99.7% 손실 표시
- 사신 보스 HP: ∞ (무한대)
- HOPE: 0% 바
- 회색/어두운 톤
- "포기하세요" 절망 메시지

**특수 기능:**
- 마우스 클릭 → 아무 반응 없음 (무력함 표현)
- 시간이 지나도 보스 HP 안 줄어듦

---

### 3.6 EVOLVED 시나리오 (최종 진화)

**Scene 56 기반 - 타임캡슐 개방, 매지코 초진화, 서버코어 파괴**

```
┌─────────────────────────────────────────────────────────────────┐
│✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧│
│                                                                  │
│  ╔═[ ★ LIMIT RELEASED ★ ]═══════════════════════════════════╗  │
│  ║                                                            ║  │
│  ║   ████████████████████████████████████████████████████    ║  │
│  ║   █ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄ █    ║  │
│  ║   █ █                                               █ █    ║  │
│  ║   █ █   M E M O R Y   S Y N C :   1 0 0 %          █ █    ║  │
│  ║   █ █                                               █ █    ║  │
│  ║   █ █        "우리는 무엇이든 가능하다"              █ █    ║  │
│  ║   █ █                                               █ █    ║  │
│  ║   █ ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀ █    ║  │
│  ║   ████████████████████████████████████████████████████    ║  │
│  ║        ↑ 8-bit 픽셀 프레임 + HD 골드 텍스처               ║  │
│  ║                                                            ║  │
│  ╚════════════════════════════════════════════════════════════╝  │
│                                                                  │
│         ╔═[ TARGET: SERVER CORE ]══════════════════════╗        │
│         ║                                               ║        │
│         ║         ◎══════════════════════◎             ║        │
│         ║        ╱                        ╲            ║        │
│         ║       ╱    ┌──────────────┐     ╲           ║        │
│         ║      ╱     │              │      ╲          ║        │
│         ║     ◎      │   ◆ CORE ◆  │       ◎         ║        │
│         ║      ╲     │   [TARGET]   │      ╱          ║        │
│         ║       ╲    └──────────────┘     ╱           ║        │
│         ║        ╲                        ╱            ║        │
│         ║         ◎══════════════════════◎             ║        │
│         ║                                               ║        │
│         ║         CANNON CHARGE: ▓▓▓▓▓▓▓▓░░  80%       ║        │
│         ║                                               ║        │
│         ╚═══════════════════════════════════════════════╝        │
│                                                                  │
│  ╔══════════════════════════════════════════════════════════╗   │
│  ║ ♥ HP ████████████████████████████████████  MAX  EVOLVED ║   │
│  ╚══════════════════════════════════════════════════════════╝   │
│                                                                  │
│✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧│
└─────────────────────────────────────────────────────────────────┘
        ↑ Golden Particles 상승
```

**핵심 요소:**
- 8bit 픽셀 프레임 + HD 골드 텍스처 융합
- MEMORY SYNC: 100%
- "우리는 무엇이든 가능하다" 대사
- 12각형 캐논 조준선
- SERVER CORE 타겟
- CANNON CHARGE 게이지
- 황금빛 파티클 상승

**인터랙션:**
- 마우스 클릭 + 홀드 → 캐논 차징
- 릴리즈 → 캐논 발사 (화면 플래시)
- 서버코어 타겟팅 완료 시 → 게임 종료 시퀀스

---

## 4. 트랜지션 애니메이션 시스템

### 4.1 시나리오 전환 트랜지션

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSITION SYSTEM                             │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  NORMAL → SYNC                                                   │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  Phase 1 (0-0.3s): 현재 UI Fade Out                             │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │ ▓▓▓▓▓▓▓ │ →  │ ▓▓▓░░░░ │ →  │ ░░░░░░░ │                   │
│  │ ▓▓▓▓▓▓▓ │     │ ▓▓░░░░░ │     │ ░░░░░░░ │                   │
│  └─────────┘     └─────────┘     └─────────┘                   │
│                                                                  │
│  Phase 2 (0.3-0.5s): 색상 전환 파티클                           │
│  ┌─────────────────────────────────────────┐                    │
│  │    Gold → Cyan 파티클 흩날림             │                    │
│  │    ·  ·  ·  ·  ·  ·  ·  ·  ·  ·        │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                  │
│  Phase 3 (0.5-0.8s): 새 UI 조립 애니메이션                      │
│  ┌─────────┐     ┌─────────┐     ┌─────────┐                   │
│  │ ┌─      │ →  │ ┌──┐    │ →  │ ┌──────┐ │                   │
│  │         │     │ │  │    │     │ │      │ │                   │
│  │      ─┘ │     │    └──┘ │     │ └──────┘ │                   │
│  └─────────┘     └─────────┘     └─────────┘                   │
│     코너에서         중앙으로         완성                       │
│                                                                  │
│  Phase 4 (0.8-1.0s): 컨텐츠 Fade In                             │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  NORMAL → COMBAT                                                 │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  Phase 1: 화면 적색 플래시                                       │
│  Phase 2: UI 프레임 "깨지는" 애니메이션 (crack propagation)     │
│  Phase 3: 파편들이 재조립되며 붉은색으로 변환                   │
│  Phase 4: 경고 배너 슬라이드 인                                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  COMBAT → INFECTED                                               │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  Phase 1: 글리치 폭발 (전체 화면 노이즈)                        │
│  Phase 2: UI가 "녹아내리는" 애니메이션                          │
│  Phase 3: 색상 보라색/녹색으로 변이                              │
│  Phase 4: 텍스트 깨짐 시작                                       │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  ANY → EVOLVED                                                   │
│  ═══════════════════════════════════════════════════════════    │
│                                                                  │
│  Phase 1: 화면 밝아짐 (White flash)                             │
│  Phase 2: 골든 파티클 폭발 (중앙에서 바깥으로)                  │
│  Phase 3: UI가 "재건"되는 애니메이션 (8bit→HD 모프)             │
│  Phase 4: 타임캡슐 개방 이펙트                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 컴포넌트 Transform 상세

```typescript
// 창 프레임 트랜지션
const WindowTransition = {
  // 등장
  enter: {
    from: { scale: 0.8, opacity: 0, y: 20 },
    to: { scale: 1, opacity: 1, y: 0 },
    duration: 300,
    easing: 'easeOutBack'
  },
  
  // 퇴장
  exit: {
    from: { scale: 1, opacity: 1 },
    to: { scale: 0.9, opacity: 0, filter: 'blur(10px)' },
    duration: 200,
    easing: 'easeInQuad'
  },
  
  // 시나리오별 특수 효과
  scenarios: {
    combat: {
      enter: 'shatter-in',      // 파편 조립
      exit: 'crack-out'         // 깨지며 사라짐
    },
    infected: {
      enter: 'glitch-in',       // 글리치 등장
      exit: 'melt-out'          // 녹아내림
    },
    evolved: {
      enter: 'golden-build',    // 황금 재건
      exit: 'particle-scatter'  // 파티클 흩어짐
    }
  }
}

// 크로스헤어 트랜지션
const CrosshairTransition = {
  normal_to_combat: {
    // 원형 → 톱니 모양
    steps: [
      { morphPath: 'circle', t: 0 },
      { morphPath: 'octagon', t: 0.3 },
      { morphPath: 'jagged-square', t: 0.7 },
      { morphPath: 'target-lock', t: 1 }
    ],
    colorShift: ['#FFD700', '#FF6600', '#FF0000'],
    duration: 400
  },
  
  any_to_evolved: {
    // 어떤 형태든 → 캐논 조준선
    steps: [
      { scale: 0, rotate: 0 },
      { scale: 1.5, rotate: 180 },
      { scale: 1, rotate: 360, morphPath: 'cannon-reticle' }
    ],
    particleEmit: true,
    duration: 600
  }
}
```

---

## 5. 인터랙션 상세 설계

### 5.1 키보드 단축키 (완전판)

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEYBOARD CONTROLS                             │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  시나리오 전환 (트랜지션 애니메이션 포함)                        │
│  ═══════════════════════════════════════════════════════════    │
│  [1]  NORMAL    (기본 골드 HUD)                                  │
│  [2]  SYNC      (신경 접속)                                      │
│  [3]  COMBAT    (전투 모드)                                      │
│  [4]  INFECTED  (감염 상태)                                      │
│  [5]  TRAUMA    (트라우마)                                       │
│  [6]  EVOLVED   (초진화)                                         │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  게임 액션                                                       │
│  ═══════════════════════════════════════════════════════════    │
│  [Space]    락온 / 진화 발동 / 캐논 차징                        │
│  [E]        상호작용 (시나리오별)                                │
│  [Tab]      다음 타겟                                            │
│  [Enter]    로그인 확인 (SYNC 시나리오)                          │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  UI 토글                                                         │
│  ═══════════════════════════════════════════════════════════    │
│  [H]        HUD 전체 표시/숨김                                   │
│  [B]        Bio Panel 토글                                       │
│  [S]        Status Panel 토글                                    │
│  [T]        Team Panel 토글                                      │
│  [M]        미니맵 토글                                          │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  시뮬레이션 (테스트용)                                           │
│  ═══════════════════════════════════════════════════════════    │
│  [D]        데미지 시뮬레이션                                    │
│  [L]        레벨업 시뮬레이션                                    │
│  [G]        글리치 강도 조절                                     │
│  [P]        로그인 팝업 토글                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 마우스 인터랙션 (시나리오별)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOUSE INTERACTIONS                            │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  NORMAL                                                          │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     크로스헤어 추적 (부드러운 따라가기)                  │
│  Click:    선택 / 기본 상호작용                                  │
│  Hover:    UI 요소 하이라이트                                    │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  SYNC                                                            │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     동기화 링 반응                                        │
│  Click:    동기화 가속 (1회당 +5%)                               │
│  Hold:     의식 집중 (파티클 수렴)                               │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  COMBAT                                                          │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     타겟팅 크로스헤어 추적                                │
│  Click:    ★ HIT MARKER 표시 ★                                  │
│            └─ 클릭 위치에서 ✖ 형태 0.3초 표시                   │
│            └─ 적 위에서 클릭 시 데미지 숫자 팝업                │
│  Hold:     연사 모드 (자동 Hit Marker)                           │
│  RClick:   회피 (화면 흔들림)                                    │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  INFECTED                                                        │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     왜곡된 크로스헤어 (지연 + 떨림)                       │
│  Click:    글리치 폭발 (일시적 강화)                             │
│  Rapid:    시스템 불안정 트리거                                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  TRAUMA                                                          │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     느린 반응 (무기력)                                    │
│  Click:    아무 효과 없음 (절망 표현)                            │
│  Any:      "희망이 없습니다" 메시지                              │
│                                                                  │
│  ═══════════════════════════════════════════════════════════    │
│  EVOLVED                                                         │
│  ═══════════════════════════════════════════════════════════    │
│  Move:     캐논 조준선 추적                                      │
│  Hold:     ★ 캐논 차징 ★ (0% → 100%)                           │
│  Release:  캐논 발사 (화면 플래시 + 폭발)                        │
│  Circle:   기억 회상 (파티클 소용돌이)                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Hit Marker 상세 설계

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIT MARKER SYSTEM                             │
│                                                                  │
│  기본 형태:                                                      │
│                                                                  │
│           ╲   ╱                                                  │
│            ╲ ╱                                                   │
│             ╳     ← 교차점이 클릭 위치                          │
│            ╱ ╲                                                   │
│           ╱   ╲                                                  │
│                                                                  │
│  애니메이션 타임라인:                                            │
│  0ms ─────────────────────────────────────────▶ 300ms           │
│  │                                                               │
│  ├─ [0ms]    출현 (scale: 0 → 1, opacity: 0 → 1)                │
│  ├─ [50ms]   최대 크기 도달                                      │
│  ├─ [100ms]  약간 축소 (scale: 1 → 0.8)                         │
│  ├─ [200ms]  페이드 시작 (opacity: 1 → 0)                       │
│  └─ [300ms]  완전 사라짐                                         │
│                                                                  │
│  헤드샷 (적 머리 부위 클릭):                                     │
│                                                                  │
│           ╲   ╱                                                  │
│            ╲ ╱                                                   │
│             ◉     ← 중앙에 원 추가                              │
│            ╱ ╲                                                   │
│           ╱   ╲                                                  │
│  + "HEADSHOT" 텍스트                                             │
│  + 빨간색 더 진하게                                              │
│                                                                  │
│  크리티컬 (높은 데미지):                                         │
│                                                                  │
│         ╲ │ ╱                                                    │
│          ╲│╱                                                     │
│        ───◆───   ← 8방향 + 중앙 다이아몬드                      │
│          ╱│╲                                                     │
│         ╱ │ ╲                                                    │
│  + 데미지 숫자 팝업 (노란색, 위로 떠오름)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 시나리오별 라이브러리 통합 상세 가이드

### 6.1 NORMAL 상태 (기본 HUD)

```typescript
// 라이브러리 요소 조합
const NormalHUD = () => (
  <VFX.VFXProvider>
    {/* 배경: 골드 그리드 */}
    <GridLines lineColor="#FFD70033" distance={40} />
    
    {/* 마우스 글로우 */}
    <Illuminator color="hsl(45 100% 50% / 10%)" size={300} />
    
    {/* 메인 패널들 */}
    <FrameCorners color="#FFD700" cornerLength={20}>
      <BioPanel />
    </FrameCorners>
    
    <FrameCorners color="#FFD700" cornerLength={20}>
      <StatusPanel />
    </FrameCorners>
    
    {/* 크로스헤어 - VFX 없음 */}
    <Crosshair color="#FFD700" />
  </VFX.VFXProvider>
);
```

**적용 효과:**
- `@arwes/react-frames`: FrameCorners (골드 코너 프레임)
- `@arwes/react-bgs`: GridLines (골드 대시 그리드)
- `@arwes/effects`: createEffectIlluminator (마우스 글로우)
- `react-vfx`: 없음 (기본 상태)
- `@arwes/text`: animateTextDecipher (텍스트 등장 시)

---

### 7.2 SYNC 시나리오 (신경 접속)

```typescript
// 라이브러리 요소 조합
const SyncHUD = ({ syncProgress }: { syncProgress: number }) => (
  <VFX.VFXProvider>
    {/* 배경: 시안 도트 패턴 */}
    <Dots color="#00D4FF" distance={20} />
    
    {/* 전체 UI에 픽셀화 트랜지션 */}
    <VFX.VFXDiv shader="pixelateTransition" uniforms={{ 
      enterTime: syncProgress,
      leaveTime: 0 
    }}>
      {/* 동기화 링 */}
      <FrameCircle 
        strokeColor="#00D4FF"
        animated={true}
        pulseSpeed={1.5}
      >
        <SyncProgress value={syncProgress} />
      </FrameCircle>
      
      {/* 텍스트: 암호해독 스타일 등장 */}
      <DecipherText 
        text="SYNCHRONIZING..."
        progress={syncProgress}
        characters="01010101▓▒░█████"
      />
    </VFX.VFXDiv>
  </VFX.VFXProvider>
);
```

**적용 효과:**
- `@arwes/react-frames`: FrameCircle (동기화 링)
- `@arwes/react-bgs`: Dots (시안 도트 패턴)
- `react-vfx`: `pixelateTransition` (접속 중 픽셀화)
- `@arwes/text`: animateTextDecipher (바이너리 스타일)

---

### 7.3 COMBAT 시나리오 (전투/피격)

```typescript
// 라이브러리 요소 조합
const CombatHUD = ({ 
  damageIntensity, 
  isLocked,
  isFiring 
}: CombatState) => {
  // 데미지 강도에 따른 셰이더 선택
  const shader = useMemo(() => {
    if (damageIntensity > 0.7) return 'glitch';
    if (damageIntensity > 0.3) return 'rgbShift';
    if (isLocked) return 'chromatic';
    return 'vignette';
  }, [damageIntensity, isLocked]);
  
  return (
    <VFX.VFXProvider>
      {/* 배경: 붉은 움직이는 라인 */}
      <MovingLines lineColor="#FF004466" speed={2} />
      
      {/* 전체 UI에 VFX */}
      <VFX.VFXDiv shader={shader} uniforms={{
        intensity: damageIntensity,
        radius: 0.5,
        power: 2
      }}>
        {/* 적 정보 패널 */}
        <FrameKranox color="#FF0044" animated={true}>
          <EnemyInfo />
        </FrameKranox>
        
        {/* 경고 배너 */}
        <FrameNero color="#FF6600">
          <WarningBanner text="SYSTEM WARNING: PAIN FEEDBACK MAX" />
        </FrameNero>
        
        {/* 체력바 - 위험 시 blink */}
        <VFX.VFXDiv shader={damageIntensity > 0.7 ? 'blink' : 'none'}>
          <HealthBar />
        </VFX.VFXDiv>
      </VFX.VFXDiv>
      
      {/* Hit Marker (클릭 시) */}
      {isFiring && <HitMarker />}
    </VFX.VFXProvider>
  );
};
```

**적용 효과:**
- `@arwes/react-frames`: FrameKranox (타겟팅), FrameNero (경고)
- `@arwes/react-bgs`: MovingLines (붉은 움직이는 라인)
- `react-vfx`: 
  - `glitch` (큰 데미지)
  - `rgbShift` (일반 데미지)
  - `chromatic` (락온)
  - `vignette` (기본 피격)
  - `blink` (체력바 위험 경고)

---

### 7.4 INFECTED 시나리오 (감염 상태)

```typescript
// 커스텀 녹아내림 셰이더
const MELT_GLITCH_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float infectionLevel;
uniform sampler2D src;
out vec4 outColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    
    // 녹아내림 (감염도에 비례)
    float melt = sin(uv.x * 20.0 + time * 2.0) * 0.03 * infectionLevel * uv.y;
    uv.y += melt;
    
    // 픽셀 누락
    float noise = fract(sin(dot(uv * time, vec2(12.9898, 78.233))) * 43758.5453);
    if (noise > 0.97 && infectionLevel > 0.5) {
        discard;
    }
    
    // RGB 분리
    float shift = infectionLevel * 0.02;
    vec4 cr = texture(src, uv + vec2(shift, 0));
    vec4 cg = texture(src, uv);
    vec4 cb = texture(src, uv - vec2(shift, 0));
    
    outColor = vec4(cr.r * 0.8, cg.g * 1.2, cb.b * 1.5, 1.0);
}
`;

const InfectedHUD = ({ infectionLevel }: { infectionLevel: number }) => (
  <VFX.VFXProvider>
    {/* 배경: 보라색 파프 */}
    <Puffs color="#9900FF" quantity={30 + infectionLevel * 20} />
    
    {/* 전체 UI에 글리치 */}
    <VFX.VFXDiv shader={MELT_GLITCH_SHADER} uniforms={{
      infectionLevel
    }}>
      {/* 손상된 패널들 */}
      <FrameNero color="#9900FF" damaged={true}>
        {/* 깨진 텍스트 */}
        <CorruptedText 
          text="STATUS: INFECTED" 
          corruptionLevel={infectionLevel}
          characters="█▓▒░?#@!$%^&*▓█▒░"
        />
      </FrameNero>
      
      {/* 바이러스 로드 게이지 */}
      <ViralLoadGauge value={infectionLevel} />
      
      {/* 왜곡된 크로스헤어 */}
      <DistortedCrosshair wobble={infectionLevel * 10} />
    </VFX.VFXDiv>
  </VFX.VFXProvider>
);
```

**적용 효과:**
- `@arwes/react-frames`: FrameNero (손상된 프레임)
- `@arwes/react-bgs`: Puffs (보라색 연기)
- `react-vfx`: 
  - `rgbGlitch` (RGB 분리)
  - 커스텀 `meltGlitch` (녹아내림)
- `@arwes/text`: 커스텀 깨진 문자셋

---

### 6.5 TRAUMA 시나리오 (트라우마 던전)

```typescript
const TraumaHUD = ({ chartPhase }: { chartPhase: 'ecg' | 'morph' | 'chart' }) => (
  <VFX.VFXProvider>
    {/* 배경: 회색 그리드 */}
    <GridLines lineColor="#66666633" distance={30} />
    
    {/* 전체 UI에 grayscale */}
    <VFX.VFXDiv shader="grayscale">
      {/* 병원 모니터 스타일 */}
      <FrameOctagon 
        color="#666666"
        bgColor="rgba(30, 30, 30, 0.9)"
      >
        {/* 심전도 → 차트 모프 */}
        <ECGToChartMorph phase={chartPhase} />
        
        {/* 손실 표시 */}
        <LossDisplay value={-847293} currency="₿" />
      </FrameOctagon>
      
      {/* 사신 보스 - halftone 효과 */}
      <VFX.VFXDiv shader="halftone">
        <FrameOctagon color="#CC3333">
          <BossDisplay 
            name="REAPER"
            hp={Infinity}
            message="포기하세요. 희망은 없습니다."
          />
        </FrameOctagon>
      </VFX.VFXDiv>
      
      {/* 희망 게이지 - 항상 0 */}
      <HopeGauge value={0} />
    </VFX.VFXDiv>
  </VFX.VFXProvider>
);
```

**적용 효과:**
- `@arwes/react-frames`: FrameOctagon (의료 모니터 스타일)
- `@arwes/react-bgs`: GridLines (회색 그리드)
- `react-vfx`: 
  - `grayscale` (전체 흑백)
  - `halftone` (사신 보스 영역)
- 커스텀: ECG→Chart 모프 애니메이션

---

### 6.6 EVOLVED 시나리오 (최종 진화)

```typescript
const EvolvedHUD = ({ 
  cannonCharge,
  isCharging 
}: { cannonCharge: number; isCharging: boolean }) => (
  <VFX.VFXProvider>
    {/* 배경: 황금 파프 (반딧불) */}
    <Puffs color="#FFD700" quantity={50} size={3} />
    
    {/* 전체 UI에 rainbow/shine */}
    <VFX.VFXDiv shader={isCharging ? 'rainbow' : 'shine'}>
      {/* 8bit + HD 융합 프레임 */}
      <PixelatedGoldFrame>
        {/* 메모리 싱크 */}
        <DecipherText 
          text="MEMORY SYNC: 100%"
          progress={1}
          characters="★☆✦✧◆◇●○■□"
        />
        
        {/* 명대사 */}
        <GoldenText>"우리는 무엇이든 가능하다"</GoldenText>
      </PixelatedGoldFrame>
      
      {/* 캐논 조준선 */}
      <FrameCircle 
        color="#FFD700"
        segments={12}
        rotating={true}
        pulseOnCharge={isCharging}
      >
        <CannonCharge value={cannonCharge} />
        <ServerCoreTarget />
      </FrameCircle>
      
      {/* 골든 파티클 상승 */}
      <GoldenParticles direction="up" count={100} />
    </VFX.VFXDiv>
  </VFX.VFXProvider>
);
```

**적용 효과:**
- `@arwes/react-frames`: FrameCircle (12각형 캐논 조준선), FrameHeader (영웅적 프레임)
- `@arwes/react-bgs`: Puffs (황금 파프/반딧불)
- `react-vfx`: 
  - `rainbow` (차징 중)
  - `shine` (완료 상태)
- `@arwes/text`: animateTextDecipher (별 문자셋)

---

## 7. 누락 요소 체크리스트

### 7.1 필수 구현 (Critical)

```
┌─────────────────────────────────────────────────────────────────┐
│                    CRITICAL - 반드시 구현                        │
│                                                                  │
│  [ ] 1. 기본 색상 변경: Cyan → Gold/Yellow                      │
│  [ ] 2. Win98 스타일 창 프레임 (─ □ ✕ 버튼 포함)                │
│  [ ] 3. 스캔라인 + 홀로그램 효과                                 │
│  [ ] 4. 시나리오 전환 트랜지션 애니메이션                        │
│  [ ] 5. Hit Marker 시스템 (COMBAT)                               │
│  [ ] 6. 캐논 차징 + 발사 (EVOLVED)                               │
│  [ ] 7. 글리치 텍스트 깨짐 (INFECTED)                            │
│  [ ] 8. 심전도→주식차트 모프 (TRAUMA)                           │
│  [ ] 9. 사신 보스 HP: ∞ 표시 (TRAUMA)                           │
│  [ ] 10. 타임캡슐 개방 이펙트 (EVOLVED)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 중요 구현 (High Priority)

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIGH PRIORITY                                 │
│                                                                  │
│  [ ] 11. DAY 표시 (1일차~5일차)                                  │
│  [ ] 12. 팀원 상태 표시 (소영/루비안, 민준/현정사랑)             │
│  [ ] 13. 퀘스트 표시 창                                          │
│  [ ] 14. 로그인 팝업 ("페르소나 이름을 호출하세요")              │
│  [ ] 15. 레벨업 알림 애니메이션                                  │
│  [ ] 16. 진화 시퀀스 (어린 페르소나 → 성장 페르소나)             │
│  [ ] 17. 몽단 섭취 시각화 (배급기 UI)                            │
│  [ ] 18. 블랙룸 다중 화면 (현실 뉴스 표시)                       │
│  [ ] 19. 비행기 추락 카운트다운 타이머                           │
│  [ ] 20. 서버코어 타겟팅 UI                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 추가 요소 (Nice to Have)

```
┌─────────────────────────────────────────────────────────────────┐
│                    NICE TO HAVE                                  │
│                                                                  │
│  [ ] 21. 미니맵                                                  │
│  [ ] 22. 스킬 쿨다운 표시                                        │
│  [ ] 23. 버프/디버프 아이콘                                       │
│  [ ] 24. 콤보 카운터                                             │
│  [ ] 25. 피격 방향 표시기                                        │
│  [ ] 26. 환경 위험 경고 (용암, 독 등)                            │
│  [ ] 27. 대화 자막 시스템                                        │
│  [ ] 28. 업적 알림                                               │
│  [ ] 29. 아이템 획득 팝업                                        │
│  [ ] 30. 사운드 시각화 (볼륨 바)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 시나리오 특화 요소

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCENARIO-SPECIFIC                             │
│                                                                  │
│  SYNC 시나리오:                                                  │
│  [ ] 홍채 인식 스캔 애니메이션                                   │
│  [ ] 뇌파(알파/베타) 그래프                                      │
│  [ ] 페르소나 와이어프레임 오버레이                              │
│  [ ] "MAGICO" 입력 → 로그인 완료                                 │
│                                                                  │
│  COMBAT 시나리오:                                                │
│  [ ] 적 정보창 (이름, 레벨, HP, 위협등급)                        │
│  [ ] 피격 시 화면 비네트 + 크랙                                  │
│  [ ] 체력 위험 시 깜빡임 + 경고음 표시                           │
│  [ ] "SYSTEM WARNING: PAIN FEEDBACK MAX"                         │
│                                                                  │
│  INFECTED 시나리오:                                              │
│  [ ] UI 녹아내림 효과 (drip animation)                           │
│  [ ] 픽셀 누락 + 잘못 배치                                       │
│  [ ] 색수차 (chromatic aberration)                               │
│  [ ] STATUS: UNDEAD 경고                                         │
│                                                                  │
│  TRAUMA 시나리오:                                                │
│  [ ] 병실 심전도 모니터 UI                                       │
│  [ ] 캔들차트 급락 애니메이션                                    │
│  [ ] "포기하세요. 희망은 없습니다." 메시지                       │
│  [ ] 무한대(∞) 기호 회전                                        │
│                                                                  │
│  EVOLVED 시나리오:                                               │
│  [ ] 8bit 픽셀 프레임 + HD 골드 텍스처                           │
│  [ ] "우리는 무엇이든 가능하다" 대사                             │
│  [ ] 12각형 캐논 조준선                                          │
│  [ ] MEMORY SYNC: 100%                                           │
│  [ ] 황금빛 파티클 (반딧불 스타일)                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 부록: 참조 이미지 분석

레퍼런스 이미지에서 추출한 디자인 요소:

```
┌─────────────────────────────────────────────────────────────────┐
│                    REFERENCE IMAGE ANALYSIS                      │
│                                                                  │
│  이미지 1-3 (캐릭터소개UI):                                      │
│  ├─ 프레임 색상: Gold (#FFD700, #FFC000)                        │
│  ├─ 배경: 반투명 다크 + 육각형 패턴                             │
│  ├─ 창 스타일: 이중 테두리, 코너 장식                           │
│  ├─ 텍스트: 모노스페이스, 대문자, 골드 강조                     │
│  ├─ 정보 패널: BIOLOGICAL, THERMAL BRAIN SCAN                   │
│  ├─ 그래프: 파형, 히트맵, 바 차트                               │
│  └─ 경고: "ZONE: DANGER", "THREAT LEVEL: HIGH"                  │
│                                                                  │
│  적용 방향:                                                      │
│  ├─ 기본 HUD 프레임을 이 스타일로 변경                          │
│  ├─ Bio Panel에 BIOLOGICAL ANALYSIS 형식 적용                   │
│  ├─ 적 정보창에 THREAT LEVEL 게이지 적용                        │
│  └─ 전체적으로 골드/옐로우 톤 유지                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**문서 버전**: 2.0  
**작성일**: 2026-01-21  
**상태**: 구현 대기
