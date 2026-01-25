# 🎮 Hexa-Tactical OS 98 HUD 상세 설계서

**Spec ID**: MZG-HUD-HexaTactical-v1.0  
**작성일**: 2026-01-22  
**목표**: 줄콘티(Scene 8~12)에 정확히 대응하는 HUD를 React + Canvas + WebGPU로 구현  
**핵심 요구**: 첨부 레퍼런스 이미지와 **99.99% 동일한 UI 스킨** 재현

---

## 0. 참고 이미지 분석 요약

### 이미지 1: "게임 시간입니다" 모달
- **중앙 메시지 윈도우**: 윈도우98 타이틀바 + 3개 컨트롤 버튼 (─ □ ✕)
- **배경**: 육각형(Hexagon) 그리드 패턴, 중앙 어둡고 좌우 가장자리 밝은 빛 번짐
- **텍스트**: 한글 2줄, 골드 글로우 효과
- **활용**: Scene 8 "페르소나의 이름을 불러 접속하세요" 안내창

### 이미지 2 & 3: "PROFILE - DANGER ZONE" 대시보드
- **메인 프레임**: 최상단 큰 윈도우 "PROFILE - DANGER ZONE"
- **BIOLOGICAL 패널**: 6각형 레이더 차트 (STR, AGI, DEX, VIT, INT, LUK)
- **PROFILE 패널**: **SOYOUNG / RUBIAN** 듀얼 헥사곤 포트레이트 + 이름 라벨
- **장비 카드**: 무기 실루엣 + 2슬롯 스펙 정보
- **THERMAL LEVEL**: "HIGH" 대형 텍스트 + 심박 라인
- **THERMAL BRAIN SCAN**: 3D 뇌 이미지 + 우측 컬러바
- **HEALTH 바**: 40~60개 세그먼트 막대
- **CONNECTION COMPLETE 배너**: 중앙 하단 등장/사라짐
- **Hazard Stripe**: 노란/검정 사선 스트라이프 경고

---

## 1. 절대 조건 (Non-Negotiables)

### 1.1 싱글 베이스 레이어 원칙
- HUD는 **1개 레이어**만 존재
- 상황별 "다른 UI 페이지"를 만들지 않음
- **기본 HUD(Idle)** 위에 **Toast/Modal/Warning/FX**가 **겹쳐지고 사라지는 방식**만 사용

### 1.2 스킨 고정 원칙
- 모든 UI는 **TACTICAL-DIAGNOSTIC-UI-ANALYSIS.md 기반 디자인**을 고정 스킨으로 사용
- 상태 변화(오류/데미지/공격/감염/트라우마/진화)는 **색/FX/필터만 변화**
- 프레임/레이아웃/타이포그래픽은 유지

---

## 2. 시나리오 정의 (줄콘티 대응)

| 시나리오 ID | 한글명 | 키 | 줄콘티 대응 | 색상 테마 |
|------------|--------|-----|-------------|-----------|
| `idle` | 기본 탐색 | 1 | 루미나우드 탐험 | Gold |
| `link_progress` | 접속 진행 | 2 | Scene 8: LINK IN PROGRESS | Cyan/Blue |
| `persona_sync` | 페르소나 동기화 | 3 | Scene 8: "페르소나 이름을 불러 접속하세요" | Cyan → Gold |
| `profile_danger` | 프로필 위험 | 4 | Scene 9-10: 페르소나 소개 + 동기화 UI | Gold + Red |
| `monster_combat` | 몬스터 전투 | 5 | Scene 12: 랩틸리언 전투 | Red |
| `psycho_attack` | 심리 공격 | 6 | Scene 11: 수빈사랑 - 미래 분기 | Purple |
| `infected` | 감염 상태 | 7 | Scene 9: 매지코 썩음 | Green/Purple |
| `trauma` | 트라우마 | 8 | 트라우마 던전 (확장) | Grey |
| `evolved` | 진화 완료 | 9 | 타임캡슐 + 초진화 | Gold + White |

---

## 3. 색상 토큰 (Design Tokens)

### 3.1 기본 팔레트 (HUD_COLORS)

