# 모듈 5: SYNC 시나리오 상세 구현

## 목표
신경 동기화 시나리오의 모든 UI 요소를 정확하게 구현한다.

---

## 5.1 동기화 링 (중앙) - 핵심 요소

### 5.1.1 구조
```
           ◆ (12시 방향 마커)
      ╱─────────────╲
     ╱       ○       ╲      ← 외부 링 (회전)
    │    ╱─────╲     │
    │   │  100%  │   │      ← 내부 텍스트
    │    ╲─────╱     │      ← 내부 링 (고정)
     ╲               ╱
      ╲─────────────╱
    ◆               ◆       ← 4시, 8시 방향 마커
      SYNCHRONIZING...      ← 하단 텍스트
```

### 5.1.2 구현 코드

```typescript
// scenarioHUDs.ts

interface SyncRingOptions {
  cx: number;           // 중심 X
  cy: number;           // 중심 Y
  outerRadius: number;  // 외부 링 반지름
  innerRadius: number;  // 내부 링 반지름
  syncProgress: number; // 0 ~ 100
  time: number;         // 애니메이션용
  color: string;        // 테마 색상
}

export function drawSyncRing(
  ctx: CanvasRenderingContext2D,
  options: SyncRingOptions
): void {
  const { cx, cy, outerRadius, innerRadius, syncProgress, time, color } = options;
  
  ctx.save();
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 링 (회전) - 점선 + 마커
  // ═══════════════════════════════════════════════════════════════
  const rotationAngle = time * 0.5; // 천천히 회전
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 5]); // 점선
  
  ctx.beginPath();
  ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 마커 4개 (회전)
  const markerCount = 4;
  for (let i = 0; i < markerCount; i++) {
    const angle = rotationAngle + (i / markerCount) * Math.PI * 2;
    const mx = cx + Math.cos(angle) * outerRadius;
    const my = cy + Math.sin(angle) * outerRadius;
    
    // 다이아몬드 마커
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle + Math.PI / 4);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(6, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 링 (고정) - 진행률 표시
  // ═══════════════════════════════════════════════════════════════
  
  // 배경 링 (어두운 색)
  ctx.strokeStyle = `${color}33`; // 20% 투명도
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // 진행률 링 (밝은 색)
  const progressAngle = (syncProgress / 100) * Math.PI * 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius, -Math.PI / 2, -Math.PI / 2 + progressAngle);
  ctx.stroke();
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 중앙 텍스트
  // ═══════════════════════════════════════════════════════════════
  
  // "SYNCHRONIZING..."
  ctx.fillStyle = color;
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SYNCHRONIZING...', cx, cy - 20);
  
  // 퍼센트 (큰 글씨)
  ctx.font = 'bold 48px "Courier New", monospace';
  ctx.fillText(`${Math.floor(syncProgress)}%`, cx, cy + 15);
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 글로우 효과
  // ═══════════════════════════════════════════════════════════════
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRadius + 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  ctx.restore();
}
```

---

## 5.2 좌측 패널: BIOLOGICAL ANALYSIS

