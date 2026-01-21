# 모듈 4: 시나리오 전환 트랜지션

## 목표
시나리오 간 전환 시 부드러운 애니메이션 효과를 구현한다.

---

## 4.1 트랜지션 상태 관리

```typescript
// constants.ts에 추가

export interface TransitionState {
  isTransitioning: boolean;
  fromScenario: ScenarioId | null;
  toScenario: ScenarioId | null;
  progress: number;           // 0 ~ 1
  startTime: number;
  duration: number;           // ms
  type: TransitionType;
}

export type TransitionType = 
  | 'fade'           // 단순 페이드
  | 'glitch'         // 글리치 전환
  | 'pixelate'       // 픽셀화 전환
  | 'shatter'        // 깨지는 효과
  | 'warp'           // 워프 효과
  | 'flash';         // 플래시

// 시나리오별 전환 타입 매핑
export const TRANSITION_TYPES: Record<string, TransitionType> = {
  // FROM -> TO 형식의 키
  'normal->sync': 'pixelate',
  'normal->combat': 'flash',
  'sync->normal': 'fade',
  'sync->combat': 'glitch',
  'combat->normal': 'fade',
  'combat->infected': 'glitch',
  'infected->trauma': 'shatter',
  'trauma->evolved': 'flash',
  'any->evolved': 'flash',      // 진화는 항상 플래시
  'default': 'fade',
};

// 전환 지속 시간 (ms)
export const TRANSITION_DURATION: Record<TransitionType, number> = {
  fade: 500,
  glitch: 800,
  pixelate: 600,
  shatter: 1000,
  warp: 700,
  flash: 300,
};
```

---

## 4.2 트랜지션 이펙트 구현

### 4.2.1 페이드 트랜지션

```typescript
// transitionEffects.ts

export function drawFadeTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  fromColor: string,
  toColor: string
): void {
  ctx.save();
  
  // 전반부: 검은색으로 페이드 아웃
  if (progress < 0.5) {
    const fadeOut = progress * 2; // 0 -> 1
    ctx.fillStyle = `rgba(0, 0, 0, ${fadeOut})`;
    ctx.fillRect(0, 0, width, height);
  } 
  // 후반부: 검은색에서 페이드 인
  else {
    const fadeIn = (progress - 0.5) * 2; // 0 -> 1
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeIn})`;
    ctx.fillRect(0, 0, width, height);
  }
  
  ctx.restore();
}
```

### 4.2.2 글리치 트랜지션

```typescript
export function drawGlitchTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  time: number
): void {
  ctx.save();
  
  // 글리치 강도 (중간에 가장 강함)
  const intensity = Math.sin(progress * Math.PI);
  
  // 수평 글리치 슬라이스
  const sliceCount = Math.floor(10 + intensity * 20);
  const sliceHeight = height / sliceCount;
  
  for (let i = 0; i < sliceCount; i++) {
    const y = i * sliceHeight;
    
    // 랜덤 오프셋 (시드 기반)
    const seed = Math.sin(i * 12.9898 + time * 100) * 43758.5453;
    const offset = (seed % 1 - 0.5) * width * 0.1 * intensity;
    
    // 슬라이스 이동 효과 (캔버스 자체를 조작할 수 없으므로 시각적 표현)
    if (Math.abs(offset) > 5) {
      // 글리치 바 그리기
      ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * intensity})`;
      ctx.fillRect(offset > 0 ? 0 : width + offset, y, Math.abs(offset), sliceHeight);
      
      ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * intensity})`;
      ctx.fillRect(offset > 0 ? width - offset : 0, y, Math.abs(offset), sliceHeight);
    }
  }
  
  // 전체 노이즈 오버레이
  ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * intensity})`;
  const noiseCount = Math.floor(1000 * intensity);
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillRect(x, y, 2, 2);
  }
  
  // RGB 분리
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = `rgba(255, 0, 0, ${0.05 * intensity})`;
  ctx.fillRect(-5 * intensity, 0, width, height);
  ctx.fillStyle = `rgba(0, 0, 255, ${0.05 * intensity})`;
  ctx.fillRect(5 * intensity, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
  
  ctx.restore();
}
```

### 4.2.3 픽셀화 트랜지션

```typescript
export function drawPixelateTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number
): void {
  ctx.save();
  
  // 픽셀 크기 (중간에 가장 크게)
  const maxPixelSize = 32;
  const pixelSize = Math.max(1, Math.floor(
    maxPixelSize * Math.sin(progress * Math.PI)
  ));
  
  if (pixelSize > 1) {
    // 그리드 오버레이로 픽셀화 효과 시뮬레이션
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += pixelSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += pixelSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }
  
  // 전환 중 어두워지는 효과
  ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * Math.sin(progress * Math.PI)})`;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}
