/**
 * Dream Persona HUD Remaster - 시나리오별 HUD 렌더링
 * 
 * 5가지 시나리오 (DREAM-PERSONA-HUD-DESIGN.md 기반):
 * 1. SYNC - 신경 동기화 (Blue)
 * 2. COMBAT - 전투 경보 (Red)
 * 3. INFECTED - 바이러스 감염 (Purple)
 * 4. TRAUMA - 트라우마 던전 (Grey)
 * 5. EVOLVED - 최종 진화 (Gold)
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * ARWES 프레임워크 직접 사용 (https://github.com/arwes/arwes):
 * - arwesCore.ts: easing, OctagonFrame, KranoxFrame, GridLines 직접 복사
 * - 시나리오 전환 트랜지션 애니메이션 (UI 변신 효과)
 * - OS 스타일 창 컨트롤 버튼 (최소화/최대화/닫기)
 * - Hit Marker 효과 (공격 시 피격 표시)
 * - 로그인/접속 팝업 UI
 * 
 * react-vfx / vfx-js 라이브러리 셰이더 적용:
 * - glitch: 데미지/피격 시
 * - rgbShift: 전투 중 데미지
 * - rgbGlitch: 감염 상태
 * - chromatic: 색수차 효과
 * - rainbow: 진화 상태
 * - grayscale: 트라우마 상태
 * ════════════════════════════════════════════════════════════════════════════
 */

import {
  type DrawContext,
  type HUDState,
  type ScenarioId,
  drawFrameCorners,
  drawFrameBackground,
  drawGridLines,
  drawDots,
  drawMovingLines,
  drawPuffs,
  drawIlluminator,
  drawDecipherText,
  decipherText,
  glitchText,
  drawScanlines,
  drawVignette,
  drawHologramEffect,
  drawCurvedScreenEffect,
  drawWin98Frame,
  decipherTextForScenario,
  THEMES,
  SCENARIOS,
  FONTS,
  easing,
  SCENARIO_COLORS,
  WIN98_THEMES,
} from './arwesDrawing'

// ARWES 코드 직접 사용
import {
  arwesEasing,
  drawArwesOctagonFrame,
  drawArwesKranoxFrame,
  drawArwesGridLines,
  drawWindowControls,
  drawHitMarker,
  drawLoginPopup,
  drawWin98Window,
  drawDayIndicator,
  drawTeamPanel,
  drawQuestPanel,
  type HitMarker,
  type LoginPopupState,
  type TeamMember,
  type Quest,
} from './arwesCore'

import { CHARACTERS, SCENARIO_WIN98_THEME, type Win98Theme } from './constants'

