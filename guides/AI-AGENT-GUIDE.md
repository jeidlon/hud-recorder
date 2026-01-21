# AI Agent 개발 가이드: HUD Recorder

> 이 문서는 AI Agent가 HUD Recorder 프로젝트의 개발 및 HUD 디자인을 이어갈 수 있도록 작성되었습니다.

## 📋 프로젝트 개요

**HUD Recorder**는 영상에 웹 기반 HUD(Heads-Up Display)를 오버레이하여 렌더링하는 웹 앱입니다.

### 핵심 기능
- 🎬 영상 파일 로드 (MP4, WebM, MOV)
- 🎨 커스텀 HUD 오버레이
- ⚡ WebCodecs API로 하드웨어 가속 인코딩/디코딩
- 🖥️ WebGPU 기반 포스트 프로세싱
- 🎭 Remotion 스타일 프레임 기반 애니메이션

---

## 🏗️ 기술 스택

### 핵심 기술

| 기술 | 용도 | 파일 위치 |
|------|------|-----------|
| **React 18** | UI 프레임워크 | `src/` |
| **Vite** | 빌드 도구 | `vite.config.ts` |
| **Zustand** | 상태 관리 | `src/store/useAppStore.ts` |
| **WebCodecs API** | 영상 인코딩/디코딩 | `src/core/` |
| **WebGPU** | GPU 셰이더 합성 | `src/core/WebGPUCompositor.ts` |
| **Remotion 패턴** | 프레임 기반 애니메이션 | `src/presets/remotion/` |
| **Framer Motion** | React 애니메이션 | 전역 |
| **Tailwind CSS** | 스타일링 | 전역 |

### 의존성

```json
{
  "remotion": "^4.x",
  "@remotion/player": "^4.x",
  "@remotion/cli": "^4.x",
  "framer-motion": "^11.x",
  "react-vfx": "^2.x"
}
```

---

## 📁 디렉토리 구조

```
src/
├── core/                    # 렌더링 파이프라인
│   ├── RenderingPipeline.ts # 메인 렌더링 오케스트레이터
│   ├── WebGPUCompositor.ts  # GPU 셰이더 합성
│   ├── WebGPUSupport.ts     # WebGPU 지원 체크
│   ├── FrameCompositor.ts   # Canvas 2D 합성 (폴백)
│   ├── OfflineHUDRenderer.ts # 오프라인 HUD 렌더링
│   ├── VideoDecoderWrapper.ts
│   ├── VideoEncoderWrapper.ts
│   ├── MP4Demuxer.ts
│   └── MP4Muxer.ts
│
├── presets/                 # HUD 프리셋
│   ├── index.ts             # 프리셋 레지스트리
│   ├── remotion/            # Remotion 스타일 HUD
│   │   ├── RemotionHUDWrapper.tsx  # 핵심 유틸리티
│   │   └── CyberpunkHUD.tsx        # 예제 HUD
│   ├── TargetLockHUD.tsx
│   ├── DreamPersonaHUD.tsx
│   └── dreamPersonaRemaster/
│
├── components/              # UI 컴포넌트
│   ├── controls/
│   │   ├── ControlPanel.tsx
│   │   └── WebGPUSettings.tsx
│   ├── hud/
│   └── video/
│
├── store/
│   └── useAppStore.ts       # 전역 상태
│
└── types/
    ├── hud-protocol.ts      # HUD 상태 타입
    └── input-log.ts         # 입력 로그 타입
```

---

## 🎨 Remotion 스타일 애니메이션 시스템

### 핵심 원칙

> **모든 애니메이션은 `frame` 값으로 구동됩니다.**
> CSS transition, setTimeout, setInterval은 사용하지 마세요.
> 이들은 렌더링 시 프레임 불일치를 유발합니다.

### 사용 가능한 훅

```tsx
import {
  useHUDFrame,      // 현재 프레임 (0, 1, 2, ...)
  useHUDConfig,     // { fps, width, height, durationInFrames }
  useHUDState,      // 마우스, 타겟 등 HUD 상태
} from '@/presets/remotion/RemotionHUDWrapper'
```

### 애니메이션 유틸리티

#### 1. `spring()` - 물리 기반 스프링

