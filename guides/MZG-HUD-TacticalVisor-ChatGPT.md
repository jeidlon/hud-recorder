# 몽중게임 In‑Game HUD 설계서 (Storyboard 대응 + UI Skin 재현 Spec)
**Spec ID**: MZG-HUD-TacticalVisor-v1.1  
**작성일**: 2026-01-22  
**목표**: 글콘티(씬 8~)에 대응하는 HUD를 **React + Remotion + WebGPU + react-vfx + Arwes**로 구현한다.  
**핵심 요구**: 첨부 레퍼런스(윈도우98형 홀로그램 UI)와 **시각적으로 99.99% 동일한 “UI 스킨”**을 재현한다.

---

## 0) 절대 조건 (Non‑Negotiables)

1) **HUD는 1개(싱글 베이스 레이어)**  
- 상황별 “다른 UI 페이지”를 만들지 않는다.  
- **기본 HUD(Idle/Normal)** 위에 **Toast/Modal/Warning/FX**가 **겹쳐지고 사라지는 방식**만 사용한다.

2) 모든 UI는 **TACTICAL‑DIAGNOSTIC‑UI‑ANALYSIS.md 기반 디자인**을 고정 스킨으로 사용한다.  
- 추가 레퍼런스(첨부 이미지)의 공통 특징을 “스킨 규격”으로 확정한다.

3) 상태 변화(오류/데미지/공격/감염/트라우마/진화)는 **색/FX/필터만 변화**한다.  
- 프레임/레이아웃/타이포 그래픽은 유지한다.

---

## 1) “Dream Persona Tactical OS 98” 스킨 규격 (첨부 UI 99.99% 재현)

> 이 섹션이 **가장 중요**하다.  
> 모든 HUD 컴포넌트는 아래 규격을 그대로 따라야 한다.

### 1.1 스킨의 공통 특징 요약 (이미지 공통점)
- **검정에 가까운 배경 + 육각(HEX) 격자 모티프**
- **윈도우98 크롬(Window chrome)**: 얇은 타이틀바 + 3개 컨트롤 버튼(─ □ ✕)
- **반투명 글래스 패널** + 내부 소프트 블러 + 미세 노이즈 + 스캔라인
- **골드(황금빛) 스트로크/텍스트** 중심, 흰색은 보조(핸들/하이라이트)
- 창 가장자리에는 **리사이즈 핸들(작은 흰 사각 점)**이 노출됨
- 패널 내부는 **얇은 라인/분할/모듈러 그리드**로 구성됨
- 경고/성공 배너는 **굵은 대문자 텍스트 + 소프트 글로우**로 처리됨
- “PROFILE / BIOLOGICAL / THERMAL …” 같은 타이틀은 **작은 대문자 + 좌측 정렬**이 기본

---

### 1.2 컬러 토큰 (반드시 변수화)

**기본 팔레트(권장: TACTICAL-DIAGNOSTIC-UI-ANALYSIS.md 그대로 사용)**
```ts
export const HUD_COLORS = {
  // gold system
  gold:       '#D4A017', // 기본 테두리/텍스트
  goldBright: '#FFD700', // 강조/아이콘/경고
  goldDim:    '#8B7500', // 비활성/그림자
  goldMuted:  '#9A7B0A', // 서브텍스트

  // background system
  bgDark:   '#0A0A08',
  bgPanel:  '#0D0D0A',
  bgWindow: '#121210',

  // lines
  borderOuter: '#1A1A15',
  borderInner: '#2A2A20',

  // status
  red:   '#FF3333',
  green: '#00FF66',
}
```

**레퍼런스 기반 추가 토큰(첨부 이미지에 자주 보이는 톤)**
```ts
export const HUD_SKIN = {
  // 글래스 느낌(패널 내부)
  glassFill: 'rgba(255,255,255,0.06)',
  glassFill2:'rgba(255,255,255,0.03)',

  // 하이라이트 라인
  highlightLine: 'rgba(255,255,255,0.20)',
  faintLine:     'rgba(255,255,255,0.08)',

  // 골드 글로우
  goldGlow: 'rgba(255,215,0,0.35)',
  goldGlowSoft: 'rgba(212,160,23,0.22)',

  // 텍스트
  textMain: 'rgba(255,240,200,0.92)',
  textDim:  'rgba(255,240,200,0.55)',
}
```