// VFX 셰이더 타입 (react-vfx에서 가져옴)
import type { VFXShaderPreset } from './vfxShaders'
import { SCENARIO_VFX_MAPPING } from './vfxShaders'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 확장된 상태 타입 (Hit Marker, 트랜지션 등)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ExtendedHUDState extends HUDState {
  hitMarkers: HitMarker[]
  loginPopup: LoginPopupState
  scenarioTransition: {
    fromScenario: ScenarioId | null
    progress: number
    startTime: number
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 공통 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 범용 패널 그리기 함수
 * Win98 프레임, ARWES 프레임 등 여러 스타일 지원
 */
function drawPanel(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  title: string,
  scenario: ScenarioId,
  time: number,
  options: { 
    glitch?: number
    showControls?: boolean
    frameStyle?: 'win98' | 'corners' | 'octagon' | 'kranox'
    transitionProgress?: number
    animated?: boolean
  } = {}
) {
  const theme = THEMES[scenario]
  const colors = SCENARIO_COLORS[scenario]
  const { 
    glitch = 0, 
    showControls = true,
    frameStyle = 'win98',  // 기본값을 Win98로 변경
    transitionProgress = 1,
    animated = true,
  } = options

  // 트랜지션 진행도에 따른 스케일/알파
  const scale = arwesEasing.outBack(transitionProgress)
  const alpha = arwesEasing.outQuad(transitionProgress)

  ctx.save()
  ctx.globalAlpha = alpha

  // 타이틀 처리 (글리치 효과)
  const displayTitle = glitch > 0 ? glitchText(title, glitch) : title

  // 프레임 스타일에 따른 렌더링
  if (frameStyle === 'win98') {
    // 새로운 Win98 스타일 프레임 사용
    drawWin98Frame(
      ctx,
      {
        x, y,
        width: w,
        height: h,
        title: displayTitle.replace(/[\[\]]/g, ''), // [ ] 제거
        theme: SCENARIO_WIN98_THEME[scenario],
        showControls,
        animated,
      },
      time
    )
  } else if (frameStyle === 'octagon') {
    drawArwesOctagonFrame(
      ctx,
      { x, y, w, h, squareSize: 12 },
      colors.frameMain,
      colors.bgPrimary,
      time,
      transitionProgress
    )
    // 타이틀
    ctx.font = `bold 11px ${FONTS.mono}`
    ctx.fillStyle = colors.textPrimary
    ctx.shadowColor = colors.glowColor
    ctx.shadowBlur = 6
    ctx.fillText(displayTitle, x + 12, y + 18)
  } else if (frameStyle === 'kranox') {
    drawArwesKranoxFrame(
      ctx,
      { x, y, w, h, squareSize: 10, smallLineLength: 12, largeLineLength: 40 },
      colors.frameMain,
      colors.bgPrimary,
      time,
      transitionProgress
    )
    // 타이틀
    ctx.font = `bold 11px ${FONTS.mono}`
    ctx.fillStyle = colors.textPrimary
    ctx.shadowColor = colors.glowColor
    ctx.shadowBlur = 6
    ctx.fillText(displayTitle, x + 12, y + 18)
  } else {
    // 기본 코너 프레임
    drawFrameBackground(ctx, x, y, w, h, scenario, 0.85)
    drawFrameCorners(ctx, x, y, w, h, scenario, time, { 
      cornerLength: 12 * scale,
      progress: transitionProgress
    })
    // 타이틀
    ctx.font = `bold 11px ${FONTS.mono}`
    ctx.fillStyle = theme.main(4)
    ctx.shadowColor = theme.main(3)
    ctx.shadowBlur = 6
    ctx.fillText(displayTitle, x + 12, y + 18)
    
    // OS 스타일 창 컨트롤 버튼
    if (showControls && transitionProgress > 0.5) {
      drawWindowControls(
        ctx,
        { x: x + w - 50, y: y + 14, theme: SCENARIO_WIN98_THEME[scenario] },
        time
      )
    }
  }

  ctx.restore()
}

function drawProgressBar(
  ctx: DrawContext,
  x: number, y: number, w: number, h: number,
  value: number, maxValue: number,
  scenario: ScenarioId,
  options: { label?: string; danger?: boolean; glow?: boolean } = {}
) {
  const theme = THEMES[scenario]
  const ratio = Math.max(0, Math.min(1, value / maxValue))
  const { label, danger = false, glow = true } = options

  ctx.save()

  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x, y, w, h)

  // 진행바
  const barColor = danger ? THEMES.combat.main(3) : theme.main(3)
  ctx.fillStyle = barColor
  if (glow) {
    ctx.shadowColor = barColor
    ctx.shadowBlur = 10
  }
  ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)

  // 테두리
  ctx.strokeStyle = theme.main(2)
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  // 라벨
  if (label) {
    ctx.font = `bold 10px ${FONTS.mono}`
    ctx.fillStyle = theme.text(4)
    ctx.textAlign = 'left'
    ctx.shadowBlur = 0
    ctx.fillText(label, x + 4, y + h - 4)
    
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.floor(value)}/${maxValue}`, x + w - 4, y + h - 4)
  }

  ctx.restore()
}

function drawTargetingReticle(
  ctx: DrawContext,
  x: number, y: number,
  scenario: ScenarioId,
  time: number,
  options: { locked?: boolean; size?: number; firing?: boolean } = {}
) {
  const theme = THEMES[scenario]
  const { locked = false, size = 20, firing = false } = options

  ctx.save()
  
  // 발사 시 색상/크기 변화
  const fireScale = firing ? 1.2 : 1
  const displaySize = size * fireScale
  
  ctx.strokeStyle = locked ? THEMES.combat.main(4) : theme.main(3)
  if (firing) {
    ctx.strokeStyle = '#FFFFFF'
  }
  
  ctx.lineWidth = firing ? 3 : 2
  ctx.shadowColor = ctx.strokeStyle as string
  ctx.shadowBlur = locked ? 15 : (firing ? 20 : 8)

  // 크로스헤어 라인 (발사 시 반동 효과)
  const gap = firing ? 12 : 8
  ctx.beginPath()
  ctx.moveTo(x - displaySize, y)
  ctx.lineTo(x - gap, y)
  ctx.moveTo(x + gap, y)
  ctx.lineTo(x + displaySize, y)
  ctx.moveTo(x, y - displaySize)
  ctx.lineTo(x, y - gap)
  ctx.moveTo(x, y + gap)
  ctx.lineTo(x, y + displaySize)
  ctx.stroke()

  // 중앙 점
  ctx.fillStyle = ctx.strokeStyle as string
  ctx.beginPath()
  ctx.arc(x, y, firing ? 4 : 3, 0, Math.PI * 2)
  ctx.fill()

  // 락온 시 추가 박스 (ARWES FrameCorners 스타일)
  if (locked) {
    const boxSize = 45 + Math.sin(time * 5) * 5
    drawFrameCorners(ctx, x - boxSize, y - boxSize, boxSize * 2, boxSize * 2, 'combat', time, { 
      cornerLength: 10,
      strokeWidth: 2 
    })
    
    // 락온 회전 링 (ARWES 스타일)
    ctx.beginPath()
    ctx.arc(x, y, boxSize + 10, time * 2, time * 2 + Math.PI * 0.5)
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y, boxSize + 10, time * 2 + Math.PI, time * 2 + Math.PI * 1.5)
    ctx.stroke()
  }

  // 발사 시 추가 플래시 효과
  if (firing) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.beginPath()
    ctx.arc(x, y, displaySize * 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #1: NORMAL (기본 HUD) - 문서 기준 Gold/Yellow 테마
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawNormalScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { time, mouse, player } = state
  const theme = THEMES.normal
  const colors = SCENARIO_COLORS.normal

  // ═══════════════════════════════════════════════════════════════
  // 배경 효과들 (골드 그리드)
  // ═══════════════════════════════════════════════════════════════
  drawGridLines(ctx, w, h, 'normal', time, 0.35)
  drawDots(ctx, w, h, 'normal', time, { x: w / 2, y: h / 2 }, 0.8)
  
  // 홀로그램 효과 (깜빡임, 색수차, 노이즈)
  drawHologramEffect(ctx, w, h, time, {
    flickerFrequency: 0.08,
    chromaticOffset: 1,
    noiseDensity: 0.015,
    baseColor: colors.frameMain
  })
  
  // CRT 커브 효과
  drawCurvedScreenEffect(ctx, w, h, 0.12)

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: BIOLOGICAL ANALYSIS (좌상단)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, 20, 80, 240, 140, 'BIOLOGICAL ANALYSIS', 'normal', time)

  // Bio Panel 내용
  ctx.save()
  ctx.font = `13px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  const bioY = 115
  ctx.fillText(`PERSONA: ${CHARACTERS.player.englishName}`, 35, bioY)
  ctx.fillText(`TYPE: ${CHARACTERS.player.type}`, 35, bioY + 18)
  
  // 동기화 바
  drawProgressBar(ctx, 35, bioY + 30, 200, 14, 100, 100, 'normal', { label: 'SYNC' })
  
  // 심박 그래프
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 1.5
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 4
  ctx.beginPath()
  for (let i = 0; i < 180; i++) {
    const gx = 35 + i
    const phase = (i / 30 + time * 3) * Math.PI
    const beat = (phase % (Math.PI * 2)) / (Math.PI * 2)
    let gy = bioY + 75
    if (beat > 0.4 && beat < 0.45) gy -= 15
    else if (beat > 0.45 && beat < 0.5) gy += 20
    else if (beat > 0.5 && beat < 0.55) gy -= 10
    else gy += Math.sin(phase * 0.5) * 2
    
    if (i === 0) ctx.moveTo(gx, gy)
    else ctx.lineTo(gx, gy)
  }
  ctx.stroke()
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: STATUS (우상단)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, w - 220, 80, 200, 130, 'STATUS', 'normal', time)

  ctx.save()
  ctx.font = `12px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  const statusX = w - 205
  ctx.fillText(`LEVEL: ${CHARACTERS.player.level}`, statusX, 115)
  ctx.fillText('CLASS: WIZARD', statusX, 133)
  ctx.fillText('LOCATION:', statusX, 155)
  ctx.font = `12px ${FONTS.korean}`
  ctx.fillText('루미나우드 숲', statusX, 173)
  ctx.restore()

  // DAY 표시
  drawDayIndicator(ctx as CanvasRenderingContext2D, w - 25, 60, 1, colors.textPrimary, time)

  // 퀘스트 표시
  drawQuestPanel(
    ctx as CanvasRenderingContext2D,
    w - 205, 195, 180,
    { name: '렙틸리언 처치', progress: 3, total: 5 },
    colors.frameMain,
    time
  )

  // ═══════════════════════════════════════════════════════════════
  // 팀원 상태 패널 (하단)
  // ═══════════════════════════════════════════════════════════════
  const teamData: TeamMember[] = CHARACTERS.team.map(t => ({
    realName: t.realName,
    personaName: t.personaName,
    type: t.type,
    hp: t.hp,
    maxHp: t.maxHp
  }))
  drawTeamPanel(
    ctx as CanvasRenderingContext2D,
    20, h - 120, 280,
    teamData,
    colors.frameMain,
    colors.bgPrimary,
    time
  )

  // ═══════════════════════════════════════════════════════════════
  // 하단 HP/MP 바
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  const barY = h - 45
  const barW = 350
  const barX = (w - barW) / 2
  
  ctx.fillStyle = colors.bgPrimary
  ctx.fillRect(barX - 10, barY - 8, barW + 20, 35)
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 1
  ctx.strokeRect(barX - 10, barY - 8, barW + 20, 35)

  // HP 바
  drawProgressBar(ctx, barX, barY, barW * 0.6 - 10, 16, player.health, player.maxHealth, 'normal', { label: 'HP' })
  
  // MP 바
  drawProgressBar(ctx, barX + barW * 0.6, barY, barW * 0.4, 16, 40, 100, 'normal', { label: 'MP' })
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 골드 크로스헤어
  // ═══════════════════════════════════════════════════════════════
  drawTargetingReticle(ctx, mouse.x, mouse.y, 'normal', time, { size: 22 })

  // Illuminator (골드 글로우)
  drawIlluminator(ctx, mouse.x, mouse.y, 'normal', 250, 0.1)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #2: SYNC (신경 동기화)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawSyncScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { time, mouse, player } = state
  const theme = THEMES.sync
  const colors = SCENARIO_COLORS.sync

  // ═══════════════════════════════════════════════════════════════
  // 배경 효과들 (Cyan 테마)
  // ═══════════════════════════════════════════════════════════════
  drawGridLines(ctx, w, h, 'sync', time, 0.4)
  drawDots(ctx, w, h, 'sync', time, { x: w / 2, y: h / 2 }, easing.outSine((time % 3) / 3))
  drawMovingLines(ctx, w, h, 'sync', time, 0.3)
  drawPuffs(ctx, w, h, 'sync', time, 0.4)

  // ═══════════════════════════════════════════════════════════════
  // 중앙 동기화 링
  // ═══════════════════════════════════════════════════════════════
  const centerX = w / 2
  const centerY = h / 2
  const ringRadius = 120

  ctx.save()
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 3
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 20

  // 외곽 링
  ctx.beginPath()
  ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)
  ctx.stroke()

  // 동기화 진행 아크
  const syncProgress = player.syncRate / 100
  ctx.strokeStyle = colors.frameLight
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(centerX, centerY, ringRadius - 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * syncProgress)
  ctx.stroke()

  // 회전하는 노드들
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + time * 0.5
    const nx = centerX + Math.cos(angle) * ringRadius
    const ny = centerY + Math.sin(angle) * ringRadius
    
    ctx.fillStyle = colors.frameLight
    ctx.beginPath()
    ctx.arc(nx, ny, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()

  // 동기화 텍스트
  ctx.save()
  ctx.font = `bold 18px ${FONTS.display}`
  ctx.fillStyle = colors.textPrimary
  ctx.textAlign = 'center'
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 15
  ctx.fillText('SYNCHRONIZING...', centerX, centerY - 30)
  
  ctx.font = `bold 32px ${FONTS.display}`
  ctx.fillText(`${player.syncRate.toFixed(0)}%`, centerX, centerY + 15)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: Bio Panel (좌상단)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, 20, 80, 240, 140, 'BIOLOGICAL ANALYSIS', 'sync', time)
  
  ctx.save()
  ctx.font = `14px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  ctx.fillText(`PERSONA: ${CHARACTERS.player.englishName}`, 35, 115)
  ctx.fillText(`TYPE: ${CHARACTERS.player.type}`, 35, 135)
  
  // 동기화 바
  drawProgressBar(ctx, 35, 150, 200, 14, player.syncRate, 100, 'sync', { label: 'SYNC' })
  
  // 심박 그래프
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i < 180; i++) {
    const gx = 35 + i
    const phase = (i / 30 + time * 3) * Math.PI
    const beat = (phase % (Math.PI * 2)) / (Math.PI * 2)
    let gy = 195
    if (beat > 0.4 && beat < 0.45) gy -= 15
    else if (beat > 0.45 && beat < 0.5) gy += 20
    else if (beat > 0.5 && beat < 0.55) gy -= 10
    else gy += Math.sin(phase * 0.5) * 2
    
    if (i === 0) ctx.moveTo(gx, gy)
    else ctx.lineTo(gx, gy)
  }
  ctx.stroke()
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: Persona Info (우상단)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, w - 220, 80, 200, 100, 'PERSONA STATUS', 'sync', time)
  ctx.save()
  ctx.font = `12px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  ctx.fillText(`LEVEL: ${CHARACTERS.player.level}`, w - 205, 115)
  ctx.fillText('NEURAL LINK: STABLE', w - 205, 135)
  ctx.fillText('BOND: ████████ 92%', w - 205, 155)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 타겟팅 레티클 (펄스)
  // ═══════════════════════════════════════════════════════════════
  const pulseSize = 20 + Math.sin(time * 4) * 3
  drawTargetingReticle(ctx, mouse.x, mouse.y, 'sync', time, { size: pulseSize })

  // Illuminator (Cyan 글로우)
  drawIlluminator(ctx, mouse.x, mouse.y, 'sync', 250, 0.08)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #2: COMBAT (전투 경보)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawCombatScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState,
  extState?: ExtendedHUDState
) {
  const { time, mouse, player, target, isLocked, effects, isFiring } = state
  const theme = THEMES.combat
  const colors = SCENARIO_COLORS.combat
  const currentTime = Date.now()

  // ═══════════════════════════════════════════════════════════════
  // 경고 비네트 (붉은 톤 펄스)
  // ═══════════════════════════════════════════════════════════════
  const pulseIntensity = 0.3 + Math.sin(time * 4) * 0.15
  drawVignette(ctx, w, h, 'combat', pulseIntensity)

  // 그리드 (붉은 톤)
  drawGridLines(ctx, w, h, 'combat', time, 0.3)

  // 데미지 플래시
  if (effects.damageFlash > 0) {
    ctx.save()
    ctx.fillStyle = `rgba(255, 0, 0, ${effects.damageFlash * 0.3})`
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }

  // ═══════════════════════════════════════════════════════════════
  // 경고 배너 (깜빡임)
  // ═══════════════════════════════════════════════════════════════
  const flash = Math.sin(time * 8) > 0
  if (flash) {
    ctx.save()
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'
    ctx.fillRect(0, 60, w, 40)
    ctx.restore()
  }

  ctx.save()
  ctx.font = `bold 18px ${FONTS.display}`
  ctx.fillStyle = flash ? colors.frameMain : colors.frameDark
  ctx.textAlign = 'center'
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = flash ? 20 : 10
  ctx.fillText('⚠ THREAT DETECTED ⚠', w / 2, 88)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: 플레이어 HP (좌하단)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, 20, h - 140, 280, 110, 'VITAL SIGNS', 'combat', time)
  
  const healthRatio = player.health / player.maxHealth
  const isDanger = healthRatio < 0.3
  drawProgressBar(ctx, 35, h - 105, 250, 20, player.health, player.maxHealth, 'combat', { 
    label: 'HP', 
    danger: isDanger 
  })

  ctx.save()
  ctx.font = `12px ${FONTS.mono}`
  ctx.fillStyle = colors.textSecondary
  ctx.fillText('PAIN FEEDBACK: ACTIVE', 35, h - 65)
  ctx.fillStyle = isDanger ? colors.frameMain : colors.textMuted
  ctx.fillText(isDanger ? '!! CRITICAL !!' : 'STATUS: COMBAT', 35, h - 45)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: 타겟 정보 (우측)
  // ═══════════════════════════════════════════════════════════════
  if (target) {
    drawPanel(ctx, w - 200, 150, 180, 120, 'TARGET ANALYSIS', 'combat', time)
    
    ctx.save()
    ctx.font = `bold 14px ${FONTS.mono}`
    ctx.fillStyle = colors.frameMain
    ctx.fillText(target.name.toUpperCase(), w - 185, 185)
    
    ctx.font = `12px ${FONTS.mono}`
    ctx.fillStyle = colors.textSecondary
    ctx.fillText(`LEVEL: ${CHARACTERS.targets.reptilian.level}`, w - 185, 205)
    ctx.fillText(`DIST: ${target.distance.toFixed(1)}m`, w - 185, 225)
    
    drawProgressBar(ctx, w - 185, 235, 150, 14, target.health, target.maxHealth, 'combat', { label: 'HP' })
    ctx.restore()
  }

  // ═══════════════════════════════════════════════════════════════
  // 락온 타겟팅 (발사 상태 반영)
  // ═══════════════════════════════════════════════════════════════
  drawTargetingReticle(ctx, mouse.x, mouse.y, 'combat', time, { 
    locked: isLocked, 
    size: 25,
    firing: isFiring
  })

  // 락온 시 추가 정보
  if (isLocked && target) {
    ctx.save()
    ctx.font = `bold 12px ${FONTS.mono}`
    ctx.fillStyle = colors.frameMain
    ctx.textAlign = 'center'
    ctx.shadowColor = colors.glowColor
    ctx.shadowBlur = 10
    ctx.fillText('◆ LOCKED ◆', mouse.x, mouse.y - 60)
    ctx.fillText(target.name, mouse.x, mouse.y + 70)
    ctx.restore()
  }

  // Hit Markers 렌더링
  if (extState?.hitMarkers) {
    for (let i = extState.hitMarkers.length - 1; i >= 0; i--) {
      const marker = extState.hitMarkers[i]
      const stillActive = drawHitMarker(ctx as CanvasRenderingContext2D, marker, currentTime)
      if (!stillActive) {
        extState.hitMarkers.splice(i, 1)
      }
    }
  }

  // Illuminator (Red 글로우)
  drawIlluminator(ctx, mouse.x, mouse.y, 'combat', 200, 0.1)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #3: INFECTED (바이러스 감염)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawInfectedScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { time, mouse, player, effects } = state
  const theme = THEMES.infected
  const colors = SCENARIO_COLORS.infected
  const glitchIntensity = 0.3 + effects.glitchIntensity

  // ═══════════════════════════════════════════════════════════════
  // 글리치 배경
  // ═══════════════════════════════════════════════════════════════
  drawGridLines(ctx, w, h, 'infected', time, 0.2)
  
  // 랜덤 글리치 바
  if (Math.random() > 0.95) {
    const numBars = Math.floor(Math.random() * 3) + 1
    ctx.save()
    for (let i = 0; i < numBars; i++) {
      const y = Math.random() * h
      const barH = Math.random() * 10 + 2
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '153, 0, 255' : '0, 255, 102'}, ${Math.random() * 0.4 + 0.1})`
      ctx.fillRect((Math.random() - 0.5) * 20, y, w, barH)
    }
    ctx.restore()
  }

  // 스캔라인 (강화)
  drawScanlines(ctx, w, h, time, 0.06)

  // 비네트 (퍼플)
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6)
  gradient.addColorStop(0, 'rgba(100, 0, 150, 0)')
  gradient.addColorStop(0.7, 'rgba(100, 0, 150, 0.1)')
  gradient.addColorStop(1, 'rgba(100, 0, 150, 0.4)')
  ctx.save()
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 감염 상태 배너 (글리치 텍스트)
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  ctx.font = `bold 20px ${FONTS.display}`
  ctx.fillStyle = colors.frameMain
  ctx.textAlign = 'center'
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 15
  const statusText = glitchText('██ SYSTEM CORRUPTED ██', glitchIntensity)
  ctx.fillText(statusText, w / 2, 80)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: 감염 패널 (글리치 효과)
  // ═══════════════════════════════════════════════════════════════
  drawPanel(ctx, 20, 100, 200, 130, glitchText('VIRAL LOAD', glitchIntensity * 0.5), 'infected', time)
  
  ctx.save()
  ctx.font = `12px ${FONTS.mono}`
  ctx.fillStyle = colors.textSecondary
  ctx.fillText(glitchText('STATUS: UND█AD', glitchIntensity), 35, 135)
  
  drawProgressBar(ctx, 35, 150, 170, 14, player.infectionLevel, 100, 'infected', { label: 'VIRAL' })
  
  ctx.fillText(glitchText('DECAY RATE:', glitchIntensity), 35, 190)
  drawProgressBar(ctx, 35, 200, 170, 14, 40, 100, 'infected')
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 왜곡된 크로스헤어 (다이아몬드)
  // ═══════════════════════════════════════════════════════════════
  const distortX = mouse.x + Math.sin(time * 10) * 5 * glitchIntensity
  const distortY = mouse.y + Math.cos(time * 12) * 5 * glitchIntensity
  
  ctx.save()
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 2
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 8

  // 왜곡된 다이아몬드 형태
  const size = 30
  ctx.beginPath()
  ctx.moveTo(distortX, distortY - size)
  ctx.lineTo(distortX + size, distortY)
  ctx.lineTo(distortX, distortY + size)
  ctx.lineTo(distortX - size, distortY)
  ctx.closePath()
  ctx.stroke()

  // RGB 분리 효과 (Purple + Green)
  ctx.globalCompositeOperation = 'screen'
  ctx.strokeStyle = colors.corruptColor + '80' // Magenta
  ctx.translate(-3, 0)
  ctx.stroke()
  ctx.strokeStyle = colors.frameAccent + '80' // Green
  ctx.translate(6, 0)
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 하단 상태 (글리치)
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  ctx.font = `bold 14px ${FONTS.mono}`
  ctx.fillStyle = colors.textSecondary
  ctx.fillText(glitchText('HP ???/??? | STA█US: UND█AD', glitchIntensity), 20, h - 30)
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #4: TRAUMA (트라우마 던전)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawTraumaScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { time, mouse } = state
  const theme = THEMES.trauma
  const colors = SCENARIO_COLORS.trauma

  // ═══════════════════════════════════════════════════════════════
  // 어두운 비네트 (강화) - 절망적인 분위기
  // ═══════════════════════════════════════════════════════════════
  drawVignette(ctx, w, h, 'trauma', 0.6)

  // 희미한 그리드
  drawGridLines(ctx, w, h, 'trauma', time, 0.15)

  // 던전 이름
  ctx.save()
  ctx.font = `bold 16px ${FONTS.display}`
  ctx.fillStyle = colors.textPrimary
  ctx.textAlign = 'center'
  ctx.fillText('[ TRAUMA ZONE: HOSPITAL ROOM ]', w / 2, 80)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 중앙 ECG → 주식차트 변환 (가이드 기준: ECG가 주식차트로 변환)
  // ═══════════════════════════════════════════════════════════════
  const chartX = w / 2 - 150
  const chartY = h / 2 - 50
  const chartW = 300
  const chartH = 80

  drawPanel(ctx, chartX - 10, chartY - 30, chartW + 20, chartH + 70, 'VITAL MONITOR', 'trauma', time)

  // ECG/주식 차트 그리기
  const phase = (time % 6) / 6 // 6초 주기
  
  ctx.save()
  ctx.strokeStyle = phase < 0.5 ? colors.ecgColor : colors.chartRed
  ctx.lineWidth = 2
  ctx.shadowColor = ctx.strokeStyle as string
  ctx.shadowBlur = 5
  
  ctx.beginPath()
  for (let i = 0; i < chartW; i++) {
    const t = i / chartW
    let y = chartY + chartH / 2
    
    if (phase < 0.5) {
      // ECG 패턴
      const beatPhase = ((t * 4 + time * 2) % 1)
      if (beatPhase > 0.4 && beatPhase < 0.45) y -= 25
      else if (beatPhase > 0.45 && beatPhase < 0.5) y += 35
      else if (beatPhase > 0.5 && beatPhase < 0.55) y -= 15
      else y += Math.sin(t * 10) * 3
    } else {
      // 주식 차트 (하락)
      y = chartY + 10 + t * (chartH - 20) + Math.sin(t * 20 + time) * 10
    }
    
    if (i === 0) ctx.moveTo(chartX + i, y)
    else ctx.lineTo(chartX + i, y)
  }
  ctx.stroke()
  
  // 하락 표시
  if (phase > 0.5) {
    ctx.font = `bold 16px ${FONTS.mono}`
    ctx.fillStyle = colors.chartRed
    ctx.textAlign = 'right'
    ctx.fillText('-99.7%', chartX + chartW - 10, chartY + chartH + 20)
  }
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // Win98 스타일 창: 사신 보스 (REAPER)
  // ═══════════════════════════════════════════════════════════════
  const bossX = w / 2
  const bossY = h - 180

  drawPanel(ctx, bossX - 100, bossY - 30, 200, 120, '◈ BOSS: REAPER ◈', 'trauma', time)

  ctx.save()
  ctx.font = `14px ${FONTS.mono}`
  ctx.fillStyle = colors.textSecondary
  ctx.textAlign = 'center'
  ctx.fillText('HP: ∞ / ∞', bossX, bossY + 10)
  ctx.fillText('[IMMORTAL]', bossX, bossY + 30)
  
  ctx.font = `12px ${FONTS.korean}`
  ctx.fillStyle = colors.textMuted
  ctx.fillText('"포기하세요. 희망은 없습니다."', bossX, bossY + 55)
  ctx.restore()

  // 무한대 기호 (회전)
  ctx.save()
  ctx.translate(bossX, bossY + 75)
  ctx.rotate(time * 0.3)
  ctx.font = `bold 24px ${FONTS.mono}`
  ctx.fillStyle = colors.textSecondary
  ctx.textAlign = 'center'
  ctx.fillText('∞', 0, 0)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 희망 바 (0%) - 절망 상태
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  ctx.font = `bold 12px ${FONTS.mono}`
  ctx.fillStyle = colors.textMuted
  ctx.fillText('HOPE: ░░░░░░░░░░░░░░░░░░ 0% | ESCAPE: NONE', 20, h - 30)
  ctx.restore()

  // 희미한 타겟팅 (거의 무력)
  ctx.save()
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.5
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(mouse.x - 15, mouse.y)
  ctx.lineTo(mouse.x + 15, mouse.y)
  ctx.moveTo(mouse.x, mouse.y - 15)
  ctx.lineTo(mouse.x, mouse.y + 15)
  ctx.stroke()
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 #5: EVOLVED (최종 진화)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawEvolvedScenario(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { time, mouse, player } = state
  const theme = THEMES.evolved
  const colors = SCENARIO_COLORS.evolved

  // ═══════════════════════════════════════════════════════════════
  // 골든 파티클 효과 (ARWES Puffs)
  // ═══════════════════════════════════════════════════════════════
  drawPuffs(ctx, w, h, 'evolved', time, 0.8)

  // 골든 그리드
  drawGridLines(ctx, w, h, 'evolved', time, 0.25)
  drawDots(ctx, w, h, 'evolved', time, mouse, 1)

  // ═══════════════════════════════════════════════════════════════
  // 상단/하단 반짝이 보더 (8비트 스타일)
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  ctx.font = `14px ${FONTS.mono}`
  ctx.fillStyle = colors.particleColor
  ctx.textAlign = 'center'
  const starLine = '✦ ✧ '.repeat(20)
  ctx.fillText(starLine, w / 2, 25)
  ctx.fillText(starLine, w / 2, h - 15)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 중앙 메모리 싱크 프레임 (레트로 8비트 + 현대 홀로그램)
  // ═══════════════════════════════════════════════════════════════
  const frameX = w / 2 - 180
  const frameY = 80
  const frameW = 360
  const frameH = 120

  // 8비트 스타일 이중 테두리
  ctx.save()
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 4
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 20
  ctx.strokeRect(frameX, frameY, frameW, frameH)
  ctx.strokeRect(frameX + 8, frameY + 8, frameW - 16, frameH - 16)
  ctx.restore()

  // 텍스트
  ctx.save()
  ctx.font = `bold 18px ${FONTS.display}`
  ctx.fillStyle = colors.textPrimary
  ctx.textAlign = 'center'
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 15
  ctx.fillText('★ MEMORY SYNC: 100% ★', w / 2, frameY + 50)
  
  ctx.font = `16px ${FONTS.korean}`
  ctx.fillStyle = colors.textSecondary
  ctx.fillText('"무엇이든 가능하다"', w / 2, frameY + 85)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 캐논 조준선 (12각형) - 가이드 기준: 최강 무기
  // ═══════════════════════════════════════════════════════════════
  const cannonX = mouse.x
  const cannonY = mouse.y
  const cannonSize = 60 + Math.sin(time * 3) * 10
  const isCharging = player.evolutionProgress > 0

  ctx.save()
  ctx.strokeStyle = colors.frameMain
  ctx.lineWidth = 3
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = isCharging ? 25 : 15

  // 12각형 그리기
  ctx.beginPath()
  for (let i = 0; i <= 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2 + time * 0.5
    const px = cannonX + Math.cos(angle) * cannonSize
    const py = cannonY + Math.sin(angle) * cannonSize
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.stroke()

  // 내부 크로스
  ctx.beginPath()
  ctx.moveTo(cannonX - cannonSize * 0.5, cannonY)
  ctx.lineTo(cannonX + cannonSize * 0.5, cannonY)
  ctx.moveTo(cannonX, cannonY - cannonSize * 0.5)
  ctx.lineTo(cannonX, cannonY + cannonSize * 0.5)
  ctx.stroke()

  // 중앙 에너지 (차징 시)
  if (isCharging) {
    ctx.fillStyle = colors.particleColor
    ctx.beginPath()
    ctx.arc(cannonX, cannonY, 8 + player.evolutionProgress * 0.1, 0, Math.PI * 2)
    ctx.fill()
  }

  // 코너 노드
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const nx = cannonX + Math.cos(angle) * cannonSize
    const ny = cannonY + Math.sin(angle) * cannonSize
    
    ctx.fillStyle = colors.particleColor
    ctx.beginPath()
    ctx.arc(nx, ny, 5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()

  // 상태 정보
  ctx.save()
  ctx.font = `bold 14px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  ctx.textAlign = 'center'
  ctx.fillText(isCharging ? '[CANNON CHARGING]' : '[CANNON READY]', cannonX, cannonY + cannonSize + 30)
  ctx.restore()

  // ═══════════════════════════════════════════════════════════════
  // 하단 HP (MAX) - 최강 상태
  // ═══════════════════════════════════════════════════════════════
  ctx.save()
  drawPanel(ctx, w / 2 - 200, h - 70, 400, 40, '', 'evolved', time, { showControls: false })
  ctx.font = `bold 14px ${FONTS.mono}`
  ctx.fillStyle = colors.textPrimary
  ctx.textAlign = 'center'
  ctx.shadowColor = colors.glowColor
  ctx.shadowBlur = 10
  ctx.fillText('♥ HP ████████████████████████████ MAX | EVOLVED', w / 2, h - 42)
  ctx.restore()

  // Golden Illuminator
  drawIlluminator(ctx, mouse.x, mouse.y, 'evolved', 300, 0.12)
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오 라우터
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawScenarioHUD(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState,
  extState?: ExtendedHUDState
) {
  switch (state.scenario) {
    case 'normal':
      drawNormalScenario(ctx, w, h, state)
      break
    case 'sync':
      drawSyncScenario(ctx, w, h, state)
      break
    case 'combat':
      drawCombatScenario(ctx, w, h, state, extState)
      break
    case 'infected':
      drawInfectedScenario(ctx, w, h, state)
      break
    case 'trauma':
      drawTraumaScenario(ctx, w, h, state)
      break
    case 'evolved':
      drawEvolvedScenario(ctx, w, h, state)
      break
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 공통 HUD 요소 (시나리오 인디케이터, 키 힌트 등)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawCommonHUD(
  ctx: DrawContext,
  w: number, h: number,
  state: HUDState
) {
  const { scenario, time } = state
  const theme = THEMES[scenario]
  const scenarioInfo = SCENARIOS[scenario]

  // 상단 시나리오 인디케이터 (ARWES 스타일)
  ctx.save()
  ctx.font = `bold 12px ${FONTS.display}`
  ctx.fillStyle = theme.main(4)
  ctx.textAlign = 'center'
  ctx.shadowColor = theme.main(4)
  ctx.shadowBlur = 12
  ctx.fillText(`[ DREAM PERSONA :: ${scenarioInfo.name} ]`, w / 2, 35)
  
  ctx.font = `10px ${FONTS.mono}`
  ctx.fillStyle = theme.text(2)
  ctx.shadowBlur = 0
  ctx.fillText('프리윌소프트 | 드림 페르소나: 리마스터', w / 2, 50)
  ctx.restore()

  // 키 힌트 (하단)
  const hints = ['[1]NORMAL', '[2]SYNC', '[3]COMBAT', '[4]INFECTED', '[5]TRAUMA', '[6]EVOLVED']
  const scenarioIds: ScenarioId[] = ['normal', 'sync', 'combat', 'infected', 'trauma', 'evolved']
  ctx.save()
  ctx.font = `10px ${FONTS.mono}`
  ctx.fillStyle = theme.text(1)
  let hintX = 20
  hints.forEach((hint, i) => {
    const isActive = scenarioIds[i] === scenario
    ctx.fillStyle = isActive ? theme.main(4) : theme.text(1)
    ctx.fillText(hint, hintX, h - 10)
    hintX += ctx.measureText(hint).width + 12
  })
  ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VFX 효과 결정 (react-vfx 셰이더 적용용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface VFXResult {
  shader: VFXShaderPreset
  intensity: number
  options: Record<string, number | number[]>
}

/**
 * 현재 상태에 맞는 VFX 셰이더를 결정합니다.
 * react-vfx / vfx-js 셰이더를 후처리로 적용할 때 사용합니다.
 */
export function getScenarioVFX(state: HUDState): VFXResult {
  const { scenario, effects, player, isLocked } = state

  switch (scenario) {
    case 'normal': {
      // 기본 상태: VFX 없음 (홀로그램 효과는 캔버스에서 직접 처리)
      return { shader: 'none', intensity: 0, options: {} }
    }

    case 'sync': {
      // 동기화 중이면 pixelateTransition
      if (player.syncRate < 100) {
        return {
          shader: 'pixelateTransition',
          intensity: 1 - player.syncRate / 100,
          options: { enterTime: player.syncRate / 100 }
        }
      }
      // 완료 시 shine
      return {
        shader: 'shine',
        intensity: 0.5,
        options: {}
      }
    }

    case 'combat': {
      // 큰 데미지: glitch
      if (effects.damageFlash > 0.5) {
        return {
          shader: 'glitch',
          intensity: effects.damageFlash,
          options: {}
        }
      }
      // 데미지: rgbShift
      if (effects.damageFlash > 0) {
        return {
          shader: 'rgbShift',
          intensity: effects.damageFlash,
          options: {}
        }
      }
      // 락온: chromatic
      if (isLocked) {
        return {
          shader: 'chromatic',
          intensity: 0.3,
          options: { intensity: 0.5, radius: 0.3, power: 1.5 }
        }
      }
      return { shader: 'none', intensity: 0, options: {} }
    }

    case 'infected': {
      // 감염은 기본적으로 rgbGlitch
      const baseIntensity = 0.3 + effects.glitchIntensity * 0.7
      if (effects.glitchIntensity > 0.5) {
        return {
          shader: 'glitch',
          intensity: baseIntensity,
          options: {}
        }
      }
      return {
        shader: 'rgbGlitch',
        intensity: baseIntensity,
        options: {}
      }
    }

    case 'trauma': {
      // 트라우마는 grayscale + vignette
      return {
        shader: 'grayscale',
        intensity: 0.8,
        options: {}
      }
    }

    case 'evolved': {
      // 진화 중이면 rainbow
      if (player.evolutionProgress > 0) {
        return {
          shader: 'rainbow',
          intensity: player.evolutionProgress / 100,
          options: {}
        }
      }
      // 완료 시 shine
      return {
        shader: 'shine',
        intensity: 0.6,
        options: {}
      }
    }

    default:
      return { shader: 'none', intensity: 0, options: {} }
  }
}

export { type HUDState, type ScenarioId, type VFXShaderPreset, SCENARIO_VFX_MAPPING }