```typescript
export function drawBiologicalAnalysisPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  data: {
    personaName: string;
    type: string;
    syncProgress: number;
  },
  time: number
): void {
  const width = 250;
  const height = 180;
  const color = '#00D4FF';
  
  // Win98 프레임
  drawWin98Frame(ctx, {
    x, y, width, height,
    title: 'BIOLOGICAL ANALYSIS',
    theme: 'cyan',
  });
  
  const contentX = x + 15;
  const contentY = y + 40;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '12px "Courier New", monospace';
  
  // PERSONA 정보
  ctx.fillText(`PERSONA: ${data.personaName}`, contentX, contentY);
  ctx.fillText(`TYPE: ${data.type}`, contentX, contentY + 20);
  
  // SYNC 진행률 바
  ctx.fillText('SYNC:', contentX, contentY + 50);
  
  // 진행률 바 배경
  ctx.fillStyle = `${color}33`;
  ctx.fillRect(contentX + 50, contentY + 42, 150, 16);
  
  // 진행률 바
  ctx.fillStyle = color;
  ctx.fillRect(contentX + 50, contentY + 42, 150 * (data.syncProgress / 100), 16);
  
  // 진행률 텍스트
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${Math.floor(data.syncProgress)}/100`,
    contentX + 50 + 75,
    contentY + 53
  );
  
  // ═══════════════════════════════════════════════════════════════
  // 뇌파 그래프 (알파/베타)
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  const graphY = contentY + 80;
  const graphWidth = 200;
  const graphHeight = 40;
  
  // 알파파 (느린 파동)
  ctx.beginPath();
  ctx.moveTo(contentX, graphY + graphHeight / 2);
  for (let i = 0; i < graphWidth; i++) {
    const waveY = Math.sin((i + time * 50) * 0.05) * 10;
    ctx.lineTo(contentX + i, graphY + graphHeight / 2 + waveY);
  }
  ctx.stroke();
  
  // 베타파 (빠른 파동) - 점선
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(contentX, graphY + graphHeight / 2);
  for (let i = 0; i < graphWidth; i++) {
    const waveY = Math.sin((i + time * 100) * 0.15) * 5;
    ctx.lineTo(contentX + i, graphY + graphHeight / 2 + waveY);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.restore();
}
```

---

## 5.3 우측 패널: PERSONA STATUS

```typescript
export function drawPersonaStatusPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  data: {
    level: number;
    neuralLink: string;
    bond: number;
  }
): void {
  const width = 200;
  const height = 120;
  
  drawWin98Frame(ctx, {
    x, y, width, height,
    title: 'PERSONA STATUS',
    theme: 'cyan',
  });
  
  const contentX = x + 15;
  const contentY = y + 40;
  const color = '#00D4FF';
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = '12px "Courier New", monospace';
  
  ctx.fillText(`LEVEL: ${data.level}`, contentX, contentY);
  ctx.fillText(`NEURAL LINK: ${data.neuralLink}`, contentX, contentY + 20);
  
  // BOND 진행률
  ctx.fillText('BOND:', contentX, contentY + 50);
  
  ctx.fillStyle = `${color}33`;
  ctx.fillRect(contentX + 50, contentY + 42, 100, 12);
  
  ctx.fillStyle = color;
  ctx.fillRect(contentX + 50, contentY + 42, 100 * (data.bond / 100), 12);
  
  ctx.fillStyle = color;
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${data.bond}%`, contentX + 170, contentY + 52);
  
  ctx.restore();
}
```

---

## 5.4 Decipher 텍스트 효과

```typescript
// 암호해독 스타일 텍스트 (문자가 랜덤하게 나타났다 사라짐)
const CIPHER_CHARS = '01▓▒░█ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getDecipherText(
  originalText: string,
  progress: number,  // 0 ~ 1
  time: number
): string {
  const length = originalText.length;
  const revealedCount = Math.floor(length * progress);
  
  return originalText.split('').map((char, index) => {
    if (char === ' ') return ' ';
    if (index < revealedCount) return char;
    
    // 랜덤 문자
    const seed = Math.sin(index * 12.9898 + time * 10) * 43758.5453;
    const randomIndex = Math.floor(Math.abs(seed) % CIPHER_CHARS.length);
    return CIPHER_CHARS[randomIndex];
  }).join('');
}
```

---

## 5.5 완전한 SYNC 시나리오 드로잉

```typescript
export function drawSyncScenario(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: HUDState
): void {
  const color = '#00D4FF';
  const syncProgress = state.syncRate ?? 0;
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 배경: 도트 패턴
  // ═══════════════════════════════════════════════════════════════
  drawBackgroundDots(ctx, width, height, {
    color: `${color}40`,
    spacing: 20,
    radius: 1,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 중앙: 동기화 링
  // ═══════════════════════════════════════════════════════════════
  drawSyncRing(ctx, {
    cx: width / 2,
    cy: height / 2,
    outerRadius: 120,
    innerRadius: 80,
    syncProgress,
    time: state.time,
    color,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 좌측 패널: BIOLOGICAL ANALYSIS
  // ═══════════════════════════════════════════════════════════════
  drawBiologicalAnalysisPanel(ctx, 20, 60, {
    personaName: 'MAGICO',
    type: 'WIZARD',
    syncProgress,
  }, state.time);
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 우측 패널: PERSONA STATUS
  // ═══════════════════════════════════════════════════════════════
  drawPersonaStatusPanel(ctx, width - 220, 60, {
    level: 42,
    neuralLink: 'STABLE',
    bond: 92,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 상단 타이틀 (Decipher 효과)
  // ═══════════════════════════════════════════════════════════════
  const title = 'NEURAL SYNCHRONIZATION IN PROGRESS';
  const decipheredTitle = getDecipherText(title, syncProgress / 100, state.time);
  
  ctx.fillStyle = color;
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(decipheredTitle, width / 2, 40);
}
```

---

## 5.6 검증 체크리스트

- [ ] 동기화 링이 화면 **정중앙**에 위치하는가?
- [ ] 외부 링이 시계 방향으로 회전하는가?
- [ ] 다이아몬드 마커 4개가 외부 링에 부착되어 회전하는가?
- [ ] 내부 링에 진행률이 원형으로 표시되는가?
- [ ] 퍼센트 숫자가 크게 표시되는가? (48px 정도)
- [ ] "SYNCHRONIZING..." 텍스트가 숫자 위에 있는가?
- [ ] 좌측 패널에 뇌파 그래프가 움직이는가?
- [ ] 전체적으로 Cyan(#00D4FF) 색상인가?
- [ ] Decipher 효과로 텍스트가 서서히 나타나는가?

---

## 5.7 참고: 현재 문제점 (스크린샷 Image 1)

```
현재 상태:
- 동기화 링 중앙 정렬 안 맞음 (약간 위로 치우침)
- 외부 링 마커 없음
- 진행률 링이 너무 단순함
- 글로우 효과 없음

목표 상태:
- 정확한 중앙 배치
- 회전하는 다이아몬드 마커
- 점선 외부 링
- 글로우 효과
```
