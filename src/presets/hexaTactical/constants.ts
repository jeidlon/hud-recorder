/**
 * Hexa-Tactical OS 98 HUD - 상수 및 테마 시스템
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 줄콘티 Scene 8~12 대응 HUD
 * 참고 이미지 레퍼런스 99.99% 일치 목표
 * ════════════════════════════════════════════════════════════════════════════
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 ID 타입 (줄콘티 대응)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type HexaScenarioId =
  | 'idle'           // #1 기본 탐색 (Gold)
  | 'link_progress'  // #2 LINK IN PROGRESS (Cyan/Blue)
  | 'persona_sync'   // #3 페르소나 접속중 (Cyan → Gold)
  | 'profile_danger' // #4 프로필 위험 (Gold + Red)
  | 'monster_combat' // #5 몬스터 전투 (Red)
  | 'psycho_attack'  // #6 심리 공격 (Purple)
  | 'infected'       // #7 감염 상태 (Green/Purple)
  | 'trauma'         // #8 트라우마 (Grey)
  | 'evolved'        // #9 진화 완료 (Gold + White)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HUD 색상 시스템 (레퍼런스 이미지 기반)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HUD_COLORS = {
  // Gold System (메인)
  gold: '#D4A017',                        // 기본 테두리/텍스트
  goldBright: '#FFD700',                  // 강조/아이콘/경고
  goldDim: '#8B7500',                     // 비활성/그림자
  goldMuted: '#9A7B0A',                   // 서브텍스트
  goldGlow: 'rgba(255,215,0,0.35)',       // 골드 글로우
  goldGlowSoft: 'rgba(212,160,23,0.22)',  // 소프트 글로우
  goldGlowStrong: 'rgba(255,215,0,0.5)',  // 강한 글로우

  // Background System
  bgDark: '#0A0A08',                      // 거의 검정 배경
  bgPanel: '#0D0D0A',                     // 패널 배경
  bgWindow: '#121210',                    // 윈도우 배경
  bgOverlay: 'rgba(10,10,8,0.85)',        // 오버레이 배경

  // Glass Effect
  glassFill: 'rgba(255,255,255,0.06)',
  glassFill2: 'rgba(255,255,255,0.03)',
  glassBlur: 12,                          // backdrop-filter blur 값

  // Lines & Borders
  borderOuter: '#1A1A15',
  borderInner: '#2A2A20',
  borderHighlight: 'rgba(255,255,255,0.12)',
  highlightLine: 'rgba(255,255,255,0.20)',
  faintLine: 'rgba(255,255,255,0.08)',

  // Text Colors
  textMain: 'rgba(255,240,200,0.92)',
  textDim: 'rgba(255,240,200,0.55)',
  textMuted: 'rgba(255,240,200,0.35)',
  textWhite: '#FFFFFF',

  // Status Colors
  red: '#FF3333',
  redBright: '#FF0044',
  redGlow: 'rgba(255,51,51,0.4)',
  green: '#00FF66',
  greenBright: '#00FF88',
  greenGlow: 'rgba(0,255,102,0.4)',
  cyan: '#00D4FF',
  cyanBright: '#00E5FF',
  cyanGlow: 'rgba(0,212,255,0.4)',
  purple: '#9900FF',
  purpleBright: '#CC66FF',
  purpleGlow: 'rgba(153,0,255,0.4)',

  // Hex Grid
  hexLine: 'rgba(212,160,23,0.22)',
  hexFill: 'rgba(255,255,255,0.06)',
  hexGlow: 'rgba(212,160,23,0.18)',

  // Hazard Stripe
  hazardYellow: '#FFDD00',
  hazardBlack: '#111111',
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 테마 오버라이드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ThemeOverride {
  primary: string
  primaryBright?: string
  primaryGlow?: string
  accent?: string
  accentGlow?: string
  bg: string
  bgPanel?: string
  text?: string
}

export const SCENARIO_THEME: Record<HexaScenarioId, ThemeOverride> = {
  idle: {
    primary: HUD_COLORS.gold,
    primaryBright: HUD_COLORS.goldBright,
    primaryGlow: HUD_COLORS.goldGlow,
    bg: HUD_COLORS.bgDark,
    bgPanel: HUD_COLORS.bgPanel,
    text: HUD_COLORS.textMain,
  },
  link_progress: {
    primary: HUD_COLORS.cyan,
    primaryBright: HUD_COLORS.cyanBright,
    primaryGlow: HUD_COLORS.cyanGlow,
    bg: 'rgba(0,20,30,0.85)',
    bgPanel: 'rgba(0,25,35,0.8)',
    text: 'rgba(200,240,255,0.92)',
  },
  persona_sync: {
    primary: HUD_COLORS.cyan,
    primaryBright: HUD_COLORS.cyanBright,
    primaryGlow: HUD_COLORS.cyanGlow,
    accent: HUD_COLORS.goldBright,
    accentGlow: HUD_COLORS.goldGlow,
    bg: 'rgba(0,20,30,0.85)',
    text: 'rgba(200,240,255,0.92)',
  },
  profile_danger: {
    primary: HUD_COLORS.gold,
    primaryBright: HUD_COLORS.goldBright,
    primaryGlow: HUD_COLORS.goldGlow,
    accent: HUD_COLORS.redBright,
    accentGlow: HUD_COLORS.redGlow,
    bg: HUD_COLORS.bgDark,
    text: HUD_COLORS.textMain,
  },
  monster_combat: {
    primary: HUD_COLORS.redBright,
    primaryBright: HUD_COLORS.red,
    primaryGlow: HUD_COLORS.redGlow,
    accent: HUD_COLORS.goldBright,
    bg: 'rgba(30,5,10,0.85)',
    bgPanel: 'rgba(40,10,15,0.8)',
    text: 'rgba(255,220,220,0.92)',
  },
  psycho_attack: {
    primary: HUD_COLORS.purple,
    primaryBright: HUD_COLORS.purpleBright,
    primaryGlow: HUD_COLORS.purpleGlow,
    accent: '#FF00FF',
    bg: 'rgba(20,0,30,0.85)',
    text: 'rgba(220,200,255,0.92)',
  },
  infected: {
    primary: HUD_COLORS.green,
    primaryBright: HUD_COLORS.greenBright,
    primaryGlow: HUD_COLORS.greenGlow,
    accent: HUD_COLORS.purple,
    accentGlow: HUD_COLORS.purpleGlow,
    bg: 'rgba(5,20,10,0.85)',
    text: 'rgba(200,255,220,0.92)',
  },
  trauma: {
    primary: '#666666',
    primaryBright: '#888888',
    primaryGlow: 'rgba(102,102,102,0.3)',
    bg: 'rgba(15,15,15,0.9)',
    bgPanel: 'rgba(20,20,20,0.85)',
    text: 'rgba(180,180,180,0.8)',
  },
  evolved: {
    primary: HUD_COLORS.goldBright,
    primaryBright: '#FFFFFF',
    primaryGlow: 'rgba(255,215,0,0.6)',
    accent: '#FFFFFF',
    accentGlow: 'rgba(255,255,255,0.4)',
    bg: 'rgba(20,18,8,0.75)',
    text: '#FFFFFF',
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 폰트 규격
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const FONTS = {
  // UI 기본 - Outfit (영문) + AstaSans (한글)
  ui: '"Outfit", "AstaSans", "Rajdhani", "Noto Sans KR", system-ui, sans-serif',
  // 디스플레이 - Outfit (퓨처리즘 스타일)
  display: '"Outfit", "Orbitron", "Rajdhani", sans-serif',
  // 모노스페이스 - 터미널/로그용
  mono: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
  // 한글 - Do Hyeon (https://fonts.google.com/specimen/Do+Hyeon)
  korean: '"Do Hyeon", "Noto Sans KR", "Malgun Gothic", sans-serif',
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Win98 홀로그램 크롬 규격
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Win98 타이틀바 고도화 규격 (레퍼런스 99.99% 일치)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 골드 그라디언트 색상 (레퍼런스 기반 정확한 색상)
export const GOLD_GRADIENT = {
  light: '#C9A227',     // 밝은 골드 (상단)
  mid: '#8B7355',       // 중간 골드
  dark: '#5A4A32',      // 어두운 골드 (하단)
  highlight: '#E8D5A3', // 하이라이트/아이콘
  cream: 'rgba(232,213,163,0.6)', // 버튼 테두리
} as const

// 스캔라인 패턴 (모든 패널에 적용)
export const SCANLINE_PATTERN = `repeating-linear-gradient(
  0deg,
  transparent 0px,
  transparent 1px,
  rgba(0,0,0,0.15) 1px,
  rgba(0,0,0,0.15) 2px
)`

export const TITLEBAR_SPEC = {
  height: 44,  // 레퍼런스: 약 40-50px (28→44로 증가)
  // 골드 그라디언트 + 스캔라인
  background: `
    ${SCANLINE_PATTERN},
    linear-gradient(180deg, 
      ${GOLD_GRADIENT.light} 0%, 
      ${GOLD_GRADIENT.mid} 50%, 
      ${GOLD_GRADIENT.dark} 100%
    )
  `,
  titleText: {
    paddingLeft: 14,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#1A1A15',  // 어두운 색 (골드 배경 위)
    textShadow: `0 1px 0 ${GOLD_GRADIENT.highlight}`,  // 엠보싱 효과
  },
  buttons: {
    count: 3,           // ─ □ ✕
    size: 32,           // 16→32로 증가 (레퍼런스 기반)
    spacing: 2,
    borderRadius: 6,    // 둥근 모서리
    border: `2px solid ${GOLD_GRADIENT.cream}`,
    background: `
      ${SCANLINE_PATTERN},
      linear-gradient(180deg, rgba(90,74,50,0.6) 0%, rgba(60,50,35,0.8) 100%)
    `,
    iconColor: GOLD_GRADIENT.highlight,
    hoverGlow: `0 0 12px ${HUD_COLORS.goldGlow}`,
    symbols: ['─', '□', '✕'] as const,
  },
}

export const RESIZE_HANDLES = {
  size: 6,
  color: '#FFFFFF',
  border: `1px solid ${HUD_COLORS.faintLine}`,
  positions: ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] as const,
  visibleOnlyWhenActive: true,
}

export const WINDOW_SPEC = {
  // 외곽 테두리 (2중) - 레퍼런스: 밝은 골드 외곽선
  outerBorder: `1px solid ${GOLD_GRADIENT.light}`,
  innerBorder: `1px solid ${GOLD_GRADIENT.dark}`,
  // 글로우 효과 (강화)
  glow: `0 0 1px ${GOLD_GRADIENT.light}, 0 0 15px ${HUD_COLORS.goldGlow}`,
  glowStrong: `0 0 1px ${GOLD_GRADIENT.light}, 0 0 25px ${HUD_COLORS.goldGlowStrong}`,
  glowSoft: `0 0 1px ${GOLD_GRADIENT.light}, 0 0 8px ${HUD_COLORS.goldGlowSoft}`,
  // 글래스 바디 + 스캔라인
  bodyBackground: `
    ${SCANLINE_PATTERN},
    linear-gradient(180deg, rgba(20,20,18,0.95) 0%, rgba(15,15,12,0.98) 100%)
  `,
  bodyBackgroundColor: 'rgba(10,10,8,0.85)',
  backdropBlur: HUD_COLORS.glassBlur,
  // 모서리 (약간의 둥근 모서리)
  borderRadius: 4,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 육각형 배경 (Hex Backdrop)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const HEX_BACKDROP = {
  hexSize: 60,
  lineColor: HUD_COLORS.hexLine,
  fillColor: HUD_COLORS.hexFill,
  lineWidth: 1,
  distribution: {
    center: 'sparse' as const,     // 중앙은 성기게
    edges: 'dense' as const,       // 좌우 가장자리 밀집
  },
  parallax: {
    enabled: true,
    strength: 0.5,                 // 0.5~1.5% 이동
    target: 'background' as const, // 배경만 적용, 창은 고정
  },
  edgeBloom: {
    enabled: true,
    color: 'rgba(255,255,255,0.08)',
    width: 150,                     // 가장자리 빛 번짐 너비
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 전역 효과 레이어
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCANLINE_SETTINGS = {
  spacing: 3,
  opacity: 0.18,
  color: 'rgba(0,0,0,0.12)',
}

export const NOISE_SETTINGS = {
  textureSize: 256,
  blendMode: 'soft-light' as const,
  opacity: 0.08,
  animationSpeed: 60,
}

export const VIGNETTE_SETTINGS = {
  intensity: 0.12,
  radius: 0.8,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 핵심 컴포넌트 규격
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 듀얼 헥사곤 포트레이트 (SOYOUNG/RUBIAN)
export const DUAL_HEX_PORTRAIT = {
  hexSize: 128,
  hexStroke: 2,
  hexGlow: `drop-shadow(0 0 18px ${HUD_COLORS.goldGlowSoft})`,
  connector: {
    type: 'glowing-line' as const,
    width: 32,
    height: 2,
    color: HUD_COLORS.gold,
    animate: 'pulse' as const,
  },
  nameLabel: {
    font: FONTS.display,
    size: 28,
    color: HUD_COLORS.goldBright,
    glow: `0 0 12px ${HUD_COLORS.goldGlow}`,
  },
}

// BIOLOGICAL 레이더 차트
export const BIO_RADAR = {
  axes: ['STR', 'AGI', 'DEX', 'VIT', 'INT', 'LUK'] as const,
  size: 180,
  rings: 5,
  colors: {
    axis: HUD_COLORS.goldDim,
    fill: 'rgba(212,160,23,0.2)',
    stroke: HUD_COLORS.gold,
    labels: HUD_COLORS.textMain,
  },
  animation: {
    onUpdate: 'ease-out' as const,
    duration: 500,
  },
}

// THERMAL LEVEL ("HIGH")
export const THERMAL_LEVEL = {
  text: 'HIGH',
  font: FONTS.display,
  fontSize: 72,
  color: HUD_COLORS.goldBright,
  glow: `0 0 20px ${HUD_COLORS.goldGlowStrong}`,
  blur: false,  // 텍스트 blur 금지
  heartbeatLine: {
    visible: true,
    color: 'rgba(255,215,0,0.3)',
    thickness: 1,
  },
}

// HEALTH 바 (세그먼트)
export const HEALTH_BAR = {
  segmentCount: 50,
  segmentWidth: 8,
  segmentHeight: 16,
  segmentGap: 2,
  colors: {
    filled: HUD_COLORS.gold,
    empty: 'rgba(212,160,23,0.15)',
    critical: HUD_COLORS.red,  // 20% 이하
  },
  animation: {
    decrease: 'left-to-right' as const,
    duration: 200,
  },
  label: {
    text: 'HEALTH',
    position: 'right' as const,
    font: FONTS.mono,
  },
}

// CONNECTION COMPLETE 배너
export const CONNECTION_BANNER = {
  text: 'CONNECTION COMPLETE',
  font: FONTS.display,
  fontSize: 32,
  color: HUD_COLORS.textMain,
  position: 'center-bottom' as const,
  animation: {
    enter: {
      type: 'slide-up' as const,
      from: { y: 50, opacity: 0 },
      to: { y: 0, opacity: 1 },
      duration: 220,
      easing: 'ease-out' as const,
    },
    exit: {
      delay: 600,
      type: 'fade' as const,
      duration: 300,
    },
  },
  background: {
    type: 'hazard-stripe' as const,
    opacity: 0.3,
  },
}

// Hazard Stripe 패널
export const HAZARD_STRIPE = {
  stripeWidth: 20,
  stripeAngle: 45,
  colors: {
    primary: HUD_COLORS.hazardYellow,
    secondary: HUD_COLORS.hazardBlack,
  },
  opacity: 0.85,
  animation: {
    scroll: true,
    speed: 20,  // px/s
    direction: 'left' as const,
  },
  warningIcon: {
    type: 'triangle-exclamation' as const,
    visible: true,
  },
  defaultVisible: false,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 안내 모달 ("게임 시간입니다")
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const INTRO_MODAL = {
  position: 'center' as const,
  width: 600,
  height: 200,
  background: {
    type: 'glass' as const,
    blur: 12,
    border: `1px solid ${HUD_COLORS.borderHighlight}`,
  },
  titlebar: {
    visible: true,
    height: 28,
    buttons: true,
  },
  content: {
    lines: [
      '게임 시간입니다',
      '몽단 섭취 후 드림 마스크를 써주세요',
    ],
    font: FONTS.korean,
    fontSize: 28,
    lineHeight: 1.6,
    color: HUD_COLORS.goldBright,
    glow: `0 0 12px ${HUD_COLORS.goldGlow}`,
  },
  bloomEffect: {
    enabled: true,
    position: 'edges' as const,
    color: '#FFFFFF',
    intensity: 0.3,
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 정의 (줄콘티 대응)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCENARIOS: Record<HexaScenarioId, {
  name: string
  koreanName: string
  description: string
  shortcut: string
  sceneRef?: string  // 줄콘티 참조
}> = {
  idle: {
    name: 'EXPLORATION',
    koreanName: '기본 탐색',
    description: '루미나우드 탐험',
    shortcut: '1',
    sceneRef: 'Scene 8 (초반)',
  },
  link_progress: {
    name: 'LINK IN PROGRESS',
    koreanName: '접속 진행',
    description: '블랙룸 진입, 신경 연결 중',
    shortcut: '2',
    sceneRef: 'Scene 8: LINK IN PROGRESS',
  },
  persona_sync: {
    name: 'PERSONA SYNC',
    koreanName: '페르소나 동기화',
    description: '페르소나의 이름을 불러 접속하세요',
    shortcut: '3',
    sceneRef: 'Scene 8: 접속중 → 접속 완료',
  },
  profile_danger: {
    name: 'PROFILE - DANGER ZONE',
    koreanName: '프로필 위험',
    description: '페르소나 소개 + 동기화 UI',
    shortcut: '4',
    sceneRef: 'Scene 9-10: 매지코/루비안 소개',
  },
  monster_combat: {
    name: 'COMBAT ALERT',
    koreanName: '몬스터 전투',
    description: '랩틸리언 전투',
    shortcut: '5',
    sceneRef: 'Scene 12: 랩틸리언 등장',
  },
  psycho_attack: {
    name: 'PSYCHO ANALYSIS',
    koreanName: '심리 공격',
    description: '수빈사랑 - 미래 분기',
    shortcut: '6',
    sceneRef: 'Scene 11: 심리 공격',
  },
  infected: {
    name: 'VIRAL CORRUPTION',
    koreanName: '감염 상태',
    description: '매지코 썩음, 시스템 오염',
    shortcut: '7',
    sceneRef: 'Scene 9: 매지코 내장 부패',
  },
  trauma: {
    name: 'TRAUMA DUNGEON',
    koreanName: '트라우마',
    description: '과거의 상처가 현실이 되는 공간',
    shortcut: '8',
    sceneRef: '확장 콘텐츠',
  },
  evolved: {
    name: 'LIMIT RELEASED',
    koreanName: '진화 완료',
    description: '타임캡슐 + 초진화',
    shortcut: '9',
    sceneRef: '확장 콘텐츠',
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 캐릭터 정보 (몽중게임 시나리오 기반)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CHARACTERS = {
  // 주인공들
  jihun: {
    realName: '지훈',
    personaName: '매지코',
    englishName: 'MAGICO',
    type: 'WIZARD',
    status: 'infected',  // Scene 9에서 썩어가는 상태
  },
  soyoung: {
    realName: '소영',
    personaName: '루비안',
    englishName: 'RUBIAN',
    type: 'SUPPORT',
    status: 'normal',
  },
  minjun: {
    realName: '민준',
    personaName: '수빈사랑',
    englishName: 'SUBIN_LOVE',
    type: 'TANK',
    status: 'trauma',  // Scene 11에서 로드킬 상태
  },

  // 적
  reptilian: {
    name: '랩틸리언',
    englishName: 'REPTILIAN',
    level: 45,
    threatLevel: 'high' as const,
    hp: 850,
    maxHp: 1000,
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 애니메이션 Easing 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const easing = {
  linear: (t: number) => t,
  inSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  outSine: (t: number) => Math.sin((t * Math.PI) / 2),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 전환 효과 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type TransitionType =
  | 'fade'
  | 'glitch'
  | 'pixelate'
  | 'flash'
  | 'shatter'

export const TRANSITION_DURATION: Record<TransitionType, number> = {
  fade: 500,
  glitch: 800,
  pixelate: 600,
  flash: 300,
  shatter: 1000,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 시나리오 테마 가져오기
export const getScenarioTheme = (scenario: HexaScenarioId): ThemeOverride => {
  return SCENARIO_THEME[scenario]
}

// 색상 헬퍼
export const applyGlow = (color: string, blur: number = 12): string => {
  return `0 0 ${blur}px ${color}`
}

// 헥사곤 포인트 계산
export const getHexagonPoints = (cx: number, cy: number, size: number): string => {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2  // 꼭지점이 위쪽을 향하도록
    const x = cx + size * Math.cos(angle)
    const y = cy + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}