```tsx
import { spring } from '@/presets/remotion/RemotionHUDWrapper'

const opacity = spring({
  frame,
  fps,
  delay: 10,              // 10프레임 후 시작
  config: {
    damping: 20,          // 높을수록 빨리 정지
    stiffness: 100,       // 높을수록 빠른 움직임
    mass: 1,              // 높을수록 무거운 느낌
  },
  from: 0,
  to: 1,
})
```

**스프링 프리셋:**
```tsx
const SPRING_PRESETS = {
  snappy:  { damping: 20, stiffness: 300 },  // 빠르고 정확
  smooth:  { damping: 30, stiffness: 120 },  // 부드러움
  bouncy:  { damping: 8,  stiffness: 180 },  // 통통 튀는
  heavy:   { damping: 25, stiffness: 80, mass: 2 },  // 묵직한
}
```

#### 2. `interpolate()` - 선형 보간

```tsx
import { interpolate, Easing } from '@/presets/remotion/RemotionHUDWrapper'

// 기본 보간
const opacity = interpolate(frame, [0, 30], [0, 1])

// Easing 적용
const scale = interpolate(
  frame,
  [0, 30, 60],
  [0, 1.2, 1],
  { easing: Easing.out }
)

// 클램핑
const progress = interpolate(
  frame,
  [0, 100],
  [0, 1],
  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
)
```

#### 3. `<Sequence>` - 타이밍 기반 표시

```tsx
import { Sequence } from '@/presets/remotion/RemotionHUDWrapper'

// 30프레임부터 60프레임 동안만 표시
<Sequence from={30} durationInFrames={60}>
  <MyComponent />
</Sequence>
```

---

## 🖥️ WebGPU 포스트 프로세싱

### WebGPU 사용 여부 확인

```tsx
import { isWebGPUSupported } from '@/core/WebGPUSupport'

if (isWebGPUSupported()) {
  // WebGPU 사용 가능
}
```

### 현재 구현된 셰이더 효과

`WebGPUCompositor.ts`의 프래그먼트 셰이더:

```wgsl
@fragment
fn main(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / u_resolution;
  
  let videoColor = textureSample(videoTexture, texSampler, uv);
  let hudColor = textureSample(hudTexture, texSampler, uv);

  if (u_webgpu_enabled == 1u) {
    // 글리치 효과
    let glitchStrength = sin(u_time * 10.0) * 0.01;
    let offset = vec2f(sin(uv.y * 100.0 + u_time * 5.0) * glitchStrength, 0.0);
    let hudGlitch = textureSample(hudTexture, texSampler, uv + offset);
    
    return vec4f(mix(videoColor.rgb, hudGlitch.rgb, hudGlitch.a), 1.0);
  }
  
  // 기본 알파 블렌딩
  return vec4f(mix(videoColor.rgb, hudColor.rgb, hudColor.a), 1.0);
}
```

### 새 셰이더 효과 추가하기

1. `WebGPUCompositor.ts`의 프래그먼트 셰이더 수정
2. 필요한 uniform 추가
3. `composite()` 메서드에서 uniform 값 전달

**예시: 색수차(Chromatic Aberration) 추가**

```wgsl
// 색수차 효과
let caStrength = 0.002;
let r = textureSample(hudTexture, texSampler, uv + vec2f(caStrength, 0.0)).r;
let g = hudColor.g;
let b = textureSample(hudTexture, texSampler, uv - vec2f(caStrength, 0.0)).b;
let caColor = vec4f(r, g, b, hudColor.a);
```

### 구현 가능한 WebGPU 효과 아이디어

| 효과 | WGSL 패턴 |
|------|-----------|
| **글리치** | UV 오프셋 + sin 함수 |
| **색수차** | R/G/B 채널별 UV 오프셋 |
| **스캔라인** | y좌표 기반 줄무늬 |
| **비네팅** | 중심 거리 기반 어두워짐 |
| **노이즈/그레인** | 랜덤 함수 + 시간 |
| **블룸** | 밝은 부분 블러 + 합성 |
| **CRT 효과** | 픽셀 그리드 + 곡면 왜곡 |
| **홀로그램** | 줄무늬 + 색상 시프트 |
| **픽셀화** | UV 양자화 |
| **열화상** | 색상 → 온도 매핑 |

