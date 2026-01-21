# 모듈 2: Win98 스타일 프레임 시스템

## 목표
Windows 98 스타일 창 프레임을 Canvas 2D로 정확하게 구현한다.

---

## 2.1 Win98 프레임 구조 (필수)

```
┌─────────────────────────────────────────┐  ← 외부 테두리 (어두운색)
│┌───────────────────────────────────────┐│  ← 내부 테두리 (밝은색)
││ [ TITLE BAR ]              ─ □ ✕    ││  ← 타이틀 바 (그라데이션)
│├───────────────────────────────────────┤│  ← 구분선
││                                       ││
││           CONTENT AREA                ││  ← 내용 영역
││                                       ││
│└───────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## 2.2 Canvas 2D 구현 코드

```typescript
// arwesDrawing.ts에 추가

interface Win98FrameOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  theme: 'gold' | 'cyan' | 'red' | 'purple' | 'grey';
  showControls?: boolean;  // ─ □ ✕ 버튼
}

const WIN98_THEMES = {
  gold: {
    outerBorder: '#8B7500',      // 어두운 골드
    innerBorder: '#FFE066',      // 밝은 골드
    titleGradientStart: '#FFD700',
    titleGradientEnd: '#CC9900',
    titleText: '#000000',
    contentBg: 'rgba(20, 15, 5, 0.85)',
    controlBg: '#FFC000',
  },
  cyan: {
    outerBorder: '#006688',
    innerBorder: '#66E5FF',
    titleGradientStart: '#00D4FF',
    titleGradientEnd: '#0099CC',
    titleText: '#000000',
    contentBg: 'rgba(0, 20, 30, 0.85)',
    controlBg: '#00A8CC',
  },
  red: {
    outerBorder: '#660022',
    innerBorder: '#FF6688',
    titleGradientStart: '#FF0044',
    titleGradientEnd: '#CC0033',
    titleText: '#FFFFFF',
    contentBg: 'rgba(30, 5, 10, 0.85)',
    controlBg: '#CC0033',
  },
  purple: {
    outerBorder: '#330066',
    innerBorder: '#CC99FF',
    titleGradientStart: '#9900FF',
    titleGradientEnd: '#6600CC',
    titleText: '#FFFFFF',
    contentBg: 'rgba(20, 0, 30, 0.85)',
    controlBg: '#6600CC',
  },
  grey: {
    outerBorder: '#333333',
    innerBorder: '#999999',
    titleGradientStart: '#666666',
    titleGradientEnd: '#444444',
    titleText: '#FFFFFF',
    contentBg: 'rgba(15, 15, 15, 0.9)',
    controlBg: '#444444',
  },
};

