# 모듈 7: TRAUMA 시나리오 상세 구현

## 목표
트라우마 던전의 심전도→차트 모프, 무한대 HP, 절망 메시지를 구현한다.

---

## 7.1 핵심 요소

1. **심전도(ECG) → 주식 차트 모프 애니메이션**
2. **-99.7% 급락 표시**
3. **사신 보스: HP ∞ / ∞ [IMMORTAL]**
4. **"포기하세요. 희망은 없습니다." 메시지**
5. **HOPE: 0% 게이지**
6. **전체적으로 Grayscale/Desaturated**

---

## 7.2 심전도(ECG) 파형 그리기

```typescript
interface ECGOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  time: number;
  color: string;
  beatRate: number;  // 심박수 (BPM)
}

export function drawECGWaveform(
  ctx: CanvasRenderingContext2D,
  options: ECGOptions
): void {
  const { x, y, width, height, time, color, beatRate } = options;
  const centerY = y + height / 2;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(x, centerY);
  
  // 심전도 패턴 (PQRST 파형)
  const beatWidth = width / 4; // 화면에 4박자
  const scrollOffset = (time * beatRate / 60 * beatWidth) % beatWidth;
  
  for (let i = -1; i < 5; i++) {
    const beatX = x + i * beatWidth - scrollOffset;
    
    // P파 (작은 올라감)
    const p1 = beatX + beatWidth * 0.1;
    const p2 = beatX + beatWidth * 0.15;
    const p3 = beatX + beatWidth * 0.2;
    
    // QRS 콤플렉스 (큰 스파이크)
    const q = beatX + beatWidth * 0.35;
    const r = beatX + beatWidth * 0.4;  // 정점
    const s = beatX + beatWidth * 0.45;
    
    // T파 (완만한 올라감)
    const t1 = beatX + beatWidth * 0.6;
    const t2 = beatX + beatWidth * 0.7;
    const t3 = beatX + beatWidth * 0.8;
    
    // 베이스라인
    ctx.lineTo(p1, centerY);
    
    // P파
    ctx.quadraticCurveTo(p2, centerY - height * 0.1, p3, centerY);
    
    // 베이스라인 → Q
    ctx.lineTo(q, centerY);
    ctx.lineTo(q, centerY + height * 0.1);
    
    // R 스파이크 (위로)
    ctx.lineTo(r, centerY - height * 0.4);
    
    // S (아래로)
    ctx.lineTo(s, centerY + height * 0.15);
    ctx.lineTo(s + beatWidth * 0.05, centerY);
    
    // T파
    ctx.quadraticCurveTo(t2, centerY - height * 0.15, t3, centerY);
    
    // 다음 박자까지 베이스라인
    ctx.lineTo(beatX + beatWidth, centerY);
  }
  
  ctx.stroke();
  ctx.restore();
}
```

---

## 7.3 주식 차트 (캔들스틱)

```typescript
interface StockChartOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  time: number;
  crashPoint: number;  // 0 ~ 1 (급락 시점)
}

export function drawStockChart(
  ctx: CanvasRenderingContext2D,
  options: StockChartOptions
): void {
  const { x, y, width, height, time, crashPoint } = options;
  
  ctx.save();
  
  // 차트 데이터 생성 (급락 포함)
  const candleCount = 20;
  const candleWidth = width / candleCount * 0.7;
  const candleGap = width / candleCount * 0.3;
  
  let price = 100;
  const prices: number[] = [];
  
  for (let i = 0; i < candleCount; i++) {
    const progress = i / candleCount;
    
    if (progress > crashPoint) {
      // 급락
      const crashProgress = (progress - crashPoint) / (1 - crashPoint);
      price = 100 * Math.pow(0.003, crashProgress); // -99.7%
    } else {
      // 평범한 변동
      price = 100 + Math.sin(i * 0.5) * 10 + Math.cos(i * 0.3) * 5;
    }
    
    prices.push(price);
  }
  
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice;
  
  // 캔들 그리기
  for (let i = 0; i < candleCount; i++) {
    const candleX = x + i * (candleWidth + candleGap);
    const currentPrice = prices[i];
    const prevPrice = prices[i - 1] ?? currentPrice;
    
    const priceY = y + height - ((currentPrice - minPrice) / priceRange) * height;
    const prevPriceY = y + height - ((prevPrice - minPrice) / priceRange) * height;
    
    const isDown = currentPrice < prevPrice;
    
    // 심지 (wick)
    ctx.strokeStyle = isDown ? '#FF3333' : '#33FF33';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(candleX + candleWidth / 2, Math.min(priceY, prevPriceY) - 5);
    ctx.lineTo(candleX + candleWidth / 2, Math.max(priceY, prevPriceY) + 5);
    ctx.stroke();
    
    // 몸통 (body)
    ctx.fillStyle = isDown ? '#FF3333' : '#33FF33';
    const bodyTop = Math.min(priceY, prevPriceY);
    const bodyHeight = Math.abs(priceY - prevPriceY) || 2;
    ctx.fillRect(candleX, bodyTop, candleWidth, bodyHeight);
  }
  
  // -99.7% 표시
  ctx.fillStyle = '#FF3333';
  ctx.font = 'bold 24px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('-99.7%', x + width - 10, y + height - 20);
  
  ctx.restore();
}
```

