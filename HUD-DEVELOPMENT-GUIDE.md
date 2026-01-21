# HUD UI 개발 가이드

> HUD Recorder에 오버레이할 커스텀 UI 제작 규칙

---

## 📋 목차

1. [내장 프리셋 추가 (권장)](#1-내장-프리셋-추가-권장)
2. [기본 구조 (iframe 방식)](#2-기본-구조-iframe-방식)
3. [통신 프로토콜](#3-통신-프로토콜)
4. [필수 구현 사항](#4-필수-구현-사항)
5. [상태 업데이트 규칙](#5-상태-업데이트-규칙)
6. [렌더링 최적화](#6-렌더링-최적화)
7. [키보드/마우스 이벤트](#7-키보드마우스-이벤트)
8. [스타일 가이드](#8-스타일-가이드)
9. [테스트 체크리스트](#9-테스트-체크리스트)
10. [예제 템플릿](#10-예제-템플릿)

---

## 1. 내장 프리셋 추가 (권장)

> 🎯 **가장 쉬운 방법!** 미리보기와 실제 HUD에서 같은 컴포넌트가 사용됩니다.

### 📁 파일 구조

```
src/presets/
├── index.ts           ← 프리셋 레지스트리 (여기서 등록)
├── TargetLockHUD.tsx  ← Target Lock HUD
└── MyNewHUD.tsx       ← 새로 만들 HUD
```

### Step 1️⃣ HUD 컴포넌트 만들기

```tsx
// src/presets/MyNewHUD.tsx
import { useEffect, useRef, useCallback, useState } from 'react'
import type { HUDComponentProps } from './index'

/**
 * 새로운 HUD 컴포넌트
 * 
 * Props:
 * - width, height: 비디오 해상도
 * - isPlaying: 재생 상태
 * - onStateUpdate: 상태 변경 시 호출
 * - onReady: 초기화 완료 시 호출
 */
export function MyNewHUD({
  width,
  height,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const hasCalledReady = useRef(false)

  // 초기화 완료 알림 (한 번만)
  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true
      onReady()
    }
  }, [])

  // 마우스 이벤트
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    setMousePos({ x, y })
  }, [width, height])

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 여기에 렌더링 로직 작성
      ctx.fillStyle = '#00ff00'
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, 20, 0, Math.PI * 2)
      ctx.fill()

      // 상태 업데이트 (녹화용)
      onStateUpdate?.({
        timestamp: performance.now(),
        mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
        customData: { /* 커스텀 데이터 */ }
      })

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [width, height, mousePos, onStateUpdate])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'crosshair',
      }}
    />
  )
}
```

### Step 2️⃣ 레지스트리에 등록

```tsx
// src/presets/index.ts
import { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Crosshair, Clock, Heart } from 'lucide-react'  // 아이콘 추가
import { TargetLockHUD } from './TargetLockHUD'
import { MyNewHUD } from './MyNewHUD'  // 👈 import 추가
import type { HUDState } from '@/types/hud-protocol'

// HUD 컴포넌트 Props 인터페이스
export interface HUDComponentProps {
  width: number
  height: number
  isPlaying?: boolean
  onStateUpdate?: (state: HUDState) => void
  onReady?: () => void
}

// 프리셋 정의
export interface HUDPreset {
  id: string
  name: string
  description: string
  icon: LucideIcon
  component: ComponentType<HUDComponentProps> | null
  available: boolean
}

// 👇 여기에 등록!
export const hudPresets: HUDPreset[] = [
  {
    id: 'target-lock',
    name: 'Target Lock',
    description: '크로스헤어 + 타겟 락온',
    icon: Crosshair,
    component: TargetLockHUD,
    available: true,
  },
  // ✨ 새 프리셋 추가!
  {
    id: 'my-new-hud',
    name: 'My New HUD',
    description: '새로운 HUD 설명',
    icon: Heart,            // lucide-react 아이콘
    component: MyNewHUD,    // 위에서 만든 컴포넌트
    available: true,
  },
  // Coming Soon (비활성화 예시)
  {
    id: 'coming-soon',
    name: 'Coming Soon...',
    description: '새로운 HUD 준비 중',
    icon: Clock,
    component: null,
    available: false,
  },
]
```

### ✅ 끝!

- 프리셋 선택 UI에 자동으로 표시됨
- 미리보기 버튼 자동 활성화
- 실제 HUD와 미리보기가 동일한 컴포넌트 사용

---

## 2. 기본 구조 (iframe 방식)

> 외부 앱을 iframe으로 연결하는 방식. 기존 앱을 재사용하거나 별도 도메인에서 호스팅할 때 유용.

### HUD 앱은 독립적인 웹 앱입니다

```
┌─────────────────────────────────────────────────────────────┐
│  HUD Recorder (메인 앱)                                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Video Layer                                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │                                                 │  │  │
│  │  │  ┌─────────────────────────────────────────┐   │  │  │
│  │  │  │  HUD App (iframe)                       │   │  │  │
│  │  │  │                                         │   │  │  │
│  │  │  │  - 투명 배경                            │   │  │  │
│  │  │  │  - postMessage 통신                     │   │  │  │
│  │  │  │  - 마우스/키보드 이벤트 처리            │   │  │  │
│  │  │  │                                         │   │  │  │
│  │  │  └─────────────────────────────────────────┘   │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 기술 스택 제한 없음

| 기술 | 지원 |
|------|------|
| React / Vue / Svelte | ✅ |
| Vanilla JS | ✅ |
| Canvas 2D / WebGL | ✅ |
| Three.js | ✅ |
| Tailwind CSS | ✅ |
| Framer Motion / GSAP | ✅ |

---

## 3. 통신 프로토콜

### 메인 앱 → HUD 앱 메시지

```typescript
interface MainToHUDMessage {
  type: 'INIT' | 'PLAY' | 'PAUSE' | 'SEEK' | 'SET_STATE' | 'CAPTURE_FRAME'
  payload?: {
    time?: number      // 현재 시간 (ms)
    width?: number     // 비디오 너비
    height?: number    // 비디오 높이
    fps?: number       // 프레임레이트
    state?: HUDState   // 복원할 상태 (오프라인 렌더링 시)
  }
}
```

### HUD 앱 → 메인 앱 메시지

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
  timestamp: number  // 필수! 상태 생성 시간 (ms)
  mouse: {
    x: number
    y: number
    buttons: number  // 마우스 버튼 상태 (bitfield)
  }
  targets?: {
    [id: string]: {
      x: number
      y: number
      locked: boolean
      // 추가 속성 자유롭게
    }
  }
  customData?: unknown  // HUD별 커스텀 데이터
}
```

---

## 4. 필수 구현 사항

### ✅ 반드시 구현해야 하는 것들

```typescript
// 1. 메시지 수신 리스너 등록
window.addEventListener('message', (e) => {
  const msg = e.data as MainToHUDMessage
  
  switch (msg.type) {
    case 'INIT':
      // 초기화: width, height, fps 받음
      initHUD(msg.payload)
      break
      
    case 'PLAY':
      // 재생 시작
      startAnimation()
      break
      
    case 'PAUSE':
      // 일시정지
      stopAnimation()
      break
      
    case 'SET_STATE':
      // 상태 복원 (오프라인 렌더링 시 필수!)
      restoreState(msg.payload?.state)
      break
  }
})

// 2. 준비 완료 알림 (필수!)
window.parent.postMessage({ type: 'READY' }, '*')

// 3. 상태 변경 시 업데이트 전송
function sendStateUpdate(state: HUDState) {
  window.parent.postMessage({
    type: 'STATE_UPDATE',
    payload: { state }
  }, '*')
}
```

### ❌ 하면 안 되는 것들

1. **timestamp 누락** - 반드시 포함
2. **과도한 상태 업데이트** - 60fps 이하로 제한
3. **메모리 누수** - 애니메이션 정리 필수
4. **불투명 배경** - 투명 배경 필수

---

## 5. 상태 업데이트 규칙

### 업데이트 빈도

```typescript
// ✅ 좋음: requestAnimationFrame과 동기화 (60fps)
let lastUpdate = 0
const UPDATE_INTERVAL = 1000 / 60 // ~16.67ms

function render(time: number) {
  // 상태 업데이트 (throttle)
  if (time - lastUpdate >= UPDATE_INTERVAL) {
    sendStateUpdate(currentState)
    lastUpdate = time
  }
  
  requestAnimationFrame(render)
}

// ❌ 나쁨: mousemove마다 업데이트 (100+fps)
document.addEventListener('mousemove', (e) => {
  sendStateUpdate({ ... }) // 너무 잦은 호출!
})
```

### 상태 구조 설계

```typescript
// ✅ 좋음: 필요한 데이터만 포함
const state: HUDState = {
  timestamp: performance.now(),
  mouse: { x: 100, y: 200, buttons: 0 },
  targets: {
    crosshair: { x: 100, y: 200, locked: false }
  },
  customData: {
    activeSkill: 'Q',
    cooldowns: { Q: 0, W: 3.5, E: 0, R: 45 }
  }
}

// ❌ 나쁨: 불필요한 데이터 포함
const state = {
  timestamp: performance.now(),
  mouse: { ... },
  entireDOMSnapshot: document.body.innerHTML, // ❌
  allEventHistory: [...] // ❌
}
```

---

## 6. 렌더링 최적화

### Canvas 기반 HUD (권장)

```typescript
// Canvas는 오프라인 렌더링과 호환성 최고
const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 렌더링 로직
  drawCrosshair(ctx, mouseX, mouseY)
  drawTargetBox(ctx, targetX, targetY)
  
  requestAnimationFrame(render)
}
```

### DOM 기반 HUD

```typescript
// DOM도 가능하지만 오프라인 렌더링 시 재현 필요
// SET_STATE 메시지로 상태 복원 구현 필수

function restoreState(state: HUDState) {
  if (!state) return
  
  // DOM 요소 위치/상태 복원
  crosshairEl.style.left = `${state.mouse.x}px`
  crosshairEl.style.top = `${state.mouse.y}px`
  
  if (state.targets?.main?.locked) {
    crosshairEl.classList.add('locked')
  }
}
```

### 메모리 관리

```typescript
// ✅ 컴포넌트 정리 시 애니메이션 취소
useEffect(() => {
  const animId = requestAnimationFrame(render)
  
  return () => {
    cancelAnimationFrame(animId)
  }
}, [])

// ✅ 이벤트 리스너 정리
useEffect(() => {
  const handler = (e: KeyboardEvent) => { ... }
  window.addEventListener('keydown', handler)
  
  return () => {
    window.removeEventListener('keydown', handler)
  }
}, [])
```

---

## 7. 키보드/마우스 이벤트

### 키보드 단축키 처리

```typescript
// 메인 앱에서 키보드 이벤트도 기록됨
// HUD 앱에서는 UI 상태만 변경

const [activeSkill, setActiveSkill] = useState<string | null>(null)

useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // 스킬 활성화
    if (['KeyQ', 'KeyW', 'KeyE', 'KeyR'].includes(e.code)) {
      setActiveSkill(e.code.replace('Key', ''))
      
      // 상태 업데이트에 포함
      sendStateUpdate({
        timestamp: performance.now(),
        mouse: { x: mouseX, y: mouseY, buttons: 0 },
        customData: { activeSkill: e.code }
      })
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [mouseX, mouseY])
```

### 마우스 클릭 처리

```typescript
const handleClick = (e: MouseEvent) => {
  // 클릭 위치에 효과 표시
  setClickEffect({ x: e.clientX, y: e.clientY })
  
  // 상태 업데이트
  sendStateUpdate({
    timestamp: performance.now(),
    mouse: { x: e.clientX, y: e.clientY, buttons: e.buttons },
    customData: { lastClick: { x: e.clientX, y: e.clientY } }
  })
}
```

---

## 8. 스타일 가이드

### 필수 CSS

```css
/* 투명 배경 필수! */
html, body {
  margin: 0;
  padding: 0;
  background: transparent !important;
  overflow: hidden;
  width: 100vw;
  height: 100vh;
}

/* 포인터 이벤트 설정 */
.hud-container {
  pointer-events: none; /* 기본: 이벤트 통과 */
}

.hud-interactive {
  pointer-events: auto; /* 클릭 가능한 요소 */
}
```

### 색상 권장

```css
/* 가시성 좋은 HUD 색상 */
:root {
  --hud-primary: #00ff00;    /* 녹색 (기본) */
  --hud-danger: #ff0000;     /* 빨강 (경고/락온) */
  --hud-warning: #ffff00;    /* 노랑 (주의) */
  --hud-info: #00ffff;       /* 시안 (정보) */
  
  /* 그림자로 가시성 확보 */
  --hud-glow: 0 0 10px currentColor;
}

.crosshair {
  color: var(--hud-primary);
  text-shadow: var(--hud-glow);
  filter: drop-shadow(0 0 5px currentColor);
}

.locked {
  color: var(--hud-danger);
}
```

### 폰트 권장

```css
/* 모노스페이스 폰트 권장 */
.hud-text {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.05em;
}
```

---

## 9. 테스트 체크리스트

### 개발 중

- [ ] 투명 배경 확인
- [ ] READY 메시지 전송 확인
- [ ] STATE_UPDATE 메시지 전송 확인
- [ ] timestamp 포함 여부
- [ ] 60fps 이하 업데이트 빈도
- [ ] 메모리 누수 없음

### 메인 앱 연동 시

- [ ] iframe 로드 정상
- [ ] 마우스 이벤트 정상 작동
- [ ] 키보드 이벤트 정상 작동
- [ ] 녹화 시 상태 기록됨
- [ ] 오프라인 렌더링 시 HUD 재현됨
- [ ] PNG 시퀀스 출력 정상

### 배포 전

- [ ] 프로덕션 빌드 테스트
- [ ] CORS 설정 확인
- [ ] HTTPS 환경 테스트

---

## 10. 예제 템플릿

### 최소 템플릿 (Vanilla JS)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background: transparent !important;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
    }
    #crosshair {
      position: absolute;
      width: 40px;
      height: 40px;
      border: 2px solid #00ff00;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: border-color 0.1s;
    }
    #crosshair::before, #crosshair::after {
      content: '';
      position: absolute;
      background: #00ff00;
    }
    #crosshair::before {
      width: 20px; height: 2px;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
    }
    #crosshair::after {
      width: 2px; height: 20px;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
    }
    #crosshair.locked {
      border-color: #ff0000;
    }
    #crosshair.locked::before, #crosshair.locked::after {
      background: #ff0000;
    }
  </style>
</head>
<body>
  <div id="crosshair"></div>
  
  <script>
    const crosshair = document.getElementById('crosshair')
    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let isLocked = false
    
    // 메시지 수신
    window.addEventListener('message', (e) => {
      const msg = e.data
      if (msg.type === 'INIT') {
        console.log('HUD initialized:', msg.payload)
      }
      if (msg.type === 'SET_STATE' && msg.payload?.state) {
        // 상태 복원 (오프라인 렌더링용)
        const { mouse, targets } = msg.payload.state
        mouseX = mouse.x
        mouseY = mouse.y
        isLocked = targets?.main?.locked || false
        updateCrosshair()
      }
    })
    
    // 준비 완료
    window.parent.postMessage({ type: 'READY' }, '*')
    
    // 마우스 추적
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      updateCrosshair()
    })
    
    // 클릭으로 락온 토글
    document.addEventListener('click', () => {
      isLocked = !isLocked
      updateCrosshair()
    })
    
    // 크로스헤어 업데이트
    function updateCrosshair() {
      crosshair.style.left = mouseX + 'px'
      crosshair.style.top = mouseY + 'px'
      crosshair.classList.toggle('locked', isLocked)
      
      // 상태 전송
      window.parent.postMessage({
        type: 'STATE_UPDATE',
        payload: {
          state: {
            timestamp: performance.now(),
            mouse: { x: mouseX, y: mouseY, buttons: 0 },
            targets: {
              main: { x: mouseX, y: mouseY, locked: isLocked }
            }
          }
        }
      }, '*')
    }
    
    // 초기화
    updateCrosshair()
  </script>
</body>
</html>
```

### React 템플릿

```tsx
// src/App.tsx
import { useEffect, useRef, useState, useCallback } from 'react'

interface HUDState {
  timestamp: number
  mouse: { x: number; y: number; buttons: number }
  targets?: Record<string, { x: number; y: number; locked: boolean }>
  customData?: unknown
}

export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isLocked, setIsLocked] = useState(false)
  const lastUpdateRef = useRef(0)
  
  // 상태 전송
  const sendState = useCallback(() => {
    const now = performance.now()
    if (now - lastUpdateRef.current < 16) return // 60fps 제한
    lastUpdateRef.current = now
    
    const state: HUDState = {
      timestamp: now,
      mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
      targets: {
        main: { x: mousePos.x, y: mousePos.y, locked: isLocked }
      }
    }
    
    window.parent.postMessage({
      type: 'STATE_UPDATE',
      payload: { state }
    }, '*')
  }, [mousePos, isLocked])
  
  // 메시지 수신
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data
      if (msg.type === 'SET_STATE' && msg.payload?.state) {
        const { mouse, targets } = msg.payload.state
        setMousePos({ x: mouse.x, y: mouse.y })
        setIsLocked(targets?.main?.locked || false)
      }
    }
    
    window.addEventListener('message', handler)
    window.parent.postMessage({ type: 'READY' }, '*')
    
    return () => window.removeEventListener('message', handler)
  }, [])
  
  // 마우스 추적
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    
    document.addEventListener('mousemove', handler)
    return () => document.removeEventListener('mousemove', handler)
  }, [])
  
  // 상태 업데이트
  useEffect(() => {
    sendState()
  }, [sendState])
  
  return (
    <div
      onClick={() => setIsLocked(!isLocked)}
      style={{
        position: 'absolute',
        left: mousePos.x,
        top: mousePos.y,
        width: 40,
        height: 40,
        border: `2px solid ${isLocked ? '#ff0000' : '#00ff00'}`,
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'auto',
        cursor: 'crosshair'
      }}
    />
  )
}
```

---

## 🚀 개발 시작하기

```bash
# 1. 새 HUD 앱 생성
npm create vite@latest my-hud -- --template react-ts

# 2. 개발 서버 시작 (다른 포트)
cd my-hud
npm install
npm run dev -- --port 5175

# 3. HUD Recorder에서 Custom URL로 연결
# http://localhost:5175
```

---

## ❓ FAQ

### Q: 내 HUD가 오프라인 렌더링에서 안 보여요
A: `SET_STATE` 메시지 처리를 구현했는지 확인하세요. 오프라인 렌더링 시 메인 앱이 각 프레임에 해당하는 상태를 전송합니다.

### Q: 마우스 이벤트가 안 잡혀요
A: `pointer-events: auto`가 설정되어 있는지 확인하세요.

### Q: 키보드 이벤트가 안 잡혀요
A: iframe 포커스 문제일 수 있습니다. 클릭 후 키보드를 사용하거나, 메인 앱에서 키보드 이벤트를 전달받도록 구현하세요.

### Q: 상태 업데이트가 너무 많아요
A: `requestAnimationFrame` 또는 throttle을 사용해 60fps 이하로 제한하세요.

---

**Happy HUD Development! 🎮**