export function drawWin98Frame(
  ctx: CanvasRenderingContext2D,
  options: Win98FrameOptions
): void {
  const { x, y, width, height, title, theme, showControls = true } = options;
  const colors = WIN98_THEMES[theme];
  const titleBarHeight = 24;
  const borderWidth = 2;
  const controlButtonSize = 16;
  
  ctx.save();
  
  // ═══════════════════════════════════════════════════════════════
  // 1. 외부 테두리 (어두운색) - Win98 스타일 이중 테두리
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.outerBorder;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(x, y, width, height);
  
  // ═══════════════════════════════════════════════════════════════
  // 2. 내부 테두리 (밝은색) - 1px 안쪽
  // ═══════════════════════════════════════════════════════════════
  ctx.strokeStyle = colors.innerBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    x + borderWidth, 
    y + borderWidth, 
    width - borderWidth * 2, 
    height - borderWidth * 2
  );
  
  // ═══════════════════════════════════════════════════════════════
  // 3. 타이틀 바 (그라데이션) - Win98 핵심 요소
  // ═══════════════════════════════════════════════════════════════
  const titleBarX = x + borderWidth + 1;
  const titleBarY = y + borderWidth + 1;
  const titleBarWidth = width - borderWidth * 2 - 2;
  
  // 그라데이션 생성
  const titleGradient = ctx.createLinearGradient(
    titleBarX, titleBarY,
    titleBarX + titleBarWidth, titleBarY
  );
  titleGradient.addColorStop(0, colors.titleGradientStart);
  titleGradient.addColorStop(1, colors.titleGradientEnd);
  
  ctx.fillStyle = titleGradient;
  ctx.fillRect(titleBarX, titleBarY, titleBarWidth, titleBarHeight);
  
  // ═══════════════════════════════════════════════════════════════
  // 4. 타이틀 텍스트
  // ═══════════════════════════════════════════════════════════════
  ctx.fillStyle = colors.titleText;
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `[ ${title.toUpperCase()} ]`,
    titleBarX + 8,
    titleBarY + titleBarHeight / 2
  );
  
  // ═══════════════════════════════════════════════════════════════
  // 5. 컨트롤 버튼 (─ □ ✕) - Win98 스타일
  // ═══════════════════════════════════════════════════════════════
  if (showControls) {
    const buttonY = titleBarY + (titleBarHeight - controlButtonSize) / 2;
    const buttonSpacing = 2;
    
    // 버튼 3개: Minimize(─), Maximize(□), Close(✕)
    const buttons = ['─', '□', '✕'];
    const buttonColors = [colors.controlBg, colors.controlBg, '#CC3333'];
    
    for (let i = 0; i < 3; i++) {
      const buttonX = titleBarX + titleBarWidth - 
                      (3 - i) * (controlButtonSize + buttonSpacing) - 4;
      
      // 버튼 배경
      ctx.fillStyle = buttonColors[i];
      ctx.fillRect(buttonX, buttonY, controlButtonSize, controlButtonSize);
      
      // 버튼 테두리 (입체감)
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(buttonX, buttonY + controlButtonSize);
      ctx.lineTo(buttonX, buttonY);
      ctx.lineTo(buttonX + controlButtonSize, buttonY);
      ctx.stroke();
      
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.moveTo(buttonX + controlButtonSize, buttonY);
      ctx.lineTo(buttonX + controlButtonSize, buttonY + controlButtonSize);
      ctx.lineTo(buttonX, buttonY + controlButtonSize);
      ctx.stroke();
      
      // 버튼 아이콘
      ctx.fillStyle = colors.titleText;
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        buttons[i],
        buttonX + controlButtonSize / 2,
        buttonY + controlButtonSize / 2
      );
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // 6. 컨텐츠 영역 배경
  // ═══════════════════════════════════════════════════════════════
  const contentX = titleBarX;
  const contentY = titleBarY + titleBarHeight + 2;
  const contentWidth = titleBarWidth;
  const contentHeight = height - borderWidth * 2 - titleBarHeight - 6;
  
  ctx.fillStyle = colors.contentBg;
  ctx.fillRect(contentX, contentY, contentWidth, contentHeight);
  
  // ═══════════════════════════════════════════════════════════════
  // 7. 코너 장식 (L자 코너) - ARWES 스타일
  // ═══════════════════════════════════════════════════════════════
  const cornerLength = 12;
  ctx.strokeStyle = colors.innerBorder;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  // 좌상단
  ctx.beginPath();
  ctx.moveTo(x + borderWidth, y + borderWidth + cornerLength);
  ctx.lineTo(x + borderWidth, y + borderWidth);
  ctx.lineTo(x + borderWidth + cornerLength, y + borderWidth);
  ctx.stroke();
  
  // 우상단
  ctx.beginPath();
  ctx.moveTo(x + width - borderWidth - cornerLength, y + borderWidth);
  ctx.lineTo(x + width - borderWidth, y + borderWidth);
  ctx.lineTo(x + width - borderWidth, y + borderWidth + cornerLength);
  ctx.stroke();
  
  // 좌하단
  ctx.beginPath();
  ctx.moveTo(x + borderWidth, y + height - borderWidth - cornerLength);
  ctx.lineTo(x + borderWidth, y + height - borderWidth);
  ctx.lineTo(x + borderWidth + cornerLength, y + height - borderWidth);
  ctx.stroke();
  
  // 우하단
  ctx.beginPath();
  ctx.moveTo(x + width - borderWidth - cornerLength, y + height - borderWidth);
  ctx.lineTo(x + width - borderWidth, y + height - borderWidth);
  ctx.lineTo(x + width - borderWidth, y + height - borderWidth - cornerLength);
  ctx.stroke();
  
  ctx.restore();
}
```

---

## 2.3 사용 예시

```typescript
// scenarioHUDs.ts에서 사용

// NORMAL 시나리오의 STATUS 패널
drawWin98Frame(ctx, {
  x: width - 220,
  y: 60,
  width: 200,
  height: 150,
  title: 'STATUS',
  theme: 'gold',
  showControls: true,
});

// SYNC 시나리오의 BIOLOGICAL ANALYSIS 패널
drawWin98Frame(ctx, {
  x: 20,
  y: 60,
  width: 250,
  height: 180,
  title: 'BIOLOGICAL ANALYSIS',
  theme: 'cyan',
  showControls: true,
});
```

---

## 2.4 검증 체크리스트

- [ ] 이중 테두리가 보이는가? (외부 어두운색, 내부 밝은색)
- [ ] 타이틀 바에 그라데이션이 적용되는가?
- [ ] 타이틀 텍스트가 `[ TITLE ]` 형식인가?
- [ ] 컨트롤 버튼 3개(─ □ ✕)가 우측에 있는가?
- [ ] 버튼에 입체감(3D 효과)이 있는가?
- [ ] 코너에 L자 장식이 있는가?
- [ ] 시나리오별 테마 색상이 정확히 적용되는가?

---

## 2.5 참고 이미지 비교

### 현재 (잘못됨):
```
┌─────────────────┐
│ STATUS      ─□✕│  ← 단순 박스, 그라데이션 없음
│                 │
└─────────────────┘
```

### 목표 (Win98 스타일):
```
╔═══════════════════════════════════╗
║┌─────────────────────────────────┐║
║│[ STATUS ]              ─ □ ✕  │║ ← 그라데이션 타이틀 바
║├─────────────────────────────────┤║
║│                                 │║
║│      (반투명 다크 배경)          │║
║│                                 │║
║└─────────────────────────────────┘║
╚═══════════════════════════════════╝
  ↑                               ↑
  L자 코너 장식                    L자 코너 장식
```
