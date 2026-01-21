import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { HUDComponentProps } from './index'

/**
 * 몽중게임 (Dream Persona) HUD
 * 
 * 7가지 시나리오 상태:
 * 1. 탐색 (Exploration) - 키: 1
 * 2. 적 감지 (Enemy Detected) - 키: 2
 * 3. 타겟 락 (Target Lock) - 키: 3
 * 4. 공격 중 (Combat Attack) - 키: 4
 * 5. 피격 (Damage Received) - 키: 5
 * 6. 레벨업 (Level Up) - 키: 6
 * 7. 위험 (Low Health) - 키: 7
 * 
 * 스타일: Retro-Futuristic (Windows 98 + Holographic Yellow)
 * 마우스 트래킹 + Curved Screen 효과
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 타입 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type HUDScenario = 
  | 'exploration'
  | 'enemy_detected' 
  | 'target_lock'
  | 'combat_attack'
  | 'damage_received'
  | 'level_up'
  | 'low_health'

interface PlayerStats {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  energy: number
  maxEnergy: number
  level: number
  exp: number
  maxExp: number
}

interface EnemyData {
  name: string
  distance: number
  threatLevel: '낮음' | '중간' | '높음' | '치명적'
  hp: number
  maxHp: number
}

interface DamageIndicator {
  id: number
  direction: number // 라디안
  timestamp: number
  amount: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 상수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SCENARIO_KEYS: Record<string, HUDScenario> = {
  '1': 'exploration',
  '2': 'enemy_detected',
  '3': 'target_lock',
  '4': 'combat_attack',
  '5': 'damage_received',
  '6': 'level_up',
  '7': 'low_health',
}

const SCENARIO_NAMES: Record<HUDScenario, string> = {
  exploration: '탐색 모드',
  enemy_detected: '적 감지',
  target_lock: '타겟 고정',
  combat_attack: '전투 중',
  damage_received: '피격',
  level_up: '레벨 업',
  low_health: '위험 상태',
}

// 몽중게임 캐릭터들
const CHARACTERS = {
  player: '매지코',
  ally1: '루비안',
  ally2: '현정사랑',
  enemy: '앨리스',
  boss: '미진부',
}

// 색상 팔레트 - Windows 98 + Holographic Yellow
const COLORS = {
  primary: '#FFD700',      // 골드 옐로우
  primaryGlow: '#FFEA00',  // 밝은 옐로우
  secondary: '#00FFFF',    // 시안
  danger: '#FF4444',       // 빨강
  dangerGlow: '#FF6666',
  success: '#00FF88',      // 초록
  warning: '#FF8800',      // 오렌지
  bg: 'rgba(20, 20, 30, 0.85)',
  bgPanel: 'rgba(40, 40, 60, 0.9)',
  border: '#FFD700',
  text: '#FFFFFF',
  textDim: 'rgba(255, 255, 255, 0.6)',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function DreamPersonaHUD({
  width,
  height,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const hasCalledReady = useRef(false)
  const onStateUpdateRef = useRef(onStateUpdate)
  onStateUpdateRef.current = onStateUpdate
  
  // 상태 업데이트 스로틀링 (100ms 간격)
  const lastStateUpdateRef = useRef(0)

  // 마우스 상태
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const [isMouseDown, setIsMouseDown] = useState(false)

  // 현재 시나리오 상태
  const [scenario, setScenario] = useState<HUDScenario>('exploration')

  // 플레이어 스탯
  const [stats, setStats] = useState<PlayerStats>({
    hp: 100,
    maxHp: 100,
    stamina: 85,
    maxStamina: 100,
    energy: 60,
    maxEnergy: 100,
    level: 4,
    exp: 750,
    maxExp: 1000,
  })

  // 적 데이터
  const [enemy, setEnemy] = useState<EnemyData>({
    name: '앨리스',
    distance: 45.5,
    threatLevel: '높음',
    hp: 850,
    maxHp: 1000,
  })

  // 타겟 락 상태
  const [isLocked, setIsLocked] = useState(false)
  const [lockProgress, setLockProgress] = useState(0)
  const [lockedPos, setLockedPos] = useState({ x: 0, y: 0 })

  // 공격 쿨타임
  const [attackCooldown, setAttackCooldown] = useState(0)
  const maxCooldown = 1.2

  // 피격 인디케이터
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([])

  // 레벨업 애니메이션 타이머
  const [levelUpTimer, setLevelUpTimer] = useState(0)

  // 글로벌 타이머 (애니메이션용)
  const [time, setTime] = useState(0)

  // 성능 최적화: 저사양 모드
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high')
  const lastFrameTime = useRef(0)
  const frameInterval = performanceMode === 'low' ? 1000 / 30 : 1000 / 60 // 30fps vs 60fps

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true
      onReady()
    }
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 키보드 이벤트 (시나리오 전환)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      
      // 1-7 키로 시나리오 전환
      if (SCENARIO_KEYS[key]) {
        const newScenario = SCENARIO_KEYS[key]
        setScenario(newScenario)

        // 시나리오별 부가 효과
        switch (newScenario) {
          case 'exploration':
            setStats(s => ({ ...s, hp: s.maxHp, stamina: 85 }))
            setIsLocked(false)
            setLockProgress(0)
            break
          case 'enemy_detected':
            setIsLocked(false)
            setLockProgress(0)
            break
          case 'target_lock':
            setLockProgress(0)
            break
          case 'combat_attack':
            setAttackCooldown(maxCooldown)
            break
          case 'damage_received':
            // 피격 시뮬레이션
            const dmg = 33
            setStats(s => ({ ...s, hp: Math.max(0, s.hp - dmg) }))
            setDamageIndicators(prev => [
              ...prev,
              { id: Date.now(), direction: Math.random() * Math.PI * 2, timestamp: Date.now(), amount: dmg }
            ])
            break
          case 'level_up':
            setStats(s => ({
              ...s,
              level: s.level + 1,
              maxHp: s.maxHp + 10,
              hp: s.maxHp + 10,
              exp: 0,
            }))
            setLevelUpTimer(3)
            break
          case 'low_health':
            setStats(s => ({ ...s, hp: 28 }))
            break
        }
      }

      // Q 키: 성능 모드 토글
      // Q 키: 성능 모드 토글
      if (e.code === 'KeyQ') {
        setPerformanceMode(prev => {
          const newMode = prev === 'high' ? 'low' : 'high'
          console.log(`[HUD] 성능 모드: ${newMode === 'high' ? '고성능 (60fps)' : '저사양 (30fps)'}`)
          return newMode
        })
      }

      // Space: 공격
      if (e.code === 'Space' && scenario === 'combat_attack') {
        if (attackCooldown <= 0) {
          setAttackCooldown(maxCooldown)
          setStats(s => ({ ...s, energy: Math.max(0, s.energy - 15) }))
          setEnemy(en => ({ ...en, hp: Math.max(0, en.hp - 50) }))
        }
      }

      // R: 체력 회복
      if (e.code === 'KeyR') {
        setStats(s => ({ ...s, hp: Math.min(s.maxHp, s.hp + 20) }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scenario, attackCooldown])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 마우스 이벤트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    setMousePos({ x, y })
  }, [width, height])

  const handleMouseDown = useCallback(() => {
    setIsMouseDown(true)
    if (scenario === 'target_lock' && !isLocked) {
      // 락온 시작
    }
  }, [scenario, isLocked])

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false)
  }, [])

  const handleClick = useCallback(() => {
    if (scenario === 'target_lock') {
      if (isLocked) {
        setIsLocked(false)
        setLockProgress(0)
      } else if (lockProgress >= 100) {
        setIsLocked(true)
        setLockedPos({ ...mousePos })
      }
    }
  }, [scenario, isLocked, lockProgress, mousePos])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 게임 로직 업데이트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1/60)

      // 쿨타임 감소
      setAttackCooldown(c => Math.max(0, c - 1/60))

      // 레벨업 타이머 감소
      setLevelUpTimer(t => Math.max(0, t - 1/60))

      // 스태미나 회복 (탐색 모드)
      if (scenario === 'exploration') {
        setStats(s => ({ ...s, stamina: Math.min(s.maxStamina, s.stamina + 0.5) }))
      }

      // 타겟 락 진행 (마우스 다운 시)
      if (scenario === 'target_lock' && isMouseDown && !isLocked) {
        setLockProgress(p => Math.min(100, p + 3))
      } else if (scenario === 'target_lock' && !isMouseDown && !isLocked) {
        setLockProgress(p => Math.max(0, p - 5))
      }

      // 오래된 피격 인디케이터 제거
      setDamageIndicators(prev => 
        prev.filter(d => Date.now() - d.timestamp < 1000)
      )

      // 에너지 천천히 회복
      setStats(s => ({ ...s, energy: Math.min(s.maxEnergy, s.energy + 0.1) }))

    }, 1000/60)

    return () => clearInterval(interval)
  }, [scenario, isMouseDown, isLocked])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Canvas 렌더링
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (timestamp: number) => {
      // 프레임 제한: 지정된 간격보다 짧으면 스킵
      const elapsed = timestamp - lastFrameTime.current
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(render)
        return
      }
      lastFrameTime.current = timestamp - (elapsed % frameInterval)

      ctx.clearRect(0, 0, width, height)

      // 저사양 모드 플래그
      const isLowPerf = performanceMode === 'low'

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Curved Screen 효과 (비네팅) - 저사양 모드에서 간소화
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (!isLowPerf) {
        drawCurvedScreenEffect(ctx, width, height)
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 스캔라인 효과 - 저사양 모드에서 비활성화
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (!isLowPerf) {
        drawScanlines(ctx, width, height, time)
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 메인 HUD 요소들
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // 좌상단: 플레이어 스탯
      drawPlayerStats(ctx, stats, scenario, time)

      // 우상단: 미니맵
      drawMinimap(ctx, width, mousePos, scenario, enemy, time)

      // 하단 중앙: 상태 표시
      drawStatusBar(ctx, width, height, scenario, stats, attackCooldown, maxCooldown, time)

      // 시나리오별 특수 UI
      switch (scenario) {
        case 'exploration':
          drawExplorationHUD(ctx, width, height, mousePos, time)
          break
        case 'enemy_detected':
          drawEnemyDetectedHUD(ctx, width, height, mousePos, enemy, time)
          break
        case 'target_lock':
          drawTargetLockHUD(ctx, width, height, mousePos, isLocked, lockedPos, lockProgress, enemy, time)
          break
        case 'combat_attack':
          drawCombatHUD(ctx, width, height, mousePos, attackCooldown, maxCooldown, stats, enemy, time)
          break
        case 'damage_received':
          drawDamageHUD(ctx, width, height, damageIndicators, time)
          break
        case 'level_up':
          drawLevelUpHUD(ctx, width, height, stats, levelUpTimer, time)
          break
        case 'low_health':
          drawLowHealthHUD(ctx, width, height, stats, time)
          break
      }

      // 크로스헤어 (공통)
      if (scenario !== 'level_up') {
        drawCrosshair(ctx, mousePos, isLocked ? lockedPos : mousePos, scenario, isLocked, time)
      }

      // 상단: 현재 시나리오 표시
      drawScenarioIndicator(ctx, width, scenario, time)

      // 하단: 키 힌트
      drawKeyHints(ctx, width, height)

      // 상태 업데이트 (스로틀링: 100ms 간격)
      const now = performance.now()
      if (now - lastStateUpdateRef.current >= 100) {
        lastStateUpdateRef.current = now
        onStateUpdateRef.current?.({
          timestamp: now,
          mouse: { x: mousePos.x, y: mousePos.y, buttons: isMouseDown ? 1 : 0 },
          targets: {
            main: { x: isLocked ? lockedPos.x : mousePos.x, y: isLocked ? lockedPos.y : mousePos.y, locked: isLocked },
          },
          customData: {
            scenario,
            stats,
            enemy,
            lockProgress,
          }
        })
      }

      // 성능 모드 표시 (우하단)
      ctx.save()
      ctx.font = '10px monospace'
      ctx.fillStyle = performanceMode === 'low' ? '#FFAA00' : '#00FF88'
      ctx.textAlign = 'right'
      ctx.fillText(`[Q] ${performanceMode === 'low' ? '저사양 30fps' : '고성능 60fps'}`, width - 20, height - 60)
      ctx.restore()

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationRef.current)
  }, [width, height, mousePos, scenario, stats, enemy, isLocked, lockedPos, lockProgress, attackCooldown, damageIndicators, levelUpTimer, time, isMouseDown, performanceMode, frameInterval])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      tabIndex={0}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: scenario === 'target_lock' ? 'crosshair' : 'default',
        outline: 'none',
        // GPU 가속 최적화
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    />
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 드로잉 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawCurvedScreenEffect(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // 비네팅 (화면 가장자리 어둡게)
  const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7)
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)')
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // 곡면 효과 (코너 라운드 그라데이션)
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.1)'
  ctx.lineWidth = 2
  
  // 코너 곡선
  const cornerRadius = 80
  const offset = 20
  
  ctx.beginPath()
  ctx.arc(offset + cornerRadius, offset + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(w - offset - cornerRadius, offset + cornerRadius, cornerRadius, -Math.PI * 0.5, 0)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(offset + cornerRadius, h - offset - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI)
  ctx.stroke()
  
  ctx.beginPath()
  ctx.arc(w - offset - cornerRadius, h - offset - cornerRadius, cornerRadius, 0, Math.PI * 0.5)
  ctx.stroke()
}

function drawScanlines(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1)
  }

  // 움직이는 스캔라인
  const scanY = (time * 100) % h
  const scanGradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
  scanGradient.addColorStop(0, 'rgba(255, 215, 0, 0)')
  scanGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.05)')
  scanGradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
  ctx.fillStyle = scanGradient
  ctx.fillRect(0, scanY - 20, w, 40)
}

function drawPlayerStats(
  ctx: CanvasRenderingContext2D, 
  stats: PlayerStats, 
  scenario: HUDScenario,
  time: number
) {
  const x = 20
  const y = 20
  const panelWidth = 280
  const panelHeight = 160

  // Windows 98 스타일 패널
  drawRetroPanel(ctx, x, y, panelWidth, panelHeight, '[ 페르소나 상태 ]')

  // 캐릭터 이름
  ctx.font = 'bold 16px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.fillText(`◆ ${CHARACTERS.player}`, x + 15, y + 45)
  ctx.shadowBlur = 0

  // 레벨
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(`Lv.${stats.level}`, x + panelWidth - 50, y + 45)

  // 체력바
  const isLowHealth = scenario === 'low_health' || stats.hp < stats.maxHp * 0.3
  drawStatBar(
    ctx, x + 15, y + 60, panelWidth - 30, 18,
    'HP', stats.hp, stats.maxHp,
    isLowHealth ? COLORS.danger : COLORS.success,
    isLowHealth && Math.sin(time * 10) > 0
  )

  // 스태미나바
  drawStatBar(
    ctx, x + 15, y + 85, panelWidth - 30, 18,
    'STM', stats.stamina, stats.maxStamina,
    COLORS.secondary,
    false
  )

  // 에너지바
  drawStatBar(
    ctx, x + 15, y + 110, panelWidth - 30, 18,
    'ENR', stats.energy, stats.maxEnergy,
    COLORS.warning,
    false
  )

  // 경험치바 (작게)
  const expRatio = stats.exp / stats.maxExp
  ctx.fillStyle = COLORS.textDim
  ctx.font = '10px "Consolas", monospace'
  ctx.fillText(`EXP: ${stats.exp}/${stats.maxExp}`, x + 15, y + 145)
  ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
  ctx.fillRect(x + 100, y + 137, (panelWidth - 130) * expRatio, 8)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.strokeRect(x + 100, y + 137, panelWidth - 130, 8)
}

function drawStatBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  label: string, value: number, max: number,
  color: string,
  flash: boolean
) {
  const ratio = value / max

  // 배경
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(x, y, w, h)

  // 게이지
  if (!flash || Math.sin(Date.now() / 100) > 0) {
    const gradient = ctx.createLinearGradient(x, y, x + w * ratio, y)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, `${color}88`)
    ctx.fillStyle = gradient
    ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)

    // 글로우 효과
    ctx.shadowColor = color
    ctx.shadowBlur = 8
    ctx.fillRect(x + 2, y + 2, (w - 4) * ratio, h - 4)
    ctx.shadowBlur = 0
  }

  // 테두리
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, w, h)

  // 라벨
  ctx.font = 'bold 10px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(label, x + 5, y + h - 5)

  // 수치
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.floor(value)}/${max}`, x + w - 5, y + h - 5)
  ctx.textAlign = 'left'
}

function drawRetroPanel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  title: string
) {
  // Windows 98 스타일 패널
  // 배경
  ctx.fillStyle = COLORS.bgPanel
  ctx.fillRect(x, y, w, h)

  // 바깥 테두리 (밝은 쪽)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y)
  ctx.lineTo(x + w, y)
  ctx.stroke()

  // 바깥 테두리 (어두운 쪽)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.beginPath()
  ctx.moveTo(x + w, y)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.stroke()

  // 안쪽 테두리
  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 1
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6)

  // 타이틀바
  const titleGradient = ctx.createLinearGradient(x + 5, y + 5, x + w - 5, y + 5)
  titleGradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
  titleGradient.addColorStop(1, 'rgba(255, 215, 0, 0.1)')
  ctx.fillStyle = titleGradient
  ctx.fillRect(x + 5, y + 5, w - 10, 20)

  // 타이틀 텍스트
  ctx.font = 'bold 11px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.fillText(title, x + 10, y + 19)
}

function drawMinimap(
  ctx: CanvasRenderingContext2D,
  screenWidth: number,
  _mousePos: { x: number; y: number },
  scenario: HUDScenario,
  enemy: EnemyData,
  time: number
) {
  const mapSize = 150
  const x = screenWidth - mapSize - 20
  const y = 20

  drawRetroPanel(ctx, x, y, mapSize, mapSize, '[ 미니맵 ]')

  const mapCenterX = x + mapSize / 2
  const mapCenterY = y + mapSize / 2 + 10

  // 그리드
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)'
  ctx.lineWidth = 0.5
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath()
    ctx.moveTo(mapCenterX + i * 25, y + 30)
    ctx.lineTo(mapCenterX + i * 25, y + mapSize - 10)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x + 10, mapCenterY + i * 25)
    ctx.lineTo(x + mapSize - 10, mapCenterY + i * 25)
    ctx.stroke()
  }

  // 플레이어 위치 (중앙)
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.arc(mapCenterX, mapCenterY, 5, 0, Math.PI * 2)
  ctx.fill()
  
  // 방향 표시
  ctx.beginPath()
  ctx.moveTo(mapCenterX, mapCenterY - 8)
  ctx.lineTo(mapCenterX - 4, mapCenterY - 2)
  ctx.lineTo(mapCenterX + 4, mapCenterY - 2)
  ctx.closePath()
  ctx.fill()
  ctx.shadowBlur = 0

  // 적 표시 (시나리오에 따라)
  if (scenario !== 'exploration') {
    const enemyAngle = time * 0.5
    const enemyDist = 40
    const enemyX = mapCenterX + Math.cos(enemyAngle) * enemyDist
    const enemyY = mapCenterY + Math.sin(enemyAngle) * enemyDist

    ctx.fillStyle = COLORS.danger
    ctx.shadowColor = COLORS.danger
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(enemyX, enemyY, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 펄싱 효과
    ctx.globalAlpha = 0.5 + Math.sin(time * 5) * 0.3
    ctx.beginPath()
    ctx.arc(enemyX, enemyY, 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }

  // 거리 표시
  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(`거리: ${enemy.distance.toFixed(1)}m`, x + 10, y + mapSize - 15)
}

function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  scenario: HUDScenario,
  _stats: PlayerStats,
  cooldown: number,
  maxCooldown: number,
  _time: number
) {
  const barWidth = 400
  const barHeight = 40
  const x = (w - barWidth) / 2
  const y = h - barHeight - 30

  // 반투명 배경
  ctx.fillStyle = 'rgba(20, 20, 40, 0.8)'
  ctx.fillRect(x, y, barWidth, barHeight)

  // 테두리
  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, barWidth, barHeight)

  // 코너 장식
  const cornerSize = 8
  ctx.fillStyle = COLORS.primary
  ctx.fillRect(x - 2, y - 2, cornerSize, 3)
  ctx.fillRect(x - 2, y - 2, 3, cornerSize)
  ctx.fillRect(x + barWidth - cornerSize + 2, y - 2, cornerSize, 3)
  ctx.fillRect(x + barWidth - 1, y - 2, 3, cornerSize)
  ctx.fillRect(x - 2, y + barHeight - 1, cornerSize, 3)
  ctx.fillRect(x - 2, y + barHeight - cornerSize + 2, 3, cornerSize)
  ctx.fillRect(x + barWidth - cornerSize + 2, y + barHeight - 1, cornerSize, 3)
  ctx.fillRect(x + barWidth - 1, y + barHeight - cornerSize + 2, 3, cornerSize)

  // 상태 텍스트
  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 10
  ctx.textAlign = 'center'
  ctx.fillText(`▣ ${SCENARIO_NAMES[scenario]} ▣`, w / 2, y + 25)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // 쿨타임 표시 (전투 모드)
  if (scenario === 'combat_attack' && cooldown > 0) {
    const cdRatio = cooldown / maxCooldown
    ctx.fillStyle = 'rgba(255, 136, 0, 0.3)'
    ctx.fillRect(x + 2, y + 2, (barWidth - 4) * cdRatio, barHeight - 4)
  }
}

function drawScenarioIndicator(
  ctx: CanvasRenderingContext2D,
  w: number,
  scenario: HUDScenario,
  _time: number
) {
  const text = `[ DREAM PERSONA :: ${SCENARIO_NAMES[scenario]} ]`
  
  ctx.font = 'bold 12px "Consolas", monospace'
  ctx.textAlign = 'center'
  
  // 글로우 효과
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 15
  ctx.fillStyle = COLORS.primaryGlow
  ctx.fillText(text, w / 2, 45)
  
  // 부제목
  ctx.shadowBlur = 0
  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText('프리윌소프트 | 드림 페르소나: 리마스터', w / 2, 60)
  
  ctx.textAlign = 'left'
}

function drawKeyHints(ctx: CanvasRenderingContext2D, _w: number, h: number) {
  const hints = [
    '[1] 탐색',
    '[2] 감지',
    '[3] 락온',
    '[4] 전투',
    '[5] 피격',
    '[6] 레벨업',
    '[7] 위험',
    '[R] 회복',
    '[Space] 공격'
  ]

  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  
  const startX = 20
  const y = h - 15
  let currentX = startX
  
  hints.forEach((hint) => {
    ctx.fillText(hint, currentX, y)
    currentX += ctx.measureText(hint).width + 15
  })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 HUD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawExplorationHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  mousePos: { x: number; y: number },
  _time: number
) {
  // 평화로운 탐색 모드 - 나침반 표시
  const compassX = w - 100
  const compassY = h - 100
  const compassRadius = 40

  ctx.strokeStyle = COLORS.primary
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2)
  ctx.stroke()

  // 방향 표시
  const directions = ['N', 'E', 'S', 'W']
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.textAlign = 'center'
  directions.forEach((d, i) => {
    const angle = (i * Math.PI / 2) - Math.PI / 2
    const dx = Math.cos(angle) * (compassRadius + 12)
    const dy = Math.sin(angle) * (compassRadius + 12)
    ctx.fillText(d, compassX + dx, compassY + dy + 4)
  })
  ctx.textAlign = 'left'

  // 방향 바늘
  const needleAngle = Math.atan2(mousePos.y - h/2, mousePos.x - w/2)
  ctx.save()
  ctx.translate(compassX, compassY)
  ctx.rotate(needleAngle)
  ctx.fillStyle = COLORS.danger
  ctx.beginPath()
  ctx.moveTo(30, 0)
  ctx.lineTo(-10, -5)
  ctx.lineTo(-10, 5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // 상태 텍스트
  ctx.font = '14px "Consolas", monospace'
  ctx.fillStyle = COLORS.success
  ctx.fillText('● 상태: 정상', 20, h - 60)
  ctx.fillStyle = COLORS.textDim
  ctx.font = '12px "Consolas", monospace'
  ctx.fillText('위협 없음 | 안전 구역', 20, h - 40)
}

function drawEnemyDetectedHUD(
  ctx: CanvasRenderingContext2D,
  w: number, _h: number,
  mousePos: { x: number; y: number },
  enemy: EnemyData,
  time: number
) {
  // 경고 깜빡임
  const flash = Math.sin(time * 8) > 0

  // 상단 경고 배너
  if (flash) {
    ctx.fillStyle = 'rgba(255, 68, 68, 0.2)'
    ctx.fillRect(0, 70, w, 40)
  }

  ctx.font = 'bold 18px "Consolas", monospace'
  ctx.fillStyle = flash ? COLORS.danger : COLORS.dangerGlow
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = flash ? 20 : 10
  ctx.textAlign = 'center'
  ctx.fillText('⚠ 적 감지 ⚠', w / 2, 95)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // 적 정보 패널
  const panelX = w - 220
  const panelY = 180
  drawRetroPanel(ctx, panelX, panelY, 200, 100, '[ 위협 분석 ]')

  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText(`대상: ${enemy.name}`, panelX + 15, panelY + 50)
  ctx.fillText(`거리: ${enemy.distance.toFixed(1)}m`, panelX + 15, panelY + 68)
  
  ctx.fillStyle = COLORS.warning
  ctx.fillText(`위험도: ${enemy.threatLevel}`, panelX + 15, panelY + 86)

  // 레이더 펄스
  const pulseRadius = ((time * 100) % 200)
  ctx.strokeStyle = `rgba(255, 68, 68, ${1 - pulseRadius / 200})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(mousePos.x, mousePos.y, pulseRadius, 0, Math.PI * 2)
  ctx.stroke()
}

function drawTargetLockHUD(
  ctx: CanvasRenderingContext2D,
  _w: number, h: number,
  mousePos: { x: number; y: number },
  isLocked: boolean,
  lockedPos: { x: number; y: number },
  lockProgress: number,
  enemy: EnemyData,
  _time: number
) {
  const targetPos = isLocked ? lockedPos : mousePos

  // 락온 진행 게이지 (원형)
  if (!isLocked && lockProgress > 0) {
    ctx.strokeStyle = COLORS.warning
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(targetPos.x, targetPos.y, 60, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * lockProgress / 100))
    ctx.stroke()

    ctx.font = 'bold 14px "Consolas", monospace'
    ctx.fillStyle = COLORS.warning
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.floor(lockProgress)}%`, targetPos.x, targetPos.y + 80)
    ctx.textAlign = 'left'
  }

  // 적 정보 패널 (락온 시)
  if (isLocked) {
    const panelX = targetPos.x + 70
    const panelY = targetPos.y - 60
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.15)'
    ctx.fillRect(panelX, panelY, 150, 80)
    ctx.strokeStyle = COLORS.danger
    ctx.lineWidth = 1
    ctx.strokeRect(panelX, panelY, 150, 80)

    ctx.font = 'bold 12px "Consolas", monospace'
    ctx.fillStyle = COLORS.danger
    ctx.fillText('◆ 타겟 고정 ◆', panelX + 10, panelY + 20)

    ctx.font = '11px "Consolas", monospace'
    ctx.fillStyle = COLORS.text
    ctx.fillText(`${enemy.name}`, panelX + 10, panelY + 40)
    
    // 적 체력바
    const hpRatio = enemy.hp / enemy.maxHp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(panelX + 10, panelY + 50, 130, 12)
    ctx.fillStyle = COLORS.danger
    ctx.fillRect(panelX + 10, panelY + 50, 130 * hpRatio, 12)
    ctx.strokeStyle = COLORS.danger
    ctx.strokeRect(panelX + 10, panelY + 50, 130, 12)
    
    ctx.font = '9px "Consolas", monospace'
    ctx.fillStyle = COLORS.text
    ctx.fillText(`${enemy.hp}/${enemy.maxHp}`, panelX + 12, panelY + 60)
  }

  // 상태 텍스트
  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = isLocked ? COLORS.danger : COLORS.warning
  ctx.fillText(isLocked ? '● 타겟 고정' : '○ 추적 중...', 20, h - 60)
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(isLocked ? '클릭하여 해제' : '마우스 홀드하여 락온', 20, h - 40)
}

function drawCombatHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  mousePos: { x: number; y: number },
  cooldown: number,
  maxCooldown: number,
  stats: PlayerStats,
  _enemy: EnemyData,
  time: number
) {
  // 전투 UI - 공격 레티클 강화
  const targetX = mousePos.x
  const targetY = mousePos.y
  const isAttacking = cooldown > maxCooldown - 0.2  // 공격 직후 0.2초

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 공격 임팩트 플래시
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (isAttacking) {
    const flashIntensity = (cooldown - (maxCooldown - 0.2)) / 0.2
    
    // 화면 플래시
    ctx.fillStyle = `rgba(255, 200, 100, ${flashIntensity * 0.2})`
    ctx.fillRect(0, 0, w, h)
    
    // 임팩트 링
    ctx.strokeStyle = `rgba(255, 200, 0, ${flashIntensity})`
    ctx.lineWidth = 4
    ctx.shadowColor = COLORS.warning
    ctx.shadowBlur = 30
    const impactRadius = 30 + (1 - flashIntensity) * 80
    ctx.beginPath()
    ctx.arc(targetX, targetY, impactRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // 스파크 파티클
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const dist = 20 + (1 - flashIntensity) * 60
      const sparkX = targetX + Math.cos(angle) * dist
      const sparkY = targetY + Math.sin(angle) * dist
      
      ctx.fillStyle = `rgba(255, 255, 200, ${flashIntensity * 0.8})`
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, 3 * flashIntensity, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 쿨타임 표시 (강화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (cooldown > 0) {
    const progress = 1 - cooldown / maxCooldown
    
    // 배경 원
    ctx.strokeStyle = 'rgba(255, 136, 0, 0.2)'
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(targetX, targetY, 48, 0, Math.PI * 2)
    ctx.stroke()
    
    // 진행 원
    ctx.strokeStyle = `rgba(255, 136, 0, ${0.5 + progress * 0.5})`
    ctx.lineWidth = 6
    ctx.shadowColor = COLORS.warning
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(targetX, targetY, 48, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * progress))
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // 쿨타임 숫자
    ctx.font = 'bold 14px "Consolas", monospace'
    ctx.fillStyle = COLORS.warning
    ctx.textAlign = 'center'
    ctx.fillText(`${cooldown.toFixed(1)}s`, targetX, targetY + 70)
    ctx.textAlign = 'left'
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 회전하는 타겟 링
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ctx.save()
  ctx.translate(targetX, targetY)
  ctx.rotate(time * 2)
  
  ctx.strokeStyle = COLORS.warning
  ctx.lineWidth = 2
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.restore()

  // 무기/에너지 표시
  const weaponPanelX = 20
  const weaponPanelY = h - 180
  drawRetroPanel(ctx, weaponPanelX, weaponPanelY, 180, 80, '[ 무기 시스템 ]')

  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.text
  ctx.fillText('공격 유형: 근접', weaponPanelX + 15, weaponPanelY + 50)
  ctx.fillText(`에너지: ${Math.floor(stats.energy)}%`, weaponPanelX + 15, weaponPanelY + 68)

  // 상태
  const ready = cooldown <= 0
  ctx.font = 'bold 14px "Consolas", monospace'
  ctx.fillStyle = ready ? COLORS.success : COLORS.warning
  ctx.shadowColor = ready ? COLORS.success : COLORS.warning
  ctx.shadowBlur = 10
  ctx.fillText(ready ? '● 공격 준비 완료' : '○ 쿨다운 중...', 20, h - 60)
  ctx.shadowBlur = 0
  ctx.font = '12px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText('[Space] 공격', 20, h - 40)
}

function drawDamageHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  indicators: DamageIndicator[],
  time: number
) {
  const centerX = w / 2
  const centerY = h / 2
  const hasRecentDamage = indicators.some(i => Date.now() - i.timestamp < 500)
  const damageIntensity = hasRecentDamage ? 1 : 0.3

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. SCREEN SHAKE (화면 흔들림)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (hasRecentDamage) {
    const shakeX = (Math.random() - 0.5) * 12 * damageIntensity
    const shakeY = (Math.random() - 0.5) * 12 * damageIntensity
    ctx.save()
    ctx.translate(shakeX, shakeY)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. RGB SPLITTING / CHROMATIC ABERRATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const rgbOffset = hasRecentDamage ? 8 : 3
  
  // Red channel offset
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = `rgba(255, 0, 0, ${0.15 * damageIntensity})`
  ctx.fillRect(-rgbOffset, 0, w + rgbOffset * 2, h)
  
  // Cyan (opposite) offset
  ctx.fillStyle = `rgba(0, 255, 255, ${0.1 * damageIntensity})`
  ctx.fillRect(rgbOffset, 0, w - rgbOffset * 2, h)
  
  ctx.globalCompositeOperation = 'source-over'

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. SCREEN NOISE / STATIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  drawNoise(ctx, w, h, damageIntensity * 0.15)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. GLITCH EFFECT (수평 라인 분리)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (hasRecentDamage && Math.random() > 0.5) {
    drawGlitchBars(ctx, w, h, time)
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 화면 가장자리 빨간색 비네팅 (강화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const vignetteIntensity = 0.4 + damageIntensity * 0.3
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) * 0.6)
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(255, 0, 0, ${vignetteIntensity})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. FLASH OVERLAY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    if (age < 0.1) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 * (1 - age * 10)})`
      ctx.fillRect(0, 0, w, h)
    }
  })

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. BLOOD DRIP EFFECT (화면 상단 피)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  drawBloodDrip(ctx, w, h, time, damageIntensity)

  // 피격 방향 표시
  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    const alpha = 1 - age
    
    const dist = 150
    const ix = centerX + Math.cos(indicator.direction) * dist
    const iy = centerY + Math.sin(indicator.direction) * dist

    ctx.save()
    ctx.translate(ix, iy)
    ctx.rotate(indicator.direction + Math.PI / 2)

    // 화살표 (강화된 글로우)
    ctx.fillStyle = `rgba(255, 68, 68, ${alpha})`
    ctx.shadowColor = COLORS.danger
    ctx.shadowBlur = 30 * alpha
    ctx.beginPath()
    ctx.moveTo(0, -40)
    ctx.lineTo(-20, 20)
    ctx.lineTo(0, 8)
    ctx.lineTo(20, 20)
    ctx.closePath()
    ctx.fill()

    // 이중 글로우
    ctx.shadowBlur = 50 * alpha
    ctx.fill()

    ctx.restore()
  })

  // 피해 텍스트 (강화)
  indicators.forEach(indicator => {
    const age = (Date.now() - indicator.timestamp) / 1000
    if (age < 0.8) {
      const yOffset = age * 80
      const scale = 1 + age * 0.5
      
      ctx.save()
      ctx.translate(centerX, centerY - 50 - yOffset)
      ctx.scale(scale, scale)
      
      // 그림자 (RGB 분리 효과)
      ctx.font = 'bold 28px "Consolas", monospace'
      ctx.textAlign = 'center'
      
      // RGB 텍스트 분리
      ctx.globalAlpha = (1 - age) * 0.5
      ctx.fillStyle = '#FF0000'
      ctx.fillText(`-${indicator.amount}`, -2, 0)
      ctx.fillStyle = '#00FFFF'
      ctx.fillText(`-${indicator.amount}`, 2, 0)
      
      // 메인 텍스트
      ctx.globalAlpha = 1 - age
      ctx.fillStyle = COLORS.danger
      ctx.shadowColor = COLORS.danger
      ctx.shadowBlur = 20
      ctx.fillText(`-${indicator.amount}`, 0, 0)
      
      ctx.restore()
    }
  })

  // 경고 메시지 (글리치 효과)
  const glitchX = hasRecentDamage ? (Math.random() - 0.5) * 4 : 0
  ctx.font = 'bold 18px "Consolas", monospace'
  ctx.fillStyle = COLORS.danger
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 15
  ctx.textAlign = 'center'
  ctx.fillText('⚠ 피해 발생 ⚠', w / 2 + glitchX, 100)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // 화면 흔들림 종료
  if (hasRecentDamage) {
    ctx.restore()
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VFX 헬퍼 함수들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawNoise(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  intensity: number
) {
  // 노이즈 패턴 생성 (성능 최적화를 위해 큰 픽셀 사용)
  const pixelSize = 4
  ctx.globalAlpha = intensity
  
  for (let y = 0; y < h; y += pixelSize) {
    for (let x = 0; x < w; x += pixelSize) {
      if (Math.random() > 0.7) {
        const brightness = Math.random() * 255
        ctx.fillStyle = `rgb(${brightness}, ${brightness * 0.9}, ${brightness * 0.9})`
        ctx.fillRect(x, y, pixelSize, pixelSize)
      }
    }
  }
  
  ctx.globalAlpha = 1
}

function drawGlitchBars(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  _time: number
) {
  // 수평 글리치 바 (랜덤 위치에 수평 라인)
  const numBars = Math.floor(Math.random() * 5) + 2
  
  for (let i = 0; i < numBars; i++) {
    const y = Math.random() * h
    const barHeight = Math.random() * 10 + 2
    const offsetX = (Math.random() - 0.5) * 30
    
    // 글리치 라인
    ctx.fillStyle = `rgba(255, 0, 100, ${Math.random() * 0.5 + 0.2})`
    ctx.fillRect(offsetX, y, w, barHeight)
    
    // RGB 분리된 복사
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(0, 255, 255, 0.3)`
    ctx.fillRect(offsetX + 5, y, w, barHeight / 2)
    ctx.globalCompositeOperation = 'source-over'
  }
  
  // 가로 줄무늬 글리치
  if (Math.random() > 0.7) {
    const sliceY = Math.random() * h
    const sliceHeight = Math.random() * 50 + 20
    
    // 슬라이스 이동 효과 (모의)
    ctx.fillStyle = `rgba(20, 20, 30, 0.8)`
    ctx.fillRect(0, sliceY, w, sliceHeight)
    
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, sliceY)
    ctx.lineTo(w, sliceY)
    ctx.moveTo(0, sliceY + sliceHeight)
    ctx.lineTo(w, sliceY + sliceHeight)
    ctx.stroke()
    ctx.setLineDash([])
  }
}

function drawBloodDrip(
  ctx: CanvasRenderingContext2D,
  w: number, _h: number,
  time: number,
  intensity: number
) {
  // 화면 상단에서 흘러내리는 피 효과
  const numDrips = Math.floor(intensity * 8)
  
  for (let i = 0; i < numDrips; i++) {
    const x = (i / numDrips) * w + Math.sin(time + i) * 30
    const dripLength = 50 + Math.sin(time * 2 + i) * 30
    const dripWidth = 3 + Math.random() * 4
    
    const gradient = ctx.createLinearGradient(x, 0, x, dripLength)
    gradient.addColorStop(0, `rgba(180, 0, 0, ${intensity * 0.8})`)
    gradient.addColorStop(0.5, `rgba(120, 0, 0, ${intensity * 0.5})`)
    gradient.addColorStop(1, 'rgba(80, 0, 0, 0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(x, dripLength / 2, dripWidth, dripLength / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  
  // 상단 혈흔 바
  const topGradient = ctx.createLinearGradient(0, 0, 0, 30)
  topGradient.addColorStop(0, `rgba(150, 0, 0, ${intensity * 0.6})`)
  topGradient.addColorStop(1, 'rgba(100, 0, 0, 0)')
  ctx.fillStyle = topGradient
  ctx.fillRect(0, 0, w, 30)
}

function drawLevelUpHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  stats: PlayerStats,
  timer: number,
  time: number
) {
  if (timer <= 0) return

  const alpha = Math.min(1, timer)
  const centerX = w / 2
  const centerY = h / 2

  // 화면 전체 골드 글로우
  ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.15})`
  ctx.fillRect(0, 0, w, h)

  // 메인 텍스트
  ctx.font = 'bold 48px "Consolas", monospace'
  ctx.fillStyle = COLORS.primaryGlow
  ctx.shadowColor = COLORS.primaryGlow
  ctx.shadowBlur = 30 + Math.sin(time * 10) * 10
  ctx.textAlign = 'center'
  ctx.fillText('LEVEL UP!', centerX, centerY - 40)

  // 레벨 표시
  ctx.font = 'bold 36px "Consolas", monospace'
  ctx.fillText(`Lv.${stats.level - 1} → Lv.${stats.level}`, centerX, centerY + 20)

  // 스탯 증가 표시
  ctx.font = '18px "Consolas", monospace'
  ctx.shadowBlur = 10
  ctx.fillStyle = COLORS.success
  ctx.fillText('체력 최대치 +10', centerX, centerY + 70)
  ctx.fillText('공격력 +2', centerX, centerY + 95)

  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // 파티클 효과
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + time * 2
    const dist = 100 + Math.sin(time * 3 + i) * 30
    const px = centerX + Math.cos(angle) * dist
    const py = centerY + Math.sin(angle) * dist

    ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`
    ctx.beginPath()
    ctx.arc(px, py, 3 + Math.sin(time * 5 + i) * 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawLowHealthHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  stats: PlayerStats,
  time: number
) {
  const hpRatio = stats.hp / stats.maxHp
  const criticalIntensity = 1 - hpRatio  // 체력 낮을수록 강해짐

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. 화면 심장박동 펄스 (전체 화면 숨쉬기)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const heartbeat = Math.abs(Math.sin(time * 4))
  const breatheScale = 1 + heartbeat * 0.01 * criticalIntensity
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(breatheScale, breatheScale)
  ctx.translate(-w / 2, -h / 2)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 주기적 RGB 분리 글리치
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Math.sin(time * 8) > 0.8) {
    const glitchOffset = 5 * criticalIntensity
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(255, 0, 0, 0.1)`
    ctx.fillRect(-glitchOffset, 0, w, h)
    ctx.fillStyle = `rgba(0, 255, 255, 0.08)`
    ctx.fillRect(glitchOffset, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. 노이즈 (체력 낮을수록 심해짐)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  drawNoise(ctx, w, h, criticalIntensity * 0.08)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. 위험 경고 - 화면 가장자리 빨간색 펄스 (강화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pulse = (0.3 + Math.sin(time * 6) * 0.25) * criticalIntensity + 0.1
  const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.65)
  gradient.addColorStop(0, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0)')
  gradient.addColorStop(1, `rgba(200, 0, 0, ${pulse})`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. 스캔라인 글리치 (간헐적)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Math.random() > 0.95) {
    const glitchY = Math.random() * h
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    ctx.fillRect(0, glitchY, w, Math.random() * 20 + 5)
  }

  // 경고 아이콘 및 텍스트
  const flash = Math.sin(time * 10) > 0
  const textGlitch = Math.sin(time * 20) > 0.9 ? (Math.random() - 0.5) * 6 : 0

  ctx.font = 'bold 26px "Consolas", monospace'
  ctx.fillStyle = flash ? COLORS.danger : COLORS.dangerGlow
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = flash ? 30 : 15
  ctx.textAlign = 'center'
  ctx.fillText('★ 위험 상태 ★', w / 2 + textGlitch, 100)
  
  // HP 텍스트 (RGB 분리)
  ctx.font = 'bold 36px "Consolas", monospace'
  const hpText = `HP: ${stats.hp} / ${stats.maxHp}`
  
  // RGB 분리 효과
  ctx.globalAlpha = 0.5
  ctx.fillStyle = '#FF0000'
  ctx.fillText(hpText, w / 2 - 2, 145)
  ctx.fillStyle = '#00FFFF'
  ctx.fillText(hpText, w / 2 + 2, 145)
  ctx.globalAlpha = 1
  
  ctx.fillStyle = COLORS.danger
  ctx.shadowBlur = 25
  ctx.fillText(hpText, w / 2, 145)
  
  ctx.font = '16px "Consolas", monospace'
  ctx.fillStyle = COLORS.warning
  ctx.shadowBlur = 10
  ctx.fillText('[R] 키를 눌러 회복', w / 2, 185)

  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. 하트비트 효과 (강화)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const heartPhase = (time * 5) % (Math.PI * 2)
  const heartScale = 1 + Math.pow(Math.abs(Math.sin(heartPhase)), 3) * 0.4

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(heartScale, heartScale)
  
  // 하트 글로우
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 40 + heartScale * 20
  
  // 하트 모양
  ctx.fillStyle = COLORS.danger
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.bezierCurveTo(-25, -40, -55, -10, 0, 35)
  ctx.bezierCurveTo(55, -10, 25, -40, 0, -10)
  ctx.fill()
  
  // 하이라이트
  ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'
  ctx.beginPath()
  ctx.ellipse(-12, -15, 8, 6, -0.5, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. EKG/심박 라인
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  drawEKGLine(ctx, w, h, time)

  // 스케일 복원
  ctx.restore()
}

function drawEKGLine(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  time: number
) {
  const y = h - 80
  const lineWidth = 300
  const startX = w - lineWidth - 30
  
  ctx.strokeStyle = COLORS.danger
  ctx.shadowColor = COLORS.danger
  ctx.shadowBlur = 10
  ctx.lineWidth = 2
  ctx.beginPath()
  
  for (let i = 0; i < lineWidth; i++) {
    const x = startX + i
    const phase = (i / lineWidth) * Math.PI * 4 - time * 10
    
    let yOffset = 0
    // EKG 파형 시뮬레이션
    const beat = (phase % (Math.PI * 2)) / (Math.PI * 2)
    if (beat > 0.4 && beat < 0.45) {
      yOffset = -20
    } else if (beat > 0.45 && beat < 0.5) {
      yOffset = 30
    } else if (beat > 0.5 && beat < 0.55) {
      yOffset = -15
    } else if (beat > 0.55 && beat < 0.6) {
      yOffset = 5
    } else {
      yOffset = Math.sin(phase * 0.5) * 2
    }
    
    if (i === 0) {
      ctx.moveTo(x, y + yOffset)
    } else {
      ctx.lineTo(x, y + yOffset)
    }
  }
  
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  _mousePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  scenario: HUDScenario,
  isLocked: boolean,
  time: number
) {
  const x = targetPos.x
  const y = targetPos.y

  // 색상 결정
  let color = COLORS.primary
  if (scenario === 'low_health' || scenario === 'damage_received') {
    color = COLORS.danger
  } else if (isLocked) {
    color = COLORS.danger
  } else if (scenario === 'combat_attack') {
    color = COLORS.warning
  } else if (scenario === 'enemy_detected') {
    color = COLORS.warning
  }

  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.shadowColor = color
  ctx.shadowBlur = 10

  // 십자선
  const crossSize = isLocked ? 25 : 20
  ctx.beginPath()
  ctx.moveTo(x - crossSize, y)
  ctx.lineTo(x - 8, y)
  ctx.moveTo(x + 8, y)
  ctx.lineTo(x + crossSize, y)
  ctx.moveTo(x, y - crossSize)
  ctx.lineTo(x, y - 8)
  ctx.moveTo(x, y + 8)
  ctx.lineTo(x, y + crossSize)
  ctx.stroke()

  // 중앙 점
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()

  // 외곽 사각형 (락온 시)
  if (isLocked || scenario === 'target_lock') {
    const boxSize = 50 + Math.sin(time * 5) * 5
    
    // 코너만 그리기
    const cornerLen = 12
    ctx.lineWidth = 2
    
    // 좌상
    ctx.beginPath()
    ctx.moveTo(x - boxSize, y - boxSize + cornerLen)
    ctx.lineTo(x - boxSize, y - boxSize)
    ctx.lineTo(x - boxSize + cornerLen, y - boxSize)
    ctx.stroke()
    
    // 우상
    ctx.beginPath()
    ctx.moveTo(x + boxSize - cornerLen, y - boxSize)
    ctx.lineTo(x + boxSize, y - boxSize)
    ctx.lineTo(x + boxSize, y - boxSize + cornerLen)
    ctx.stroke()
    
    // 좌하
    ctx.beginPath()
    ctx.moveTo(x - boxSize, y + boxSize - cornerLen)
    ctx.lineTo(x - boxSize, y + boxSize)
    ctx.lineTo(x - boxSize + cornerLen, y + boxSize)
    ctx.stroke()
    
    // 우하
    ctx.beginPath()
    ctx.moveTo(x + boxSize - cornerLen, y + boxSize)
    ctx.lineTo(x + boxSize, y + boxSize)
    ctx.lineTo(x + boxSize, y + boxSize - cornerLen)
    ctx.stroke()
  }

  // 외곽 원 (전투 모드)
  if (scenario === 'combat_attack') {
    const radius = 40 + Math.sin(time * 3) * 3
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.shadowBlur = 0

  // 좌표 표시
  ctx.font = '10px "Consolas", monospace'
  ctx.fillStyle = COLORS.textDim
  ctx.fillText(`X:${x.toFixed(0)} Y:${y.toFixed(0)}`, x + 30, y - 30)
}
