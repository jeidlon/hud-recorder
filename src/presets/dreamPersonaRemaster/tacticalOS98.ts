/**
 * TACTICAL OS 98 - 정밀 UI 구현
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 참조 이미지 기반 99.99% 일치 구현:
 * - Image 1: System Diagnostic 화면
 * - Image 2: Tactical OS Desktop 화면
 * ════════════════════════════════════════════════════════════════════════════
 */

import type { DrawContext } from './arwesDrawing'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TACTICAL OS 98 색상 팔레트 (이미지 기반 정밀 색상)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TACTICAL_COLORS = {
    // 메인 골드 계열
    gold: '#D4A017',           // 메인 골드 (테두리, 텍스트)
    goldBright: '#FFD700',     // 밝은 골드 (강조)
    goldDim: '#8B7500',        // 어두운 골드 (그림자)
    goldMuted: '#9A7B0A',      // 중간 골드 (서브텍스트)

    // 배경
    bgDark: '#0A0A08',         // 거의 검정 배경
    bgPanel: '#0D0D0A',        // 패널 배경
    bgWindow: '#121210',       // 윈도우 배경
    bgContent: '#F5F5F0',      // 밝은 콘텐츠 영역 (맵뷰)

    // 상태 색상
    red: '#FF3333',            // REC 표시, 경고
    green: '#00FF66',          // 활성 상태

    // 테두리
    borderOuter: '#1A1A15',    // 외부 테두리
    borderInner: '#2A2A20',    // 내부 테두리

    // 그리드
    gridLine: 'rgba(212, 160, 23, 0.08)',  // 그리드 라인
    gridDot: 'rgba(212, 160, 23, 0.15)',   // 그리드 점
} as const

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 폰트 설정
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TACTICAL_FONTS = {
    primary: '"Rajdhani", "Consolas", monospace',
    mono: '"JetBrains Mono", "Fira Code", monospace',
    korean: '"Noto Sans KR", "Malgun Gothic", sans-serif',
    display: '"Orbitron", "Rajdhani", sans-serif',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상태 인터페이스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface TacticalOSState {
    time: number
    currentTime: Date
    recording: boolean
    recordTime: number
    netStatus: 'ACTIVE' | 'INACTIVE' | 'CONNECTING'
    integrity: number        // 0-100
    capacitor: { current: number; max: number }
    operator: {
        name: string
        id: string
    }
    location: {
        name: string
        nameKorean: string
        x: number
        y: number
        z: number
    }
    targetLocked: boolean
    targetSize: { width: number; height: number }
    startMenuOpen: boolean
    systemStatus: 'NORMAL' | 'ALERT' | 'STANDBY'
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [1] 배경 그리드 패턴
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawTacticalGrid(
    ctx: DrawContext,
    width: number,
    height: number,
    _time: number
): void {
    ctx.save()

    const spacing = 40

    // 수직 라인
    ctx.strokeStyle = TACTICAL_COLORS.gridLine
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x += spacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }

    // 수평 라인
    for (let y = 0; y <= height; y += spacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
    }

    // 교차점 도트
    ctx.fillStyle = TACTICAL_COLORS.gridDot
    for (let x = 0; x <= width; x += spacing) {
        for (let y = 0; y <= height; y += spacing) {
            ctx.beginPath()
            ctx.arc(x, y, 1.5, 0, Math.PI * 2)
            ctx.fill()
        }
    }

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [2] 상단 바 - NET_UPLINK, 나침반, REC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawTopBar(
    ctx: DrawContext,
    width: number,
    state: TacticalOSState
): void {
    ctx.save()

    const y = 25

    // ═══════════════════════════════════════════════════════════════
    // 좌측: NET_UPLINK 상태
    // ═══════════════════════════════════════════════════════════════

    // WiFi 아이콘
    ctx.fillStyle = state.netStatus === 'ACTIVE' ? TACTICAL_COLORS.gold : TACTICAL_COLORS.goldDim
    ctx.font = `14px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'
    ctx.fillText('📡', 20, y)

    // NET_UPLINK: ACTIVE
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `bold 14px ${TACTICAL_FONTS.primary}`
    ctx.fillText(`NET_UPLINK: ${state.netStatus}`, 45, y)

    // TACTICAL VISOR 버전
    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `11px ${TACTICAL_FONTS.mono}`
    ctx.fillText('● TACTICAL VISOR V.98.02', 45, y + 18)

    // ═══════════════════════════════════════════════════════════════
    // 중앙: 나침반 표시
    // ═══════════════════════════════════════════════════════════════

    const centerX = width / 2
    ctx.textAlign = 'center'
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `12px ${TACTICAL_FONTS.mono}`
    ctx.fillText('MN 320°', centerX - 60, y)

    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 14px ${TACTICAL_FONTS.mono}`
    ctx.fillText('N 0°', centerX, y)

    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `12px ${TACTICAL_FONTS.mono}`
    ctx.fillText('NE 45°', centerX + 60, y)

    // 구분선
    ctx.strokeStyle = TACTICAL_COLORS.goldMuted
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX - 90, y + 5)
    ctx.lineTo(centerX + 90, y + 5)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // 우측: REC 표시
    // ═══════════════════════════════════════════════════════════════

    ctx.textAlign = 'right'

    if (state.recording) {
        // REC 점멸 효과
        const blink = Math.sin(state.time * 5) > 0
        if (blink) {
            ctx.fillStyle = TACTICAL_COLORS.red
            ctx.beginPath()
            ctx.arc(width - 130, y - 4, 5, 0, Math.PI * 2)
            ctx.fill()
        }

        ctx.fillStyle = TACTICAL_COLORS.red
        ctx.font = `bold 14px ${TACTICAL_FONTS.mono}`
        ctx.fillText(`REC [${formatTime(state.recordTime)}]`, width - 20, y)
    }

    // FRAME / RES 정보
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText('FRAME: 24/s', width - 20, y + 14)
    ctx.fillText('RES: 4K', width - 20, y + 26)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [3] 메인 다이얼로그 창 (System Diagnostic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface DialogOptions {
    x: number
    y: number
    width: number
    height: number
    title: string
    time: number
}

export function drawTacticalDialog(
    ctx: DrawContext,
    options: DialogOptions
): { contentX: number; contentY: number; contentWidth: number; contentHeight: number } {
    const { x, y, width, height, title } = options

    ctx.save()

    const titleBarHeight = 28
    const borderWidth = 3
    const cornerClipSize = 12

    // ═══════════════════════════════════════════════════════════════
    // 이중 테두리 프레임
    // ═══════════════════════════════════════════════════════════════

    // 외부 테두리
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = borderWidth
    ctx.strokeRect(x, y, width, height)

    // 내부 테두리 (2px 안쪽)
    ctx.strokeStyle = TACTICAL_COLORS.goldDim
    ctx.lineWidth = 1
    ctx.strokeRect(x + 6, y + 6, width - 12, height - 12)

    // ═══════════════════════════════════════════════════════════════
    // 코너 클립 장식 (L자 모양)
    // ═══════════════════════════════════════════════════════════════

    ctx.strokeStyle = TACTICAL_COLORS.goldBright
    ctx.lineWidth = 2
    ctx.lineCap = 'square'

    // 좌상단
    ctx.beginPath()
    ctx.moveTo(x - 2, y + cornerClipSize)
    ctx.lineTo(x - 2, y - 2)
    ctx.lineTo(x + cornerClipSize, y - 2)
    ctx.stroke()

    // 우상단
    ctx.beginPath()
    ctx.moveTo(x + width - cornerClipSize, y - 2)
    ctx.lineTo(x + width + 2, y - 2)
    ctx.lineTo(x + width + 2, y + cornerClipSize)
    ctx.stroke()

    // 좌하단
    ctx.beginPath()
    ctx.moveTo(x - 2, y + height - cornerClipSize)
    ctx.lineTo(x - 2, y + height + 2)
    ctx.lineTo(x + cornerClipSize, y + height + 2)
    ctx.stroke()

    // 우하단
    ctx.beginPath()
    ctx.moveTo(x + width - cornerClipSize, y + height + 2)
    ctx.lineTo(x + width + 2, y + height + 2)
    ctx.lineTo(x + width + 2, y + height - cornerClipSize)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // 타이틀 바
    // ═══════════════════════════════════════════════════════════════

    // 타이틀 바 배경
    ctx.fillStyle = TACTICAL_COLORS.bgPanel
    ctx.fillRect(x + borderWidth, y + borderWidth, width - borderWidth * 2, titleBarHeight)

    // 타이틀 텍스트
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `bold 12px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'
    ctx.fillText(title, x + 15, y + 20)

    // 윈도우 컨트롤 버튼 (─ □ ✕)
    const btnSize = 14
    const btnY = y + 7
    const btnSpacing = 4

    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 1

    // 닫기 (✕)
    let btnX = x + width - 20
    ctx.strokeRect(btnX, btnY, btnSize, btnSize)
    ctx.beginPath()
    ctx.moveTo(btnX + 3, btnY + 3)
    ctx.lineTo(btnX + btnSize - 3, btnY + btnSize - 3)
    ctx.moveTo(btnX + btnSize - 3, btnY + 3)
    ctx.lineTo(btnX + 3, btnY + btnSize - 3)
    ctx.stroke()

    // 최대화 (□)
    btnX -= btnSize + btnSpacing
    ctx.strokeRect(btnX, btnY, btnSize, btnSize)
    ctx.strokeRect(btnX + 3, btnY + 3, btnSize - 6, btnSize - 6)

    // 최소화 (─)
    btnX -= btnSize + btnSpacing
    ctx.strokeRect(btnX, btnY, btnSize, btnSize)
    ctx.beginPath()
    ctx.moveTo(btnX + 3, btnY + btnSize / 2)
    ctx.lineTo(btnX + btnSize - 3, btnY + btnSize / 2)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // 컨텐츠 영역 배경
    // ═══════════════════════════════════════════════════════════════

    const contentX = x + 10
    const contentY = y + titleBarHeight + 10
    const contentWidth = width - 20
    const contentHeight = height - titleBarHeight - 20

    ctx.fillStyle = TACTICAL_COLORS.bgWindow
    ctx.fillRect(contentX, contentY, contentWidth, contentHeight)

    ctx.restore()

    return { contentX, contentY, contentWidth, contentHeight }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [4] 시스템 정상 콘텐츠 (방패 아이콘 + 텍스트)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawSystemNormalContent(
    ctx: DrawContext,
    x: number,
    y: number,
    width: number,
    height: number,
    time: number
): void {
    ctx.save()

    const centerX = x + width / 2
    const centerY = y + height / 2

    // ═══════════════════════════════════════════════════════════════
    // 방패 아이콘
    // ═══════════════════════════════════════════════════════════════

    const shieldY = centerY - 80
    const shieldSize = 40

    // 방패 글로우
    ctx.shadowColor = TACTICAL_COLORS.goldBright
    ctx.shadowBlur = 15 + Math.sin(time * 2) * 5

    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.beginPath()
    ctx.moveTo(centerX, shieldY - shieldSize)
    ctx.lineTo(centerX + shieldSize, shieldY - shieldSize * 0.5)
    ctx.lineTo(centerX + shieldSize, shieldY + shieldSize * 0.3)
    ctx.quadraticCurveTo(centerX, shieldY + shieldSize, centerX, shieldY + shieldSize)
    ctx.quadraticCurveTo(centerX, shieldY + shieldSize, centerX - shieldSize, shieldY + shieldSize * 0.3)
    ctx.lineTo(centerX - shieldSize, shieldY - shieldSize * 0.5)
    ctx.closePath()
    ctx.fill()

    // 체크마크
    ctx.strokeStyle = TACTICAL_COLORS.bgDark
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(centerX - 15, shieldY)
    ctx.lineTo(centerX - 5, shieldY + 10)
    ctx.lineTo(centerX + 15, shieldY - 10)
    ctx.stroke()

    ctx.shadowBlur = 0

    // ═══════════════════════════════════════════════════════════════
    // 한글 메인 텍스트
    // ═══════════════════════════════════════════════════════════════

    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 48px ${TACTICAL_FONTS.korean}`
    ctx.textAlign = 'center'
    ctx.fillText('시스템 정상', centerX, centerY + 20)

    // ═══════════════════════════════════════════════════════════════
    // 영문 상태 텍스트
    // ═══════════════════════════════════════════════════════════════

    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `12px ${TACTICAL_FONTS.mono}`
    ctx.fillText('SYSTEM NORMAL // ALL MODULES INITIALIZED', centerX, centerY + 50)

    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText('CPU: 4.2GHz | MEM: 64TB | NET: SECURE', centerX, centerY + 68)

    // ═══════════════════════════════════════════════════════════════
    // 오디오 웨이브폼 (하단)
    // ═══════════════════════════════════════════════════════════════

    const waveY = centerY + 100
    const waveWidth = 80
    const barCount = 7
    const barWidth = 6
    const barSpacing = (waveWidth - barCount * barWidth) / (barCount - 1)

    ctx.fillStyle = TACTICAL_COLORS.gold

    for (let i = 0; i < barCount; i++) {
        const barX = centerX - waveWidth / 2 + i * (barWidth + barSpacing)
        const barHeight = 8 + Math.sin(time * 3 + i * 0.8) * 12 + Math.abs(3.5 - i) * 3
        ctx.fillRect(barX, waveY - barHeight / 2, barWidth, barHeight)
    }

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [5] 하단 바 - START 버튼, 터미널 로그, 상태 표시
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawBottomBar(
    ctx: DrawContext,
    width: number,
    height: number,
    state: TacticalOSState,
    time: number
): void {
    ctx.save()

    const barY = height - 80

    // ═══════════════════════════════════════════════════════════════
    // START 버튼
    // ═══════════════════════════════════════════════════════════════

    const startBtnX = 25
    const startBtnY = height - 50
    const startBtnWidth = 100
    const startBtnHeight = 32

    // 버튼 배경 및 테두리
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 2
    ctx.strokeRect(startBtnX, startBtnY, startBtnWidth, startBtnHeight)

    // 그리드 아이콘 (3x3)
    ctx.fillStyle = TACTICAL_COLORS.gold
    const iconX = startBtnX + 12
    const iconY = startBtnY + 8
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            ctx.fillRect(iconX + col * 5, iconY + row * 5, 3, 3)
        }
    }

    // START 텍스트
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `bold 14px ${TACTICAL_FONTS.primary}`
    ctx.textAlign = 'left'
    ctx.fillText('START', startBtnX + 35, startBtnY + 21)

    // ROOT_ACCESS / DISABLED
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `9px ${TACTICAL_FONTS.mono}`
    ctx.fillText('ROOT_ACCESS', startBtnX + 5, startBtnY + 48)
    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.fillText('DISABLED', startBtnX + 75, startBtnY + 48)

    // ═══════════════════════════════════════════════════════════════
    // 터미널 로그 (중앙)
    // ═══════════════════════════════════════════════════════════════

    const logs = [
        '> Initializing core tools...',
        '> Loading "ARWES_Theme.css"...',
        '> Mount: /dev/vda1 successful',
        '> User authenticated: COMMANDER_KIM',
        '> Waiting for input_',
    ]

    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'

    const logX = 200
    logs.forEach((log, i) => {
        const alpha = 0.4 + (i / logs.length) * 0.6
        ctx.globalAlpha = alpha
        ctx.fillText(log, logX, barY + 10 + i * 14)
    })
    ctx.globalAlpha = 1

    // 커서 깜빡임
    if (Math.sin(time * 4) > 0) {
        ctx.fillStyle = TACTICAL_COLORS.gold
        ctx.fillRect(logX + 135, barY + logs.length * 14 - 2, 8, 12)
    }

    // ═══════════════════════════════════════════════════════════════
    // INTEGRITY 바 (우측)
    // ═══════════════════════════════════════════════════════════════

    const integrityX = width - 200
    const integrityY = barY
    const integrityWidth = 170
    const integrityHeight = 24

    // 라벨
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `11px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'
    ctx.fillText('INTEGRITY', integrityX, integrityY)

    ctx.textAlign = 'right'
    ctx.fillText(`${state.integrity}%`, integrityX + integrityWidth, integrityY)

    // 프로그레스 바 (세그먼트 스타일)
    const barY2 = integrityY + 8
    const segmentCount = 12
    const segmentWidth = (integrityWidth - (segmentCount - 1) * 2) / segmentCount
    const filledSegments = Math.floor((state.integrity / 100) * segmentCount)

    for (let i = 0; i < segmentCount; i++) {
        const segX = integrityX + i * (segmentWidth + 2)
        if (i < filledSegments) {
            ctx.fillStyle = TACTICAL_COLORS.gold
        } else {
            ctx.fillStyle = TACTICAL_COLORS.goldDim
            ctx.globalAlpha = 0.3
        }
        ctx.fillRect(segX, barY2, segmentWidth, integrityHeight)
        ctx.globalAlpha = 1
    }

    // ═══════════════════════════════════════════════════════════════
    // CAPACITOR 표시
    // ═══════════════════════════════════════════════════════════════

    const capY = integrityY + 50
    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'
    ctx.fillText('CAPACITOR', integrityX, capY)
    ctx.textAlign = 'right'
    ctx.fillText(`${state.capacitor.current.toString().padStart(4, '0')}/${state.capacitor.max}`, integrityX + integrityWidth, capY)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [6] 시작 메뉴 (Desktop 화면)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MenuItem {
    icon: string
    label: string
    labelKorean: string
    description: string
}

const MENU_ITEMS: MenuItem[] = [
    { icon: '⚡', label: 'Run', labelKorean: '실행', description: 'Execute command line' },
    { icon: '⚙️', label: 'Settings', labelKorean: '설정', description: 'System configuration' },
    { icon: '📄', label: 'Docs', labelKorean: '문서', description: 'Access classified files' },
    { icon: '⏻', label: 'Log Off', labelKorean: '로그오프', description: 'Terminate session' },
]

export function drawStartMenu(
    ctx: DrawContext,
    x: number,
    y: number,
    state: TacticalOSState,
    _time: number
): void {
    if (!state.startMenuOpen) return

    ctx.save()

    const menuWidth = 220
    const menuHeight = 350

    // ═══════════════════════════════════════════════════════════════
    // 메뉴 배경 및 테두리
    // ═══════════════════════════════════════════════════════════════

    ctx.fillStyle = TACTICAL_COLORS.bgPanel
    ctx.fillRect(x, y - menuHeight, menuWidth, menuHeight)

    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 2
    ctx.strokeRect(x, y - menuHeight, menuWidth, menuHeight)

    // ═══════════════════════════════════════════════════════════════
    // 상단: SYS-98 // STATUS
    // ═══════════════════════════════════════════════════════════════

    const headerY = y - menuHeight + 20

    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'left'
    ctx.fillText('SYS-98 // STATUS', x + 15, headerY)

    // X 버튼
    ctx.textAlign = 'right'
    ctx.fillText('✕', x + menuWidth - 15, headerY)

    // 구분선
    ctx.strokeStyle = TACTICAL_COLORS.goldDim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x + 10, headerY + 10)
    ctx.lineTo(x + menuWidth - 10, headerY + 10)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // 대기 모드 표시
    // ═══════════════════════════════════════════════════════════════

    const standbyY = headerY + 40

    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 16px ${TACTICAL_FONTS.korean}`
    ctx.textAlign = 'left'
    ctx.fillText('대기 모드 (Standby)', x + 15, standbyY)

    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText('SYS-98 | DIAGNOSTIC RUNNING', x + 15, standbyY + 16)

    // 눈 아이콘 박스
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.strokeRect(x + menuWidth - 55, standbyY - 15, 40, 35)
    ctx.font = `20px ${TACTICAL_FONTS.mono}`
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.textAlign = 'center'
    ctx.fillText('👁', x + menuWidth - 35, standbyY + 8)

    // ═══════════════════════════════════════════════════════════════
    // OPERATOR 정보
    // ═══════════════════════════════════════════════════════════════

    const operatorY = standbyY + 55

    // 아바타 원
    ctx.beginPath()
    ctx.arc(x + 35, operatorY + 15, 20, 0, Math.PI * 2)
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.fill()
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.stroke()

    // 아바타 얼굴 (심플)
    ctx.fillStyle = TACTICAL_COLORS.bgDark
    ctx.beginPath()
    ctx.arc(x + 35, operatorY + 12, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + 27, operatorY + 22, 16, 8)

    // OPERATOR 텍스트
    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 14px ${TACTICAL_FONTS.primary}`
    ctx.textAlign = 'left'
    ctx.fillText('OPERATOR', x + 65, operatorY + 10)

    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText(`ID: ${state.operator.id}`, x + 65, operatorY + 26)

    // 상태 바
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.fillRect(x + menuWidth - 60, operatorY + 5, 40, 4)
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `9px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'right'
    ctx.fillText('100%', x + menuWidth - 15, operatorY + 9)
    ctx.fillText('CONNECTED', x + menuWidth - 15, operatorY + 25)

    // ═══════════════════════════════════════════════════════════════
    // 메뉴 항목들
    // ═══════════════════════════════════════════════════════════════

    const menuStartY = operatorY + 60
    const itemHeight = 45

    MENU_ITEMS.forEach((item, i) => {
        const itemY = menuStartY + i * itemHeight

        // 호버 효과 시뮬레이션 (첫 번째 아이템)
        if (i === 0) {
            ctx.fillStyle = 'rgba(212, 160, 23, 0.1)'
            ctx.fillRect(x + 5, itemY - 5, menuWidth - 10, itemHeight - 5)
        }

        // 아이콘
        ctx.font = `16px ${TACTICAL_FONTS.mono}`
        ctx.fillStyle = TACTICAL_COLORS.gold
        ctx.textAlign = 'left'
        ctx.fillText(item.icon, x + 20, itemY + 12)

        // 한글 (굵게) + 영문
        ctx.font = `bold 13px ${TACTICAL_FONTS.korean}`
        ctx.fillStyle = TACTICAL_COLORS.goldBright
        ctx.fillText(`${item.labelKorean} (${item.label})`, x + 50, itemY + 12)

        // 설명
        ctx.font = `9px ${TACTICAL_FONTS.mono}`
        ctx.fillStyle = TACTICAL_COLORS.goldMuted
        ctx.fillText(item.description, x + 50, itemY + 26)
    })

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [7] 맵 뷰 창 (NAV-01 // MAP_VIEW)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawMapViewWindow(
    ctx: DrawContext,
    x: number,
    y: number,
    width: number,
    height: number,
    state: TacticalOSState,
    time: number
): void {
    ctx.save()

    // 윈도우 프레임
    const dialog = drawTacticalDialog(ctx, {
        x, y, width, height,
        title: 'NAV-01 // MAP_VIEW',
        time
    })

    // ═══════════════════════════════════════════════════════════════
    // 위치 정보 박스
    // ═══════════════════════════════════════════════════════════════

    const infoX = dialog.contentX + 10
    const infoY = dialog.contentY + 10
    const infoWidth = 180
    const infoHeight = 70

    ctx.fillStyle = TACTICAL_COLORS.bgPanel
    ctx.fillRect(infoX, infoY, infoWidth, infoHeight)
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 1
    ctx.strokeRect(infoX, infoY, infoWidth, infoHeight)

    // 한글 위치명
    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 16px ${TACTICAL_FONTS.korean}`
    ctx.textAlign = 'left'
    ctx.fillText(`위치: ${state.location.nameKorean}`, infoX + 10, infoY + 25)

    // 영문 위치명
    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `11px ${TACTICAL_FONTS.mono}`
    ctx.fillText(`(Location: ${state.location.name})`, infoX + 10, infoY + 42)

    // 좌표
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText(
        `X: ${state.location.x.toFixed(2)}   Y: ${state.location.y.toFixed(2)}   Z: ${state.location.z.toFixed(2)}`,
        infoX + 10, infoY + 58
    )

    // ═══════════════════════════════════════════════════════════════
    // 밝은 콘텐츠 영역 (지도 자리)
    // ═══════════════════════════════════════════════════════════════

    const mapX = infoX
    const mapY = infoY + infoHeight + 10
    const mapWidth = dialog.contentWidth - 20
    const mapHeight = dialog.contentHeight - infoHeight - 30

    ctx.fillStyle = TACTICAL_COLORS.bgContent
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight)

    // ═══════════════════════════════════════════════════════════════
    // 타겟 크로스헤어
    // ═══════════════════════════════════════════════════════════════

    const targetX = mapX + mapWidth / 2
    const targetY = mapY + mapHeight / 2

    // 크로스헤어 원
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(targetX, targetY, 30, 0, Math.PI * 2)
    ctx.stroke()

    // 십자 라인
    ctx.beginPath()
    ctx.moveTo(targetX - 40, targetY)
    ctx.lineTo(targetX - 15, targetY)
    ctx.moveTo(targetX + 15, targetY)
    ctx.lineTo(targetX + 40, targetY)
    ctx.moveTo(targetX, targetY - 40)
    ctx.lineTo(targetX, targetY - 15)
    ctx.moveTo(targetX, targetY + 15)
    ctx.lineTo(targetX, targetY + 40)
    ctx.stroke()

    // 타겟 크기 텍스트
    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `28px ${TACTICAL_FONTS.mono}`
    ctx.textAlign = 'center'
    ctx.fillText(`${state.targetSize.width}×${state.targetSize.height}`, targetX, targetY + 8)

    // TARGET_LOCKED 라벨
    if (state.targetLocked) {
        const labelWidth = 100
        const labelHeight = 20
        ctx.fillStyle = TACTICAL_COLORS.bgPanel
        ctx.fillRect(targetX - labelWidth / 2, targetY + 50, labelWidth, labelHeight)
        ctx.strokeStyle = TACTICAL_COLORS.gold
        ctx.strokeRect(targetX - labelWidth / 2, targetY + 50, labelWidth, labelHeight)

        ctx.fillStyle = TACTICAL_COLORS.gold
        ctx.font = `10px ${TACTICAL_FONTS.mono}`
        ctx.fillText('TARGET_LOCKED', targetX, targetY + 64)
    }

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [8] 데스크탑 헤더 바
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawDesktopHeader(
    ctx: DrawContext,
    width: number,
    state: TacticalOSState
): void {
    ctx.save()

    const headerHeight = 50

    // 상단 라인
    ctx.strokeStyle = TACTICAL_COLORS.goldDim
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, headerHeight)
    ctx.lineTo(width, headerHeight)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // 좌측: TACTICAL OS V.98
    // ═══════════════════════════════════════════════════════════════

    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 18px ${TACTICAL_FONTS.display}`
    ctx.textAlign = 'left'
    ctx.fillText('TACTICAL OS', 30, 30)

    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText('V.98', 150, 26)

    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `9px ${TACTICAL_FONTS.mono}`
    ctx.fillText('NET: CONNECTED // 5Ghz', 30, 45)

    // ═══════════════════════════════════════════════════════════════
    // 우측: 시계 및 상태
    // ═══════════════════════════════════════════════════════════════

    ctx.textAlign = 'right'

    // 신호 강도 바
    const signalX = width - 150
    const signalY = 20
    for (let i = 0; i < 4; i++) {
        const barHeight = 6 + i * 4
        ctx.fillStyle = i < 3 ? TACTICAL_COLORS.gold : TACTICAL_COLORS.goldDim
        ctx.fillRect(signalX + i * 6, signalY + 18 - barHeight, 4, barHeight)
    }

    // 시계
    const timeStr = formatClockTime(state.currentTime)
    ctx.fillStyle = TACTICAL_COLORS.goldBright
    ctx.font = `bold 24px ${TACTICAL_FONTS.mono}`
    ctx.fillText(timeStr, width - 30, 35)

    // AM/PM
    const ampm = state.currentTime.getHours() >= 12 ? 'PM' : 'AM'
    ctx.fillStyle = TACTICAL_COLORS.goldMuted
    ctx.font = `10px ${TACTICAL_FONTS.mono}`
    ctx.fillText(ampm, width - 30, 45)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [9] 데스크탑 태스크바
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawDesktopTaskbar(
    ctx: DrawContext,
    width: number,
    height: number,
    state: TacticalOSState
): void {
    ctx.save()

    const barHeight = 40
    const barY = height - barHeight

    // 태스크바 배경
    ctx.fillStyle = TACTICAL_COLORS.bgPanel
    ctx.fillRect(0, barY, width, barHeight)

    // 상단 라인
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, barY)
    ctx.lineTo(width, barY)
    ctx.stroke()

    // ═══════════════════════════════════════════════════════════════
    // START 버튼
    // ═══════════════════════════════════════════════════════════════

    const startBtnWidth = 90
    ctx.fillStyle = state.startMenuOpen ? TACTICAL_COLORS.gold : TACTICAL_COLORS.bgWindow
    ctx.fillRect(10, barY + 5, startBtnWidth, barHeight - 10)
    ctx.strokeStyle = TACTICAL_COLORS.gold
    ctx.strokeRect(10, barY + 5, startBtnWidth, barHeight - 10)

    // 그리드 아이콘
    ctx.fillStyle = state.startMenuOpen ? TACTICAL_COLORS.bgDark : TACTICAL_COLORS.gold
    for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
            ctx.fillRect(20 + c * 8, barY + 12 + r * 8, 5, 5)
        }
    }

    ctx.font = `bold 12px ${TACTICAL_FONTS.primary}`
    ctx.textAlign = 'left'
    ctx.fillText('START', 45, barY + 25)

    // ═══════════════════════════════════════════════════════════════
    // 열린 앱 버튼들
    // ═══════════════════════════════════════════════════════════════

    const apps = [
        { icon: '👁', label: 'MAP_VIEW.EXE', active: true },
        { icon: '💻', label: 'CMD_PROMPT', active: false },
    ]

    let appX = 120
    apps.forEach(app => {
        const btnWidth = 120

        ctx.fillStyle = app.active ? 'rgba(212, 160, 23, 0.2)' : 'transparent'
        ctx.fillRect(appX, barY + 5, btnWidth, barHeight - 10)
        ctx.strokeStyle = TACTICAL_COLORS.goldDim
        ctx.strokeRect(appX, barY + 5, btnWidth, barHeight - 10)

        ctx.fillStyle = TACTICAL_COLORS.gold
        ctx.font = `12px ${TACTICAL_FONTS.mono}`
        ctx.textAlign = 'left'
        ctx.fillText(`${app.icon} ${app.label}`, appX + 10, barY + 25)

        appX += btnWidth + 10
    })

    // ═══════════════════════════════════════════════════════════════
    // 우측 시스템 트레이
    // ═══════════════════════════════════════════════════════════════

    ctx.textAlign = 'right'
    ctx.fillStyle = TACTICAL_COLORS.gold
    ctx.font = `12px ${TACTICAL_FONTS.mono}`

    // 사운드, WiFi, 언어
    ctx.fillText('🔊  📶  ENG', width - 20, barY + 25)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// [10] 좌측 세로 텍스트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawSidebarText(
    ctx: DrawContext,
    height: number
): void {
    ctx.save()

    ctx.fillStyle = TACTICAL_COLORS.goldDim
    ctx.font = `bold 14px ${TACTICAL_FONTS.display}`

    // 세로 텍스트 (회전)
    ctx.translate(25, height / 2 + 80)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillText('TACTICAL OS 98', 0, 0)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 유틸리티 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function formatClockTime(date: Date): string {
    let hours = date.getHours() % 12
    if (hours === 0) hours = 12
    const mins = date.getMinutes().toString().padStart(2, '0')
    const secs = date.getSeconds().toString().padStart(2, '0')
    return `${hours.toString().padStart(2, '0')}:${mins}:${secs}`
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 렌더 함수: System Diagnostic 화면
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function renderSystemDiagnostic(
    ctx: DrawContext,
    width: number,
    height: number,
    state: TacticalOSState
): void {
    // 배경
    ctx.fillStyle = TACTICAL_COLORS.bgDark
    ctx.fillRect(0, 0, width, height)

    // 그리드 패턴
    drawTacticalGrid(ctx, width, height, state.time)

    // 상단 바
    drawTopBar(ctx, width, state)

    // 중앙 다이얼로그
    const dialogWidth = 450
    const dialogHeight = 320
    const dialogX = (width - dialogWidth) / 2
    const dialogY = (height - dialogHeight) / 2 - 40

    const content = drawTacticalDialog(ctx, {
        x: dialogX,
        y: dialogY,
        width: dialogWidth,
        height: dialogHeight,
        title: 'SYSTEM_DIAGNOSTIC.EXE',
        time: state.time
    })

    // 시스템 정상 콘텐츠
    drawSystemNormalContent(ctx, content.contentX, content.contentY, content.contentWidth, content.contentHeight, state.time)

    // 하단 바
    drawBottomBar(ctx, width, height, state, state.time)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 렌더 함수: Desktop 화면
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function renderTacticalDesktop(
    ctx: DrawContext,
    width: number,
    height: number,
    state: TacticalOSState
): void {
    // 배경
    ctx.fillStyle = TACTICAL_COLORS.bgDark
    ctx.fillRect(0, 0, width, height)

    // 그리드 패턴
    drawTacticalGrid(ctx, width, height, state.time)

    // 헤더
    drawDesktopHeader(ctx, width, state)

    // 좌측 세로 텍스트
    drawSidebarText(ctx, height)

    // 맵 뷰 창
    drawMapViewWindow(ctx, width / 2 + 50, 100, 400, 350, state, state.time)

    // 시작 메뉴 (열려있을 때)
    drawStartMenu(ctx, 10, height - 40, state, state.time)

    // 태스크바
    drawDesktopTaskbar(ctx, width, height, state)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기본 상태 생성
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function createDefaultTacticalState(): TacticalOSState {
    return {
        time: 0,
        currentTime: new Date(),
        recording: true,
        recordTime: 892, // 00:14:52
        netStatus: 'ACTIVE',
        integrity: 100,
        capacitor: { current: 307, max: 350 },
        operator: {
            name: 'OPERATOR',
            id: '2049-X',
        },
        location: {
            name: 'Luminawood',
            nameKorean: '루미나우드',
            x: 849.21,
            y: 102.44,
            z: 0.12,
        },
        targetLocked: true,
        targetSize: { width: 300, height: 300 },
        startMenuOpen: true,
        systemStatus: 'NORMAL',
    }
}
