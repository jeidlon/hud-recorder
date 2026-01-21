/**
 * Dream Persona HUD Remaster - 상수 및 테마 시스템
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * ARWES 프레임워크 영감 반영:
 * - packages/theme/createThemeColor - 동적 컬러 멀티플라이어 시스템
 * - packages/theme/createThemeMultiplier - 단위 및 스페이싱 시스템
 * ════════════════════════════════════════════════════════════════════════════
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 ID 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ScenarioId = 
  | 'normal'    // #1 기본 상태 (Gold/Yellow) - 탐색, 일반 게임플레이
  | 'sync'      // #2 로그인/신경 접속 (Blue)
  | 'combat'    // #3 몬스터 전투/피격 (Red)
  | 'infected'  // #4 감염 상태 (Purple)
  | 'trauma'    // #5 트라우마 던전 (Grey)
  | 'evolved'   // #6 최종 진화 (Gold Enhanced)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 정확한 색상 팔레트 (GUIDE-MODULE-01-COLOR-SYSTEM.md 기준)
// 모든 값은 HEX 또는 rgba 형식으로 정확히 정의됨
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// NORMAL 시나리오 색상 (필수) - Gold/Yellow 테마
export const NORMAL_COLORS = {
  // 프레임 색상
  frameMain: '#FFD700',      // Gold - 메인 테두리
  frameAccent: '#FFC000',    // Amber - 강조/하이라이트
  frameLight: '#FFE066',     // Light Gold - 밝은 부분
  frameDark: '#CC9900',      // Dark Gold - 어두운 부분
  
  // 배경 색상
  bgPrimary: 'rgba(20, 15, 5, 0.85)',    // 다크 브라운 (불투명도 85%)
  bgSecondary: 'rgba(30, 25, 10, 0.7)',  // 약간 밝은 브라운
  bgPanel: 'rgba(40, 35, 15, 0.6)',      // 패널 배경
  
  // 텍스트 색상
  textPrimary: '#FFD700',    // 골드 텍스트
  textSecondary: '#CCAA00',  // 어두운 골드
  textMuted: '#998800',      // 비활성 텍스트
  textWhite: '#FFFFFF',      // 순백색
  
  // 그리드/장식 색상
  gridLine: 'rgba(255, 215, 0, 0.15)',   // 15% 투명도 골드
  dotColor: 'rgba(255, 215, 0, 0.3)',    // 30% 투명도 골드
  glowColor: 'rgba(255, 215, 0, 0.4)',   // 글로우 효과
} as const

// SYNC 시나리오 색상 (신경 접속) - Cyan/Blue 계열
export const SYNC_COLORS = {
  frameMain: '#00D4FF',      // Cyan
  frameAccent: '#00A8CC',    // Dark Cyan
  frameLight: '#66E5FF',     // Light Cyan
  frameDark: '#006688',      // Deep Cyan
  
  bgPrimary: 'rgba(0, 20, 30, 0.85)',
  bgSecondary: 'rgba(0, 30, 45, 0.7)',
  bgPanel: 'rgba(0, 40, 60, 0.6)',
  
  textPrimary: '#00D4FF',
  textSecondary: '#88DDFF',
  textMuted: '#668899',
  textWhite: '#FFFFFF',
  
  gridLine: 'rgba(0, 212, 255, 0.15)',
  dotColor: 'rgba(0, 212, 255, 0.3)',
  glowColor: 'rgba(0, 212, 255, 0.5)',
} as const

// COMBAT 시나리오 색상 (전투) - Red 계열
export const COMBAT_COLORS = {
  frameMain: '#FF0044',      // Crimson Red
  frameAccent: '#CC0033',    // Dark Red
  frameLight: '#FF4466',     // Light Red
  frameDark: '#990022',      // Deep Red
  
  bgPrimary: 'rgba(30, 5, 10, 0.85)',
  bgSecondary: 'rgba(45, 10, 15, 0.7)',
  bgPanel: 'rgba(60, 15, 20, 0.6)',
  
  textPrimary: '#FF0044',
  textSecondary: '#FF6688',
  textMuted: '#AA4455',
  textWhite: '#FFFFFF',
  textWarning: '#FF6600',    // 경고 오렌지
  
  gridLine: 'rgba(255, 0, 68, 0.15)',
  dotColor: 'rgba(255, 0, 68, 0.3)',
  glowColor: 'rgba(255, 0, 68, 0.5)',
} as const

// INFECTED 시나리오 색상 (감염) - Purple/Green 형광 계열
export const INFECTED_COLORS = {
  frameMain: '#9900FF',      // Purple
  frameAccent: '#00FF66',    // 형광 Green (보조)
  frameLight: '#CC66FF',     // Light Purple
  frameDark: '#660099',      // Deep Purple
  
  bgPrimary: 'rgba(20, 0, 30, 0.85)',
  bgSecondary: 'rgba(30, 0, 45, 0.7)',
  bgPanel: 'rgba(40, 0, 60, 0.6)',
  
  textPrimary: '#9900FF',
  textSecondary: '#CC99FF',
  textMuted: '#775599',
  textWhite: '#FFFFFF',
  corruptColor: '#FF00FF',   // Magenta (글리치)
  
  gridLine: 'rgba(153, 0, 255, 0.15)',
  dotColor: 'rgba(153, 0, 255, 0.3)',
  glowColor: 'rgba(153, 0, 255, 0.5)',
} as const

// TRAUMA 시나리오 색상 (트라우마) - Grey/Desaturated 계열
export const TRAUMA_COLORS = {
  frameMain: '#666666',      // Grey
  frameAccent: '#444444',    // Dark Grey
  frameLight: '#888888',     // Light Grey
  frameDark: '#333333',      // Deep Grey
  
  bgPrimary: 'rgba(15, 15, 15, 0.9)',   // 거의 검은색
  bgSecondary: 'rgba(25, 25, 25, 0.8)',
  bgPanel: 'rgba(35, 35, 35, 0.7)',
  
  textPrimary: '#666666',
  textSecondary: '#888888',
  textMuted: '#555555',
  textWhite: '#AAAAAA',
  ecgColor: '#00FF88',       // 심전도 녹색
  chartRed: '#FF3333',       // 차트 하락 빨강
  
  gridLine: 'rgba(102, 102, 102, 0.15)',
  dotColor: 'rgba(102, 102, 102, 0.3)',
  glowColor: 'rgba(102, 102, 102, 0.3)',
} as const

// EVOLVED 시나리오 색상 (진화) - Gold + White 계열
export const EVOLVED_COLORS = {
  frameMain: '#FFD700',      // Gold
  frameAccent: '#FFFFFF',    // White
  frameLight: '#FFFACD',     // Light Gold/White
  frameDark: '#CC9900',      // Deep Gold
  
  bgPrimary: 'rgba(30, 25, 10, 0.7)',   // 투명도 높게
  bgSecondary: 'rgba(40, 35, 15, 0.6)',
  bgPanel: 'rgba(50, 45, 20, 0.5)',
  
  textPrimary: '#FFFFFF',
  textSecondary: '#FFD700',
  textMuted: '#CCAA66',
  textWhite: '#FFFFFF',
  particleColor: '#FFD700',  // 골든 파티클
  
  gridLine: 'rgba(255, 215, 0, 0.2)',
  dotColor: 'rgba(255, 215, 0, 0.4)',
  glowColor: 'rgba(255, 215, 0, 0.6)',  // 강한 글로우
} as const

// 시나리오별 색상 통합 객체
export const SCENARIO_COLORS = {
  normal: NORMAL_COLORS,
  sync: SYNC_COLORS,
  combat: COMBAT_COLORS,
  infected: INFECTED_COLORS,
  trauma: TRAUMA_COLORS,
  evolved: EVOLVED_COLORS,
} as const

// 색상 헬퍼 함수
export const getScenarioColor = <K extends keyof typeof NORMAL_COLORS>(
  scenario: ScenarioId, 
  colorKey: K
): string => {
  return SCENARIO_COLORS[scenario][colorKey as keyof typeof SCENARIO_COLORS[typeof scenario]] as string
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES-style Theme Color System (from packages/theme/createThemeColor)
// 각 컬러는 0-5 레벨의 강도를 가짐 (arwes의 color multiplier 패턴)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ThemeColor {
  main: (level: number) => string
  deco: (level: number) => string
  bg: (level: number) => string
  text: (level: number) => string
}

// ARWES 스타일 컬러 레벨 시스템 (0=어두움, 4=밝음)
const createColorLevel = (hue: number, sat: number, lightBase: number) => {
  return (level: number): string => {
    const light = Math.min(100, lightBase + level * 12)
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }
}

const createAlphaColor = (hue: number, sat: number, light: number) => {
  return (level: number): string => {
    const alpha = 0.1 + level * 0.18
    return `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 테마 (ARWES createThemeColor 패턴)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const THEMES: Record<ScenarioId, ThemeColor> = {
  // NORMAL: 기본 HUD - 문서 기준 Gold/Yellow 메인 테마
  normal: {
    main: createColorLevel(45, 100, 50),    // #FFD700 Gold 메인 프레임
    deco: createColorLevel(38, 100, 50),    // #FFC000 Amber 강조
    bg: createAlphaColor(30, 40, 10),       // rgba(20, 15, 5, 0.85) 다크 브라운 배경
    text: createColorLevel(45, 20, 92),     // #FFFFFF/골드 강조 텍스트
  },
  // SYNC: 신경 동기화 - 시안 블루
  sync: {
    main: createColorLevel(190, 100, 50),   // #00D4FF 시안
    deco: createColorLevel(210, 100, 50),   // 딥 블루
    bg: createAlphaColor(210, 80, 10),      // 다크 블루 배경
    text: createColorLevel(190, 20, 90),    // 밝은 텍스트
  },
  // COMBAT: 전투/피격 - 경고 레드
  combat: {
    main: createColorLevel(355, 100, 50),   // #FF0044 경고 레드
    deco: createColorLevel(25, 100, 55),    // 오렌지
    bg: createAlphaColor(0, 80, 12),        // 다크 레드 배경
    text: createColorLevel(0, 10, 92),      // 밝은 텍스트
  },
  // INFECTED: 바이러스 감염 - 독성 퍼플/그린
  infected: {
    main: createColorLevel(280, 100, 55),   // #9900FF 독성 퍼플
    deco: createColorLevel(145, 100, 50),   // 병적인 그린
    bg: createAlphaColor(285, 70, 10),      // 다크 퍼플 배경
    text: createColorLevel(280, 15, 75),    // 희미한 텍스트
  },
  // TRAUMA: 트라우마 던전 - 절망의 그레이
  trauma: {
    main: createColorLevel(0, 5, 45),       // 절망의 그레이
    deco: createColorLevel(355, 65, 45),    // 손실의 레드 (주식차트)
    bg: createAlphaColor(0, 5, 6),          // 완전 어두운 배경
    text: createColorLevel(0, 5, 60),       // 희미한 텍스트
  },
  // EVOLVED: 최종 진화 - 골드 강화 + 8비트 픽셀
  evolved: {
    main: createColorLevel(45, 100, 58),    // 밝은 골드
    deco: createColorLevel(40, 80, 95),     // 크림 화이트
    bg: createAlphaColor(45, 60, 18),       // 따뜻한 골드 배경
    text: createColorLevel(45, 30, 98),     // 밝은 골드 텍스트
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES-style Space Unit System (from packages/theme/createThemeMultiplier)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SPACE_UNIT = 4 // 기본 단위 4px

export const space = (multiplier: number | number[]): number | number[] => {
  if (Array.isArray(multiplier)) {
    return multiplier.map(m => m * SPACE_UNIT)
  }
  return multiplier * SPACE_UNIT
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES-style Frame Settings (from packages/frames/createFrameCornersSettings)
// 코너 라인 스타일 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FRAME_SETTINGS = {
  padding: 2,
  strokeWidth: 2,
  cornerLength: 16,
  cornerLengthLarge: 24,
  cornerLengthSmall: 10,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES-style Background Settings (from packages/bgs/)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GRID_SETTINGS = {
  lineWidth: 1,
  distance: 30,
  horizontalLineDash: [4, 8],
  verticalLineDash: [2, 6],
}

export const DOTS_SETTINGS = {
  type: 'cross' as 'box' | 'circle' | 'cross',
  distance: 40,
  size: 4,
  crossSize: 1,
}

export const MOVING_LINES_SETTINGS = {
  lineWidth: 1,
  distance: 40,
  sets: 5,
  speed: 0.5,
}

export const PUFFS_SETTINGS = {
  quantity: 15,
  padding: 30,
  xOffset: [0, 15] as [number, number],
  yOffset: [-20, -80] as [number, number],
  radiusInitial: 3,
  radiusOffset: [4, 20] as [number, number],
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCENARIOS: Record<ScenarioId, {
  name: string
  koreanName: string
  description: string
  shortcut: string
  day?: number  // 게임 내 일차
}> = {
  normal: {
    name: 'DREAM PERSONA',
    koreanName: '기본 탐색',
    description: '드림월드 탐험 및 일반 게임플레이',
    shortcut: '1',
    day: 1,
  },
  sync: {
    name: 'NEURAL SYNC',
    koreanName: '신경 동기화',
    description: '드림 마스크 연결 및 페르소나 동기화',
    shortcut: '2',
    day: 1,
  },
  combat: {
    name: 'COMBAT ALERT',
    koreanName: '전투 경보',
    description: '적 탐지 및 전투 상태',
    shortcut: '3',
    day: 1,
  },
  infected: {
    name: 'VIRAL CORRUPTION',
    koreanName: '바이러스 감염',
    description: '시스템 오염 및 언데드 상태',
    shortcut: '4',
    day: 3,
  },
  trauma: {
    name: 'TRAUMA DUNGEON',
    koreanName: '트라우마 던전',
    description: '과거의 상처가 현실이 되는 공간',
    shortcut: '5',
    day: 4,
  },
  evolved: {
    name: 'LIMIT RELEASED',
    koreanName: '한계 돌파',
    description: '최종 진화 - 모든 기억이 하나가 된다',
    shortcut: '6',
    day: 5,
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ARWES-style Text Animation Settings (from packages/text/animateTextDecipher)
// 텍스트 암호해독 문자셋
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CIPHER_CHARACTERS = 
  '    ----____▓▒░█▀▄◆◇○●□■△▲▽▼◁◀▷▶abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// 글리치용 특수 문자
export const GLITCH_CHARACTERS = ['█', '▓', '▒', '░', '?', '#', '@', '!', '※', '¤', '▪', '▫']

// 시나리오별 암호해독 문자셋 (DREAM-PERSONA-HUD-GUIDE-V2.md 기준)
export const SCENARIO_CHARACTERS = {
  normal: CIPHER_CHARACTERS,
  sync: '01010101▓▒░█████',
  combat: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  infected: '█▓▒░?#@!$%^&*▓█▒░ERROR',
  trauma: '...---___~~~',
  evolved: '★☆✦✧◆◇●○■□▲△▼▽✦✧',
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 캐릭터 정보
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CHARACTERS = {
  player: {
    name: '매지코',
    englishName: 'MAGICO',
    type: 'WIZARD',
    level: 42,
  },
  // 팀원 정보 (문서 기준)
  team: [
    { realName: '소영', personaName: '루비안', type: 'SUPPORT', hp: 85, maxHp: 100 },
    { realName: '민준', personaName: '현정사랑', type: 'TANK', hp: 100, maxHp: 100 },
  ],
  targets: {
    reptilian: { name: '렙틸리언', level: 45, threatLevel: 'high' as const },
    reaper: { name: '리퍼', level: 99, threatLevel: 'boss' as const },
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Win98 스타일 + 홀로그램 설정 (문서 기준)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCANLINE_SETTINGS = {
  spacing: 2,           // 2px 간격
  opacity: 0.03,        // 3% 투명도
  color: '#000000',
  animateSpeed: 0.5,    // 초당 이동 비율
}

export const HOLOGRAM_SETTINGS = {
  flicker: {
    frequency: 0.1,     // 10% 확률로 깜빡임
    duration: 50,       // 50ms 지속
  },
  chromatic: {
    offset: 1,          // 1px 색수차
  },
  noise: {
    density: 0.02,      // 2% 노이즈
  },
}

// Win98 스타일 창 프레임 색상 (GUIDE-MODULE-02-WIN98-FRAME.md 기준)
export const WIN98_THEMES = {
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
} as const

export type Win98Theme = keyof typeof WIN98_THEMES

// 시나리오별 Win98 테마 매핑
export const SCENARIO_WIN98_THEME: Record<ScenarioId, Win98Theme> = {
  normal: 'gold',
  sync: 'cyan',
  combat: 'red',
  infected: 'purple',
  trauma: 'grey',
  evolved: 'gold',
}

// 레거시 호환성을 위한 기본 Win98 색상
export const WIN98_COLORS = WIN98_THEMES.gold

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 애니메이션 Easing 함수들 (ARWES animated 패턴)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const easing = {
  linear: (t: number) => t,
  inSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 폰트 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FONTS = {
  primary: '"Rajdhani", "Consolas", "Monaco", monospace',
  mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
  display: '"Orbitron", "Rajdhani", sans-serif',
  korean: '"Noto Sans KR", "Malgun Gothic", sans-serif',
  retro: '"Press Start 2P", "VT323", monospace',
}
