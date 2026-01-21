# 모듈 1: 색상 시스템

## 목표
시나리오별 정확한 색상 팔레트를 constants.ts에 정의한다.

---

## 1.1 NORMAL 시나리오 색상 (필수)

```typescript
// constants.ts에 정확히 이 값들을 사용할 것

const NORMAL_COLORS = {
  // 프레임 색상
  frameMain: '#FFD700',      // Gold - 메인 테두리
  frameAccent: '#FFC000',    // Amber - 강조/하이라이트
  frameLight: '#FFE066',     // Light Gold - 밝은 부분
  
  // 배경 색상
  bgPrimary: 'rgba(20, 15, 5, 0.85)',    // 다크 브라운 (불투명도 85%)
  bgSecondary: 'rgba(30, 25, 10, 0.7)',  // 약간 밝은 브라운
  bgPanel: 'rgba(40, 35, 15, 0.6)',      // 패널 배경
  
  // 텍스트 색상
  textPrimary: '#FFD700',    // 골드 텍스트
  textSecondary: '#CCAA00',  // 어두운 골드
  textMuted: '#998800',      // 비활성 텍스트
  
  // 그리드/장식 색상
  gridLine: 'rgba(255, 215, 0, 0.15)',   // 15% 투명도 골드
  dotColor: 'rgba(255, 215, 0, 0.3)',    // 30% 투명도 골드
  glowColor: 'rgba(255, 215, 0, 0.4)',   // 글로우 효과
}
```

---

## 1.2 시나리오별 색상 정의

### SYNC (신경 접속) - Cyan/Blue 계열
```typescript
const SYNC_COLORS = {
  frameMain: '#00D4FF',      // Cyan
  frameAccent: '#00A8CC',    // Dark Cyan
  frameLight: '#66E5FF',     // Light Cyan
  bgPrimary: 'rgba(0, 20, 30, 0.85)',
  textPrimary: '#00D4FF',
  gridLine: 'rgba(0, 212, 255, 0.15)',
}
```

### COMBAT (전투) - Red 계열
```typescript
const COMBAT_COLORS = {
  frameMain: '#FF0044',      // Crimson Red
  frameAccent: '#CC0033',    // Dark Red
  frameLight: '#FF4466',     // Light Red
  bgPrimary: 'rgba(30, 5, 10, 0.85)',
  textPrimary: '#FF0044',
  warningColor: '#FF6600',   // 경고 오렌지
  gridLine: 'rgba(255, 0, 68, 0.15)',
}
```

### INFECTED (감염) - Purple/Green 형광 계열
```typescript
const INFECTED_COLORS = {
  frameMain: '#9900FF',      // Purple
  frameAccent: '#00FF66',    // 형광 Green (보조)
  frameLight: '#CC66FF',     // Light Purple
  bgPrimary: 'rgba(20, 0, 30, 0.85)',
  textPrimary: '#9900FF',
  corruptColor: '#FF00FF',   // Magenta (글리치)
  gridLine: 'rgba(153, 0, 255, 0.15)',
}
```

### TRAUMA (트라우마) - Grey/Desaturated 계열
```typescript
const TRAUMA_COLORS = {
  frameMain: '#666666',      // Grey
  frameAccent: '#444444',    // Dark Grey
  frameLight: '#888888',     // Light Grey
  bgPrimary: 'rgba(15, 15, 15, 0.9)',  // 거의 검은색
  textPrimary: '#666666',
  ecgColor: '#00FF88',       // 심전도 녹색
  chartRed: '#FF3333',       // 차트 하락 빨강
  gridLine: 'rgba(102, 102, 102, 0.15)',
}
```

### EVOLVED (진화) - Gold + White 계열
```typescript
const EVOLVED_COLORS = {
  frameMain: '#FFD700',      // Gold
  frameAccent: '#FFFFFF',    // White
  frameLight: '#FFFACD',     // Light Gold/White
  bgPrimary: 'rgba(30, 25, 10, 0.7)',  // 투명도 높게
  textPrimary: '#FFFFFF',
  particleColor: '#FFD700',  // 골든 파티클
  glowColor: 'rgba(255, 215, 0, 0.6)', // 강한 글로우
}
```

---

## 1.3 검증 체크리스트

구현 후 다음을 확인:

- [ ] NORMAL 시나리오에서 모든 프레임이 #FFD700 (골드)인가?
- [ ] NORMAL 배경이 어두운 브라운인가? (검은색 X)
- [ ] SYNC 시나리오에서 모든 요소가 Cyan 계열인가?
- [ ] COMBAT에서 경고 요소가 오렌지(#FF6600)인가?
- [ ] INFECTED에서 형광 녹색(#00FF66)이 보조색으로 사용되는가?
- [ ] TRAUMA에서 전체적으로 desaturated(채도 낮음) 느낌인가?
- [ ] EVOLVED에서 골드+화이트 조합이 되는가?

---

## 1.4 코드 위치

파일: `src/presets/dreamPersonaRemaster/constants.ts`

```typescript
// 이 구조로 export 할 것
export const SCENARIO_COLORS = {
  normal: NORMAL_COLORS,
  sync: SYNC_COLORS,
  combat: COMBAT_COLORS,
  infected: INFECTED_COLORS,
  trauma: TRAUMA_COLORS,
  evolved: EVOLVED_COLORS,
} as const;

// 헬퍼 함수
export const getScenarioColor = (
  scenario: ScenarioId, 
  colorKey: keyof typeof NORMAL_COLORS
): string => {
  return SCENARIO_COLORS[scenario][colorKey];
};
```