---

## 7.4 ECG → Chart 모프 애니메이션

```typescript
interface MorphOptions {
  phase: 'ecg' | 'morphing' | 'chart';
  morphProgress: number;  // 0 ~ 1 (모핑 진행도)
}

export function drawECGToChartMorph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  options: MorphOptions
): void {
  const { phase, morphProgress } = options;
  
  ctx.save();
  
  // 패널 배경
  ctx.fillStyle = 'rgba(15, 15, 15, 0.9)';
  ctx.fillRect(x, y, width, height);
  
  // 패널 테두리
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // 타이틀
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('[ VITAL MONITOR ]', x + 10, y + 20);
  
  const contentX = x + 10;
  const contentY = y + 40;
  const contentWidth = width - 20;
  const contentHeight = height - 60;
  
  if (phase === 'ecg') {
    // 심전도만 표시
    drawECGWaveform(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      color: '#00FF88',
      beatRate: 72,
    });
  } else if (phase === 'morphing') {
    // 모핑 중 (두 파형 블렌딩)
    ctx.globalAlpha = 1 - morphProgress;
    drawECGWaveform(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      color: '#00FF88',
      beatRate: 72,
    });
    
    ctx.globalAlpha = morphProgress;
    drawStockChart(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      crashPoint: 0.6,
    });
    
    ctx.globalAlpha = 1;
  } else {
    // 차트만 표시
    drawStockChart(ctx, {
      x: contentX,
      y: contentY,
      width: contentWidth,
      height: contentHeight,
      time,
      crashPoint: 0.6,
    });
  }
  
  ctx.restore();
}
```

---

## 7.5 사신 보스 패널

```typescript
export function drawReaperBossPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  time: number
): void {
  const width = 250;
  const height = 120;
  
  // Win98 프레임 (회색)
  drawWin98Frame(ctx, {
    x, y, width, height,
    title: '◆ BOSS: REAPER ◆',
    theme: 'grey',
  });
  
  const contentX = x + 15;
  const contentY = y + 45;
  
  ctx.save();
  
  // HP: ∞ / ∞
  ctx.fillStyle = '#CC3333';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.textAlign = 'center';
  
  // 무한대 기호 회전 애니메이션
  ctx.save();
  ctx.translate(x + width / 2, contentY + 10);
  ctx.rotate(Math.sin(time * 0.5) * 0.1); // 살짝 흔들림
  ctx.fillText('HP: ∞ / ∞', 0, 0);
  ctx.restore();
  
  // [IMMORTAL] 태그
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText('[IMMORTAL]', x + width / 2, contentY + 35);
  
  // 절망 메시지
  ctx.fillStyle = '#999999';
  ctx.font = 'italic 11px "Courier New", monospace';
  ctx.fillText('"포기하세요. 희망은 없습니다."', x + width / 2, contentY + 55);
  
  // 무한대 기호 반복 (장식)
  ctx.fillStyle = '#44444433';
  ctx.font = '48px serif';
  ctx.fillText('∞', x + width / 2, contentY + 80);
  
  ctx.restore();
}
```

