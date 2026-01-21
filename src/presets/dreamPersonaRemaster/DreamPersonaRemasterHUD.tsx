/**
 * Dream Persona HUD Remaster - 메인 컴포넌트
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * ARWES 프레임워크 (https://github.com/arwes/arwes) 영감 반영:
 * 
 * 1. packages/frames/createFrameCornersSettings - 코너 프레임 애니메이션
 * 2. packages/bgs/createBackgroundGridLines - 그리드 라인 배경
 * 3. packages/bgs/createBackgroundDots - 도트 패턴 배경
 * 4. packages/bgs/createBackgroundMovingLines - 움직이는 라인 효과
 * 5. packages/bgs/createBackgroundPuffs - 파티클 시스템
 * 6. packages/effects/createEffectIlluminator - 마우스 추적 글로우
 * 7. packages/text/animateTextDecipher - 텍스트 암호해독 효과
 * 8. packages/theme/createThemeColor - 동적 컬러 시스템
 * 
 * react-vfx / vfx-js (https://github.com/fand/vfx-js) 셰이더 직접 사용:
 * - glitch: 큰 데미지 피격 시
 * - rgbShift: 일반 데미지 시
 * - rgbGlitch: 감염 상태
 * - chromatic: 락온 색수차
 * - rainbow: 진화 상태
 * - grayscale: 트라우마 상태
 * - shine: 완료 상태
 * 
 * 5가지 시나리오 (DREAM-PERSONA-HUD-DESIGN.md 기반):
 * [1] SYNC - 신경 동기화 (Blue)
 * [2] COMBAT - 전투 경보 (Red)
 * [3] INFECTED - 바이러스 감염 (Purple)
 * [4] TRAUMA - 트라우마 던전 (Grey)
 * [5] EVOLVED - 최종 진화 (Gold)
 * ════════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { HUDComponentProps } from '../index'

import { type ScenarioId, SCENARIO_COLORS } from './constants'
import {
  drawScenarioHUD,
  drawCommonHUD,
  getScenarioVFX,
  type HUDState,
  type ExtendedHUDState,
} from './scenarioHUDs'
import { drawScanlines, drawVignette } from './arwesDrawing'
import { VFXPostProcessor } from './VFXPostProcessor'
import type { VFXShaderPreset } from './vfxShaders'
import { drawLoginPopup, type HitMarker, type LoginPopupState } from './arwesCore'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 키보드 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SCENARIO_KEYS: Record<string, ScenarioId> = {
  '1': 'normal',
  '2': 'sync',
  '3': 'combat',
  '4': 'infected',
  '5': 'trauma',
  '6': 'evolved',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 초기 상태
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const createInitialState = (width: number, height: number): HUDState => ({
  scenario: 'normal',
  time: 0,
  mouse: { x: width / 2, y: height / 2 },
  isLocked: false,
  lockProgress: 0,
  isFiring: false,

  player: {
    health: 100,
    maxHealth: 100,
    syncRate: 0,
    infectionLevel: 0,
    evolutionProgress: 0,
  },

  target: {
    name: '렙틸리언',
    health: 850,
    maxHealth: 1000,
    distance: 45.5,
    threatLevel: 'high',
  },

  effects: {
    damageFlash: 0,
    glitchIntensity: 0,
    transitionProgress: 1,
  },
})

const createInitialExtendedState = (): Omit<ExtendedHUDState, keyof HUDState> => ({
  hitMarkers: [],
  loginPopup: {
    visible: false,
    phase: 'connecting',
    progress: 0,
    personaName: '아네사',
  },
  scenarioTransition: {
    fromScenario: null,
    progress: 1,
    startTime: 0,
  },
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function DreamPersonaRemasterHUD({
  width,
  height,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hudCanvasRef = useRef<HTMLCanvasElement | null>(null)  // VFX용 오프스크린 캔버스
  const animationRef = useRef<number>(0)
  const hasCalledReady = useRef(false)
  const onStateUpdateRef = useRef(onStateUpdate)
  onStateUpdateRef.current = onStateUpdate

  // VFX 프로세서 (react-vfx 셰이더 사용)
  const vfxProcessorRef = useRef<VFXPostProcessor | null>(null)
  const [vfxEnabled, setVfxEnabled] = useState(true)

  // 상태 업데이트 스로틀링
  const lastStateUpdateRef = useRef(0)

  // 성능 모드
  const [performanceMode, setPerformanceMode] = useState<'high' | 'low'>('high')
  const frameInterval = performanceMode === 'high' ? 1000 / 60 : 1000 / 30
  const lastFrameTime = useRef(0)

  // HUD 상태
  const [state, setState] = useState<HUDState>(() => createInitialState(width, height))
  const stateRef = useRef(state)
  stateRef.current = state

  // 확장 상태 (Hit Marker, Login Popup 등)
  const extendedStateRef = useRef<ExtendedHUDState>({
    ...createInitialState(width, height),
    ...createInitialExtendedState(),
  })

  // 마우스 상태
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isFiring, setIsFiring] = useState(false)

  // 현재 적용 중인 VFX 표시
  const [currentVFX, setCurrentVFX] = useState<VFXShaderPreset>('none')

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 초기화
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    // VFX용 오프스크린 캔버스 생성
    if (!hudCanvasRef.current) {
      hudCanvasRef.current = document.createElement('canvas')
      hudCanvasRef.current.width = width
      hudCanvasRef.current.height = height
    }

    // VFX 프로세서 초기화 (react-vfx 셰이더 사용)
    if (!vfxProcessorRef.current) {
      const vfxCanvas = document.createElement('canvas')
      vfxCanvas.width = width
      vfxCanvas.height = height
      vfxProcessorRef.current = new VFXPostProcessor(vfxCanvas)
      console.log('🎮 VFX Processor initialized (react-vfx shaders)')
    }

    if (!hasCalledReady.current) {
      hasCalledReady.current = true
      onReady?.()
    }

    return () => {
      vfxProcessorRef.current?.dispose()
      vfxProcessorRef.current = null
    }
  }, [onReady, width, height])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 시나리오 전환 효과
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const switchScenario = useCallback((newScenario: ScenarioId) => {
    setState(prev => {
      const updated: Partial<HUDState> = {
        scenario: newScenario,
        effects: {
          ...prev.effects,
          transitionProgress: 0,
        },
      }

      // 시나리오별 초기화
      switch (newScenario) {
        case 'normal':
          updated.player = { ...prev.player, health: prev.player.maxHealth, syncRate: 100 }
          updated.isLocked = false
          break
        case 'sync':
          updated.player = { ...prev.player, syncRate: 0, health: prev.player.maxHealth }
          updated.isLocked = false
          break
        case 'combat':
          updated.player = { ...prev.player, health: 78 }
          updated.target = { name: '렙틸리언', health: 850, maxHealth: 1000, distance: 45.5, threatLevel: 'high' }
          break
        case 'infected':
          updated.player = { ...prev.player, infectionLevel: 78 }
          updated.effects = { ...prev.effects, glitchIntensity: 0.3 }
          break
        case 'trauma':
          updated.player = { ...prev.player, health: 50 }
          break
        case 'evolved':
          updated.player = { ...prev.player, health: prev.player.maxHealth, evolutionProgress: 0 }
          break
      }

      return { ...prev, ...updated }
    })
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 키보드 이벤트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key

      // 1-5 키로 시나리오 전환
      if (SCENARIO_KEYS[key]) {
        switchScenario(SCENARIO_KEYS[key])
      }

      // Q: 성능 모드 토글
      if (e.code === 'KeyQ') {
        setPerformanceMode(prev => prev === 'high' ? 'low' : 'high')
      }

      // V: VFX 토글 (react-vfx 셰이더)
      if (e.code === 'KeyV') {
        setVfxEnabled(prev => !prev)
      }

      // L: 로그인 팝업 토글
      if (e.code === 'KeyL') {
        const popup = extendedStateRef.current.loginPopup
        if (popup.visible) {
          // 팝업 닫기
          extendedStateRef.current.loginPopup = {
            ...popup,
            visible: false,
            progress: 0,
            phase: 'connecting',
          }
        } else {
          // 팝업 열기
          extendedStateRef.current.loginPopup = {
            ...popup,
            visible: true,
            progress: 0,
            phase: 'connecting',
          }
        }
      }

      // Space: 락온/공격
      if (e.code === 'Space') {
        setState(prev => {
          if (prev.scenario === 'combat') {
            return { ...prev, isLocked: !prev.isLocked }
          }
          if (prev.scenario === 'evolved') {
            return {
              ...prev,
              player: { ...prev.player, evolutionProgress: 100 }
            }
          }
          return prev
        })
      }

      // R: 체력 회복
      if (e.code === 'KeyR') {
        setState(prev => ({
          ...prev,
          player: { ...prev.player, health: Math.min(prev.player.maxHealth, prev.player.health + 20) }
        }))
      }

      // E: 데미지 시뮬레이션
      if (e.code === 'KeyE' && stateRef.current.scenario === 'combat') {
        setState(prev => ({
          ...prev,
          player: { ...prev.player, health: Math.max(0, prev.player.health - 15) },
          effects: { ...prev.effects, damageFlash: 1 }
        }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [switchScenario])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 마우스 이벤트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    setState(prev => ({ ...prev, mouse: { x, y } }))
  }, [width, height])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsMouseDown(true)

    // Combat 시나리오에서 발사 및 Hit Marker 생성
    if (stateRef.current.scenario === 'combat') {
      setIsFiring(true)

      // Hit Marker 추가
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * width
      const y = ((e.clientY - rect.top) / rect.height) * height

      // 크리티컬/헤드샷 확률
      const rand = Math.random()
      const hitType: HitMarker['type'] = rand > 0.9 ? 'headshot' : rand > 0.7 ? 'critical' : 'normal'
      const damage = hitType === 'headshot' ? 150 : hitType === 'critical' ? 80 : Math.floor(30 + Math.random() * 20)

      const marker: HitMarker = {
        x,
        y,
        startTime: Date.now(),
        type: hitType,
        damage,
      }

      extendedStateRef.current.hitMarkers.push(marker)

      // 타겟 체력 감소 (락온 시)
      if (stateRef.current.isLocked && stateRef.current.target) {
        setState(prev => ({
          ...prev,
          target: prev.target ? {
            ...prev.target,
            health: Math.max(0, prev.target.health - damage)
          } : null
        }))
      }
    }
  }, [width, height])

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false)
    setIsFiring(false)
  }, [])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 게임 로직 업데이트
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        const dt = 1 / 60

        // 시간 업데이트
        const time = prev.time + dt

        // 이펙트 감쇠
        const effects = {
          ...prev.effects,
          damageFlash: Math.max(0, prev.effects.damageFlash - dt * 3),
          transitionProgress: Math.min(1, prev.effects.transitionProgress + dt * 2),
        }

        // 시나리오별 로직
        let player = { ...prev.player }

        switch (prev.scenario) {
          case 'sync':
            // 동기화 진행
            player.syncRate = Math.min(100, player.syncRate + dt * 8)
            break
          case 'infected':
            // 글리치 강도 변동
            effects.glitchIntensity = 0.2 + Math.sin(time * 2) * 0.15
            break
          case 'evolved':
            // 진화 에너지 충전 (마우스 다운 시)
            if (isMouseDown) {
              player.evolutionProgress = Math.min(100, player.evolutionProgress + dt * 30)
            } else {
              player.evolutionProgress = Math.max(0, player.evolutionProgress - dt * 10)
            }
            break
        }

        // isFiring 상태 반영
        return { ...prev, time, effects, player, isFiring }
      })

      // 확장 상태 동기화
      extendedStateRef.current = {
        ...stateRef.current,
        hitMarkers: extendedStateRef.current.hitMarkers,
        loginPopup: extendedStateRef.current.loginPopup,
        scenarioTransition: extendedStateRef.current.scenarioTransition,
      }

      // 로그인 팝업 진행
      const popup = extendedStateRef.current.loginPopup
      if (popup.visible && popup.progress < 1) {
        const dt = 1 / 60
        const newProgress = Math.min(1, popup.progress + dt * 0.5)

        // 진행 단계 업데이트
        let newPhase: LoginPopupState['phase'] = popup.phase
        if (newProgress > 0.3 && popup.phase === 'connecting') {
          newPhase = 'syncing'
        }
        if (newProgress >= 1) {
          newPhase = 'complete'
        }

        extendedStateRef.current.loginPopup = {
          ...popup,
          progress: newProgress,
          phase: newPhase,
        }

        // 완료 시 팝업 자동 닫기 및 SYNC 시나리오로 전환
        if (newProgress >= 1 && stateRef.current.scenario !== 'sync') {
          setTimeout(() => {
            extendedStateRef.current.loginPopup.visible = false
          }, 1500)
        }
      }
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [isMouseDown, isFiring])

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Canvas 렌더링
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // HUD 렌더링용 오프스크린 캔버스
    const hudCanvas = hudCanvasRef.current
    if (!hudCanvas) return
    const hudCtx = hudCanvas.getContext('2d')
    if (!hudCtx) return

    // 캔버스 크기 동기화
    if (hudCanvas.width !== width || hudCanvas.height !== height) {
      hudCanvas.width = width
      hudCanvas.height = height
    }

    const render = (timestamp: number) => {
      // 프레임 제한
      const elapsed = timestamp - lastFrameTime.current
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(render)
        return
      }
      lastFrameTime.current = timestamp - (elapsed % frameInterval)

      const currentState = stateRef.current

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Step 1: HUD를 오프스크린 캔버스에 렌더링
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      hudCtx.clearRect(0, 0, width, height)

      // 배경색 (새 색상 시스템 사용)
      const colors = SCENARIO_COLORS[currentState.scenario]
      hudCtx.fillStyle = colors.bgPrimary
      hudCtx.fillRect(0, 0, width, height)

      // 스캔라인 (저사양 모드에서 비활성화)
      if (performanceMode === 'high') {
        drawScanlines(hudCtx, width, height, currentState.time, 0.02)
      }

      // 시나리오별 HUD (확장 상태 포함)
      drawScenarioHUD(hudCtx, width, height, currentState, extendedStateRef.current)

      // 공통 HUD (인디케이터, 키 힌트)
      drawCommonHUD(hudCtx, width, height, currentState)

      // 비네트 (시나리오별 강도)
      const vignetteIntensity = currentState.scenario === 'trauma' ? 0.5 :
        currentState.scenario === 'combat' ? 0.3 : 0.2
      drawVignette(hudCtx, width, height, currentState.scenario, vignetteIntensity)

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Step 2: VFX 후처리 적용 (react-vfx 셰이더)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ctx.clearRect(0, 0, width, height)

      if (vfxEnabled && vfxProcessorRef.current && performanceMode === 'high') {
        // 현재 상태에 맞는 VFX 결정
        const vfxResult = getScenarioVFX(currentState)

        // VFX 상태 업데이트 (UI 표시용)
        if (vfxResult.shader !== currentVFX) {
          setCurrentVFX(vfxResult.shader)
        }

        // VFX 적용
        if (vfxResult.shader !== 'none' && vfxResult.intensity > 0.1) {
          vfxProcessorRef.current.apply(
            hudCanvas,
            ctx,
            vfxResult.shader,
            currentState.time,
            vfxResult.options as Record<string, number>
          )
        } else {
          // VFX 없이 그대로 복사
          ctx.drawImage(hudCanvas, 0, 0)
        }
      } else {
        // VFX 비활성화 시 그대로 복사
        ctx.drawImage(hudCanvas, 0, 0)
        if (currentVFX !== 'none') {
          setCurrentVFX('none')
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // Step 3: UI 오버레이 (VFX 영향 받지 않음)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // 로그인 팝업 렌더링
      if (extendedStateRef.current.loginPopup.visible) {
        drawLoginPopup(ctx, width, height, extendedStateRef.current.loginPopup, currentState.time)
      }

      // 성능 모드 표시
      ctx.save()
      ctx.font = '10px monospace'
      ctx.fillStyle = performanceMode === 'low' ? '#FFAA00' : '#00FF88'
      ctx.textAlign = 'right'
      ctx.fillText(`[Q] ${performanceMode === 'low' ? '저사양 30fps' : '고성능 60fps'}`, width - 20, height - 55)

      // VFX 상태 표시
      ctx.fillStyle = vfxEnabled ? '#00FFFF' : '#FF6600'
      ctx.fillText(`[V] VFX: ${vfxEnabled ? currentVFX : 'OFF'}`, width - 20, height - 40)

      // 로그인 팝업 힌트
      ctx.fillStyle = '#88AAFF'
      ctx.fillText(`[L] Login Popup`, width - 20, height - 25)
      ctx.restore()

      // 상태 업데이트 (오프라인 렌더링용)
      const now = performance.now()
      if (now - lastStateUpdateRef.current >= 100) {
        lastStateUpdateRef.current = now
        onStateUpdateRef.current?.({
          timestamp: now,
          mouse: {
            x: currentState.mouse.x,
            y: currentState.mouse.y,
            buttons: isMouseDown ? 1 : 0
          },
          targets: {
            main: {
              x: currentState.mouse.x,
              y: currentState.mouse.y,
              locked: currentState.isLocked
            },
          },
          customData: {
            scenario: currentState.scenario,
            player: currentState.player,
            target: currentState.target,
            effects: currentState.effects,
            lockProgress: currentState.lockProgress,
          }
        })
      }

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationRef.current)
  }, [width, height, performanceMode, frameInterval, isMouseDown])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      tabIndex={0}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'crosshair',
        outline: 'none',
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
      }}
    />
  )
}
