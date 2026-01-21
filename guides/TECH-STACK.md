# 기술 스택

> HUD Recorder 프로젝트의 기술 스택 문서

---

## 📦 코어 프레임워크

| 기술 | 버전 | 설명 |
|------|------|------|
| **React** | 19.2.0 | UI 프레임워크 |
| **TypeScript** | 5.9.3 | 타입 시스템 |
| **Vite** | 7.2.4 | 빌드 도구 & 개발 서버 |

---

## 🎨 스타일링 & UI

| 기술 | 버전 | 설명 |
|------|------|------|
| **Tailwind CSS** | 4.1.18 | 유틸리티 CSS 프레임워크 |
| **Lucide React** | 0.562.0 | 아이콘 라이브러리 |
| **Framer Motion** | 12.27.5 | 애니메이션 라이브러리 |
| **Remotion** | 4.x | 프레임 기반 비디오 애니메이션 |
| **react-vfx** | 2.x | WebGL 셰이더 효과 |
| **clsx** | 2.1.1 | 조건부 클래스 유틸리티 |
| **class-variance-authority** | 0.7.1 | 컴포넌트 variants |
| **tailwind-merge** | 3.4.0 | Tailwind 클래스 병합 |

---

## 🗃️ 상태 관리

| 기술 | 버전 | 설명 |
|------|------|------|
| **Zustand** | 5.0.10 | 경량 상태 관리 |

---

## 🎮 HUD 렌더링

| 기술 | 설명 |
|------|------|
| **Canvas 2D API** | HUD 요소 렌더링 (실시간 + 오프라인) |
| **OffscreenCanvas** | 오프라인 렌더링용 캔버스 |
| **공유 드로잉 모듈** | 실시간/오프라인 동일 렌더링 보장 |
| **Remotion 패턴** | 프레임 기반 선언적 애니메이션 |
| **WebGPU** | GPU 셰이더 기반 포스트 프로세싱 |

### 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   HUD 렌더링 시스템                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ RemotionHUD     │    │ dreamPersonaDrawing.ts      │ │
│  │ Wrapper.tsx     │    │ (공유 드로잉 함수)          │ │
│  │                 │    └───────────┬─────────────────┘ │
│  │ • spring()      │                │                   │
│  │ • interpolate() │    ┌───────────┴───────────┐       │
│  │ • Sequence      │    │                       │       │
│  └────────┬────────┘    │                       │       │
│           │             ▼                       ▼       │
│           ▼      ┌──────────────┐    ┌──────────────┐   │
│  ┌──────────────┐│DreamPersona  │    │OfflineHUD   │   │
│  │CyberpunkHUD  ││HUD.tsx       │    │Renderer.ts   │   │
│  │(Remotion식)  ││(실시간)       │    │(내보내기)    │   │
│  └──────────────┘└──────────────┘    └──────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   합성 파이프라인                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              RenderingPipeline.ts               │    │
│  │                                                 │    │
│  │  WebGPU 지원?                                   │    │
│  │      │                                          │    │
│  │      ├── Yes ──► WebGPUCompositor.ts            │    │
│  │      │           (WGSL 셰이더, 글리치 등)       │    │
│  │      │                                          │    │
│  │      └── No ───► FrameCompositor.ts             │    │
│  │                  (Canvas 2D 폴백)               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Remotion 스타일 애니메이션

```tsx
// src/presets/remotion/RemotionHUDWrapper.tsx
import { spring, interpolate, Sequence } from './RemotionHUDWrapper'

// 물리 기반 스프링
const opacity = spring({ frame, fps, delay: 10, config: { damping: 20 } })

// 선형 보간
const scale = interpolate(frame, [0, 30], [0, 1])

// 시퀀싱
<Sequence from={30} durationInFrames={60}>
  <Component />
</Sequence>
```

### WebGPU 셰이더

```wgsl
// src/core/WebGPUCompositor.ts
@fragment
fn main(...) -> @location(0) vec4f {
  // 글리치, 색수차, 스캔라인 등 GPU 가속 효과
}
```