---

### 1.3 폰트 규격 (필수)
- Title / Label: **오버스페이스 대문자**(윈도우 타이틀 느낌)
- Big Word (“HIGH”, “CONNECTION COMPLETE”): **굵고 각진 SF 폰트**

권장 조합(실무에서 안정적인 대체):
- `Rajdhani` (UI 기본)
- `Orbitron` (큰 단어, “HIGH”)
- Fallback: `system-ui`

```css
:root {
  --font-ui: "Rajdhani", system-ui, -apple-system, Segoe UI, sans-serif;
  --font-display: "Orbitron", "Rajdhani", system-ui, sans-serif;
}
```

---

### 1.4 “윈도우98 홀로그램 크롬” 정확한 구조

#### 1) 타이틀바 규격
- 높이: **28px**
- 배경: 다크 그레이 + 아주 약한 그라데이션
- 타이틀 텍스트: 좌측 10px 패딩 / **uppercase / 11px / letter-spacing 0.18em**
- 우측 버튼: **3개(─ □ ✕)**  
  - 버튼 크기: 16×16  
  - 버튼 간격: 4px  
  - stroke: `rgba(255,240,200,0.65)`  
  - hover 시 goldBright + glow

#### 2) 외곽 테두리(2중)
- Outer border: 1px `borderOuter`
- Inner border: 1px `rgba(255,255,255,0.12)`
- 전체 그림자: `drop-shadow(0 0 10px goldGlowSoft)`

#### 3) 글래스 바디(패널 내부)
- Fill: `linear-gradient(180deg, glassFill, glassFill2)`
- Backdrop blur: **10~14px**
- 내부 패턴:
  - 매우 약한 dot noise
  - **스캔라인(전역)**

#### 4) 리사이즈 핸들(첨부 이미지 핵심)
- 위치: **각 모서리 + 좌/우/상/하 중앙**
- 형태: 6×6 흰 사각형
- 테두리: 1px faintLine
- 활성 창(Top‑Z)일 때만 표시(기본)

---

### 1.5 전역 스캔라인 + 노이즈 (레퍼런스 느낌 필수)

#### 1) Scanline (CSS Overlay)
```css
.hud-scanline {
  pointer-events: none;
  position: fixed; inset: 0;
  opacity: 0.18; /* 강도는 상황별 가변 */
  background:
    repeating-linear-gradient(
      to bottom,
      rgba(0,0,0,0.0) 0px,
      rgba(0,0,0,0.0) 2px,
      rgba(0,0,0,0.12) 3px
    );
  mix-blend-mode: overlay;
}
```

#### 2) Film Noise (Canvas or WebGPU)
- 256×256 노이즈 텍스처를 프레임마다 offset
- `mix-blend-mode: soft-light`
- opacity 0.08~0.14

---

### 1.6 배경(HEX Backdrop) 규격
첨부 이미지 공통: **뒤 배경에 육각형이 떠 있고, 일부는 fill, 일부는 outline**

**구성 요소**
- Large hex outlines(얇은 라인) + medium hex fills(짙은 회색) 혼합
- 화면 중앙은 어둡고, 양끝은 빛 번짐(특히 “게임 시간입니다 …” 장면)

**정확한 규격**
- Hex line: `rgba(212,160,23,0.22)` 또는 `rgba(255,255,255,0.10)`
- Hex fill: `rgba(255,255,255,0.06)`
- 랜덤 분포지만 “좌우 가장자리 밀집, 중앙은 성기게”

**마우스 패럴랙스**
- `mousemove` 기반으로 hex layer가 0.5~1.5% 이동
- parallax는 **배경만** 적용, 창은 고정

---

## 2) 레퍼런스 UI를 “컴포넌트”로 쪼개서 1:1 재현

### 2.1 Profile Danger Zone (대형 메인 프레임)
**구성**
- 최상단 큰 프레임: `PROFILE - DANGER ZONE`
- 내부 5개 패널:
  1) BIOLOGICAL (레이더 차트)
  2) PROFILE (페르소나 2명 hex portrait)
  3) 장비 카드(무기 실루엣 + 스펙 2슬롯)
  4) THERMAL LEVEL (BIG WORD)
  5) THERMAL BRAIN SCAN (뇌 이미지 + 우측 컬러바)