```typescript
export const HUD_COLORS = {
  // Gold System (메인)
  gold: '#D4A017',           // 기본 테두리/텍스트
  goldBright: '#FFD700',     // 강조/아이콘/경고
  goldDim: '#8B7500',        // 비활성/그림자
  goldMuted: '#9A7B0A',      // 서브텍스트
  goldGlow: 'rgba(255,215,0,0.35)',    // 골드 글로우
  goldGlowSoft: 'rgba(212,160,23,0.22)', // 소프트 글로우

  // Background System
  bgDark: '#0A0A08',         // 거의 검정 배경
  bgPanel: '#0D0D0A',        // 패널 배경
  bgWindow: '#121210',       // 윈도우 배경

  // Glass Effect
  glassFill: 'rgba(255,255,255,0.06)',
  glassFill2: 'rgba(255,255,255,0.03)',
  
  // Lines
  borderOuter: '#1A1A15',
  borderInner: '#2A2A20',
  highlightLine: 'rgba(255,255,255,0.20)',
  faintLine: 'rgba(255,255,255,0.08)',

  // Text
  textMain: 'rgba(255,240,200,0.92)',
  textDim: 'rgba(255,240,200,0.55)',

  // Status Colors
  red: '#FF3333',
  redGlow: 'rgba(255,51,51,0.4)',
  green: '#00FF66',
  cyan: '#00D4FF',
  purple: '#9900FF',
  
  // Hex Grid
  hexLine: 'rgba(212,160,23,0.22)',
  hexFill: 'rgba(255,255,255,0.06)',
} as const
```

### 3.2 시나리오별 색상 오버라이드

```typescript
export const SCENARIO_THEME: Record<ScenarioId, ThemeOverride> = {
  idle: { primary: HUD_COLORS.gold, bg: HUD_COLORS.bgDark },
  link_progress: { primary: '#00D4FF', bg: 'rgba(0,20,30,0.85)' },
  persona_sync: { primary: '#00D4FF', bg: 'rgba(0,20,30,0.85)' },
  profile_danger: { primary: HUD_COLORS.gold, accent: HUD_COLORS.red },
  monster_combat: { primary: HUD_COLORS.red, bg: 'rgba(30,5,10,0.85)' },
  psycho_attack: { primary: HUD_COLORS.purple, accent: '#FF00FF' },
  infected: { primary: '#00FF66', accent: HUD_COLORS.purple },
  trauma: { primary: '#666666', bg: 'rgba(15,15,15,0.9)' },
  evolved: { primary: HUD_COLORS.goldBright, accent: '#FFFFFF' },
}
```

---

## 4. 폰트 규격

```css
:root {
  /* UI 기본 - Rajdhani (산세리프) */
  --font-ui: "Rajdhani", "Noto Sans KR", system-ui, sans-serif;
  
  /* 디스플레이 - Orbitron (SF 각진 폰트) */
  --font-display: "Orbitron", "Rajdhani", sans-serif;
  
  /* 모노스페이스 - 터미널/로그용 */
  --font-mono: "JetBrains Mono", "Fira Code", "Consolas", monospace;
  
  /* 한글 */
  --font-korean: "Noto Sans KR", "Malgun Gothic", sans-serif;
}
```

### 4.1 텍스트 스타일 규격

| 용도 | 폰트 | 크기 | 스타일 | 예시 |
|------|------|------|--------|------|
| 윈도우 타이틀 | font-ui | 11px | uppercase, letter-spacing 0.18em | "PROFILE - DANGER ZONE" |
| 대형 상태 텍스트 | font-display | 48px+ | bold, glow | "HIGH", "시스템 정상" |
| 이름 라벨 | font-display | 26-32px | bold, glow | "SOYOUNG", "RUBIAN" |
| 상태 텍스트 | font-mono | 12px | normal | "CPU: 4.2GHz" |
| 한글 본문 | font-korean | 16-20px | normal | "게임 시간입니다" |

---

## 5. "Win98 홀로그램 크롬" 규격

### 5.1 타이틀바

```typescript
const TITLEBAR_SPEC = {
  height: 28,
  background: 'linear-gradient(180deg, bgPanel, bgWindow)',
  titleText: {
    paddingLeft: 10,
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: 'rgba(255,240,200,0.75)',
  },
  buttons: {
    count: 3,  // ─ □ ✕
    size: 16,
    spacing: 4,
    stroke: 'rgba(255,240,200,0.65)',
    hoverGlow: HUD_COLORS.goldBright,
  },
}
```

### 5.2 외곽 테두리 (2중)

```css
.hud-window {
  /* Outer border */
  border: 1px solid #1A1A15;
  
  /* Inner border (pseudo-element) */
  &::after {
    border: 1px solid rgba(255,255,255,0.12);
  }
  
  /* Glow */
  filter: drop-shadow(0 0 10px rgba(212,160,23,0.22));
}
```

