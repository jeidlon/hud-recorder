# HUD Recorder

> 영상에 웹 기반 HUD를 오버레이하여 렌더링하는 웹 앱

![Preview](./public/preview-bg.png)

## ✨ 특징

- 🎬 **WebCodecs API** - 하드웨어 가속 비디오 인코딩/디코딩
- 🎨 **Remotion 스타일 애니메이션** - 프레임 기반 선언적 애니메이션
- 🖥️ **WebGPU 포스트 프로세싱** - GPU 셰이더로 글리치, 색수차 등 효과
- 🎮 **다양한 HUD 프리셋** - Cyberpunk, 몽중게임, Target Lock 등
- 📦 **MP4/PNG 내보내기** - 완성된 영상 또는 이미지 시퀀스 추출

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

## 📁 프로젝트 구조

```
src/
├── core/               # 렌더링 파이프라인
│   ├── WebGPUCompositor.ts
│   ├── RenderingPipeline.ts
│   └── ...
├── presets/            # HUD 프리셋
│   ├── remotion/       # Remotion 스타일 HUD
│   │   ├── RemotionHUDWrapper.tsx
│   │   └── CyberpunkHUD.tsx
│   └── ...
├── components/         # UI 컴포넌트
└── store/              # 상태 관리
```

## 🎨 HUD 프리셋

| 프리셋 | 설명 |
|--------|------|
| **Cyberpunk HUD** | Remotion 스타일, 스프링 애니메이션, 글리치 효과 |
| **몽중게임 REMASTER** | ARWES + react-vfx 셰이더 |
| **몽중게임 HUD** | 레트로-퓨처리스틱 |
| **Target Lock** | 크로스헤어 + 타겟 락온 |

## 📖 문서

| 문서 | 설명 |
|------|------|
| [TECH-STACK.md](./TECH-STACK.md) | 기술 스택 상세 |
| [AI-AGENT-GUIDE.md](./AI-AGENT-GUIDE.md) | AI Agent 개발 가이드 |
| [HUD-DEVELOPMENT-GUIDE.md](./HUD-DEVELOPMENT-GUIDE.md) | HUD 개발 가이드 |

## 🛠️ 기술 스택

### 코어
- React 19 + TypeScript
- Vite 7
- Zustand (상태 관리)

### 렌더링
- WebCodecs API (비디오 처리)
- WebGPU (GPU 합성)
- Remotion (애니메이션 패턴)
- Canvas 2D (폴백)

### 스타일
- Tailwind CSS
- Framer Motion
- Lucide Icons

## 🌐 브라우저 호환성

| 기능 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| WebCodecs | ✅ 94+ | ✅ 94+ | ❌ | ❌ |
| WebGPU | ✅ 113+ | ✅ 113+ | 🔜 | 🔜 |

> ⚠️ Chromium 기반 브라우저 권장 (Chrome, Edge)

## 🤖 AI Agent를 위한 안내

이 프로젝트를 이어서 개발하는 AI Agent는 다음 문서를 참고하세요:

📄 **[AI-AGENT-GUIDE.md](./AI-AGENT-GUIDE.md)**

- Remotion 스타일 애니메이션 (`spring()`, `interpolate()`, `<Sequence>`)
- WebGPU WGSL 셰이더 작성법
- 새 HUD 프리셋 만들기
- 베스트 프랙티스 & 트러블슈팅

## 📝 라이선스

MIT

---

**Last Updated: 2026-01-21**