- 하단: HEALTH 세그먼트 바 + CONNECTION COMPLETE 배너 + Hazard stripe

**정확한 레이아웃 규칙**
- 그리드: `12-col` 가정
- 패널 간격: 16px
- 패널 내부 패딩: 14px
- 패널 모서리: **직각(라운드 금지)**

---

### 2.2 Hex Portrait Frame (SOYOUNG / RUBIAN)
**핵심: “육각 프레임 + 골드 라인 + 글로우”**

- hex frame stroke: 2px `gold`
- 외곽 글로우: `drop-shadow(0 0 18px goldGlowSoft)`
- 내부 이미지는 hex 마스크로 clip
- 가운데 얇은 세로 샤드(골드 결정) 1개(장식)
- 하단 이름 라벨:
  - 폰트: display(Orbitron 추천)
  - 크기: 26~32px
  - 글로우: 0 0 12px goldGlow

---

### 2.3 Thermal Level 패널 (“HIGH”)
- 텍스트는 패널 중앙
- 글꼴은 굵고 각진 디스플레이
- 배경에는 **세로 심장박동 라인** 1개(매우 약하게)
- “HIGH”는 blur하지 말고 **글로우만**

---

### 2.4 Thermal Brain Scan 패널
- 우측에 세로 컬러바(스펙트럼)
- brain 이미지 위에 약한 스캔라인
- 패널 테두리 동일(윈도우 크롬)

---

### 2.5 Health Bar (세그먼트)
- **짧은 막대가 40~60개** 반복되는 스타일
- 감소 애니메이션은 “왼쪽부터 꺼지는 방식”
- 라벨 “HEALTH”는 우측 끝

---

### 2.6 Connection Complete 배너
- 중앙 하단, 폭 넓은 배너
- 텍스트: `CONNECTION COMPLETE` 대문자
- 등장: 아래에서 위로 220ms 슬라이드 + opacity
- 사라짐: 600ms 뒤 자동 fade

---

### 2.7 Hazard Stripe 패널
- “노란/오프화이트 사선 스트라이프” + 경고 삼각형 아이콘
- opacity는 0.85 정도(너무 진하지 않게)
- 경고 상황에서만 활성(기본은 숨김)

---

### 2.8 “게임 시간입니다 …” 안내 모달(중앙 큰 메시지)
- 배경은 좌우가 강하게 bloom(화이트)  
- 중앙 박스는:
  - thin border
  - 내부는 글래스
  - 상단 우측에 윈도우 컨트롤 3개
- 문구는 큰 한글(2줄), glow 적용

---

## 3) Arwes 결합 규칙 (Win98 + Futuristic Corner 결합)

> “윈도우98의 타이틀바”는 유지하면서  
> **아래 모서리/분할선/코너 장식**만 Arwes로 강화한다.

### 3.1 어디에 Arwes를 쓰는가
- Window body 안쪽 프레임(내부 코너)
- Reticle / Hazard ring / Target box
- ObjectiveTicker의 모서리

### 3.2 사용 규칙
- Arwes 프레임은 **항상 goldDim**로 시작
- hover/active 때만 goldBright로 상승
- Arwes 라인은 2px 이하 유지(과다 금지)

---

## 4) WebGPU + react-vfx 적용 레이어 설계 (필수)

### 4.1 레이어 순서(절대 고정)
1) **Game Footage / Scene**
2) **Hex Backdrop**
3) **Windows / Panels (React DOM)**
4) **HUD Vector Overlay (Canvas 2D)**
5) **Scanline + Noise (Overlay)**
6) **WebGPU PostFX Pass (전역)**
7) **Subtitles / ToastRail**

### 4.2 WebGPU PostFX (전역)
- Chromatic Aberration: 0.2~0.6px
- Bloom: 0.12~0.20 (골드만 약하게)
- Vignette: 0.12
- Sharpen: 0.06 (텍스트 가독성 유지)

### 4.3 react-vfx (국소)
- “ERROR/WARNING” 발생 시 **해당 패널만** glitch
- “접속중” 상태에서 **입력창만** pixelate

---

## 5) Window Shell 구현 지시 (AI Agent용)

