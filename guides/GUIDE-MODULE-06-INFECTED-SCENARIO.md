# 모듈 6: INFECTED 시나리오 상세 구현

## 목표
감염 상태의 글리치, 녹아내림, 색수차 효과를 정확하게 구현한다.

---

## 6.1 핵심 효과 목록

1. **글리치 텍스트**: 문자가 깨지고 대체됨 (█, ▓, ?, #)
2. **UI 녹아내림**: 패널이 아래로 흐르는 효과
3. **색수차 (Chromatic Aberration)**: RGB 채널 분리
4. **픽셀 누락**: 랜덤하게 픽셀이 사라짐
5. **색상 변조**: 보라색 + 형광 녹색

---

## 6.2 글리치 텍스트 구현

```typescript
// 감염 레벨에 따른 글리치 문자셋
const GLITCH_CHARS = {
  light: ['▓', '▒', '░'],
  medium: ['█', '▓', '▒', '░', '?', '#'],
  heavy: ['█', '▓', '▒', '░', '?', '#', '@', '!', '$', '%', '^', '&', '*', 'E', 'R', 'O'],
};

interface GlitchTextOptions {
  corruptionLevel: number;  // 0 ~ 1 (감염도)
  time: number;
  scrambleRate: number;     // 글리치 빈도 (0 ~ 1)
}

export function getGlitchedText(
  originalText: string,
  options: GlitchTextOptions
): string {
  const { corruptionLevel, time, scrambleRate } = options;
  
  // 글리치 문자셋 선택
  const charSet = corruptionLevel > 0.7 
    ? GLITCH_CHARS.heavy 
    : corruptionLevel > 0.4 
      ? GLITCH_CHARS.medium 
      : GLITCH_CHARS.light;
  
  return originalText.split('').map((char, index) => {
    // 공백은 유지
    if (char === ' ') return ' ';
    
    // 시간에 따른 글리치 확률
    const noise = Math.sin(index * 12.9898 + time * 20) * 0.5 + 0.5;
    const shouldGlitch = noise < corruptionLevel * scrambleRate;
    
    if (shouldGlitch) {
      // 추가 노이즈로 문자 선택
      const charNoise = Math.sin(index * 78.233 + time * 50);
      const charIndex = Math.floor(Math.abs(charNoise) * charSet.length) % charSet.length;
      return charSet[charIndex];
    }
    
    return char;
  }).join('');
}

// 사용 예시
// STATUS: UNDEAD → S█▓US▒ UND░AD
```

---

## 6.3 UI 녹아내림 효과 (Drip/Melt)

```typescript
interface MeltEffectOptions {
  meltIntensity: number;    // 0 ~ 1
  time: number;
  dripsPerWidth: number;    // 폭당 물방울 수
}

export function drawMeltEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  options: MeltEffectOptions
): void {
  const { meltIntensity, time, dripsPerWidth } = options;
  
  ctx.save();
  
  // 하단에 녹아내리는 드립 효과
  const dripCount = Math.floor(width / dripsPerWidth);
  
  for (let i = 0; i < dripCount; i++) {
    // 드립 위치 (시드 기반 랜덤)
    const seed = i * 123.456;
    const dripX = x + (i / dripCount) * width + Math.sin(seed) * 10;
    
    // 드립 길이 (시간에 따라 변화)
    const baseDripLength = 20 + Math.sin(seed * 2) * 30;
    const animatedLength = baseDripLength * meltIntensity * 
                           (0.5 + 0.5 * Math.sin(time * 2 + seed));
    
    // 드립 그리기
    const gradient = ctx.createLinearGradient(
      dripX, y + height,
      dripX, y + height + animatedLength
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    
    // 물방울 형태
    ctx.beginPath();
    ctx.moveTo(dripX - 3, y + height);
    ctx.quadraticCurveTo(
      dripX, y + height + animatedLength,
      dripX + 3, y + height
    );
    ctx.fill();
  }
  
  ctx.restore();
}
```

---

## 6.4 색수차 효과 (패널용)

```typescript
export function drawChromaticPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    aberrationOffset: number;  // RGB 분리 거리 (px)
    time: number;
    flickerRate: number;
  }
): void {
  const { aberrationOffset, time, flickerRate } = options;
  
  // 시간에 따라 오프셋 변화
  const dynamicOffset = aberrationOffset * (0.5 + 0.5 * Math.sin(time * 5));
  
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // 빨간 채널 (왼쪽으로)
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - dynamicOffset, y - dynamicOffset, width, height);
  
  // 파란 채널 (오른쪽으로)
  ctx.strokeStyle = 'rgba(0, 100, 255, 0.4)';
  ctx.strokeRect(x + dynamicOffset, y + dynamicOffset, width, height);
  
  // 녹색 채널 (제자리)
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
  ctx.strokeRect(x, y, width, height);
  
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}
```

---

## 6.5 픽셀 누락 효과

```typescript
export function drawPixelDropout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: {
    dropoutRate: number;  // 0 ~ 1 (누락률)
    pixelSize: number;
    time: number;
  }
): void {
  const { dropoutRate, pixelSize, time } = options;
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 1)'; // 검은색으로 마스킹
  
  const cols = Math.ceil(width / pixelSize);
  const rows = Math.ceil(height / pixelSize);
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // 시드 기반 랜덤 (시간에 따라 변화)
      const seed = row * 1000 + col + Math.floor(time * 3);
      const noise = Math.sin(seed * 12.9898) * 43758.5453 % 1;
      
      if (noise < dropoutRate) {
        ctx.fillRect(
          col * pixelSize,
          row * pixelSize,
          pixelSize,
          pixelSize
        );
      }
    }
  }
  
  ctx.restore();
}
```

---

## 6.6 감염 오버레이

```typescript
export function drawInfectedOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  infectionLevel: number
): void {
  ctx.save();
  
  // 보라색 비네트
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, 'rgba(153, 0, 255, 0)');
  gradient.addColorStop(0.5, `rgba(153, 0, 255, ${0.1 * infectionLevel})`);
  gradient.addColorStop(1, `rgba(153, 0, 255, ${0.4 * infectionLevel})`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 수평 글리치 라인 (랜덤 위치)
  const lineCount = Math.floor(10 * infectionLevel);
  ctx.fillStyle = `rgba(0, 255, 100, ${0.3 * infectionLevel})`;
  
  for (let i = 0; i < lineCount; i++) {
    const seed = i * 123 + Math.floor(time * 10);
    const y = (Math.sin(seed) * 0.5 + 0.5) * height;
    const lineHeight = 1 + Math.random() * 3;
    
    // 가끔씩만 표시 (깜빡임)
    if (Math.sin(seed + time * 20) > 0.7) {
      ctx.fillRect(0, y, width, lineHeight);
    }
  }
  
  ctx.restore();
}
```

---

## 6.7 완전한 INFECTED 시나리오 드로잉

```typescript
export function drawInfectedScenario(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HUDState
): void {
  const mainColor = '#9900FF';
  const accentColor = '#00FF66';
  const infectionLevel = (state.infectionLevel ?? 78) / 100;
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 감염 오버레이 (배경)
  // ═══════════════════════════════════════════════════════════════
  drawInfectedOverlay(ctx, width, height, state.time, infectionLevel);
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 상단 배너: 글리치 텍스트
  // ═══════════════════════════════════════════════════════════════
  const bannerText = getGlitchedText('SYSTEM CORRUPTED', {
    corruptionLevel: infectionLevel,
    time: state.time,
    scrambleRate: 0.3,
  });
  
  // 배너 배경 (색수차 적용)
  const bannerY = 100;
  drawChromaticPanel(ctx, width / 2 - 150, bannerY - 20, 300, 40, {
    aberrationOffset: 3 * infectionLevel,
    time: state.time,
    flickerRate: 0.1,
  });
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(width / 2 - 150, bannerY - 20, 300, 40);
  
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(bannerText, width / 2, bannerY);
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 좌측 패널: VIRAL LOAD
  // ═══════════════════════════════════════════════════════════════
  const panelX = 30;
  const panelY = 150;
  const panelWidth = 200;
  const panelHeight = 130;
  
  // 손상된 Win98 프레임
  drawWin98Frame(ctx, {
    x: panelX,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    title: getGlitchedText('VIRAL LOAD', {
      corruptionLevel: infectionLevel * 0.5,
      time: state.time,
      scrambleRate: 0.2,
    }),
    theme: 'purple',
  });
  
  // 녹아내림 효과
  drawMeltEffect(ctx, panelX, panelY, panelWidth, panelHeight, mainColor, {
    meltIntensity: infectionLevel,
    time: state.time,
    dripsPerWidth: 30,
  });
  
  // 패널 내용
  const contentX = panelX + 15;
  const contentY = panelY + 45;
  
  ctx.fillStyle = mainColor;
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'left';
  
  ctx.fillText(
    getGlitchedText('STATUS: UNDEAD', {
      corruptionLevel: infectionLevel,
      time: state.time,
      scrambleRate: 0.4,
    }),
    contentX, contentY
  );
  
  // VIRAL 진행률 바
  ctx.fillText('VIRAL:', contentX, contentY + 30);
  ctx.fillStyle = `${mainColor}33`;
  ctx.fillRect(contentX, contentY + 40, 150, 16);
  ctx.fillStyle = mainColor;
  ctx.fillRect(contentX, contentY + 40, 150 * infectionLevel, 16);
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.floor(infectionLevel * 100)}/100`, contentX + 145, contentY + 52);
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 하단 상태 표시 (글리치)
  // ═══════════════════════════════════════════════════════════════
  const statusText = getGlitchedText('HP ???/??? | STATUS: UNSTABLE', {
    corruptionLevel: infectionLevel,
    time: state.time,
    scrambleRate: 0.5,
  });
  
  ctx.fillStyle = mainColor;
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(statusText, 30, height - 50);
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 글리치 크로스헤어
  // ═══════════════════════════════════════════════════════════════
  drawGlitchedCrosshair(ctx, width / 2, height / 2, state.time, infectionLevel);
  
  // ═══════════════════════════════════════════════════════════════
  // 6. 픽셀 누락 (마지막)
  // ═══════════════════════════════════════════════════════════════
  if (infectionLevel > 0.5) {
    drawPixelDropout(ctx, width, height, {
      dropoutRate: (infectionLevel - 0.5) * 0.02, // 최대 1%
      pixelSize: 4,
      time: state.time,
    });
  }
}