### 5.3 글래스 바디 (패널 내부)

```css
.hud-body {
  background: linear-gradient(180deg, 
    rgba(255,255,255,0.06), 
    rgba(255,255,255,0.03)
  );
  backdrop-filter: blur(12px);
}
```

### 5.4 리사이즈 핸들

```typescript
const RESIZE_HANDLES = {
  size: 6,
  color: '#FFFFFF',
  border: '1px solid rgba(255,255,255,0.08)',
  positions: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'],
  visibleOnlyWhenActive: true,
}
```

---

## 6. 전역 효과 레이어

### 6.1 스캔라인 (CSS Overlay)

```css
.hud-scanline {
  pointer-events: none;
  position: fixed;
  inset: 0;
  opacity: 0.18;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0,0,0,0.0) 0px,
    rgba(0,0,0,0.0) 2px,
    rgba(0,0,0,0.12) 3px
  );
  mix-blend-mode: overlay;
}
```

### 6.2 필름 노이즈 (Canvas/WebGPU)

```typescript
const NOISE_SETTINGS = {
  textureSize: 256,
  blendMode: 'soft-light',
  opacity: 0.08, // 0.08 ~ 0.14
  animationSpeed: 60, // fps
}
```

### 6.3 육각형 배경 (Hex Backdrop)

```typescript
const HEX_BACKDROP = {
  hexSize: 60,
  lineColor: 'rgba(212,160,23,0.22)',
  fillColor: 'rgba(255,255,255,0.06)',
  distribution: {
    center: 'sparse',    // 중앙은 성기게
    edges: 'dense',      // 좌우 가장자리 밀집
  },
  parallax: {
    enabled: true,
    strength: 0.5, // 0.5~1.5% 이동
    target: 'background', // 배경만 적용, 창은 고정
  },
}
```

---

## 7. 핵심 컴포넌트 상세 규격

### 7.1 Dual Hex Portrait (SOYOUNG / RUBIAN)

```typescript
interface DualHexPortraitProps {
  leftImage: string      // 인간 (SOYOUNG)
  rightImage: string     // 페르소나 (RUBIAN)
  leftName: string
  rightName: string
  connectionStatus: 'connecting' | 'syncing' | 'complete'
}

const HEX_PORTRAIT_SPEC = {
  hexSize: 128,                          // 육각형 크기
  hexStroke: 2,                          // 골드 테두리 두께
  hexGlow: 'drop-shadow(0 0 18px rgba(212,160,23,0.22))',
  connector: {
    type: 'glowing-line',
    width: 32,
    height: 2,
    color: HUD_COLORS.gold,
    animate: 'pulse',
  },
  nameLabel: {
    font: 'font-display',
    size: 28,
    color: HUD_COLORS.goldBright,
    glow: '0 0 12px rgba(255,215,0,0.35)',
  },
}
```

### 7.2 BIOLOGICAL Radar Chart

```typescript
const RADAR_CHART_SPEC = {
  axes: ['STR', 'AGI', 'DEX', 'VIT', 'INT', 'LUK'],
  size: 180,
  rings: 5,
  colors: {
    axis: HUD_COLORS.goldDim,
    fill: 'rgba(212,160,23,0.2)',
    stroke: HUD_COLORS.gold,
    labels: HUD_COLORS.textMain,
  },
  animation: {
    onUpdate: 'ease-out',
    duration: 500,
  },
}
```

### 7.3 THERMAL LEVEL ("HIGH")

```typescript
const THERMAL_LEVEL_SPEC = {
  text: 'HIGH',
  font: 'font-display',
  fontSize: 72,
  color: HUD_COLORS.goldBright,
  glow: '0 0 20px rgba(255,215,0,0.5)',
  blur: false,  // 텍스트 blur 금지, glow만!
  heartbeatLine: {
    visible: true,
    color: 'rgba(255,215,0,0.3)',
    thickness: 1,
  },
}
```

### 7.4 HEALTH Bar (세그먼트)

```typescript
const HEALTH_BAR_SPEC = {
  segmentCount: 50,       // 40~60개
  segmentWidth: 8,
  segmentHeight: 16,
  segmentGap: 2,
  colors: {
    filled: HUD_COLORS.gold,
    empty: 'rgba(212,160,23,0.15)',
    critical: HUD_COLORS.red,  // 20% 이하
  },
  animation: {
    decrease: 'left-to-right', // 왼쪽부터 꺼짐
    duration: 200,
  },
  label: {
    text: 'HEALTH',
    position: 'right',
    font: 'font-mono',
  },
}
```