### 5.1 파일 구조(권장)
```
src/hud/
  skin/
    dreamPersona98/
      tokens.ts
      WindowShell.tsx
      WindowControls.tsx
      ResizeHandles.tsx
      HexBackdrop.tsx
      ScanlineOverlay.tsx
      NoiseOverlay.tsx
  widgets/
    PersonaProfile.tsx
    BioRadar.tsx
    ThermalLevel.tsx
    BrainScan.tsx
    HealthSegments.tsx
    ConnectionBanner.tsx
    HazardStripe.tsx
```

### 5.2 WindowShell (마크업 고정)
```tsx
export function WindowShell({
  title, children, active
}: {
  title: string; children: React.ReactNode; active?: boolean
}) {
  return (
    <div className="hud-window">
      <div className="hud-titlebar">
        <div className="hud-title">{title}</div>
        <WindowControls />
      </div>

      <div className="hud-body">
        {children}
      </div>

      <ResizeHandles visible={active} />
    </div>
  )
}
```

### 5.3 CSS 핵심(스킨 고정)
```css
.hud-window {
  position: relative;
  background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
  border: 1px solid #1A1A15;
  box-shadow: 0 0 10px rgba(212,160,23,0.22);
  backdrop-filter: blur(12px);
}

.hud-titlebar {
  height: 28px;
  display:flex; align-items:center; justify-content:space-between;
  padding: 0 10px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
}

.hud-title {
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,240,200,0.75);
}
```

---

## 6) 스토리보드(글콘티) 대응 UI 작동 시나리오 (요약 업데이트)

> UI 스킨이 고정되었으므로, 아래는 “동작”만 정의한다.  
> 모든 창은 **WindowShell**을 사용한다.

### SCENE 8 — 블랙룸 진입 / LINK IN PROGRESS
- TopBar: `NET_UPLINK: LINKING`
- 중앙 Banner: `LINK IN PROGRESS` (2초)
- Terminal:
  - `> Initializing link channel...`
  - `> Resolving environment: LUMINA_WOOD`

### SCENE 8 — “페르소나의 이름을 불러 접속하세요”
- 중앙 Dialog WindowShell 생성
- 입력(`V`) → `접속중…` → `접속 완료`
- 완료 시 **ConnectionBanner** 등장

### SCENE 9 — 매지코 비명/눈알 이상
- BioAnalysis WindowShell 자동 표시
- 120ms 글리치 + 주변 비네팅

### SCENE 10 — 루비안 조개즙/점액
- 점액 트레이스 라인(Arwes 라인) 활성화
- WARNING toast: `SURFACE FORMATION DETECTED`

### SCENE 11 — 수빈사랑 접속/심리 공격
- PsychoAnalysis WindowShell 1회 노출
- 다중 미래 분기 썸네일 3개만 표시(과다 금지)

### 몬스터 전투(랩틸리언)
- Reticle + Threat Box
- `K` 스킬창 열기 힌트
- 소환 실패 시 ERROR WindowShell

---

## 7) QA 체크리스트 (레퍼런스 일치 검증)

### 7.1 스킨 픽셀 체크
- [ ] 타이틀바 높이 28px 고정
- [ ] 컨트롤 버튼 3개(─ □ ✕) 우측 정렬
- [ ] 2중 테두리 + 골드 글로우
- [ ] 리사이즈 핸들(흰 사각점) 노출
- [ ] 글래스 + blur + scanline + noise 동시 적용
- [ ] HEX 배경이 항상 존재(Outline + Fill 혼합)

### 7.2 “HIGH / CONNECTION COMPLETE” 체크
- [ ] 굵은 폰트 + 골드 글로우
- [ ] 텍스트는 흐려지지 않음(blur 금지)
- [ ] 등장 모션 220ms, 과한 바운스 금지

---

## 8) 구현 우선순위 (Agent Task Order)

1) **WindowShell + Controls + Handles** 완성  
2) **HexBackdrop + Scanline/Noise Overlay** 완성  
3) ProfileDangerZone 프리셋(한 화면) 완성  
4) Storyboard 트리거 이벤트 연결(Zustand)  
5) WebGPU PostFX 전역 합성  
6) 상태별(Combat/Infected/Trauma/Evolved) 색/FX만 추가

---

**END**
