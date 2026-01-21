import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { HUDComponentProps } from './index'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 공유 드로잉 모듈 import (오프라인 렌더러와 동일한 함수 사용!)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import {
  // 타입
  type HUDScenario,
  type PlayerStats,
  type EnemyData,
  type DamageIndicator,
  
  // 드로잉 함수들
  drawCurvedScreenEffect,
  drawScanlines,
  drawPlayerStats,
  drawMinimap,
  drawStatusBar,
  drawScenarioIndicator,
  drawKeyHints,
  drawCrosshair,
  drawExplorationHUD,
  drawEnemyDetectedHUD,
  drawTargetLockHUD,
  drawCombatHUD,
  drawDamageHUD,
  drawLevelUpHUD,
  drawLowHealthHUD,
} from './dreamPersonaDrawing'

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
 * 
 * ⚡ 공유 드로잉 모듈 사용 - 실시간/오프라인 렌더링 100% 동일!
 */

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

  // 성능 모드
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high')
  const frameInterval = performanceMode === 'high' ? 1000 / 60 : 1000 / 30
  const lastFrameTime = useRef(0)

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
  const [lockedPos, setLockedPos] = useState({ x: 0, y: 0 })
  const [lockProgress, setLockProgress] = useState(0)

  // 전투 상태
  const [attackCooldown, setAttackCooldown] = useState(0)
  const maxCooldown = 2

  // 피격 인디케이터
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([])

  // 레벨업 타이머
  const [levelUpTimer, setLevelUpTimer] = useState(0)

  // 시간
  const [time, setTime] = useState(0)

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    if (!hasCalledReady.current) {
      hasCalledReady.current = true
      onReady?.()
    }
  }, [onReady])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 키보드 이벤트
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
  }, [])

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
  // Canvas 렌더링 - 공유 드로잉 함수 사용!
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
      // 공유 드로잉 함수 호출 (OfflineHUDRenderer와 동일!)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // Curved Screen 효과 (비네팅)
      if (!isLowPerf) {
        drawCurvedScreenEffect(ctx, width, height)
      }

      // 스캔라인 효과
      if (!isLowPerf) {
        drawScanlines(ctx, width, height, time)
      }

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

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 상태 업데이트 (오프라인 렌더링에서 사용)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
            damageIndicators, // 피격 인디케이터도 저장!
            levelUpTimer,     // 레벨업 타이머도 저장!
            attackCooldown,   // 쿨다운도 저장!
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
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    />
  )
}
