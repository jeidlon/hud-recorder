/**
 * Cyberpunk HUD - Remotion 스타일
 * 
 * Remotion의 spring(), interpolate(), Sequence 패턴을 사용한 
 * 고퀄리티 사이버펑크 스타일 HUD
 * 
 * 특징:
 * - 스프링 기반 자연스러운 애니메이션
 * - 스태거드 UI 등장 효과
 * - 글리치 텍스트 효과
 * - 동적 스캔라인
 */

import * as React from 'react'
import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import type { HUDComponentProps } from '@/presets/index'
import type { HUDState } from '@/types/hud-protocol'
import {
  useHUDFrame,
  useHUDConfig,
  useHUDState,
  RemotionHUDProvider,
  interpolate,
  spring,
  Easing,
  Sequence,
} from './RemotionHUDWrapper'

// ===== Color Palette =====
const COLORS = {
  primary: '#00f0ff',      // 시안
  secondary: '#ff00ff',    // 마젠타
  accent: '#ffff00',       // 옐로우
  warning: '#ff3333',      // 레드
  success: '#00ff88',      // 그린
  bg: 'rgba(0, 0, 0, 0.6)',
  bgPanel: 'rgba(0, 20, 40, 0.8)',
}

// ===== Spring Presets =====
const SPRING_PRESETS = {
  snappy: { damping: 20, stiffness: 300 },
  smooth: { damping: 30, stiffness: 120 },
  bouncy: { damping: 8, stiffness: 180 },
  heavy: { damping: 25, stiffness: 80, mass: 2 },
}

// ===== Animated Components =====

/** 글리치 텍스트 */
const GlitchText: React.FC<{ 
  text: string
  style?: React.CSSProperties 
  intensity?: number
}> = ({ text, style, intensity = 1 }) => {
  const frame = useHUDFrame()
  const { fps } = useHUDConfig()
  
  // 랜덤 글리치 (매 N프레임마다)
  const glitchFrame = Math.floor(frame / 3)
  const isGlitching = (glitchFrame % 7 === 0 || glitchFrame % 13 === 0) && intensity > 0
  
  const offsetX = isGlitching ? (Math.sin(frame * 0.5) * 3 * intensity) : 0
  const offsetY = isGlitching ? (Math.cos(frame * 0.7) * 2 * intensity) : 0
  
  return (
    <div style={{ position: 'relative', ...style }}>
      {/* 레드 채널 */}
      {isGlitching && (
        <span
          style={{
            position: 'absolute',
            left: -2 * intensity,
            color: COLORS.warning,
            opacity: 0.7,
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </span>
      )}
      {/* 시안 채널 */}
      {isGlitching && (
        <span
          style={{
            position: 'absolute',
            left: 2 * intensity,
            color: COLORS.primary,
            opacity: 0.7,
            mixBlendMode: 'screen',
          }}
        >
          {text}
        </span>
      )}
      {/* 메인 텍스트 */}
      <span
        style={{
          position: 'relative',
          transform: `translate(${offsetX}px, ${offsetY}px)`,
        }}
      >
        {text}
      </span>
    </div>
  )
}

/** 애니메이션 바 (HP, 에너지 등) */
const AnimatedBar: React.FC<{
  value: number
  maxValue: number
  color: string
  label: string
  delay?: number
}> = ({ value, maxValue, color, label, delay = 0 }) => {
  const frame = useHUDFrame()
  const { fps } = useHUDConfig()
  
  // 스프링으로 바 등장
  const barScale = spring({
    frame,
    fps,
    delay,
    config: SPRING_PRESETS.snappy,
  })
  
  // 값 애니메이션
  const percentage = (value / maxValue) * 100
  const animatedWidth = spring({
    frame,
    fps,
    delay: delay + 10,
    config: SPRING_PRESETS.smooth,
    to: percentage,
  })
  
  return (
    <div
      style={{
        opacity: barScale,
        transform: `scaleX(${barScale})`,
        transformOrigin: 'left',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: COLORS.primary, fontFamily: 'monospace' }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: color, fontFamily: 'monospace' }}>
          {value}/{maxValue}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${animatedWidth}%`,
            background: `linear-gradient(90deg, ${color}, ${color}88)`,
            boxShadow: `0 0 10px ${color}`,
            transition: 'none', // Remotion 스타일: CSS transition 금지!
          }}
        />
      </div>
    </div>
  )
}

/** 타겟 락온 크로스헤어 */
const Crosshair: React.FC<{
  x: number
  y: number
  isLocked: boolean
  lockProgress?: number
}> = ({ x, y, isLocked, lockProgress = 0 }) => {
  const frame = useHUDFrame()
  const { fps } = useHUDConfig()
  
  // 락온 시 스케일 애니메이션
  const lockedScale = isLocked
    ? spring({ frame, fps, config: SPRING_PRESETS.bouncy })
    : 1
  
  // 회전 애니메이션
  const rotation = interpolate(frame, [0, fps * 4], [0, 360], {
    extrapolateRight: 'extend',
  })
  
  // 펄스 효과
  const pulse = interpolate(
    frame % fps,
    [0, fps / 2, fps],
    [1, 1.1, 1],
    { extrapolateRight: 'clamp' }
  )
  
  const color = isLocked ? COLORS.warning : COLORS.primary
  const size = 80 * lockedScale * (isLocked ? pulse : 1)
  
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}
    >
      {/* 외부 링 (회전) */}
      <svg
        width={size}
        height={size}
        viewBox="-50 -50 100 100"
        style={{
          transform: `rotate(${rotation}deg)`,
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -size / 2,
          marginTop: -size / 2,
        }}
      >
        <circle
          r="40"
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeDasharray="10 5"
          opacity={0.5}
        />
        {/* 코너 마커 */}
        {[0, 90, 180, 270].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path
              d="M 35 -5 L 40 0 L 35 5"
              fill="none"
              stroke={color}
              strokeWidth="2"
            />
          </g>
        ))}
      </svg>
      
      {/* 내부 크로스헤어 */}
      <svg
        width={50}
        height={50}
        viewBox="-25 -25 50 50"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -25,
          marginTop: -25,
        }}
      >
        {/* 십자선 */}
        <line x1="-15" y1="0" x2="-5" y2="0" stroke={color} strokeWidth="2" />
        <line x1="5" y1="0" x2="15" y2="0" stroke={color} strokeWidth="2" />
        <line x1="0" y1="-15" x2="0" y2="-5" stroke={color} strokeWidth="2" />
        <line x1="0" y1="5" x2="0" y2="15" stroke={color} strokeWidth="2" />
        
        {/* 중앙 점 */}
        <circle r="2" fill={color} />
        
        {/* 락온 진행도 */}
        {!isLocked && lockProgress > 0 && (
          <circle
            r="20"
            fill="none"
            stroke={COLORS.accent}
            strokeWidth="2"
            strokeDasharray={`${lockProgress * 1.26} 126`}
            transform="rotate(-90)"
          />
        )}
      </svg>
      
      {/* 락온 텍스트 */}
      {isLocked && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: size / 2 + 10,
            transform: 'translateX(-50%)',
            color: COLORS.warning,
            fontSize: 12,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${COLORS.warning}`,
          }}
        >
          LOCKED
        </div>
      )}
    </div>
  )
}