---

## 📹 비디오 처리

| 기술 | 버전 | 설명 |
|------|------|------|
| **WebCodecs API** | 네이티브 | 하드웨어 가속 비디오 디코딩/인코딩 |
| **mp4box** | 2.3.0 | MP4 파일 파싱 (demuxing) |
| **mp4-muxer** | 5.2.2 | MP4 파일 생성 (muxing) |
| **JSZip** | 3.10.1 | PNG 시퀀스 ZIP 압축 |

### 비디오 파이프라인

```
입력 MP4
    │
    ▼
┌─────────────────┐
│   mp4box        │ ← MP4 구조 파싱
│   (demuxer)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WebCodecs      │ ← 하드웨어 가속 디코딩
│  VideoDecoder   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Canvas 2D      │ ← HUD 오버레이 렌더링
│  Compositing    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  WebCodecs      │ ← 하드웨어 가속 인코딩
│  VideoEncoder   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   mp4-muxer     │ ← MP4 컨테이너 생성
│   (muxer)       │
└────────┬────────┘
         │
         ▼
출력 MP4 (HUD 포함)
```

---

## 🔧 개발 도구

| 기술 | 버전 | 설명 |
|------|------|------|
| **ESLint** | 9.39.1 | 코드 린팅 |
| **TypeScript ESLint** | 8.46.4 | TS 린트 규칙 |
| **@vitejs/plugin-react** | 5.1.1 | Vite React 플러그인 |

---

## 📋 타입 정의

| 패키지 | 설명 |
|--------|------|
| **@types/react** | React 타입 |
| **@types/react-dom** | React DOM 타입 |
| **@types/node** | Node.js 타입 |
| **@types/dom-webcodecs** | WebCodecs API 타입 |

---

## ⚠️ 설치됨 (미사용)

> 3D HUD 실험 후 롤백으로 인해 미사용 상태. 삭제 가능.

| 기술 | 버전 |
|------|------|
| Three.js | 0.182.0 |
| React Three Fiber | 9.5.0 |
| @react-three/drei | 10.7.7 |
| @react-three/postprocessing | 3.0.4 |
| postprocessing | 6.38.2 |

**삭제 명령어:**
```bash
npm uninstall three @react-three/fiber @react-three/drei @react-three/postprocessing postprocessing
```

---

## 🌐 브라우저 호환성

| 기능 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Canvas 2D | ✅ | ✅ | ✅ | ✅ |
| WebCodecs | ✅ 94+ | ❌ | ❌ | ✅ 94+ |
| OffscreenCanvas | ✅ | ✅ | ✅ 16.4+ | ✅ |
| **WebGPU** | ✅ 113+ | 🔜 개발중 | 🔜 개발중 | ✅ 113+ |

> ⚠️ **WebCodecs** 및 **WebGPU**는 Chromium 기반 브라우저에서만 완벽 지원됩니다.
> WebGPU 미지원 시 Canvas 2D 폴백이 자동 적용됩니다.

---

## 📊 번들 크기

```
현재: ~730KB (gzipped)

주요 구성:
├── React + React DOM: ~140KB
├── Framer Motion: ~100KB
├── Three.js (미사용): ~150KB ← 삭제 시 감소
├── Tailwind CSS: ~30KB
├── Zustand: ~5KB
└── 앱 코드: ~300KB
```

---

## 🚀 실행 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트
npm run lint
```

---

---

## 🤖 AI Agent 가이드

AI Agent가 이 프로젝트를 이어서 개발할 때 참고할 문서:

📄 **[AI-AGENT-GUIDE.md](./AI-AGENT-GUIDE.md)**

- Remotion 스타일 애니메이션 패턴
- WebGPU 셰이더 작성법
- 새 HUD 프리셋 만들기
- 베스트 프랙티스 & 트러블슈팅

---

**Last Updated: 2026-01-21**
