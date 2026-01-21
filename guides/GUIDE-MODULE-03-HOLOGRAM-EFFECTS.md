# 모듈 3: 홀로그램 및 스캔라인 효과

## 목표
레트로 퓨처리스틱 홀로그램 효과와 CRT 스캔라인을 구현한다.

---

## 3.1 스캔라인 효과 (필수)

```typescript
// arwesDrawing.ts

/**
 * CRT 스캔라인 효과
 * - 2px 간격의 수평선
 * - 위에서 아래로 천천히 이동
 * - 투명도 3~5%
 */
export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  options: {
    lineSpacing?: number;      // 라인 간격 (기본 2px)
    opacity?: number;          // 투명도 (기본 0.03)
    scrollSpeed?: number;      // 스크롤 속도 (기본 0.5)
    color?: string;            // 라인 색상 (기본 검정)
  } = {}
): void {
  const {
    lineSpacing = 2,
    opacity = 0.03,
    scrollSpeed = 0.5,
    color = '#000000'
  } = options;
  
  ctx.save();
  
  // 스크롤 오프셋 계산 (time 기반으로 아래로 이동)
  const scrollOffset = (time * scrollSpeed * 50) % lineSpacing;
  
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1;
  
  // 수평 스캔라인 그리기
  for (let y = scrollOffset; y < height; y += lineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  ctx.restore();
}
```

---

## 3.2 홀로그램 플리커 효과

```typescript
/**
 * 홀로그램 깜빡임 효과
 * - 랜덤한 간격으로 전체 화면이 살짝 깜빡임
 * - 깜빡일 때 약간의 밝기 변화
 */
export function drawHologramFlicker(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  options: {
    flickerFrequency?: number;  // 깜빡임 빈도 (0-1, 높을수록 자주)
    flickerIntensity?: number;  // 깜빡임 강도 (0-1)
    baseColor?: string;         // 기본 색상
  } = {}
): void {
  const {
    flickerFrequency = 0.05,
    flickerIntensity = 0.1,
    baseColor = 'rgba(255, 255, 255, 0.02)'
  } = options;
  
  ctx.save();
  
  // 랜덤 플리커 계산 (노이즈 기반)
  const noise = Math.sin(time * 47.3) * Math.cos(time * 23.7);
  const flicker = noise > (1 - flickerFrequency * 2) ? 1 : 0;
  
  if (flicker) {
    // 전체 화면에 밝은 오버레이
    ctx.fillStyle = baseColor;
    ctx.globalAlpha = flickerIntensity * (0.5 + Math.random() * 0.5);
    ctx.fillRect(0, 0, width, height);
  }
  
  ctx.restore();
}
```

---

## 3.3 색수차 (Chromatic Aberration) 효과

```typescript
/**
 * 색수차 효과
 * - RGB 채널이 약간씩 분리되어 보이는 효과
 * - 가장자리에서 더 강하게 나타남
 * 
 * 주의: Canvas 2D에서는 완벽한 색수차가 어려우므로
 * 테두리 근처에 RGB 분리된 선을 그리는 방식으로 시뮬레이션
 */
export function drawChromaticAberration(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    offset?: number;           // RGB 분리 거리 (기본 2px)
    opacity?: number;          // 효과 투명도
  } = {}
): void {
  const { offset = 2, opacity = 0.3 } = options;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // 빨간색 오프셋 (왼쪽으로)
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - offset, y - offset, width, height);
  
  // 파란색 오프셋 (오른쪽으로)
  ctx.strokeStyle = '#0000FF';
  ctx.strokeRect(x + offset, y + offset, width, height);
  
  ctx.restore();
}
```

---

## 3.4 홀로그램 노이즈 효과