### 7.5 CONNECTION COMPLETE 배너

```typescript
const CONNECTION_BANNER_SPEC = {
  text: 'CONNECTION COMPLETE',
  font: 'font-display',
  fontSize: 32,
  color: HUD_COLORS.textMain,
  position: 'center-bottom',
  animation: {
    enter: {
      type: 'slide-up',
      from: { y: 50, opacity: 0 },
      to: { y: 0, opacity: 1 },
      duration: 220,
      easing: 'ease-out',
    },
    exit: {
      delay: 600,
      type: 'fade',
      duration: 300,
    },
  },
  background: {
    type: 'hazard-stripe',
    opacity: 0.3,
  },
}
```

### 7.6 Hazard Stripe 패널

```typescript
const HAZARD_STRIPE_SPEC = {
  stripeWidth: 20,
  stripeAngle: 45,
  colors: {
    primary: '#FFDD00',
    secondary: '#111111',
  },
  opacity: 0.85,
  animation: {
    scroll: true,
    speed: 20, // px/s
    direction: 'left',
  },
  warningIcon: {
    type: 'triangle-exclamation',
    visible: true,
  },
  defaultVisible: false, // 경고 상황에서만 활성
}
```

### 7.7 "게임 시간입니다" 안내 모달

```typescript
const INTRO_MODAL_SPEC = {
  position: 'center',
  width: 600,
  height: 200,
  background: {
    type: 'glass',
    blur: 12,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  titlebar: {
    visible: true,
    height: 28,
    buttons: true,  // ─ □ ✕
  },
  content: {
    lines: [
      '게임 시간입니다',
      '몽단 섭취 후 드림 마스크를 써주세요',
    ],
    font: 'font-korean',
    fontSize: 28,
    lineHeight: 1.6,
    color: HUD_COLORS.goldBright,
    glow: '0 0 12px rgba(255,215,0,0.35)',
  },
  bloomEffect: {
    enabled: true,
    position: 'edges', // 좌우 가장자리
    color: '#FFFFFF',
    intensity: 0.3,
  },
}
```

---

## 8. 시나리오별 UI 작동 (줄콘티 대응)

### Scene 8: 블랙룸 진입 / LINK IN PROGRESS

```typescript
const SCENE_8_LINK_PROGRESS = {
  trigger: 'onEnterBlackroom',
  topBar: {
    status: 'NET_UPLINK: LINKING',
    color: HUD_COLORS.cyan,
  },
  centerBanner: {
    text: 'LINK IN PROGRESS',
    duration: 2000,
    animation: 'typewriter',
  },
  terminal: {
    visible: true,
    logs: [
      '> Initializing link channel...',
      '> Resolving environment: LUMINA_WOOD',
    ],
    typingSpeed: 50,
  },
}
```

### Scene 8: "페르소나의 이름을 불러 접속하세요"

```typescript
const SCENE_8_PERSONA_CONNECT = {
  trigger: 'afterLinkComplete',
  modal: {
    type: 'intro-modal',
    title: '접속 안내',
    content: '페르소나의 이름을 불러 접속하세요',
    input: {
      visible: true,
      placeholder: 'V',
    },
  },
  states: {
    inputReceived: {
      text: '접속중...',
      effect: 'pixelate',
    },
    complete: {
      text: '접속 완료',
      banner: 'CONNECTION COMPLETE',
      effect: 'shine',
    },
  },
}
```

### Scene 9: 매지코 비명 / 눈알 이상

```typescript
const SCENE_9_MAGICO_SCREAM = {
  trigger: 'onMagicoScream',
  bioAnalysis: {
    visible: true,
    title: 'BIO_ANALYSIS',
    data: {
      syncRate: 45,
      corruption: 78,
      status: 'UNSTABLE',
    },
  },
  effects: {
    glitch: {
      enabled: true,
      duration: 120,
      intensity: 0.8,
    },
    vignette: {
      enabled: true,
      color: HUD_COLORS.red,
      intensity: 0.4,
    },
  },
}
```

### Scene 10: 루비안 조개즙/점액