```

### 4.2.4 플래시 트랜지션 (EVOLVED용)

```typescript
export function drawFlashTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  color: string = '#FFFFFF'
): void {
  ctx.save();
  
  // 플래시 강도 (시작에 가장 강하고 점점 사라짐)
  const flashIntensity = progress < 0.3 
    ? 1 
    : Math.max(0, 1 - (progress - 0.3) / 0.7);
  
  ctx.fillStyle = color;
  ctx.globalAlpha = flashIntensity;
  ctx.fillRect(0, 0, width, height);
  
  ctx.restore();
}
```

### 4.2.5 깨지는 효과 (Shatter)

```typescript
export function drawShatterTransition(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  time: number
): void {
  ctx.save();
  
  // 깨지는 조각들
  const shardCount = 20;
  const gravity = 500;
  
  for (let i = 0; i < shardCount; i++) {
    // 조각별 시작 위치 및 속도 (시드 기반)
    const seed = i * 123.456;
    const startX = (Math.sin(seed) * 0.5 + 0.5) * width;
    const startY = (Math.cos(seed * 2) * 0.5 + 0.5) * height;
    const velocityX = (Math.sin(seed * 3) - 0.5) * 200;
    const velocityY = -100 - Math.random() * 200;
    
    // 현재 위치 계산
    const t = progress;
    const currentX = startX + velocityX * t;
    const currentY = startY + velocityY * t + 0.5 * gravity * t * t;
    
    // 조각 크기 및 회전
    const size = 20 + Math.random() * 40;
    const rotation = t * (Math.sin(seed * 4) * 5);
    
    // 조각 그리기
    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.max(0, 1 - progress);
    
    // 삼각형 조각
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    
    ctx.fillStyle = `rgba(100, 100, 100, 0.5)`;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }
  
  // 크랙 라인
  if (progress < 0.3) {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1 - progress / 0.3;
    
    // 중앙에서 방사형 크랙
    const cx = width / 2;
    const cy = height / 2;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      const length = 100 + progress * 300;
      
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(angle) * length,
        cy + Math.sin(angle) * length
      );
      ctx.stroke();
    }
  }
  
  ctx.restore();
}
```

---

## 4.3 트랜지션 컨트롤러

```typescript
// transitionController.ts

export class TransitionController {
  private state: TransitionState = {
    isTransitioning: false,
    fromScenario: null,
    toScenario: null,
    progress: 0,
    startTime: 0,
    duration: 500,
    type: 'fade',
  };
  
  startTransition(
    from: ScenarioId,
    to: ScenarioId,
    currentTime: number
  ): void {
    // 전환 타입 결정
    const key = `${from}->${to}`;
    const type = TRANSITION_TYPES[key] 
      || (to === 'evolved' ? TRANSITION_TYPES['any->evolved'] : null)
      || TRANSITION_TYPES['default'];
    
    this.state = {
      isTransitioning: true,
      fromScenario: from,
      toScenario: to,
      progress: 0,
      startTime: currentTime,
      duration: TRANSITION_DURATION[type],
      type,
    };
  }
  
  update(currentTime: number): boolean {
    if (!this.state.isTransitioning) return false;
    
    const elapsed = (currentTime - this.state.startTime) * 1000;
    this.state.progress = Math.min(1, elapsed / this.state.duration);
    
    if (this.state.progress >= 1) {
      this.state.isTransitioning = false;
      return true; // 전환 완료
    }
    
    return false;
  }
  
  draw(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
    if (!this.state.isTransitioning) return;
    
    switch (this.state.type) {
      case 'fade':
        drawFadeTransition(ctx, width, height, this.state.progress, '', '');
        break;
      case 'glitch':
        drawGlitchTransition(ctx, width, height, this.state.progress, time);
        break;
      case 'pixelate':
        drawPixelateTransition(ctx, width, height, this.state.progress);
        break;
      case 'shatter':
        drawShatterTransition(ctx, width, height, this.state.progress, time);
        break;
      case 'flash':
        const flashColor = this.state.toScenario === 'evolved' ? '#FFD700' : '#FFFFFF';
        drawFlashTransition(ctx, width, height, this.state.progress, flashColor);
        break;
    }
  }
  
  get isActive(): boolean {
    return this.state.isTransitioning;
  }
  
  get shouldSwitchNow(): boolean {
    // 50% 지점에서 실제 시나리오 전환
    return this.state.progress >= 0.5;
  }
}
```

---

## 4.4 사용 방법

```typescript
// DreamPersonaRemasterHUD.tsx

const transitionController = useRef(new TransitionController());

// 시나리오 전환 시
const changeScenario = (newScenario: ScenarioId) => {
  if (state.scenario === newScenario) return;
  
  transitionController.current.startTransition(
    state.scenario,
    newScenario,
    state.time
  );
};

// 렌더 루프에서
useEffect(() => {
  const render = () => {
    // ... HUD 그리기 ...
    
    // 트랜지션 업데이트 및 그리기
    transitionController.current.update(state.time);
    
    // 50% 지점에서 실제 시나리오 전환
    if (transitionController.current.shouldSwitchNow) {
      setState(prev => ({ ...prev, scenario: transitionController.current.toScenario }));
    }
    
    // 트랜지션 효과 그리기 (가장 위 레이어)
    transitionController.current.draw(ctx, width, height, state.time);
  };
}, []);
```

---

## 4.5 검증 체크리스트

- [ ] 시나리오 전환 시 효과가 재생되는가?
- [ ] NORMAL→SYNC: 픽셀화 효과가 나타나는가?
- [ ] COMBAT→INFECTED: 글리치 효과가 나타나는가?
- [ ] ANY→EVOLVED: 골든 플래시가 나타나는가?
- [ ] 전환 중간(50%)에 실제 시나리오가 바뀌는가?
- [ ] 전환이 너무 빠르거나 느리지 않은가? (적절한 duration)
- [ ] 글리치 전환 시 RGB 분리가 보이는가?
