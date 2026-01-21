# 모듈 8: EVOLVED 시나리오 상세 구현

## 목표
최종 진화 상태의 캐논 조준선, 황금 파티클, 8bit+HD 융합을 구현한다.

---

## 8.1 핵심 요소

1. **12각형 캐논 조준선** (회전 + 차징)
2. **캐논 차징 시스템** (마우스 홀드 → 0%→100%)
3. **황금 파티클** (반딧불 스타일 상승)
4. **8bit 픽셀 프레임 + HD 골드 텍스처**
5. **"우리는 무엇이든 가능하다" 메시지**
6. **MEMORY SYNC: 100%**
7. **Golden Flash 트랜지션**

---

## 8.2 12각형 캐논 조준선

```typescript
interface CannonReticleOptions {
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  segments: number;          // 12각형
  rotation: number;          // 회전 각도
  chargeLevel: number;       // 0 ~ 1 (차징 레벨)
  color: string;
  glowColor: string;
}

export function drawCannonReticle(
  ctx: CanvasRenderingContext2D,
  options: CannonReticleOptions
): void {
  const { cx, cy, outerRadius, innerRadius, segments, rotation, chargeLevel, color, glowColor } = options;
  
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 12각형 (세그먼트)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const nextAngle = ((i + 1) / segments) * Math.PI * 2;
    
    // 세그먼트 진행률 (차징에 따라 밝아짐)
    const segmentProgress = i / segments;
    const isActive = segmentProgress <= chargeLevel;
    
    ctx.strokeStyle = isActive ? glowColor : color;
    ctx.lineWidth = isActive ? 3 : 2;
    
    const x1 = Math.cos(angle) * outerRadius;
    const y1 = Math.sin(angle) * outerRadius;
    const x2 = Math.cos(nextAngle) * outerRadius;
    const y2 = Math.sin(nextAngle) * outerRadius;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // 꼭지점 마커
    if (isActive) {
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 링 (차징 표시)
  // ═══════════════════════════════════════════════════════════════
  
  // 배경 링
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // 차징 링
  if (chargeLevel > 0) {
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, innerRadius, -Math.PI / 2, -Math.PI / 2 + chargeLevel * Math.PI * 2);
    ctx.stroke();
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 십자 조준선
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  
  // 수평선
  ctx.beginPath();
  ctx.moveTo(-innerRadius + 15, 0);
  ctx.lineTo(-10, 0);
  ctx.moveTo(10, 0);
  ctx.lineTo(innerRadius - 15, 0);
  ctx.stroke();
  
  // 수직선
  ctx.beginPath();
  ctx.moveTo(0, -innerRadius + 15);
  ctx.lineTo(0, -10);
  ctx.moveTo(0, 10);
  ctx.lineTo(0, innerRadius - 15);
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 중앙 도트
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = glowColor;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 글로우 효과
  // ═══════════════════════════════════════════════════════════════
  if (chargeLevel > 0.5) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20 * chargeLevel;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  
  ctx.restore();
}
```

---

## 8.3 황금 파티클 (반딧불 스타일)

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  twinklePhase: number;
}

class GoldenParticleSystem {
  particles: Particle[] = [];
  width: number;
  height: number;
  
  constructor(width: number, height: number, count: number) {
    this.width = width;
    this.height = height;
    
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }
  
  createParticle(): Particle {
    return {
      x: Math.random() * this.width,
      y: this.height + Math.random() * 100,  // 하단에서 시작
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 1.5,        // 위로 상승
      size: 2 + Math.random() * 3,
      alpha: 0.5 + Math.random() * 0.5,
      twinklePhase: Math.random() * Math.PI * 2,
    };
  }
  