---

## 7.6 완전한 TRAUMA 시나리오 드로잉

```typescript
export function drawTraumaScenario(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HUDState
): void {
  // 모프 페이즈 계산 (시간 기반)
  const cycleTime = state.time % 10;
  let morphPhase: 'ecg' | 'morphing' | 'chart';
  let morphProgress = 0;
  
  if (cycleTime < 3) {
    morphPhase = 'ecg';
  } else if (cycleTime < 5) {
    morphPhase = 'morphing';
    morphProgress = (cycleTime - 3) / 2;
  } else {
    morphPhase = 'chart';
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 1. Grayscale 오버레이
  // ═══════════════════════════════════════════════════════════════
  // (참고: Canvas에서 완전한 grayscale은 어렵지만 어두운 오버레이로 표현)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(0, 0, width, height);
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 배경 그리드 (회색)
  // ═══════════════════════════════════════════════════════════════
  drawBackgroundGridLines(ctx, width, height, {
    lineColor: 'rgba(102, 102, 102, 0.2)',
    distance: 30,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // 3. TRAUMA ZONE 배너
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = 'rgba(60, 60, 60, 0.8)';
  ctx.fillRect(width / 2 - 200, 80, 400, 30);
  
  ctx.fillStyle = '#888888';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[ TRAUMA ZONE: HOSPITAL ROOM ]', width / 2, 100);
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 심전도 → 차트 모프 패널
  // ═══════════════════════════════════════════════════════════════
  drawECGToChartMorph(
    ctx,
    width / 2 - 200,
    130,
    400,
    150,
    state.time,
    { phase: morphPhase, morphProgress }
  );
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 사신 보스 패널
  // ═══════════════════════════════════════════════════════════════
  drawReaperBossPanel(ctx, width / 2 - 125, 300, state.time);
  
  // ═══════════════════════════════════════════════════════════════
  // 6. 하단 HOPE 게이지
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = '#666666';
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('HOPE: 0% | ESCAPE: NONE', 30, height - 50);
  
  // HOPE 바 (비어있음)
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, height - 40, 150, 16);
  
  // 0% 텍스트
  ctx.fillStyle = '#444444';
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EMPTY', 105, height - 30);
  
  // ═══════════════════════════════════════════════════════════════
  // 7. 절망적 크로스헤어 (희미하게)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = 'rgba(102, 102, 102, 0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(width / 2 - 30, height / 2);
  ctx.lineTo(width / 2 + 30, height / 2);
  ctx.moveTo(width / 2, height / 2 - 30);
  ctx.lineTo(width / 2, height / 2 + 30);
  ctx.stroke();
  ctx.setLineDash([]);
}
```

---

## 7.7 검증 체크리스트

- [ ] 심전도(ECG)가 제대로 된 PQRST 파형인가?
- [ ] 심전도가 시간에 따라 스크롤되는가?
- [ ] 3초 후 주식 차트로 모핑이 시작되는가?
- [ ] 모핑 중 두 그래픽이 블렌딩되는가?
- [ ] 차트에 캔들스틱이 표시되는가?
- [ ] -99.7% 급락이 빨간색으로 표시되는가?
- [ ] 사신 보스의 HP가 ∞ / ∞ 인가?
- [ ] ∞ 기호가 살짝 회전(흔들림)하는가?
- [ ] "포기하세요. 희망은 없습니다." 메시지가 있는가?
- [ ] HOPE 게이지가 0%이고 비어있는가?
- [ ] 전체적으로 회색/저채도 분위기인가?

---

## 7.8 현재 문제점 (스크린샷 Image 3)

```
현재 상태:
- 단순 사인파로 심전도 표현 (PQRST 없음)
- 주식 차트 없음
- 모프 애니메이션 없음
- ∞ 회전/흔들림 없음

목표 상태:
- 정확한 PQRST 심전도 파형
- 캔들스틱 주식 차트
- ECG → Chart 부드러운 모핑
- 살짝 흔들리는 ∞ 기호
```
