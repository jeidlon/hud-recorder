# HUD UI 개발 가이드

> HUD Recorder에 오버레이할 커스텀 UI 제작 규칙

---

## 📋 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [내장 프리셋 추가 (권장)](#2-내장-프리셋-추가-권장)
3. [공유 드로잉 모듈 작성](#3-공유-드로잉-모듈-작성)
4. [오프라인 렌더링 지원](#4-오프라인-렌더링-지원)
5. [통신 프로토콜 (iframe 방식)](#5-통신-프로토콜-iframe-방식)
6. [상태 업데이트 규칙](#6-상태-업데이트-규칙)
7. [렌더링 최적화](#7-렌더링-최적화)
8. [스타일 가이드](#8-스타일-가이드)
9. [테스트 체크리스트](#9-테스트-체크리스트)
10. [예제 템플릿](#10-예제-템플릿)

---

## 1. 아키텍처 개요

### 🎯 핵심 원칙: 공유 드로잉 모듈

**실시간 미리보기**와 **오프라인 렌더링(PNG/MP4)**이 **100% 동일한 결과**를 보장하려면 **공유 드로잉 모듈**을 사용해야 합니다.

```
                    myHUDDrawing.ts
                    (모든 드로잉 함수 공유)
                           │
           ┌───────────────┴───────────────┐
           │                               │
      MyNewHUD.tsx               OfflineHUDRenderer.ts
      (실시간 미리보기)              (PNG/MP4 내보내기)

              → 100% 동일한 렌더링 보장!
```

### 📁 파일 구조

```
src/
├── presets/
│   ├── index.ts                  ← 프리셋 레지스트리
│   ├── dreamPersonaDrawing.ts    ← 공유 드로잉 모듈 (핵심!)
│   ├── DreamPersonaHUD.tsx       ← 실시간 HUD 컴포넌트
│   └── TargetLockHUD.tsx         ← 다른 HUD
├── core/
│   └── OfflineHUDRenderer.ts     ← 오프라인 렌더러 (여기에 case 추가)
└── components/hud/
    └── InlineTargetLockHUD.tsx   ← 인라인 HUD
```

---

## 2. 내장 프리셋 추가 (권장)

### Step 1️⃣ 공유 드로잉 모듈 만들기

```typescript
// src/presets/myHUDDrawing.ts
// 이 파일의 함수들이 실시간 + 오프라인 모두에서 사용됨!

export type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

// 타입 정의
export interface MyHUDState {
  health: number
  mana: number
  // ... 커스텀 상태
}

// 색상 상수
export const COLORS = {
  primary: '#00ff00',
  danger: '#ff0000',
  // ...
}

// 드로잉 함수들 (핵심!)
export function drawHealthBar(
  ctx: DrawContext,
  x: number, y: number,
  health: number, maxHealth: number
) {
  const ratio = health / maxHealth
  const barWidth = 200
  const barHeight = 20

  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x, y, barWidth, barHeight)

  // 게이지
  ctx.fillStyle = ratio < 0.3 ? COLORS.danger : COLORS.primary
  ctx.fillRect(x, y, barWidth * ratio, barHeight)

  // 테두리
  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, barWidth, barHeight)
}

export function drawCrosshair(
  ctx: DrawContext,
  x: number, y: number,
  isLocked: boolean
) {
  const color = isLocked ? COLORS.danger : COLORS.primary
  ctx.strokeStyle = color
  ctx.lineWidth = 2

  // 십자선
  ctx.beginPath()
  ctx.moveTo(x - 20, y)
  ctx.lineTo(x + 20, y)
  ctx.moveTo(x, y - 20)
  ctx.lineTo(x, y + 20)
  ctx.stroke()

  // 원
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.stroke()
}

// 시나리오별 HUD
export function drawMainHUD(
  ctx: DrawContext,
  width: number, height: number,
  state: MyHUDState,
  mousePos: { x: number; y: number },
  time: number
) {
  // 여기서 다른 드로잉 함수들 호출
  drawHealthBar(ctx, 20, 20, state.health, 100)
  drawCrosshair(ctx, mousePos.x, mousePos.y, false)
  // ...
}
```

### Step 2️⃣ React HUD 컴포넌트 만들기

```tsx
// src/presets/MyNewHUD.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type { HUDComponentProps } from './index'

// 공유 드로잉 모듈 import! (핵심!)
import {
  type MyHUDState,
  drawMainHUD,
  drawCrosshair,
  // ... 필요한 함수들
} from './myHUDDrawing'

export function MyNewHUD({
  width,
  height,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const [state, setState] = useState<MyHUDState>({ health: 100, mana: 50 })
  const [time, setTime] = useState(0)

  // 초기화
  useEffect(() => {
    onReady?.()
  }, [onReady])

  // 마우스 이벤트
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    })
  }, [width, height])

  // 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 공유 드로잉 함수 호출! (오프라인 렌더러와 동일!)
      drawMainHUD(ctx, width, height, state, mousePos, time)

      // 상태 업데이트 (녹화용)
      onStateUpdate?.({
        timestamp: performance.now(),
        mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
        customData: { state } // 커스텀 상태 저장!
      })

      setTime(t => t + 1/60)
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [width, height, mousePos, state, time, onStateUpdate])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'auto',
      }}
    />
  )
}
```

### Step 3️⃣ 레지스트리에 등록

```tsx
// src/presets/index.ts
import { Heart } from 'lucide-react'
import { MyNewHUD } from './MyNewHUD'

export const hudPresets: HUDPreset[] = [
  // 기존 프리셋들...
  
  // ✨ 새 프리셋 추가!
  {
    id: 'my-new-hud',
    name: 'My New HUD',
    description: '새로운 HUD 설명',
    icon: Heart,
    component: MyNewHUD,
    available: true,
  },
]
```

### Step 4️⃣ 오프라인 렌더러에 추가

```typescript
// src/core/OfflineHUDRenderer.ts
import {
  type MyHUDState,
  drawMainHUD,
} from '@/presets/myHUDDrawing'

// render() 메서드에 case 추가
render(state: FrameState): OffscreenCanvas {
  switch (this.config.presetId) {
    case 'my-new-hud':
      return this.renderMyNewHUD(state)
    // ...
  }
}

private renderMyNewHUD(state: FrameState): OffscreenCanvas {
  const { width, height } = this.config
  const ctx = this.ctx

  ctx.clearRect(0, 0, width, height)

  // customData에서 상태 추출
  const hudState: MyHUDState = (state.customData as any)?.state || { health: 100, mana: 50 }
  const mousePos = { x: state.mouse.x, y: state.mouse.y }
  const time = this.frameIndex / 60

  // 공유 드로잉 함수 호출! (실시간 HUD와 동일!)
  drawMainHUD(ctx, width, height, hudState, mousePos, time)

  this.frameIndex++
  return this.canvas
}
```

---

## 3. 공유 드로잉 모듈 작성

### 타입 정의

```typescript
// 실시간 Canvas와 OffscreenCanvas 모두 지원
export type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
```

### 함수 시그니처 권장

```typescript
// ✅ 좋음: ctx를 첫 번째 파라미터로
export function drawElement(
  ctx: DrawContext,
  x: number, y: number,
  ...params
) { ... }

// ✅ 좋음: 시간 기반 애니메이션
export function drawAnimatedElement(
  ctx: DrawContext,
  x: number, y: number,
  time: number  // 초 단위 시간
) {
  const pulse = Math.sin(time * 5) * 0.3 + 0.7
  ctx.globalAlpha = pulse
  // ...
  ctx.globalAlpha = 1
}
```

### 글로우 효과

```typescript
export function drawGlowingText(
  ctx: DrawContext,
  text: string,
  x: number, y: number,
  color: string
) {
  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 15
  ctx.fillText(text, x, y)
  ctx.shadowBlur = 0  // 반드시 리셋!
}
```

---

## 4. 오프라인 렌더링 지원

### customData 활용

실시간 HUD에서 상태를 `customData`에 저장하면 오프라인 렌더링에서 복원됩니다:

```typescript
// 실시간 HUD에서 상태 저장
onStateUpdate?.({
  timestamp: performance.now(),
  mouse: { x, y, buttons: 0 },
  targets: { main: { x, y, locked: isLocked } },
  customData: {
    // 오프라인 렌더링에 필요한 모든 상태!
    scenario: 'combat',
    health: 75,
    mana: 30,
    effects: ['burning', 'slowed'],
    cooldowns: { Q: 2.5, W: 0, E: 8.0, R: 45.0 },
  }
})
```

```typescript
// 오프라인 렌더러에서 상태 복원
private renderMyHUD(state: FrameState): OffscreenCanvas {
  const customData = state.customData as any
  const scenario = customData?.scenario || 'idle'
  const health = customData?.health || 100
  const effects = customData?.effects || []
  // ...
}
```

### 마우스 위치 보간

마우스 위치는 자동으로 **선형 보간**됩니다 (InputInterpolator):

```
녹화 시: 100ms 간격으로 상태 저장
렌더링 시: 60fps (16.67ms 간격)으로 보간된 위치 제공
```

---

## 5. 통신 프로토콜 (iframe 방식)

> 외부 앱을 iframe으로 연결하는 경우에만 해당

### 메인 앱 → HUD 앱

```typescript
interface MainToHUDMessage {
  type: 'INIT' | 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_STATE' | 'CAPTURE_FRAME'
  payload?: {
    time?: number
    width?: number
    height?: number
    fps?: number
    state?: HUDState
  }
}
```

### HUD 앱 → 메인 앱

```typescript
interface HUDToMainMessage {
  type: 'READY' | 'STATE_UPDATE' | 'FRAME_CAPTURED' | 'ERROR'
  payload?: {
    state?: HUDState
    frameData?: ImageBitmap
    error?: string
  }
}
```

### HUD 상태 구조

```typescript
interface HUDState {
  timestamp: number  // 필수!
  mouse: { x: number; y: number; buttons: number }
  targets?: Record<string, { x: number; y: number; locked: boolean }>
  customData?: unknown  // HUD별 커스텀 데이터
}
```

---

## 6. 상태 업데이트 규칙

### 업데이트 빈도 제한

```typescript
// ✅ 좋음: 100ms 간격으로 스로틀링
const lastUpdateRef = useRef(0)

useEffect(() => {
  const now = performance.now()
  if (now - lastUpdateRef.current < 100) return
  lastUpdateRef.current = now

  onStateUpdate?.({
    timestamp: now,
    mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
    customData: { ... }
  })
}, [mousePos, ...deps])
```

### 필수 저장 데이터

```typescript
// ✅ 오프라인 렌더링에 필요한 모든 것을 저장!
customData: {
  scenario,        // 현재 시나리오/모드
  stats,           // 플레이어 스탯
  enemy,           // 적 정보
  effects,         // 활성 효과들
  timers,          // 타이머/쿨다운
  indicators,      // 방향 표시기 등
}
```

---

## 7. 렌더링 최적화

### GPU 가속

```tsx
<canvas
  style={{
    transform: 'translateZ(0)',
    willChange: 'transform',
    backfaceVisibility: 'hidden',
  }}
/>
```

### 성능 모드 지원

```typescript
const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high')
const frameInterval = performanceMode === 'high' ? 1000 / 60 : 1000 / 30

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyQ') {
      setPerformanceMode(prev => prev === 'high' ? 'low' : 'high')
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### 메모리 관리

```typescript
// ✅ 애니메이션 정리
useEffect(() => {
  const animId = requestAnimationFrame(render)
  return () => cancelAnimationFrame(animId)
}, [])

// ✅ 오래된 데이터 정리
setIndicators(prev => prev.filter(i => Date.now() - i.timestamp < 1000))
```

---

## 8. 스타일 가이드

### 필수 CSS

```css
html, body {
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
}

.hud-container {
  pointer-events: none;
}

.hud-interactive {
  pointer-events: auto;
}
```

### 색상 팔레트

```typescript
export const COLORS = {
  primary: '#FFD700',      // 골드 (메인)
  primaryGlow: '#FFEA00',  // 밝은 골드
  secondary: '#00FFFF',    // 시안
  danger: '#FF4444',       // 빨강
  success: '#00FF88',      // 초록
  warning: '#FF8800',      // 오렌지
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
}
```

### 폰트

```typescript
ctx.font = 'bold 14px "Consolas", monospace'
// 또는
ctx.font = 'bold 14px "JetBrains Mono", "Fira Code", monospace'
```

---

## 9. 테스트 체크리스트

### 개발 중

- [ ] 공유 드로잉 모듈 분리
- [ ] 실시간 HUD에서 공유 함수 import
- [ ] customData에 모든 필요한 상태 저장
- [ ] 상태 업데이트 스로틀링 (100ms)

### 오프라인 렌더링

- [ ] OfflineHUDRenderer에 case 추가
- [ ] customData에서 상태 복원
- [ ] 공유 드로잉 함수 호출
- [ ] PNG 시퀀스 품질 확인
- [ ] MP4 렌더링 품질 확인

### 실시간 vs 오프라인 비교

- [ ] 동일한 시나리오에서 화면 비교
- [ ] 마우스 움직임 부드러움 확인
- [ ] 모든 효과 동일하게 표현되는지

---

## 10. 예제 템플릿

### 최소 공유 드로잉 모듈

```typescript
// src/presets/simpleDrawing.ts
export type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

export function drawSimpleHUD(
  ctx: DrawContext,
  width: number, height: number,
  mousePos: { x: number; y: number },
  time: number
) {
  // 크로스헤어
  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(mousePos.x - 20, mousePos.y)
  ctx.lineTo(mousePos.x + 20, mousePos.y)
  ctx.moveTo(mousePos.x, mousePos.y - 20)
  ctx.lineTo(mousePos.x, mousePos.y + 20)
  ctx.stroke()

  // 좌표 표시
  ctx.fillStyle = '#00ff00'
  ctx.font = '12px monospace'
  ctx.fillText(`X: ${mousePos.x.toFixed(0)} Y: ${mousePos.y.toFixed(0)}`, 10, 20)
}
```

### 최소 HUD 컴포넌트

```tsx
// src/presets/SimpleHUD.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import type { HUDComponentProps } from './index'
import { drawSimpleHUD } from './simpleDrawing'

export function SimpleHUD({ width, height, onStateUpdate, onReady }: HUDComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const [time, setTime] = useState(0)

  useEffect(() => { onReady?.() }, [onReady])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * width,
      y: ((e.clientY - rect.top) / rect.height) * height,
    })
  }, [width, height])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const render = () => {
      ctx.clearRect(0, 0, width, height)
      drawSimpleHUD(ctx, width, height, mousePos, time)
      
      onStateUpdate?.({
        timestamp: performance.now(),
        mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
      })

      setTime(t => t + 1/60)
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [width, height, mousePos, time, onStateUpdate])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
    />
  )
}
```

---

## 🚀 빠른 시작

```bash
# 1. 공유 드로잉 모듈 생성
# src/presets/myHUDDrawing.ts

# 2. HUD 컴포넌트 생성
# src/presets/MyHUD.tsx (공유 모듈 import!)

# 3. 레지스트리 등록
# src/presets/index.ts

# 4. 오프라인 렌더러 추가
# src/core/OfflineHUDRenderer.ts

# 5. 테스트
npm run dev
```

---

## ❓ FAQ

### Q: 실시간과 PNG 시퀀스가 다르게 보여요
A: 공유 드로잉 모듈을 사용하고 있는지 확인하세요. 실시간 HUD와 OfflineHUDRenderer가 **같은 함수**를 호출해야 합니다.

### Q: 마우스 움직임이 뚝뚝 끊겨요
A: InputInterpolator가 자동으로 보간합니다. customData의 좌표도 보간하려면 별도 처리가 필요합니다.

### Q: 새 HUD 추가하는데 오프라인 렌더링이 안 돼요
A: `OfflineHUDRenderer.ts`에 새 프리셋 ID에 대한 `case`를 추가했는지 확인하세요.

### Q: PNG 해상도가 낮아요
A: `exportHUDToPNGSequence`의 `scale` 파라미터로 해상도를 조절할 수 있습니다 (기본 2x).

---

**Happy HUD Development! 🎮**