```wgsl
// 비네팅 예시
let center = vec2f(0.5, 0.5);
let dist = distance(uv, center);
let vignette = 1.0 - smoothstep(0.4, 0.8, dist);
finalColor *= vignette;

// 스캔라인 예시
let scanline = sin(uv.y * u_resolution.y * 3.14159) * 0.1 + 0.9;
finalColor *= scanline;

// 노이즈 예시
fn rand(co: vec2f) -> f32 {
  return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453);
}
let noise = rand(uv + u_time) * 0.1;
finalColor += noise;
```

---

## 🎮 새 HUD 프리셋 만들기

### 1단계: 컴포넌트 생성

```tsx
// src/presets/remotion/MyCustomHUD.tsx

import * as React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { HUDComponentProps } from '@/presets/index'
import type { HUDState } from '@/types/hud-protocol'
import {
  useHUDFrame,
  useHUDConfig,
  useHUDState,
  RemotionHUDProvider,
  spring,
  interpolate,
} from './RemotionHUDWrapper'

// 내부 컴포넌트 (Remotion Context 내부)
const MyHUDContent: React.FC = () => {
  const frame = useHUDFrame()
  const { fps, width, height } = useHUDConfig()
  const hudState = useHUDState()
  
  // 스프링 애니메이션
  const panelOpacity = spring({ frame, fps, delay: 0 })
  
  return (
    <div style={{ 
      position: 'absolute', 
      inset: 0,
      opacity: panelOpacity 
    }}>
      {/* HUD 요소들 */}
    </div>
  )
}

// 메인 컴포넌트 (hud-recorder 시스템 통합)
export function MyCustomHUD({
  width,
  height,
  isPlaying,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const [frame, setFrame] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const fps = 60
  
  // 프레임 루프
  useEffect(() => {
    let animationId: number
    const update = () => {
      setFrame(f => f + 1)
      animationId = requestAnimationFrame(update)
    }
    animationId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animationId)
  }, [])
  
  // 상태 업데이트
  useEffect(() => {
    onStateUpdate?.({
      timestamp: performance.now(),
      mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
    })
  }, [mousePos, onStateUpdate])
  
  useEffect(() => { onReady?.() }, [onReady])
  
  return (
    <div 
      style={{ position: 'absolute', inset: 0 }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * width,
          y: ((e.clientY - rect.top) / rect.height) * height,
        })
      }}
    >
      <RemotionHUDProvider
        frame={frame}
        fps={fps}
        durationInFrames={9999}
        width={width}
        height={height}
        hudState={{
          timestamp: performance.now(),
          mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
        }}
      >
        <MyHUDContent />
      </RemotionHUDProvider>
    </div>
  )
}
```

### 2단계: 프리셋 등록

```tsx
// src/presets/index.ts

import { MyCustomHUD } from './remotion/MyCustomHUD'
import { Sparkles } from 'lucide-react' // 아이콘

export const hudPresets: HUDPreset[] = [
  {
    id: 'my-custom',
    name: 'My Custom HUD',
    description: '설명',
    icon: Sparkles,
    component: MyCustomHUD,
    available: true,
  },
  // ... 기존 프리셋들
]
```

### 3단계: 오프라인 렌더러 추가 (선택사항)

영상 내보내기를 지원하려면 Canvas 2D 기반 렌더러도 추가:

```tsx
// src/core/OfflineHUDRenderer.ts

render(state: FrameState): OffscreenCanvas {
  switch (this.config.presetId) {
    case 'my-custom':
      return this.renderMyCustom(state)
    // ...
  }
}

private renderMyCustom(state: FrameState): OffscreenCanvas {
  const ctx = this.ctx
  ctx.clearRect(0, 0, width, height)
  
  // Canvas 2D로 동일한 비주얼 구현
  // spring(), interpolate() 로직을 Canvas API로 변환
  
  this.frameIndex++
  return this.canvas
}
```

---

## 📐 HUD 상태 타입

```tsx
// src/types/hud-protocol.ts

interface HUDState {
  timestamp: number
  mouse?: {
    x: number
    y: number
    buttons: number
  }
  keyboard?: {
    keys: string[]
  }
  targets?: {
    main?: { x: number; y: number; locked?: boolean }
    secondary?: { x: number; y: number }[]
  }
  custom?: Record<string, unknown>
}
```