```typescript
const SCENE_10_RUBIAN_SLIME = {
  trigger: 'onSlimeFormation',
  traceLines: {
    type: 'arwes-line',
    color: HUD_COLORS.purple,
    animated: true,
    paths: 'slime-trace',
  },
  toast: {
    type: 'warning',
    text: 'SURFACE FORMATION DETECTED',
    icon: 'biohazard',
    duration: 3000,
  },
}
```

### Scene 11: 수빈사랑 접속 / 심리 공격

```typescript
const SCENE_11_PSYCHO_ATTACK = {
  trigger: 'onPsychoAttack',
  psychoAnalysis: {
    visible: true,
    title: 'PSYCHO_ANALYSIS',
    duration: 'once', // 1회만 노출
  },
  futureBranches: {
    visible: true,
    thumbnails: 3,  // 정확히 3개만 (과다 금지)
    layout: 'horizontal',
    animation: 'fade-in-stagger',
  },
}
```

### Scene 12: 몬스터 전투 (랩틸리언)

```typescript
const SCENE_12_MONSTER_COMBAT = {
  trigger: 'onMonsterDetected',
  reticle: {
    visible: true,
    type: 'tactical-circle',
    lockOnProgress: true,
  },
  threatBox: {
    visible: true,
    target: {
      name: '렙틸리언',
      level: 45,
      threatLevel: 'high',
      hp: 850,
      maxHp: 1000,
    },
  },
  skillHint: {
    key: 'K',
    text: '스킬창 열기',
    visible: true,
  },
  onSummonFail: {
    modal: {
      type: 'error',
      title: 'ERROR',
      content: '무기 소환 실패',
      effect: 'glitch',
    },
  },
}
```

---

## 9. VFX 레이어 설계

### 9.1 레이어 순서 (Z-Index)

```
1. Game Footage / Scene Background
2. Hex Backdrop (parallax)
3. Windows / Panels (React DOM / Canvas)
4. HUD Vector Overlay (Canvas 2D)
5. Scanline + Noise (CSS Overlay)
6. WebGPU PostFX Pass (전역)
7. Subtitles / ToastRail (최상위)
```

### 9.2 WebGPU PostFX (전역)

```typescript
const WEBGPU_POSTFX = {
  chromaticAberration: {
    offset: [0.2, 0.6], // 0.2~0.6px
  },
  bloom: {
    threshold: 0.7,
    intensity: 0.15, // 0.12~0.20
    targetColor: HUD_COLORS.gold,
  },
  vignette: {
    intensity: 0.12,
    radius: 0.8,
  },
  sharpen: {
    amount: 0.06,  // 텍스트 가독성 유지
  },
}
```

### 9.3 react-vfx 국소 효과

```typescript
const LOCAL_VFX = {
  error_warning: {
    target: 'panel',  // 해당 패널만
    effect: 'glitch',
    intensity: 0.8,
  },
  connecting: {
    target: 'input-field',
    effect: 'pixelate',
    intensity: 0.4,
  },
  infected: {
    target: 'full-hud',
    effect: 'rgbGlitch',
    intensity: 0.3,
  },
  evolved: {
    target: 'full-hud',
    effect: 'rainbow',
    intensity: 0.2,
  },
}
```

---

## 10. 컴포넌트 파일 구조

```
src/presets/hexaTactical/
├── constants.ts              # 색상, 폰트, 설정 토큰
├── HexaTacticalHUD.tsx       # 메인 컴포넌트
├── components/
│   ├── WindowShell.tsx       # Win98 창 프레임
│   ├── WindowControls.tsx    # ─ □ ✕ 버튼
│   ├── ResizeHandles.tsx     # 리사이즈 핸들
│   ├── HexBackdrop.tsx       # 육각형 배경
│   ├── ScanlineOverlay.tsx   # 스캔라인
│   ├── NoiseOverlay.tsx      # 필름 노이즈
│   └── ConnectionBanner.tsx  # CONNECTION COMPLETE
├── widgets/
│   ├── DualHexPortrait.tsx   # SOYOUNG/RUBIAN 프로필
│   ├── BioRadar.tsx          # BIOLOGICAL 레이더
│   ├── ThermalLevel.tsx      # "HIGH" 패널
│   ├── BrainScan.tsx         # 뇌 스캔 3D
│   ├── HealthSegments.tsx    # 세그먼트 체력바
│   ├── HazardStripe.tsx      # 경고 스트라이프
│   └── IntroModal.tsx        # "게임 시간입니다" 모달
├── scenarios/
│   ├── IdleScenario.ts
│   ├── LinkProgressScenario.ts
│   ├── PersonaSyncScenario.ts
│   ├── ProfileDangerScenario.ts
│   ├── MonsterCombatScenario.ts
│   ├── PsychoAttackScenario.ts
│   ├── InfectedScenario.ts
│   ├── TraumaScenario.ts
│   └── EvolvedScenario.ts
├── drawing/
│   ├── hexDrawing.ts         # 육각형 그리기 함수
│   ├── frameDrawing.ts       # 프레임 그리기
│   ├── effectsDrawing.ts     # 이펙트 그리기
│   └── reticleDrawing.ts     # 조준점/락온
└── vfx/
    ├── WebGPUPostFX.ts       # 전역 후처리
    └── LocalVFX.ts           # 국소 VFX
```