// 글리치 크로스헤어
function drawGlitchedCrosshair(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  time: number,
  glitchIntensity: number
): void {
  ctx.save();
  
  // 랜덤 오프셋 (글리치)
  const offsetX = (Math.sin(time * 30) * glitchIntensity) * 10;
  const offsetY = (Math.cos(time * 25) * glitchIntensity) * 5;
  
  ctx.strokeStyle = '#9900FF';
  ctx.lineWidth = 2;
  
  // 떨리는 십자선
  ctx.beginPath();
  ctx.moveTo(cx + offsetX - 30, cy + offsetY);
  ctx.lineTo(cx + offsetX - 10, cy + offsetY);
  ctx.moveTo(cx + offsetX + 10, cy + offsetY);
  ctx.lineTo(cx + offsetX + 30, cy + offsetY);
  ctx.moveTo(cx + offsetX, cy + offsetY - 30);
  ctx.lineTo(cx + offsetX, cy + offsetY - 10);
  ctx.moveTo(cx + offsetX, cy + offsetY + 10);
  ctx.lineTo(cx + offsetX, cy + offsetY + 30);
  ctx.stroke();
  
  // 추가 글리치 레이어 (다른 색상)
  ctx.strokeStyle = '#00FF66';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - offsetX - 30, cy - offsetY);
  ctx.lineTo(cx - offsetX - 10, cy - offsetY);
  ctx.moveTo(cx - offsetX + 10, cy - offsetY);
  ctx.lineTo(cx - offsetX + 30, cy - offsetY);
  ctx.stroke();
  
  ctx.restore();
}
```

---

## 6.8 검증 체크리스트

- [ ] 텍스트가 █▓▒░?# 등의 문자로 깨지는가?
- [ ] 감염도가 높을수록 글리치가 심해지는가?
- [ ] 패널 하단에 녹아내림(드립) 효과가 있는가?
- [ ] 전체적으로 보라색 오버레이가 있는가?
- [ ] 프레임에 RGB 색수차가 보이는가?
- [ ] 감염도 50% 이상에서 픽셀 누락이 발생하는가?
- [ ] 크로스헤어가 떨리고 분리되는가?
- [ ] 수평 글리치 라인이 가끔 지나가는가?

---

## 6.9 현재 문제점 (스크린샷 Image 4)

```
현재 상태:
- 텍스트 글리치가 너무 단순함 (? 하나만 삽입)
- 녹아내림 효과 없음
- 색수차 없음 (단순 보라색 오버레이만)
- 픽셀 누락 없음
- 크로스헤어 글리치 없음

목표 상태:
- 다양한 글리치 문자 (█▓▒░?#@!)
- 패널 하단 드립 효과
- RGB 분리된 프레임
- 랜덤 픽셀 누락
- 떨리는 이중 크로스헤어
```