  update(deltaTime: number): void {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.twinklePhase += deltaTime * 5;
      
      // 화면 벗어나면 재생성
      if (p.y < -20) {
        Object.assign(p, this.createParticle());
      }
    });
  }
  
  draw(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.save();
    
    this.particles.forEach(p => {
      // 반짝임 효과
      const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      const alpha = p.alpha * twinkle;
      
      // 그라데이션 (중앙이 밝음)
      const gradient = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, p.size * 2
      );
      gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(255, 200, 0, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // 중앙 코어 (더 밝게)
      ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
}

// 전역 인스턴스 (한 번만 생성)
let goldenParticles: GoldenParticleSystem | null = null;

export function drawGoldenParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  count: number = 50
): void {
  if (!goldenParticles || goldenParticles.width !== width) {
    goldenParticles = new GoldenParticleSystem(width, height, count);
  }
  
  goldenParticles.update(0.016); // ~60fps
  goldenParticles.draw(ctx, time);
}
```

---

## 8.4 8bit + HD 융합 프레임

```typescript
export function drawPixelatedGoldFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number
): void {
  const pixelSize = 4;
  
  ctx.save();
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 8bit 픽셀 테두리
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = '#FFD700';
  
  // 상단
  for (let px = x; px < x + width; px += pixelSize) {
    ctx.fillRect(px, y, pixelSize, pixelSize);
    ctx.fillRect(px, y + pixelSize, pixelSize, pixelSize);
  }
  
  // 하단
  for (let px = x; px < x + width; px += pixelSize) {
    ctx.fillRect(px, y + height - pixelSize, pixelSize, pixelSize);
    ctx.fillRect(px, y + height - pixelSize * 2, pixelSize, pixelSize);
  }
  
  // 좌측
  for (let py = y; py < y + height; py += pixelSize) {
    ctx.fillRect(x, py, pixelSize, pixelSize);
    ctx.fillRect(x + pixelSize, py, pixelSize, pixelSize);
  }
  
  // 우측
  for (let py = y; py < y + height; py += pixelSize) {
    ctx.fillRect(x + width - pixelSize, py, pixelSize, pixelSize);
    ctx.fillRect(x + width - pixelSize * 2, py, pixelSize, pixelSize);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 2. HD 골드 그라데이션 배경
  // ═══════════════════════════════════════════════════════════════
  const innerX = x + pixelSize * 2;
  const innerY = y + pixelSize * 2;
  const innerWidth = width - pixelSize * 4;
  const innerHeight = height - pixelSize * 4;
  
  const bgGradient = ctx.createLinearGradient(
    innerX, innerY,
    innerX, innerY + innerHeight
  );
  bgGradient.addColorStop(0, 'rgba(50, 40, 10, 0.9)');
  bgGradient.addColorStop(0.5, 'rgba(30, 25, 5, 0.95)');
  bgGradient.addColorStop(1, 'rgba(50, 40, 10, 0.9)');
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
  
  // ═══════════════════════════════════════════════════════════════
  // 3. HD 골드 테두리 (부드러운 선)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerX, innerY, innerWidth, innerHeight);
  
  // 코너 하이라이트
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  const cornerSize = 15;
  
  // 좌상단
  ctx.beginPath();
  ctx.moveTo(innerX, innerY + cornerSize);
  ctx.lineTo(innerX, innerY);
  ctx.lineTo(innerX + cornerSize, innerY);
  ctx.stroke();
  
  // 우상단
  ctx.beginPath();
  ctx.moveTo(innerX + innerWidth - cornerSize, innerY);
  ctx.lineTo(innerX + innerWidth, innerY);
  ctx.lineTo(innerX + innerWidth, innerY + cornerSize);
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 애니메이션 반짝임
  // ═══════════════════════════════════════════════════════════════
  const shimmerX = (time * 100) % (width + 100) - 50;
  
  const shimmerGradient = ctx.createLinearGradient(
    x + shimmerX - 30, y,
    x + shimmerX + 30, y
  );
  shimmerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  shimmerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  shimmerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = shimmerGradient;
  ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
  
  ctx.restore();
}
```

---

## 8.5 완전한 EVOLVED 시나리오 드로잉

```typescript
export function drawEvolvedScenario(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HUDState
): void {
  const mainColor = '#FFD700';
  const glowColor = '#FFFFFF';
  const cannonCharge = state.cannonCharge ?? 0;
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 황금 파티클 배경 (반딧불)
  // ═══════════════════════════════════════════════════════════════
  drawGoldenParticles(ctx, width, height, state.time, 60);
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 상단: MEMORY SYNC 100% (픽셀+HD 프레임)
  // ═══════════════════════════════════════════════════════════════
  drawPixelatedGoldFrame(ctx, width / 2 - 150, 60, 300, 50, state.time);
  
  ctx.fillStyle = mainColor;
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ MEMORY SYNC: 100% ★', width / 2, 92);
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 명대사
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = glowColor;
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center';
  
  // 글로우 효과
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 20;
  ctx.fillText('"우리는 무엇이든 가능하다"', width / 2, 135);
  ctx.shadowBlur = 0;
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 12각형 캐논 조준선
  // ═══════════════════════════════════════════════════════════════
  drawCannonReticle(ctx, {
    cx: width / 2,
    cy: height / 2 + 30,
    outerRadius: 100,
    innerRadius: 60,
    segments: 12,
    rotation: state.time * 0.3, // 천천히 회전
    chargeLevel: cannonCharge,
    color: mainColor,
    glowColor: glowColor,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 차징 상태 텍스트
  // ═══════════════════════════════════════════════════════════════
  if (cannonCharge > 0 && cannonCharge < 1) {
    ctx.fillStyle = mainColor;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `CHARGING: ${Math.floor(cannonCharge * 100)}%`,
      width / 2,
      height / 2 + 140
    );
  } else if (cannonCharge >= 1) {
    ctx.fillStyle = glowColor;
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[CANNON READY]', width / 2, height / 2 + 140);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 6. 하단 상태
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = mainColor;
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('LIMIT RELEASED | EVOLUTION: COMPLETE', 30, height - 50);
  
  // 진행률 바 (가득 참 + 빛남)
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, height - 40, 200, 16);
  
  // 가득 찬 바
  const barGradient = ctx.createLinearGradient(30, 0, 230, 0);
  barGradient.addColorStop(0, mainColor);
  barGradient.addColorStop(0.5, glowColor);
  barGradient.addColorStop(1, mainColor);
  ctx.fillStyle = barGradient;
  ctx.fillRect(32, height - 38, 196, 12);
  
  // MAX 텍스트
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MAX', 130, height - 30);
}
```

---

## 8.6 캐논 차징 인터랙션

```typescript
// DreamPersonaRemasterHUD.tsx에서

// 마우스 홀드 시 차징
const handleMouseDown = () => {
  if (state.scenario === 'evolved') {
    // 차징 시작
    setChargingStartTime(Date.now());
  }
};

const handleMouseUp = () => {
  if (state.scenario === 'evolved' && state.cannonCharge >= 1) {
    // 발사!
    triggerCannonFire();
  }
  // 차징 리셋
  setState(prev => ({ ...prev, cannonCharge: 0 }));
  setChargingStartTime(null);
};

// 차징 업데이트 (매 프레임)
useEffect(() => {
  if (chargingStartTime && state.scenario === 'evolved') {
    const elapsed = Date.now() - chargingStartTime;
    const charge = Math.min(1, elapsed / 2000); // 2초에 100%
    setState(prev => ({ ...prev, cannonCharge: charge }));
  }
}, [time, chargingStartTime]);
```

---

## 8.7 검증 체크리스트

- [ ] 12각형 조준선이 천천히 회전하는가?
- [ ] 마우스 홀드 시 세그먼트가 하나씩 밝아지는가?
- [ ] 차징 100% 시 전체 조준선이 빛나는가?
- [ ] 황금 파티클이 아래에서 위로 상승하는가?
- [ ] 파티클이 반짝이는가? (twinkle)
- [ ] 8bit 픽셀 테두리가 보이는가?
- [ ] HD 골드 그라데이션 배경이 있는가?
- [ ] "우리는 무엇이든 가능하다" 메시지에 글로우가 있는가?
- [ ] 프레임에 반짝임(shimmer) 애니메이션이 있는가?