---

## 11. 구현 우선순위 (Agent Task Order)

### Phase 1: 기초 프레임워크 (필수)
1. ✅ `constants.ts` - 색상/폰트/설정 토큰 완성
2. ✅ `WindowShell.tsx` - Win98 창 프레임 + 컨트롤 + 핸들
3. ✅ `HexBackdrop.tsx` - 육각형 배경 + 패럴랙스

### Phase 2: 핵심 위젯 (필수)
4. ⬜ `DualHexPortrait.tsx` - SOYOUNG/RUBIAN 듀얼 포트레이트
5. ⬜ `BioRadar.tsx` - BIOLOGICAL 레이더 차트
6. ⬜ `ThermalLevel.tsx` - "HIGH" 패널
7. ⬜ `HealthSegments.tsx` - 세그먼트 체력바
8. ⬜ `ConnectionBanner.tsx` - 배너 애니메이션

### Phase 3: 메인 레이아웃 (필수)
9. ⬜ `ProfileDangerScenario.ts` - 대형 메인 프레임 레이아웃
10. ⬜ `HexaTacticalHUD.tsx` - 메인 컴포넌트 통합

### Phase 4: 시나리오 트리거 (중요)
11. ⬜ 각 시나리오별 상태 전환 로직 (Zustand)
12. ⬜ 줄콘티 대응 이벤트 연결

### Phase 5: 전역 VFX (권장)
13. ⬜ `WebGPUPostFX.ts` - 크로매틱, 블룸, 비네트
14. ⬜ `ScanlineOverlay.tsx` + `NoiseOverlay.tsx`

### Phase 6: 상태별 색상/FX 변화 (권장)
15. ⬜ Combat/Infected/Trauma/Evolved 색상 오버라이드
16. ⬜ 국소 VFX (글리치, 픽셀화)

---

## 12. QA 체크리스트 (레퍼런스 일치 검증)

### 12.1 스킨 픽셀 체크
- [ ] 타이틀바 높이 28px 고정
- [ ] 컨트롤 버튼 3개(─ □ ✕) 우측 정렬, 16x16px
- [ ] 2중 테두리 + 골드 글로우
- [ ] 리사이즈 핸들(흰 사각점) 6x6px 노출
- [ ] 글래스 + blur(12px) + scanline + noise 동시 적용
- [ ] HEX 배경 존재(Outline + Fill 혼합)

### 12.2 "HIGH / CONNECTION COMPLETE" 체크
- [ ] 굵은 폰트 (Orbitron) + 골드 글로우
- [ ] 텍스트는 흐려지지 않음 (blur 금지)
- [ ] 등장 모션 220ms, 과한 바운스 금지

### 12.3 듀얼 헥사곤 포트레이트 체크
- [ ] 육각형 프레임 stroke 2px 골드
- [ ] 외곽 글로우 18px
- [ ] 이름 라벨 26-32px, 글로우 적용
- [ ] 가운데 연결 라인 애니메이션

### 12.4 시나리오 전환 체크
- [ ] 색상만 변화, 레이아웃 고정
- [ ] 전환 효과 500ms 이내
- [ ] Toast/Modal 오버레이 방식

---

## 13. 참고 자료

- `TACTICAL-DIAGNOSTIC-UI-ANALYSIS.md` - 레퍼런스 이미지 분석
- `MZG-HUD-TacticalVisor-ChatGPT.md` - ChatGPT 설계서
- `MZG-HUD-TacticalVisor-Gemini.md` - Gemini 설계서
- `DREAM-PERSONA-HUD-GUIDE-V2.md` - 기존 HUD 가이드
- `guide/GUIDE-MODULE-*.md` - 모듈별 세부 가이드

---

**END OF SPEC**