```typescript
/**
 * 홀로그램 노이즈 텍스처
 * - 미세한 노이즈 패턴으로 홀로그램 질감 표현
 */
export function drawHologramNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  options: {
    density?: number;          // 노이즈 밀도 (기본 0.002)
    color?: string;            // 노이즈 색상
    animated?: boolean;        // 애니메이션 여부
  } = {}
): void {
  const {
    density = 0.002,
    color = 'rgba(255, 255, 255, 0.1)',
    animated = true
  } = options;
  
  ctx.save();
  ctx.fillStyle = color;
  
  // 노이즈 시드 (애니메이션용)
  const seed = animated ? Math.floor(time * 10) : 0;
  
  // 랜덤 픽셀 노이즈
  const pixelCount = Math.floor(width * height * density);
  
  for (let i = 0; i < pixelCount; i++) {
    // 의사 랜덤 (시드 기반)
    const pseudoRandom = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
    const rx = (pseudoRandom % 1) * width;
    const ry = (Math.sin(pseudoRandom) * 0.5 + 0.5) * height;
    
    ctx.fillRect(Math.floor(rx), Math.floor(ry), 1, 1);
  }
  
  ctx.restore();
}
```

---

## 3.5 통합 홀로그램 효과 함수

```typescript
/**
 * 모든 홀로그램 효과를 한번에 적용
 * 이 함수를 매 프레임 마지막에 호출
 */
export function applyHologramEffects(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  scenario: ScenarioId
): void {
  // 시나리오별 효과 강도 조절
  const effectIntensity: Record<ScenarioId, number> = {
    normal: 0.5,    // 기본 홀로그램
    sync: 0.8,      // 접속 중이므로 강하게
    combat: 0.7,    // 전투 중
    infected: 1.5,  // 감염 상태 - 매우 강하게
    trauma: 0.3,    // 절망적 - 약하게
    evolved: 0.6,   // 진화 상태
  };
  
  const intensity = effectIntensity[scenario];
  
  // 1. 스캔라인 (항상 적용)
  drawScanlines(ctx, width, height, time, {
    opacity: 0.03 * intensity,
    scrollSpeed: 0.5,
  });
  
  // 2. 홀로그램 플리커 (INFECTED에서 강하게)
  drawHologramFlicker(ctx, width, height, time, {
    flickerFrequency: scenario === 'infected' ? 0.15 : 0.05,
    flickerIntensity: 0.1 * intensity,
  });
  
  // 3. 노이즈 (INFECTED, SYNC에서만)
  if (scenario === 'infected' || scenario === 'sync') {
    drawHologramNoise(ctx, width, height, time, {
      density: scenario === 'infected' ? 0.005 : 0.002,
    });
  }
}
```

---

## 3.6 사용 위치

```typescript
// scenarioHUDs.ts의 drawScenarioHUD 함수 마지막에 호출

export function drawScenarioHUD(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HUDState
): void {
  // ... 모든 HUD 요소 그리기 ...
  
  // 마지막에 홀로그램 효과 적용 (가장 위 레이어)
  applyHologramEffects(ctx, width, height, state.time, state.scenario);
}
```

---

## 3.7 검증 체크리스트

- [ ] 스캔라인이 2px 간격으로 보이는가?
- [ ] 스캔라인이 위에서 아래로 천천히 이동하는가?
- [ ] 스캔라인이 너무 진하지 않은가? (3~5% 투명도)
- [ ] 가끔씩 전체 화면이 미세하게 깜빡이는가? (플리커)
- [ ] INFECTED 시나리오에서 효과가 더 강한가?
- [ ] TRAUMA 시나리오에서 효과가 약한가?
- [ ] 노이즈 패턴이 시간에 따라 변하는가?

---

## 3.8 시나리오별 효과 강도 요약

| 시나리오 | 스캔라인 | 플리커 | 노이즈 | 색수차 |
|---------|---------|--------|--------|--------|
| NORMAL  | ●○○ | ●○○ | ○○○ | ○○○ |
| SYNC    | ●●○ | ●●○ | ●○○ | ○○○ |
| COMBAT  | ●●○ | ●○○ | ○○○ | ●○○ |
| INFECTED| ●●● | ●●● | ●●● | ●●● |
| TRAUMA  | ●○○ | ○○○ | ○○○ | ○○○ |
| EVOLVED | ●●○ | ●○○ | ○○○ | ○○○ |