---

## 🎯 디자인 패턴 및 베스트 프랙티스

### ✅ DO (해야 할 것)

```tsx
// 모든 애니메이션은 frame 기반
const opacity = spring({ frame, fps, delay: 10 })

// 스태거드 애니메이션
items.map((item, i) => (
  <Item key={i} delay={i * 5} />
))

// 조건부 렌더링은 Sequence로
<Sequence from={30}>
  <LateElement />
</Sequence>
```

### ❌ DON'T (하지 말아야 할 것)

```tsx
// CSS transition 금지!
style={{ transition: 'opacity 0.3s' }}

// setTimeout/setInterval 금지!
setTimeout(() => setVisible(true), 500)

// requestAnimationFrame 내부에서 직접 DOM 조작 금지
// (React 상태로 관리)
```

### 애니메이션 타이밍 계산

```tsx
// 초 단위를 프레임으로 변환
const delayInSeconds = 0.5
const delayInFrames = delayInSeconds * fps // 30 frames at 60fps

// 프레임을 초로 변환
const currentTimeInSeconds = frame / fps
```

---

## 🔧 개발 명령어

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 타입 체크
npm run typecheck

# 린트
npm run lint
```

---

## 🐛 트러블슈팅

### WebGPU가 작동하지 않을 때

1. Chrome 113+ 또는 Edge 113+ 확인
2. `chrome://flags`에서 WebGPU 활성화 확인
3. HTTPS 또는 localhost에서만 작동

### 애니메이션이 끊길 때

1. `spring()` 또는 `interpolate()` 대신 CSS transition 사용 여부 확인
2. 불필요한 리렌더링 최소화 (useMemo, useCallback)
3. 복잡한 계산은 메모이제이션

### 내보내기 품질이 낮을 때

1. `OfflineHUDRenderer`에 해당 프리셋 구현 확인
2. `scale` 옵션으로 고해상도 출력
3. WebGPU 효과가 Canvas 2D 폴백에서 지원되는지 확인

---

## 📚 프로젝트 내 AI 스킬

이 프로젝트에는 AI Agent가 참고할 수 있는 스킬이 설치되어 있습니다:

### Remotion Best Practices
📁 `.agents/skills/remotion-best-practices/`

| 파일 | 내용 |
|------|------|
| `rules/animations.md` | spring, interpolate 사용법 |
| `rules/timing.md` | 타이밍 계산 |
| `rules/sequencing.md` | Sequence 컴포넌트 |
| `rules/charts.md` | 차트 애니메이션 |
| `rules/text-animations.md` | 텍스트 효과 |
| `rules/transitions.md` | 트랜지션 |
| `rules/3d.md` | 3D 효과 |
| `assets/` | 예제 코드 |

### Motion (Vue/Nuxt)
📁 `.agents/skills/motion/`

| 파일 | 내용 |
|------|------|
| `references/components.md` | 컴포넌트 패턴 |
| `references/composables.md` | 훅 패턴 |
| `references/examples.md` | 예제 |

> 💡 **스킬 활용법**: HUD 디자인 시 해당 스킬 파일을 읽어서 패턴 참고

---

## 📚 외부 참고 자료

- [Remotion 공식 문서](https://www.remotion.dev/docs)
- [WebGPU 스펙](https://www.w3.org/TR/webgpu/)
- [WebCodecs API](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [WGSL 레퍼런스](https://www.w3.org/TR/WGSL/)

---

## 🎨 HUD 디자인 요청 예시

AI Agent에게 이런 식으로 요청하세요:

```
"바운시하게 등장하는 HP 바 만들어줘"
→ spring({ config: { damping: 8 } })

"0.5초 후에 나타나는 패널"
→ <Sequence from={30}> + spring({ delay: 30 })

"글리치 효과 있는 텍스트"
→ GlitchText 컴포넌트 참고

"마우스 따라다니는 크로스헤어"
→ useHUDState().mouse 사용

"WebGPU 색수차 효과"
→ WebGPUCompositor 셰이더 수정
```

---

*마지막 업데이트: 2026-01-21*