/** 스캔라인 오버레이 */
const Scanlines: React.FC = () => {
  const frame = useHUDFrame()
  const { fps, height } = useHUDConfig()
  
  const offset = (frame % (fps * 2)) * 2
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.1) 2px,
          rgba(0, 0, 0, 0.1) 4px
        )`,
        transform: `translateY(${offset % 4}px)`,
      }}
    />
  )
}

/** 메인 HUD 레이아웃 */
const CyberpunkHUDContent: React.FC = () => {
  const frame = useHUDFrame()
  const { fps, width, height } = useHUDConfig()
  const hudState = useHUDState()
  
  // 스태거드 UI 등장
  const panelDelay = 0
  const panelStagger = 5
  
  // 상태 값들 (hudState에서 가져오거나 기본값)
  const hp = 85
  const maxHp = 100
  const energy = 60
  const maxEnergy = 100
  const shield = 45
  const maxShield = 100
  
  // 마우스/타겟 위치
  const mouseX = hudState?.mouse?.x ?? width / 2
  const mouseY = hudState?.mouse?.y ?? height / 2
  const isLocked = hudState?.targets?.main?.locked ?? false
  
  // 시간 표시 (프레임 기반)
  const seconds = Math.floor(frame / fps)
  const minutes = Math.floor(seconds / 60)
  const displaySeconds = seconds % 60
  const timeStr = `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`
  
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        fontFamily: "'Rajdhani', 'Orbitron', monospace",
        color: COLORS.primary,
      }}
    >
      {/* 스캔라인 */}
      <Scanlines />
      
      {/* 좌상단: 스탯 패널 */}
      <Sequence from={panelDelay}>
        <div
          style={{
            position: 'absolute',
            left: 20,
            top: 20,
            width: 200,
            padding: 15,
            background: COLORS.bgPanel,
            border: `1px solid ${COLORS.primary}40`,
            borderRadius: 4,
          }}
        >
          <GlitchText
            text="SYSTEM STATUS"
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 15,
              color: COLORS.primary,
            }}
            intensity={0.5}
          />
          
          <AnimatedBar
            value={hp}
            maxValue={maxHp}
            color={hp < 30 ? COLORS.warning : COLORS.success}
            label="HP"
            delay={panelDelay + panelStagger}
          />
          
          <AnimatedBar
            value={energy}
            maxValue={maxEnergy}
            color={COLORS.primary}
            label="ENERGY"
            delay={panelDelay + panelStagger * 2}
          />
          
          <AnimatedBar
            value={shield}
            maxValue={maxShield}
            color={COLORS.secondary}
            label="SHIELD"
            delay={panelDelay + panelStagger * 3}
          />
        </div>
      </Sequence>
      
      {/* 우상단: 타임 & 좌표 */}
      <Sequence from={panelDelay + 10}>
        <div
          style={{
            position: 'absolute',
            right: 20,
            top: 20,
            padding: 15,
            background: COLORS.bgPanel,
            border: `1px solid ${COLORS.primary}40`,
            borderRadius: 4,
            textAlign: 'right',
          }}
        >
          <div style={{ fontSize: 24, fontFamily: 'monospace', fontWeight: 'bold' }}>
            {timeStr}
          </div>
          <div style={{ fontSize: 10, color: COLORS.primary, opacity: 0.7, marginTop: 5 }}>
            POS: {Math.round(mouseX)}, {Math.round(mouseY)}
          </div>
        </div>
      </Sequence>
      
      {/* 하단 중앙: 상태 바 */}
      <Sequence from={panelDelay + 20}>
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 20,
            padding: '10px 20px',
            background: COLORS.bgPanel,
            border: `1px solid ${COLORS.primary}40`,
            borderRadius: 4,
          }}
        >
          <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
            <span style={{ color: COLORS.accent }}>◆</span> TRACKING
          </div>
          <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
            <span style={{ color: isLocked ? COLORS.warning : COLORS.success }}>●</span>
            {isLocked ? ' LOCKED' : ' SCANNING'}
          </div>
          <div style={{ fontSize: 12, fontFamily: 'monospace' }}>
            FPS: {fps}
          </div>
        </div>
      </Sequence>
      
      {/* 크로스헤어 */}
      <Crosshair x={mouseX} y={mouseY} isLocked={isLocked} />
      
      {/* 코너 프레임 */}
      <svg
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 좌상단 */}
        <path
          d={`M 0 50 L 0 0 L 50 0`}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2"
          opacity={0.5}
        />
        {/* 우상단 */}
        <path
          d={`M ${width - 50} 0 L ${width} 0 L ${width} 50`}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2"
          opacity={0.5}
        />
        {/* 좌하단 */}
        <path
          d={`M 0 ${height - 50} L 0 ${height} L 50 ${height}`}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2"
          opacity={0.5}
        />
        {/* 우하단 */}
        <path
          d={`M ${width - 50} ${height} L ${width} ${height} L ${width} ${height - 50}`}
          fill="none"
          stroke={COLORS.primary}
          strokeWidth="2"
          opacity={0.5}
        />
      </svg>
    </div>
  )
}

// ===== 메인 HUD 컴포넌트 (hud-recorder 시스템과 통합) =====

export function CyberpunkHUD({
  width,
  height,
  isPlaying,
  onStateUpdate,
  onReady,
}: HUDComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState(0)
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const [isLocked, setIsLocked] = useState(false)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const fps = 60
  
  // 마우스 이벤트
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    setMousePos({ x, y })
  }, [width, height])
  
  const handleClick = useCallback(() => {
    setIsLocked((prev) => !prev)
  }, [])
  
  // 프레임 루프
  useEffect(() => {
    const updateFrame = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      
      const delta = timestamp - lastTimeRef.current
      if (delta >= 1000 / fps) {
        lastTimeRef.current = timestamp
        setFrame((f) => f + 1)
      }
      
      animationRef.current = requestAnimationFrame(updateFrame)
    }
    
    animationRef.current = requestAnimationFrame(updateFrame)
    return () => cancelAnimationFrame(animationRef.current)
  }, [])
  
  // 상태 업데이트
  useEffect(() => {
    const hudState: HUDState = {
      timestamp: performance.now(),
      mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
      targets: {
        main: { x: mousePos.x, y: mousePos.y, locked: isLocked },
      },
    }
    onStateUpdate?.(hudState)
  }, [mousePos, isLocked, onStateUpdate])
  
  // Ready 알림
  useEffect(() => {
    onReady?.()
  }, [onReady])
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        cursor: 'crosshair',
      }}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
    >
      <RemotionHUDProvider
        frame={frame}
        fps={fps}
        durationInFrames={9999}
        width={width}
        height={height}
        hudState={{
          timestamp: performance.now(),
          mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
          targets: {
            main: { x: mousePos.x, y: mousePos.y, locked: isLocked },
          },
        }}
      >
        <CyberpunkHUDContent />
      </RemotionHUDProvider>
    </div>
  )
}
