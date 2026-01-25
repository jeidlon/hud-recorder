/**
 * Hexa-Tactical OS 98 HUD - 메인 컴포넌트 (Onboarding v3 - 모든 문제 수정)
 * 
 * Remotion 스타일 프레임 기반 렌더링 지원:
 * - 미리보기: requestAnimationFrame으로 자체 프레임 증가
 * - 렌더링: externalState.timestamp → 프레임 번호 변환
 */

import * as React from 'react'
import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { HUDComponentProps } from '../index'

import {
  type HexaScenarioId,
  HUD_COLORS,
  FONTS,
  getScenarioTheme,
} from './constants'

// Remotion 스타일 유틸리티
import { interpolate, spring } from '../remotion/RemotionHUDWrapper'

// 🎬 프레임 동기화 애니메이션 시스템
import { FrameAnimatedDiv, easing } from './utils/frameAnimation'

// 🎬 Event Sourcing 시스템
import { useEventEmitter, eventSourceLog } from '../../core/useEventSourcedState'

// 렌더링 모드 Context (framer-motion 애니메이션 비활성화용)
const RenderModeContext = React.createContext(false)
export const useIsRenderMode = () => React.useContext(RenderModeContext)

// 🎬 외부 타임스탬프 Context (Remotion 프레임 동기화용)
const ExternalTimestampContext = React.createContext(0)
export const useExternalTimestamp = () => React.useContext(ExternalTimestampContext)

import {
  WindowShell,
  ScanlineOverlay,
  ConnectionBanner,
} from './components'

import { GameIcons } from './components/GameIcons'
import { FrameSpinner } from './components/FrameSpinner'
import { TextDecipher, MovingLines, Illuminator, FrameCornersCSS, FireSequence } from './effects'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 키보드 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SCENARIO_KEYS: Record<string, HexaScenarioId> = {
  '2': 'link_progress',
  '3': 'persona_sync',
  '4': 'profile_danger',
  '5': 'monster_combat',
  '6': 'psycho_attack',
  '7': 'infected',
  '8': 'trauma',
  '9': 'evolved',
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAKE CODE DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FAKE_CODE_LINES = [
  "INIT NEURAL_LINK v2.4.7...",
  "BYPASS SECURE_FIREWALL [OK]",
  "DECRYPT BIOMETRIC_DATA...",
  "SYNC WAVEFORMS [||||||||||] 99%",
  "ALLOC MEMORY_BLOCKS 0x7FFF...",
  "OPTIMIZE RENDER_PIPELINE...",
  "LOAD PERSONA_PROTOCOLS...",
  "CHECK INTEGRITY [PASSED]",
  "ESTABLISH SECURE_CONN...",
  "DOWNLOAD ASSETS [128KB]...",
  "VERIFY USER_TOKEN [OK]",
  "ACCESS GRANTED.",
  "LOADING PERSONA: MAGICO",
  "NEURAL_SYNC: 98.7%",
  "SYSTEM READY.",
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: Voice Waveform (개선 - 초반 잠잠 → 후반 요동, 골드 색상)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VoiceWaveform: React.FC<{ isSpeaking?: boolean }> = ({ isSpeaking: _isSpeaking = true }) => {
  void _isSpeaking; // Reserved for future use
  const BAR_COUNT = 40 // 바 개수 늘림
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(10))
  const [phase, setPhase] = useState<'idle' | 'speaking' | 'fading' | 'done'>('idle')
  const fadeProgress = useRef(1) // 1 = full intensity, 0 = silent
  
  // 음성인식 시뮬레이션: idle(0.8초) -> speaking(2.7초) -> fading(0.8초) -> done
  useEffect(() => {
    // 0.8초 후 말하기 시작
    const startSpeaking = setTimeout(() => setPhase('speaking'), 800)
    // 3초 후 페이드 아웃 시작
    const startFading = setTimeout(() => {
      setPhase('fading')
      fadeProgress.current = 1
    }, 3000)
    // 3.8초 후 완전 종료
    const stopSpeaking = setTimeout(() => setPhase('done'), 3800)
    
    return () => {
      clearTimeout(startSpeaking)
      clearTimeout(startFading)
      clearTimeout(stopSpeaking)
    }
  }, [])
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (phase === 'speaking') {
        // 말하는 중: 크게 요동 (중앙이 더 높게)
        setBars(prev => prev.map((_, i) => {
          const centerWeight = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2) * 0.4
          return (Math.random() * 80 + 20) * centerWeight
        }))
      } else if (phase === 'fading') {
        // 점점 줄어듦 (0.8초간)
        fadeProgress.current = Math.max(0, fadeProgress.current - 0.06) // 약 16프레임에 걸쳐 감소
        const intensity = fadeProgress.current
        setBars(prev => prev.map((_, i) => {
          const centerWeight = 1 - Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2) * 0.4
          const maxHeight = (Math.random() * 60 + 15) * centerWeight * intensity
          const minHeight = Math.random() * 8 + 3
          return Math.max(minHeight, maxHeight)
        }))
      } else if (phase === 'done') {
        // 말 끝남: 완전 조용
        setBars(prev => prev.map(() => Math.random() * 5 + 2))
      } else {
        // 대기 중: 잠잠
        setBars(prev => prev.map(() => Math.random() * 12 + 5))
      }
    }, 50)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'space-between', 
      gap: 1, 
      height: 24,
      width: '100%', // 전체 너비
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${h}%`,
          background: (phase === 'speaking' || phase === 'fading') ? HUD_COLORS.goldBright : HUD_COLORS.goldDim,
          borderRadius: 1,
          boxShadow: (phase === 'speaking' || phase === 'fading') ? `0 0 3px ${HUD_COLORS.goldGlow}` : 'none',
          transition: 'height 0.08s ease-out, background 0.3s',
        }} />
      ))}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: Onboarding Popup (중앙 정렬 수정, 색상 통일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface OnboardingPopupProps {
  step: 'code' | 'voice' | 'enter' | 'connecting' | 'success'
}

const OnboardingPopup: React.FC<OnboardingPopupProps> = ({ step }) => {
  const [codeLines, setCodeLines] = useState<string[]>([])
  const [typedName, setTypedName] = useState("")
  const [showCursor, setShowCursor] = useState(true)

  // Code Scrolling Effect
  useEffect(() => {
    if (step === 'code') {
      setCodeLines([])
      let lineIndex = 0
      
      const addLine = () => {
        if (lineIndex < FAKE_CODE_LINES.length) {
          setCodeLines(prev => [...prev.slice(-6), FAKE_CODE_LINES[lineIndex]])
          lineIndex++
          setTimeout(addLine, Math.random() * 200 + 50)
        }
      }
      addLine()
    }
  }, [step])

  // Typing Effect
  useEffect(() => {
    if (step === 'voice') {
      setTypedName("")
      const targetText = "매지코"
      let currentIndex = 0
      
      const timeout = setTimeout(() => {
        const interval = setInterval(() => {
          if (currentIndex < targetText.length) {
            setTypedName(targetText.slice(0, currentIndex + 1))
            currentIndex++
          } else {
            clearInterval(interval)
          }
        }, 400)
        return () => clearInterval(interval)
      }, 1200)
      return () => clearTimeout(timeout)
    }
  }, [step])

  // Cursor Blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(prev => !prev), 400)
    return () => clearInterval(interval)
  }, [])

  // 색상 통일
  const getThemeColors = () => {
    if (step === 'code') return { color: HUD_COLORS.cyanBright, glow: HUD_COLORS.cyanGlow }
    if (step === 'success') return { color: HUD_COLORS.greenBright, glow: HUD_COLORS.greenGlow }
    if (step === 'connecting') return { color: HUD_COLORS.cyan, glow: HUD_COLORS.cyanGlow }
    return { color: HUD_COLORS.goldBright, glow: HUD_COLORS.goldGlow } // voice, enter
  }
  const { color: themeColor, glow: themeGlow } = getThemeColors()

  return (
    // 완전 중앙 정렬을 위한 컨테이너 (absolute로 변경 - 미리보기 내부에 표시)
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      pointerEvents: 'none'
    }}>
      <FrameAnimatedDiv
        startTime={0}
        duration={200}
        from={{ opacity: 0, scale: 0.95 }}
        to={{ opacity: 1, scale: 1 }}
        easing="linear"
        style={{ pointerEvents: 'auto' }}
      >
        <div style={{ position: 'relative' }}>
          {/* ARWES FrameCorners 효과 */}
          <FrameCornersCSS 
            strokeWidth={2}
            cornerLength={20}
            color={themeColor}
            glowColor={themeGlow}
            padding={0}
            animated={true}
            animationDuration={400}
          />
          <WindowShell
            title={step === 'code' ? "SYSTEM BOOT" : step === 'success' ? "STATUS" : "PERSONA CONNECT"}
            width={420}
            height={step === 'code' ? 200 : 180}
            glowIntensity="strong"
            showTitlebar={true}
            showControls={false}
            borderColor={themeColor}
            titleColor={themeColor}
          >
            <div style={{ 
              display: 'flex', flexDirection: 'column', height: '100%', 
              justifyContent: 'space-between', padding: 8,
              fontFamily: FONTS.korean // 한글폰트 적용
            }}>
            
            {/* Main Text - ARWES TextDecipher 효과 적용 */}
            <div style={{ 
              fontFamily: FONTS.display, 
              fontSize: step === 'success' ? 20 : 22, 
              color: themeColor,
              textShadow: `0 0 10px ${themeGlow}`,
              textAlign: 'center',
              marginBottom: 8
            }}>
              {step === 'code' && "LINK IN PROGRESS..."}
              {step === 'voice' && "페르소나의 이름을 불러 접속하세요"}
              {step === 'enter' && "페르소나의 이름을 불러 접속하세요"}
              {step === 'connecting' && "접속중..."}
              {step === 'success' && <TextDecipher text="CONNECTION COMPLETE" duration={600} isActive={true} />}
            </div>

            {/* Sub Content */}
            {step === 'code' && (
              <div style={{ 
                flex: 1, background: 'rgba(0,10,20,0.7)', 
                borderRadius: 4, padding: 8, overflow: 'hidden',
                fontFamily: FONTS.mono, fontSize: 9, color: HUD_COLORS.cyan,
                textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                border: `1px solid ${HUD_COLORS.cyanGlow}`
              }}>
                {codeLines.map((line, i) => (
                  <div key={i}>
                    <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span> {line}
                  </div>
                ))}
              </div>
            )}

            {step === 'voice' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
                {/* Typed Name 영역 - 중앙보다 살짝 위에 */}
                <div 
                  style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: 30, // 위로 올림
                  }}
                >
                  <div 
                    style={{ 
                      fontSize: 32, // 크기 줄임
                      color: HUD_COLORS.goldBright,
                      textShadow: `0 0 8px ${HUD_COLORS.goldGlow}, 0 0 20px ${HUD_COLORS.goldGlow}`,
                      letterSpacing: '0.12em',
                      display: 'flex', alignItems: 'center',
                      fontFamily: '"Do Hyeon", "Noto Sans KR", sans-serif',
                      minHeight: 40,
                    }}
                  >
                    {typedName}
                    <span style={{ 
                      width: 2, height: 32, background: HUD_COLORS.goldBright, marginLeft: 3,
                      opacity: showCursor ? 1 : 0
                    }} />
                  </div>
                </div>
                
                {/* Voice Waveform - 팝업창 완전 최하단, 여백 완전 제거 */}
                <div style={{ 
                  position: 'absolute',
                  bottom: -8, // WindowShell 패딩 오프셋
                  left: -8,
                  right: -8,
                  opacity: 0.9,
                }}>
                  <VoiceWaveform />
                </div>
              </div>
            )}

            {/* Enter 후 태그 스타일 - 유튜브 태그처럼 박스 안에 텍스트 */}
            {step === 'enter' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15, flex: 1, justifyContent: 'center' }}>
                {/* 태그 스타일 박스 */}
                <FrameAnimatedDiv
                  startTime={0}
                  duration={200}
                  from={{ scale: 0.8, opacity: 0 }}
                  to={{ scale: 1, opacity: 1 }}
                  easing="easeOut"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '10px 24px',
                    background: 'rgba(255,215,0,0.12)',
                    border: `2px solid ${HUD_COLORS.goldBright}`,
                    borderRadius: 6,
                    boxShadow: `0 0 15px ${HUD_COLORS.goldGlow}, inset 0 0 20px rgba(255,215,0,0.05)`,
                  }}
                >
                  <span style={{
                    fontSize: 28,
                    fontFamily: '"Do Hyeon", "Noto Sans KR", sans-serif',
                    fontWeight: 700,
                    color: HUD_COLORS.goldBright,
                    textShadow: `0 0 10px ${HUD_COLORS.goldGlow}`,
                    letterSpacing: '0.1em',
                  }}>
                    매지코
                  </span>
                </FrameAnimatedDiv>
                
                {/* 작은 안내 텍스트 */}
                <div style={{
                  fontSize: 11,
                  fontFamily: FONTS.korean,
                  color: HUD_COLORS.textDim,
                  opacity: 0.7,
                }}>
                  페르소나 선택 완료
                </div>
              </div>
            )}

            {/* 접속중... 로딩 단계 - 스피너만 표시 */}
            {step === 'connecting' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                {/* 🎬 프레임 기반 스피너 - Remotion 호환 */}
                <FrameSpinner 
                  size={40}
                  borderWidth={3}
                  color={HUD_COLORS.cyanGlow}
                  highlightColor={HUD_COLORS.cyanBright}
                  speed={1}
                />
              </div>
            )}

            {step === 'success' && (
              <FrameAnimatedDiv 
                startTime={0}
                duration={150}
                from={{ scale: 0.8, opacity: 0 }}
                to={{ scale: 1, opacity: 1 }}
                easing="linear"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'center' }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={HUD_COLORS.greenBright} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div style={{ fontSize: 16, color: HUD_COLORS.greenBright, fontFamily: FONTS.korean }}>
                  접속 완료
                </div>
              </FrameAnimatedDiv>
            )}

            </div>
          </WindowShell>
        </div>
      </FrameAnimatedDiv>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 동기화 채팅 메시지 (좌측 하단, 게임 채팅 스타일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SyncChatMessage: React.FC<{ step: 'sync' | 'complete'; onComplete: () => void }> = ({ step, onComplete }) => {
  const [dots, setDots] = useState("")
  const [progress, setProgress] = useState(0)
  const [showComplete, setShowComplete] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const totalBlocks = 20
  
  // 점 애니메이션
  useEffect(() => {
    if (step === 'sync' && !showComplete) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? "" : prev + ".")
      }, 400)
      return () => clearInterval(interval)
    }
  }, [step, showComplete])
  
  // 로딩바 진행
  useEffect(() => {
    if (step === 'sync' && !showComplete) {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 100))
      }, 100) // 5초 동안 100%
      return () => clearInterval(interval)
    }
  }, [step, showComplete])
  
  // 5초 후 완료
  useEffect(() => {
    if (step === 'sync') {
      const completeTimer = setTimeout(() => {
        setShowComplete(true)
        setProgress(100)
        onComplete()
      }, 5000)
      return () => clearTimeout(completeTimer)
    }
  }, [step, onComplete])
  
  // 완료 후 3초 뒤 페이드아웃
  useEffect(() => {
    if (showComplete) {
      const fadeTimer = setTimeout(() => {
        setFadeOut(true)
      }, 3000)
      return () => clearTimeout(fadeTimer)
    }
  }, [showComplete])

  // CLI 로딩바 생성
  const filledBlocks = Math.floor((progress / 100) * totalBlocks)
  const loadingBar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks)

  return (
    <FrameAnimatedDiv
      startTime={0}
      duration={300}
      from={{ opacity: 0, x: -20 }}
      to={{ opacity: fadeOut ? 0 : 1, x: 0 }}
      easing="easeOutCubic"
      style={{
        position: 'absolute',
        left: 20,
        bottom: 180, // SYSTEM LOG 위에 위치
        zIndex: 100,
        fontFamily: FONTS.mono,
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* SYNCHRONIZATION... 메시지 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: HUD_COLORS.goldBright, // 노란색으로 변경
        textShadow: `0 0 6px ${HUD_COLORS.goldGlow}`,
      }}>
        <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span>
        <span>SYNCHRONIZATION{showComplete ? "" : dots}</span>
      </div>
      
      {/* CLI 로딩바 */}
      {!showComplete && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: HUD_COLORS.goldBright,
          textShadow: `0 0 4px ${HUD_COLORS.goldGlow}`,
          letterSpacing: '0.05em',
        }}>
          <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span>
          <span style={{ fontSize: 10 }}>[{loadingBar}]</span>
          <span style={{ fontSize: 9, opacity: 0.8 }}>{progress}%</span>
        </div>
      )}
      
      {/* SYNCHRONIZATION COMPLETE! 메시지 */}
      {showComplete && (
        <FrameAnimatedDiv
          startTime={0}
          duration={200}
          from={{ opacity: 0, y: -5 }}
          to={{ opacity: 1, y: 0 }}
          easing="easeOutCubic"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: HUD_COLORS.greenBright,
            textShadow: `0 0 6px ${HUD_COLORS.greenGlow}`,
          }}
        >
          <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span>
          <span>✓ SYNCHRONIZATION COMPLETE!</span>
        </FrameAnimatedDiv>
      )}
    </FrameAnimatedDiv>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 몬스터 출현 배너 (오버워치 스타일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MonsterBanner: React.FC<{ visible: boolean; onComplete: () => void }> = ({ visible, onComplete }) => {
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (visible) {
      // 1.5초 후 완료 (애니메이션 끝나면 사라짐)
      const completeTimer = setTimeout(() => {
        onCompleteRef.current()
      }, 1500)
      return () => clearTimeout(completeTimer)
    }
  }, [visible])

  if (!visible) return null

  return (
    <>
      {/* CSS 키프레임 정의 */}
      <style>{`
        @keyframes monster-banner-container {
          0% { opacity: 0; transform: translateY(-50%) scaleY(0); }
          10% { opacity: 1; transform: translateY(-50%) scaleY(1); }
          90% { opacity: 1; transform: translateY(-50%) scaleY(1); }
          100% { opacity: 0; transform: translateY(-50%) scaleY(0); }
        }
        @keyframes monster-banner-band {
          0%, 80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes monster-banner-text {
          0% { transform: translateX(-150%); }
          20% { transform: translateX(0%); }
          65% { transform: translateX(0%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'monster-banner-container 1.5s ease-out forwards',
        }}
      >
        {/* 빨간 띠 */}
        <div
          style={{
            width: '100%',
            background: 'rgba(200, 30, 30, 0.7)',
            padding: '12px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            animation: 'monster-banner-band 1.5s ease-out forwards',
          }}
        >
          {/* 텍스트 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              animation: 'monster-banner-text 1.5s ease-out forwards',
            }}
          >
            {/* 경고 아이콘 (세모 !) */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L1 21h22L12 2z" fill="rgba(0,0,0,0.6)" stroke="rgba(0,0,0,0.8)" strokeWidth="1"/>
              <text x="12" y="18" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">!</text>
            </svg>
            <span style={{
              fontSize: 36,
              fontFamily: '"Black Han Sans", sans-serif',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'rgba(0, 0, 0, 0.75)',
              letterSpacing: '0',
            }}>
              몬스터 출현!
            </span>
            {/* 경고 아이콘 (세모 !) */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L1 21h22L12 2z" fill="rgba(0,0,0,0.6)" stroke="rgba(0,0,0,0.8)" strokeWidth="1"/>
              <text x="12" y="18" textAnchor="middle" fill="#FFF" fontSize="12" fontWeight="bold">!</text>
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 타겟팅 UI (유도미사일 스타일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const TargetLock: React.FC<{ target: TargetInfo; onRemove: (id: number) => void }> = ({ target, onRemove }) => {
  const isRenderMode = useIsRenderMode()
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    // 🎬 렌더링 모드에서는 타이머 비활성화
    if (isRenderMode) return
    const blinkInterval = setInterval(() => setBlink(p => !p), 300)
    const removeTimer = setTimeout(() => onRemove(target.id), 3000)
    return () => {
      clearInterval(blinkInterval)
      clearTimeout(removeTimer)
    }
  }, [target.id, onRemove, isRenderMode])

  return (
    <FrameAnimatedDiv
      startTime={0}
      duration={200}
      from={{ scale: 1.5, opacity: 0 }}
      to={{ scale: 1, opacity: 1 }}
      easing="easeOutCubic"
      style={{
        position: 'absolute',
        left: target.x - 50,
        top: target.y - 50,
        width: 100,
        height: 100,
        pointerEvents: 'none',
      }}
    >
      {/* 외곽 사각형 */}
      <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
        <rect x="5" y="5" width="90" height="90" stroke="#FF3333" strokeWidth="2" fill="none" opacity={0.8} />
        {/* 코너 강조 */}
        <path d="M5 20 L5 5 L20 5" stroke="#FF3333" strokeWidth="3" />
        <path d="M80 5 L95 5 L95 20" stroke="#FF3333" strokeWidth="3" />
        <path d="M95 80 L95 95 L80 95" stroke="#FF3333" strokeWidth="3" />
        <path d="M20 95 L5 95 L5 80" stroke="#FF3333" strokeWidth="3" />
        {/* 중앙 십자 */}
        <line x1="50" y1="35" x2="50" y2="45" stroke="#FF3333" strokeWidth="2" />
        <line x1="50" y1="55" x2="50" y2="65" stroke="#FF3333" strokeWidth="2" />
        <line x1="35" y1="50" x2="45" y2="50" stroke="#FF3333" strokeWidth="2" />
        <line x1="55" y1="50" x2="65" y2="50" stroke="#FF3333" strokeWidth="2" />
      </svg>
      {/* 상단: 몬스터명 */}
      <div style={{
        position: 'absolute',
        top: -25,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        fontFamily: FONTS.display,
        color: '#FF5555',
        whiteSpace: 'nowrap',
        textShadow: '0 0 5px rgba(255,0,0,0.5)',
      }}>
        랩틸리온 Lv.1
      </div>
      {/* 하단: DANGER */}
      <div style={{
        position: 'absolute',
        bottom: -22,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 12,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        color: '#FF3333',
        opacity: blink ? 1 : 0.3,
        textShadow: '0 0 8px rgba(255,0,0,0.8)',
      }}>
        DANGER!
      </div>
    </FrameAnimatedDiv>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 히트 마커 (FPS 스타일)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const HitMarkerUI: React.FC<{ marker: HitMarker; onRemove: (id: number) => void }> = ({ marker, onRemove }) => {
  const isRenderMode = useIsRenderMode()
  
  useEffect(() => {
    // 🎬 렌더링 모드에서는 타이머 비활성화 (상태가 customData에서 관리됨)
    if (isRenderMode) return
    const timer = setTimeout(() => onRemove(marker.id), 200)
    return () => clearTimeout(timer)
  }, [marker.id, onRemove, isRenderMode])

  return (
    <FrameAnimatedDiv
      startTime={0}
      duration={200}
      from={{ scale: 0.5, opacity: 1 }}
      to={{ scale: isRenderMode ? 1 : 1.2, opacity: isRenderMode ? 1 : 0 }}
      easing="easeOutCubic"
      style={{
        position: 'absolute',
        left: marker.x - 20,
        top: marker.y - 20,
        width: 40,
        height: 40,
        pointerEvents: 'none',
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <line x1="8" y1="8" x2="16" y2="16" stroke="#FFF" strokeWidth="3" />
        <line x1="32" y1="8" x2="24" y2="16" stroke="#FFF" strokeWidth="3" />
        <line x1="8" y1="32" x2="16" y2="24" stroke="#FFF" strokeWidth="3" />
        <line x1="32" y1="32" x2="24" y2="24" stroke="#FFF" strokeWidth="3" />
      </svg>
    </FrameAnimatedDiv>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 데미지 방향 화살표
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const DamageArrowUI: React.FC<{ arrow: DamageArrow; onRemove: (id: number) => void }> = ({ arrow, onRemove }) => {
  const isRenderMode = useIsRenderMode()
  
  useEffect(() => {
    // 🎬 렌더링 모드에서는 타이머 비활성화
    if (isRenderMode) return
    const timer = setTimeout(() => onRemove(arrow.id), 1000)
    return () => clearTimeout(timer)
  }, [arrow.id, onRemove, isRenderMode])

  return (
    <FrameAnimatedDiv
      startTime={0}
      duration={isRenderMode ? 0 : 1000}
      from={{ opacity: 1, scale: 1.2 }}
      to={{ opacity: isRenderMode ? 1 : 0, scale: 1 }}
      easing="easeOut"
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -75, // 중앙 정렬
        marginTop: -75,
        pointerEvents: 'none',
        width: 150,
        height: 150,
      }}
    >
      {/* FPS 스타일 데미지 인디케이터 - 화면 가장자리에서 중앙 방향 */}
      <svg 
        width="150" 
        height="150" 
        viewBox="0 0 150 150"
        style={{ 
          transform: `rotate(${arrow.angle}deg)`,
        }}
      >
        <defs>
          {/* 빨간색 그라데이션 - 바깥에서 안쪽으로 */}
          <linearGradient id={`damageGrad-${arrow.id}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FF0000" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#FF2222" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
          </linearGradient>
          {/* 글로우 필터 */}
          <filter id={`damageGlow-${arrow.id}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* 메인 화살표 - 화면 가장자리에서 중앙을 가리킴 */}
        <g filter={`url(#damageGlow-${arrow.id})`}>
          <path 
            d="M 75 10 L 60 50 L 75 40 L 90 50 Z" 
            fill={`url(#damageGrad-${arrow.id})`}
            stroke="#FF0000"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </FrameAnimatedDiv>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 사망 오버레이
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS Glitch 애니메이션 키프레임 스타일
const glitchKeyframes = `
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-3px, 3px); }
  40% { transform: translate(-3px, -3px); }
  60% { transform: translate(3px, 3px); }
  80% { transform: translate(3px, -3px); }
  100% { transform: translate(0); }
}
@keyframes noise {
  0%, 100% { opacity: 0.03; }
  10% { opacity: 0.08; }
  20% { opacity: 0.04; }
  30% { opacity: 0.1; }
  40% { opacity: 0.02; }
  50% { opacity: 0.07; }
  60% { opacity: 0.04; }
  70% { opacity: 0.09; }
  80% { opacity: 0.03; }
  90% { opacity: 0.06; }
}
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
`

const DeathOverlay: React.FC<{ visible: boolean; onConfirm: () => void }> = ({ visible, onConfirm }) => {
  const [showGlitch, setShowGlitch] = useState(false)
  const hasPlayedGlitch = useRef(false)

  useEffect(() => {
    if (visible && !hasPlayedGlitch.current) {
      hasPlayedGlitch.current = true
      // 글리치 효과 한 번만 재생 (0.5초간)
      setShowGlitch(true)
      setTimeout(() => setShowGlitch(false), 500)
    }
    if (!visible) {
      hasPlayedGlitch.current = false
    }
  }, [visible])

  if (!visible) return null

  return (
    <>
      {/* Glitch 키프레임 스타일 삽입 */}
      <style>{glitchKeyframes}</style>
      
      <FrameAnimatedDiv
        startTime={0}
        duration={300}
        from={{ opacity: 0 }}
        to={{ opacity: 1 }}
        easing="easeOutCubic"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // 배경 전체를 grayscale로 만드는 backdrop-filter
          backdropFilter: 'grayscale(100%) brightness(0.5)',
          WebkitBackdropFilter: 'grayscale(100%) brightness(0.5)',
        }}
      >
        {/* 노이즈 오버레이 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.15,
          animation: 'noise 0.2s infinite',
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }} />

        {/* 스캔라인 효과 */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
        }} />

        {/* WindowShell 스타일 빨간 팝업 - 글리치 효과 적용 */}
        <FrameAnimatedDiv
          startTime={300}
          duration={150}
          from={{ scale: 0.8, opacity: 0 }}
          to={{ scale: 1, opacity: 1 }}
          easing="easeOutCubic"
          style={{
            animation: showGlitch ? 'glitch 0.15s linear' : 'none',
          }}
        >
          {/* 글리치 시 RGB 분리 효과 */}
          {showGlitch && (
            <>
              <div style={{
                position: 'absolute',
                inset: 0,
                transform: 'translate(-3px, 0)',
                opacity: 0.5,
                filter: 'hue-rotate(-60deg)',
                pointerEvents: 'none',
              }}>
                <WindowShell title="SYSTEM ALERT" width={350} height={180} borderColor="#FF0000" titleColor="#FF0000" showTitlebar showControls glowIntensity="strong">
                  <div />
                </WindowShell>
              </div>
              <div style={{
                position: 'absolute',
                inset: 0,
                transform: 'translate(3px, 0)',
                opacity: 0.5,
                filter: 'hue-rotate(60deg)',
                pointerEvents: 'none',
              }}>
                <WindowShell title="SYSTEM ALERT" width={350} height={180} borderColor="#0000FF" titleColor="#0000FF" showTitlebar showControls glowIntensity="strong">
                  <div />
                </WindowShell>
              </div>
            </>
          )}
          
          <WindowShell
            title="SYSTEM ALERT"
            width={350}
            height={180}
            glowIntensity="strong"
            showTitlebar={true}
            showControls={true}
            borderColor="#FF4444"
            titleColor="#FF4444"
          >
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              padding: 15,
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: 20,
                fontFamily: '"Do Hyeon", sans-serif',
                color: '#FF4444',
                marginBottom: 8,
                textShadow: '0 0 10px rgba(255,0,0,0.6)',
              }}>
                1회차 꿈에서 사망하셨습니다
              </div>
              <div style={{
                fontSize: 12,
                fontFamily: '"Do Hyeon", sans-serif',
                color: '#FF8888',
                marginBottom: 20,
              }}>
                다음 꿈속에서 다시 접속하세요
              </div>
              <button
                onClick={onConfirm}
              style={{
                background: 'rgba(255,50,50,0.2)',
                border: '1px solid #FF5555',
                borderRadius: 0,
                padding: '8px 35px',
                fontSize: 14,
                fontFamily: '"AstaSans-VariableFont_wght", "Do Hyeon", sans-serif',
                color: '#FFF',
                cursor: 'pointer',
                transition: 'all 0.15s',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.4)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,50,50,0.2)'}
            >
              확인
            </button>
          </div>
        </WindowShell>
      </FrameAnimatedDiv>
    </FrameAnimatedDiv>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: 몬스터 채팅 메시지 (2줄 순차 표시)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const MonsterChatMessage: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [showLine1, setShowLine1] = useState(false)
  const [showLine2, setShowLine2] = useState(false)
  const [fadingLine1, setFadingLine1] = useState(false)
  const [fadingLine2, setFadingLine2] = useState(false)

  useEffect(() => {
    if (visible) {
      // 상태 초기화
      setShowLine1(true)
      setShowLine2(false)
      setFadingLine1(false)
      setFadingLine2(false)
      
      // 1초 후 두 번째 줄 표시
      const showLine2Timer = setTimeout(() => {
        setShowLine2(true)
        setFadingLine2(false)
      }, 1000)
      
      // 4초 후 첫 번째 줄 페이드아웃
      const fadeLine1Timer = setTimeout(() => setFadingLine1(true), 4000)
      // 4.5초 후 두 번째 줄 페이드아웃
      const fadeLine2Timer = setTimeout(() => setFadingLine2(true), 4500)
      
      // 5초 후 첫 번째 줄 숨김
      const hideLine1Timer = setTimeout(() => setShowLine1(false), 5000)
      // 5.5초 후 두 번째 줄 숨김
      const hideLine2Timer = setTimeout(() => setShowLine2(false), 5500)
      
      return () => {
        clearTimeout(showLine2Timer)
        clearTimeout(fadeLine1Timer)
        clearTimeout(fadeLine2Timer)
        clearTimeout(hideLine1Timer)
        clearTimeout(hideLine2Timer)
      }
    } else {
      // visible이 false가 되면 상태 리셋
      setShowLine1(false)
      setShowLine2(false)
      setFadingLine1(false)
      setFadingLine2(false)
    }
  }, [visible])

  if (!showLine1 && !showLine2) return null

  return (
    <div style={{
      position: 'absolute',
      left: 20,
      bottom: 180,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
    }}>
      {/* 첫 번째 줄: 몬스터 출현 */}
      {showLine1 && (
        <FrameAnimatedDiv
          startTime={0}
          duration={fadingLine1 ? 1000 : 300}
          from={{ opacity: 0, x: -20 }}
          to={{ opacity: fadingLine1 ? 0 : 1, x: 0 }}
          easing="easeOutCubic"
          style={{
            fontFamily: '"AstaSans", "Do Hyeon", sans-serif',
            fontSize: 12,
            color: '#FF4444',
            textShadow: '0 0 6px rgba(255,0,0,0.5)',
          }}
        >
          <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span> 몬스터 [랩틸리온]이 출현했습니다!
        </FrameAnimatedDiv>
      )}
      
      {/* 두 번째 줄: 사냥 안내 */}
      {showLine2 && (
        <FrameAnimatedDiv
          startTime={0}
          duration={fadingLine2 ? 1000 : 300}
          from={{ opacity: 0, x: -20 }}
          to={{ opacity: fadingLine2 ? 0 : 1, x: 0 }}
          easing="easeOutCubic"
          style={{
            fontFamily: '"AstaSans", "Do Hyeon", sans-serif',
            fontSize: 12,
            color: '#FFAA44',
            textShadow: '0 0 6px rgba(255,150,0,0.5)',
          }}
        >
          <span style={{ color: HUD_COLORS.goldDim }}>{'>'}</span> 몬스터를 사냥하세요!
        </FrameAnimatedDiv>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 컴포넌트: CLI 스타일 바텀시트 (사용 안함 - 레거시)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// @ts-ignore: Legacy component kept for reference
const _SyncBottomSheet: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState("")
  const totalBlocks = 30
  
  useEffect(() => {
    const startTime = Date.now()
    const duration = 5000
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      setProgress(newProgress)
      
      if (newProgress >= 1) {
        clearInterval(interval)
        setTimeout(onComplete, 300)
      }
    }, 50)
    
    return () => clearInterval(interval)
  }, [onComplete])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const filledBlocks = Math.floor(progress * totalBlocks)
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks)

  return (
    <FrameAnimatedDiv
      startTime={0}
      duration={150}
      from={{ y: 50, opacity: 0 }}
      to={{ y: 0, opacity: 1 }}
      easing="linear"
      style={{
        position: 'absolute', // absolute로 변경 (미리보기 내부에 표시)
        bottom: 0, left: 0, right: 0,
        zIndex: 800,
      }}
    >
      {/* WindowShell 스타일 적용 */}
      <div style={{
        background: 'linear-gradient(0deg, rgba(5,5,4,0.95) 0%, rgba(10,10,8,0.9) 100%)',
        borderTop: `1px solid rgba(255, 248, 225, 0.65)`,
        boxShadow: `0 -2px 20px ${HUD_COLORS.goldGlow}`,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        backdropFilter: 'blur(8px)',
      }}>
        {/* SYNC 텍스트 (고정폭) */}
        <div style={{ 
          fontFamily: FONTS.mono, 
          fontSize: 12, 
          color: HUD_COLORS.goldBright, 
          letterSpacing: '0.05em',
          width: 160, // 고정폭으로 텍스트 위치 고정
          textAlign: 'right'
        }}>
          SYNCHRONIZATION<span style={{ display: 'inline-block', width: 24 }}>{dots}</span>
        </div>
        
        {/* CLI Style Progress Bar */}
        <div style={{ 
          fontFamily: FONTS.mono, 
          fontSize: 10, 
          color: HUD_COLORS.gold,
          letterSpacing: '-1px',
          textShadow: `0 0 4px ${HUD_COLORS.goldGlow}`
        }}>
          [{progressBar}]
        </div>

        {/* Percentage (로딩바 우측) */}
        <div style={{ 
          fontFamily: FONTS.mono, 
          fontSize: 11, 
          color: HUD_COLORS.goldBright,
          width: 40,
          textAlign: 'left'
        }}>
          {Math.floor(progress * 100)}%
        </div>
      </div>
    </FrameAnimatedDiv>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HUD 상태 & 서브 컴포넌트들
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface TargetInfo {
  x: number
  y: number
  id: number
}

interface HitMarker {
  x: number
  y: number
  id: number
}

interface DamageArrow {
  angle: number
  id: number
}

interface HUDState {
  scenario: HexaScenarioId
  time: number
  mouse: { x: number; y: number }
  player: { health: number; maxHealth: number; energy: number; maxEnergy: number; level: number; exp: number }
  skills: Array<{ id: string; name: string; icon: keyof typeof GameIcons; cooldown: number }>
  showBanner: boolean
  bannerText: string
  onboardingStep: 'hidden' | 'code' | 'voice' | 'enter' | 'connecting' | 'success' | 'sync' | 'complete'
  // 몬스터 모드 관련
  monsterMode: boolean
  monsterBannerVisible: boolean
  monsterChatVisible: boolean
  targets: TargetInfo[]
  hitMarkers: HitMarker[]
  damageArrows: DamageArrow[]
  isDead: boolean
  themeMode: 'normal' | 'danger'
  uiAnimState: 'normal' | 'exiting' | 'entering'
  // 마우스 홀드 타겟팅
  activeTarget: TargetInfo | null
  // 불 효과
  showFireRubian: boolean    // 루비안 불
  showFireSubin: boolean     // 수빈사랑 불
  fireOffsets: [{ x: number; y: number; scale: number }, { x: number; y: number; scale: number }] // 팀원별 offset
  fireMemberIndex: number    // 현재 조정 중인 팀원 (0: 루비안, 1: 수빈사랑)
  // 🎬 Event Sourcing: Fire 시작 시간 (렌더링 동기화용)
  fireStartTimes: { rubian: number | null; subin: number | null }
}

const createInitialState = (width: number, height: number): HUDState => ({
  scenario: 'idle',
  time: 0,
  mouse: { x: width / 2, y: height / 2 },
  player: { health: 1500, maxHealth: 1500, energy: 800, maxEnergy: 800, level: 45, exp: 75 },
  skills: [
    { id: 's1', name: 'Attack', icon: 'Attack', cooldown: 0 },
    { id: 's2', name: 'Guard', icon: 'Guard', cooldown: 0 },
    { id: 's3', name: 'Dash', icon: 'Dash', cooldown: 2.5 },
    { id: 's4', name: 'Ult', icon: 'Ult', cooldown: 15 },
    { id: 's5', name: 'Heal', icon: 'Heal', cooldown: 8 },
  ],
  showBanner: false,
  bannerText: '',
  onboardingStep: 'hidden',
  // 몬스터 모드
  monsterMode: false,
  monsterBannerVisible: false,
  monsterChatVisible: false,
  targets: [],
  hitMarkers: [],
  damageArrows: [],
  isDead: false,
  themeMode: 'normal',
  uiAnimState: 'normal',
  activeTarget: null,
  // 불 효과 (위치 픽스 완료)
  showFireRubian: false,
  showFireSubin: false,
  fireOffsets: [
    { x: -35, y: -60, scale: 0.095 },  // 루비안
    { x: -35, y: -60, scale: 0.095 },  // 수빈사랑
  ],
  fireMemberIndex: 0,
  // 🎬 Event Sourcing: Fire 시작 시간
  fireStartTimes: { rubian: null, subin: null },
})

const SegmentedBar: React.FC<{ 
  value: number; 
  max: number; 
  color: string; 
  segments?: number; 
  animateIn?: boolean; 
  height?: number;
  fireGlow?: boolean; // 불 효과 glow
}> = ({ value, max, color, segments = 20, animateIn = false, height, fireGlow = false }) => {
  const [visibleSegments, setVisibleSegments] = useState(animateIn ? 0 : segments)
  const [damagedSegment, setDamagedSegment] = useState<number | null>(null)
  const [blinkCount, setBlinkCount] = useState(0)
  const [fireGlowIndex, setFireGlowIndex] = useState(-1) // 현재 glow 중인 세그먼트 인덱스
  const prevValueRef = useRef(value)
  const prevFireGlowRef = useRef(false)
  
  const percentage = value / max
  const activeSegments = Math.ceil(percentage * segments)
  
  // 마운트 시 순차적으로 채워지는 애니메이션
  useEffect(() => {
    if (animateIn) {
      setVisibleSegments(0)
      let current = 0
      const interval = setInterval(() => {
        current++
        setVisibleSegments(current)
        if (current >= activeSegments) {
          clearInterval(interval)
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [animateIn, activeSegments])

  // 불 효과 glow 애니메이션: 1초 후 왼쪽부터 순차적으로 주황색 glow (유지)
  useEffect(() => {
    if (fireGlow && !prevFireGlowRef.current) {
      // fireGlow가 false → true로 변경됨
      const startTimeout = setTimeout(() => {
        let current = 0
        setFireGlowIndex(0)
        const interval = setInterval(() => {
          current++
          if (current >= activeSegments) {
            clearInterval(interval)
            // 마지막까지 도달하면 그 상태 유지 (리셋 안함)
            setFireGlowIndex(activeSegments - 1)
          } else {
            setFireGlowIndex(current)
          }
        }, 167) // 2.5초 동안 쫘라락 (15칸 기준)
      }, 2000) // 2초 딜레이
      
      prevFireGlowRef.current = true
      return () => clearTimeout(startTimeout)
    } else if (!fireGlow && prevFireGlowRef.current) {
      // fireGlow가 true → false로 변경됨
      setFireGlowIndex(-1)
      prevFireGlowRef.current = false
    }
  }, [fireGlow, activeSegments])

  // 데미지 효과: 이전 값보다 줄어들면 빨간색 깜빡임
  useEffect(() => {
    const prevActive = Math.ceil((prevValueRef.current / max) * segments)
    if (activeSegments < prevActive) {
      // 데미지 받음
      setDamagedSegment(activeSegments) // 줄어든 칸
      setBlinkCount(0)
      
      const blinkInterval = setInterval(() => {
        setBlinkCount(c => {
          if (c >= 5) {
            clearInterval(blinkInterval)
            setDamagedSegment(null)
            return 0
          }
          return c + 1
        })
      }, 100)
      
      prevValueRef.current = value
      return () => clearInterval(blinkInterval)
    }
    prevValueRef.current = value
  }, [value, max, segments, activeSegments])

  return (
    <div style={{ display: 'flex', gap: 1, height: height || '100%', width: '100%' }}>
      {Array.from({ length: segments }).map((_, i) => {
        const isActive = animateIn ? i < visibleSegments : i < activeSegments
        const isDamaged = damagedSegment !== null && i === damagedSegment
        const showRed = isDamaged && blinkCount % 2 === 0
        const isFireGlowing = fireGlowIndex >= 0 && i <= fireGlowIndex && isActive
        
        // 불 glow 색상 (주황색)
        const fireColor = '#FF6B00'
        
        return (
          <div key={i} style={{
            flex: 1,
            position: 'relative',
            borderRadius: 1, 
            overflow: 'hidden',
            // 🔥 시네마틱 개선: 배경 그라데이션 + inner glow 효과
            background: showRed 
              ? 'linear-gradient(180deg, #FFFFFF 0%, #FF6666 8%, #FF2222 25%, #FF0000 50%, #CC0000 100%)'
              : isFireGlowing
                ? `linear-gradient(180deg, #FFFFFF 0%, #FFFF00 8%, ${fireColor} 30%, #FF4500 100%)`
                : isActive 
                  // 🎨 핵심: 상단 15%를 밝게, 그 아래로 자연스럽게 그라데이션
                  ? `linear-gradient(180deg, 
                      rgba(255,255,255,0.95) 0%, 
                      rgba(255,255,255,0.7) 8%, 
                      ${color} 20%, 
                      ${color} 60%, 
                      ${color}CC 100%)`
                  : 'rgba(255,255,255,0.03)',
            opacity: isActive || showRed ? 1 : 0.25,
            border: isActive || showRed ? 'none' : '1px solid rgba(255,255,255,0.08)',
            // 🔥 시네마틱 개선: 다층 box-shadow로 inner glow + outer glow 효과
            boxShadow: showRed 
              ? `0 0 8px #FF0000, inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.3)` 
              : isFireGlowing 
                ? `0 0 12px ${fireColor}, 0 0 20px ${fireColor}, inset 0 1px 2px rgba(255,255,255,0.8)` 
                : isActive 
                  // 🎨 핵심: inner highlight + outer glow 조합
                  ? `0 0 6px ${color}88, 0 0 12px ${color}44, inset 0 1px 2px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.2)` 
                  : 'inset 0 0 2px rgba(0,0,0,0.5)',
            transition: isFireGlowing ? 'all 0.05s ease-out' : 'none'
          }}>
            {/* 🔥 시네마틱 개선: 상단 하이라이트 라인 (레퍼런스처럼 밝은 상단 엣지) */}
            {isActive && !showRed && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.3), rgba(255,255,255,0.8), rgba(255,255,255,0.3))',
                borderRadius: '1px 1px 0 0',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// 이미지 경로 Context - Remotion 환경에서 staticFile() 경로 주입용
const ImagePathContext = React.createContext<Record<string, string>>({})
export const ImagePathProvider = ImagePathContext.Provider
export const useImagePath = (key: string, fallback: string): string => {
  const paths = React.useContext(ImagePathContext)
  return paths[key] || fallback
}

const PlayerStatusWidget: React.FC<{ player: HUDState['player']; animateBars?: boolean; dangerMode?: boolean }> = ({ player, animateBars = false, dangerMode = false }) => {
  const profileImg = useImagePath('jihoon', '/jihoon_profile_1.png')
  
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {/* 육각형 프로필 */}
      <div style={{ width: 53, height: 61, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: -1, background: dangerMode ? 'rgba(255, 80, 80, 0.4)' : 'rgba(255, 248, 225, 0.4)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', filter: 'blur(2px)', opacity: 0.5 }} />
        <div style={{ position: 'absolute', inset: 0, background: dangerMode ? 'rgba(255, 80, 80, 0.65)' : 'rgba(255, 248, 225, 0.65)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div style={{ position: 'absolute', inset: 1.5, background: '#111', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={profileImg} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      {/* 닉네임 */}
      <div style={{ 
        fontFamily: '"Do Hyeon", sans-serif', 
        fontSize: 10, 
        color: dangerMode ? '#FF8888' : HUD_COLORS.goldBright,
        textShadow: `0 0 4px ${dangerMode ? 'rgba(255,0,0,0.4)' : HUD_COLORS.goldGlow}`,
        letterSpacing: '0.05em',
      }}>
        매지코
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <WindowShell 
        title={`HP                            ${player.health} / ${player.maxHealth}`} 
        width={160} 
        height={36} 
        showControls={true} 
        titleColor={dangerMode ? '#FF6666' : '#FFD700'} 
        borderColor={dangerMode ? '#FF4444' : undefined}
        glowIntensity="normal" 
        bodyStyle={{ padding: '2px 3px 3px 3px' }}
      >
        {/* HP 바 - outline 포함 */}
        <div style={{ 
          padding: 2, 
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${dangerMode ? 'rgba(255,100,100,0.4)' : 'rgba(255,215,0,0.35)'}`,
          borderRadius: 2,
          height: '100%',
          boxSizing: 'border-box',
        }}>
          <SegmentedBar value={player.health} max={player.maxHealth} color="#FFD700" animateIn={animateBars} />
        </div>
      </WindowShell>
      <WindowShell 
        title={`MP                              ${player.energy} / ${player.maxEnergy}`} 
        width={160} 
        height={36} 
        showControls={true} 
        titleColor={dangerMode ? '#FF6666' : '#40C4FF'} 
        borderColor={dangerMode ? '#FF4444' : undefined}
        glowIntensity="normal" 
        bodyStyle={{ padding: '2px 3px 3px 3px' }}
      >
        {/* MP 바 - outline 포함 */}
        <div style={{ 
          padding: 2, 
          background: 'rgba(0,0,0,0.3)',
          border: `1px solid ${dangerMode ? 'rgba(255,100,100,0.4)' : 'rgba(64,196,255,0.35)'}`,
          borderRadius: 2,
          height: '100%',
          boxSizing: 'border-box',
        }}>
          <SegmentedBar value={player.energy} max={player.maxEnergy} color="#40C4FF" animateIn={animateBars} />
        </div>
      </WindowShell>
    </div>
  </div>
)
}

// 팀원 상태 컴포넌트
interface TeamMember {
  name: string
  profileImg: string
  health: number
  maxHealth: number
}

const TeamMemberRow: React.FC<{ 
  member: TeamMember; 
  dangerMode?: boolean;
  showFire?: boolean;
  fireOffset?: { x: number; y: number; scale: number };
  fireStartTimestamp?: number; // 🎬 Event Sourcing: Fire 시작 시간
}> = ({ member, dangerMode = false, showFire = false, fireOffset = { x: -35, y: -60, scale: 0.095 }, fireStartTimestamp = 0 }) => {
  // 위치 픽스 완료: 루비안 & 수빈사랑 모두 { x: -35, y: -60, scale: 0.095 }
  // HP 100당 1칸
  const segments = Math.ceil(member.maxHealth / 100)
  
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3, position: 'relative' }}>
      {/* 불 효과 오버레이 */}
      {showFire && (
        <div style={{
          position: 'absolute',
          left: fireOffset.x,
          top: fireOffset.y,
          width: 2560 * fireOffset.scale,
          height: 1080 * fireOffset.scale,
          pointerEvents: 'none',
          zIndex: 100,
        }}>
          <FireSequence 
            playing={true}
            fps={30}
            loop={true}
            blendMode="screen"
            style={{ width: '100%', height: '100%' }}
            startTimestamp={fireStartTimestamp}
          />
        </div>
      )}
      {/* 미니 육각형 프로필 (20% 축소: 38->30, 44->35) */}
      <div style={{ width: 30, height: 35, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: -2 }}>
        <div style={{ position: 'absolute', inset: 0, background: dangerMode ? 'rgba(255, 80, 80, 0.5)' : 'rgba(255, 248, 225, 0.5)', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div style={{ position: 'absolute', inset: 1, background: '#111', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={member.profileImg} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </div>
      {/* 닉네임 + HP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        {/* 상단: 닉네임 (왼쪽) + HP 수치 (오른쪽 끝) */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: -3 }}>
          <div style={{ 
            fontFamily: '"Do Hyeon", sans-serif', 
            fontSize: 11, 
            color: dangerMode ? '#FF8888' : HUD_COLORS.textMain,
            letterSpacing: '0.02em',
          }}>
            {member.name}
          </div>
          <div style={{ 
            fontFamily: FONTS.display, 
            fontSize: 8, 
            color: HUD_COLORS.goldDim,
            fontWeight: 600,
          }}>
            HP {member.health}/{member.maxHealth}
          </div>
        </div>
        {/* 하단: HP 바 - outline 포함, 불 효과보다 위에 표시 */}
        <div style={{ 
          padding: 2, 
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${dangerMode ? 'rgba(255,100,100,0.4)' : 'rgba(255,215,0,0.3)'}`,
          borderRadius: 2,
          position: 'relative',
          zIndex: 150, // 불 효과(z-index: 100)보다 위
        }}>
          <SegmentedBar 
            value={member.health} 
            max={member.maxHealth} 
            color="#FFD700" 
            segments={segments} 
            height={8}
            fireGlow={showFire} // 불 효과가 켜지면 glow 애니메이션
          />
        </div>
      </div>
    </div>
  )
}

const TeamStatusWidget: React.FC<{ 
  dangerMode?: boolean;
  showFireRubian?: boolean;
  showFireSubin?: boolean;
  fireOffsets?: [{ x: number; y: number; scale: number }, { x: number; y: number; scale: number }];
  fireStartTimes?: { rubian: number | null; subin: number | null }; // 🎬 Event Sourcing
}> = ({ 
  dangerMode = false, 
  showFireRubian = false, 
  showFireSubin = false,
  fireOffsets = [
    { x: -35, y: -60, scale: 0.095 },
    { x: -35, y: -60, scale: 0.095 },
  ],
  fireStartTimes = { rubian: null, subin: null },
}) => {
  // 이미지 경로 Context에서 가져오기
  const soyeongImg = useImagePath('soyeong', '/soyeong_pr_1.png')
  const minjunImg = useImagePath('minjun', '/minjun_pr_1.png')
  
  // Normal 상태에서는 체력 풀!
  const teamMembers: TeamMember[] = [
    { name: '루비안', profileImg: soyeongImg, health: 1500, maxHealth: 1500 },
    { name: '수빈사랑', profileImg: minjunImg, health: 1500, maxHealth: 1500 },
  ]

  return (
    <WindowShell 
      title="TEAM" 
      width={195} 
      height="auto"  // 컨텐츠에 맞게 자동 조절
      glowIntensity="soft" 
      showTitlebar={true} 
      showControls={true}
      borderColor={dangerMode ? '#FF4444' : undefined}
      style={{ overflow: 'visible' }} // 불 효과가 border 밖으로 넘칠 수 있도록
      bodyStyle={{ overflow: 'visible', paddingBottom: 8 }} // 하단 패딩 추가
    >
      <div style={{ padding: '4px 5px' }}>
        {teamMembers.map((member, i) => (
          <TeamMemberRow 
            key={i} 
            member={member} 
            dangerMode={dangerMode}
            showFire={i === 0 ? showFireRubian : showFireSubin}
            fireOffset={fireOffsets[i]}
            fireStartTimestamp={i === 0 ? (fireStartTimes.rubian ?? 0) : (fireStartTimes.subin ?? 0)}
          />
        ))}
      </div>
    </WindowShell>
  )
}

const SkillBar: React.FC<{ skills: HUDState['skills']; theme: any }> = ({ skills, theme }) => (
  <div style={{ display: 'flex', gap: 4, padding: 3, justifyContent: 'center' }}>
    {skills.map((skill, i) => {
      const Icon = GameIcons[skill.icon]
      return (
        <div key={skill.id} style={{ width: 29, height: 29, background: 'rgba(20,20,20,0.4)', border: `1px solid ${HUD_COLORS.borderInner}`, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: `inset 0 0 5px rgba(0,0,0,0.5)`, cursor: 'pointer' }}>
          <Icon color={theme.primaryBright} size={15} />
          <div style={{ position: 'absolute', top: -4, left: -3, fontSize: 8, fontFamily: FONTS.mono, color: '#888', background: '#111', padding: '0 2px', border: `1px solid ${HUD_COLORS.borderInner}` }}>{i + 1}</div>
        </div>
      )
    })}
  </div>
)

const MiniMap: React.FC<{ theme: any }> = ({ theme }) => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, transparent 30%, #000 100%), repeating-linear-gradient(0deg, transparent 0, transparent 17px, ${theme.primaryGlow} 18px), repeating-linear-gradient(90deg, transparent 0, transparent 17px, ${theme.primaryGlow} 18px)`, opacity: 0.4 }} />
    <GameIcons.MapMarker color={theme.primaryBright} size={13} />
    <div style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 8, color: theme.primary, fontFamily: FONTS.mono }}>SEC-08</div>
  </div>
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Remotion 스타일 프레임 관리 훅
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const FPS = 30

function useHexaFrame(externalTimestamp?: number): number {
  const [internalFrame, setInternalFrame] = useState(0)
  const animFrameRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  
  // 외부 timestamp가 있으면 (렌더링 모드) 프레임 계산
  const isExternalMode = externalTimestamp !== undefined
  
  useEffect(() => {
    if (isExternalMode) return // 외부 모드면 자체 루프 사용 안 함
    
    startTimeRef.current = performance.now()
    
    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current
      const newFrame = Math.floor((elapsed / 1000) * FPS)
      setInternalFrame(newFrame)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    
    animFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [isExternalMode])
  
  // 외부 timestamp → 프레임 변환 (렌더링 모드)
  if (isExternalMode) {
    return Math.floor((externalTimestamp / 1000) * FPS)
  }
  
  return internalFrame
}

export function HexaTacticalHUD({ width, height, onStateUpdate, onReady, externalState }: HUDComponentProps) {
  // 🎬 Event Sourcing: 이벤트 발행 훅
  const emit = useEventEmitter()
  
  // 🎬 내부 상태 (_internalState) - setState로 업데이트됨
  const [_internalState, setState] = useState<HUDState>(() => createInitialState(width, height))
  const stateRef = useRef(_internalState)
  stateRef.current = _internalState
  const theme = useMemo(() => getScenarioTheme(_internalState.scenario), [_internalState.scenario])
  
  // 🎬 Remotion 스타일 프레임 관리
  const frame = useHexaFrame(externalState?.timestamp)
  const isRenderMode = externalState !== undefined
  
  // 🎬 렌더링 모드: externalState에서 상태를 직접 계산 (useEffect 대신 useMemo)
  // Remotion에서는 각 프레임이 독립적으로 렌더링되므로 동기적으로 상태를 계산해야 함
  // 🎬 최종 상태: 렌더링 모드에서는 externalState에서 복원, 일반 모드에서는 _internalState 사용
  const state = useMemo<HUDState>(() => {
    if (!isRenderMode || !externalState) return _internalState
    
    const customData = externalState.customData as Partial<HUDState> || {}
    return {
      ..._internalState,
      mouse: externalState.mouse || _internalState.mouse,
      scenario: (externalState.scenario as HexaScenarioId) || customData.scenario || _internalState.scenario,
      // customData에서 모든 상태 복원
      onboardingStep: customData.onboardingStep ?? _internalState.onboardingStep,
      monsterMode: customData.monsterMode ?? _internalState.monsterMode,
      themeMode: customData.themeMode ?? _internalState.themeMode,
      uiAnimState: customData.uiAnimState ?? _internalState.uiAnimState,
      showTeam: customData.showTeam ?? _internalState.showTeam,
      player: customData.player ?? _internalState.player,
      teamMembers: customData.teamMembers ?? _internalState.teamMembers,
      isDead: customData.isDead ?? _internalState.isDead,
      monsterBannerVisible: customData.monsterBannerVisible ?? _internalState.monsterBannerVisible,
      monsterChatVisible: customData.monsterChatVisible ?? _internalState.monsterChatVisible,
      targets: customData.targets ?? _internalState.targets,
      activeTarget: customData.activeTarget ?? _internalState.activeTarget,
      hitMarkers: customData.hitMarkers ?? _internalState.hitMarkers,
      damageArrows: customData.damageArrows ?? _internalState.damageArrows,
      showFireRubian: customData.showFireRubian ?? _internalState.showFireRubian,
      showFireSubin: customData.showFireSubin ?? _internalState.showFireSubin,
      fireOffsets: customData.fireOffsets ?? _internalState.fireOffsets,
      // 🎬 Event Sourcing: Fire 시작 시간 복원
      fireStartTimes: customData.fireStartTime ?? customData.fireStartTimes ?? _internalState.fireStartTimes,
      showBanner: customData.showBanner ?? _internalState.showBanner,
      bannerText: customData.bannerText ?? _internalState.bannerText,
      skills: customData.skills ?? _internalState.skills,
    }
  }, [isRenderMode, externalState, _internalState])
  
  const animationRef = useRef<number>(0)
  const lastStateUpdateRef = useRef(0)
  const hasCalledReady = useRef(false)
  const fireTimerRubianRef = useRef<NodeJS.Timeout | null>(null)
  const fireTimerSubinRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🎬 Remotion 스타일: 프레임 기반 애니메이션 값
  const frameAnimations = useMemo(() => {
    return {
      // 글로벌 펄스 (느린 호흡 효과)
      globalPulse: interpolate(
        frame % (FPS * 3), 
        [0, FPS * 1.5, FPS * 3], 
        [1, 1.02, 1],
        { extrapolateRight: 'clamp' }
      ),
      // 스캔라인 오프셋
      scanlineOffset: (frame % (FPS * 2)) * 2,
      // UI 엔트리 (처음 60프레임 동안)
      uiEntry: spring({
        frame,
        fps: FPS,
        config: { damping: 20, stiffness: 100 },
      }),
    }
  }, [frame])

  const startOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, onboardingStep: 'code' }))
    
    setTimeout(() => {
      setState(prev => ({ ...prev, onboardingStep: 'voice' }))
      setTimeout(() => {
        // 매지코 입력 완료 → 엔터 표시
        setState(prev => ({ ...prev, onboardingStep: 'enter' }))
        setTimeout(() => {
          // 접속중...
          setState(prev => ({ ...prev, onboardingStep: 'connecting' }))
          setTimeout(() => {
            // 접속 완료
            setState(prev => ({ ...prev, onboardingStep: 'success' }))
            setTimeout(() => {
              setState(prev => ({ ...prev, onboardingStep: 'sync' }))
            }, 1500)
          }, 2000) // 접속중 2초
        }, 1200) // 태그 표시 1.2초
      }, 4000) // 음성인식 4초
    }, 3000) // 코드 로딩 3초
  }, [])

  useEffect(() => {
    if (!hasCalledReady.current) {
      hasCalledReady.current = true
      onReady?.()
    }
  }, [onReady])

  // Normal 모드로 복귀
  const resetToNormal = useCallback(() => {
    setState(prev => ({
      ...prev,
      monsterMode: false,
      themeMode: 'normal',
      scenario: 'idle' as HexaScenarioId,
      uiAnimState: 'normal',
      monsterChatVisible: false, // 채팅 메시지 리셋
      monsterBannerVisible: false, // 배너 리셋
    }))
  }, [])

  // 몬스터 모드 시작
  const startMonsterMode = useCallback(() => {
    // 🎬 이벤트 발행: 몬스터 모드 시작
    emit('SCENARIO_CHANGE', { scenario: 'monster_combat', prevScenario: stateRef.current.scenario })
    emit('MONSTER_ALERT', {})
    
    // 먼저 채팅 상태 리셋 (재실행을 위해)
    setState(prev => ({
      ...prev,
      monsterChatVisible: false,
      monsterBannerVisible: false,
    }))
    
    // 약간의 딜레이 후 배너 표시 (상태 리셋 후 다시 true로)
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        monsterBannerVisible: true,
      }))
      emit('UI_ENTER', { elementId: 'monster-banner' })
    }, 50)
    
    // 2단계: 배너가 사라진 후 (1.5초) UI 나가기
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        uiAnimState: 'exiting',
      }))
      emit('UI_EXIT', { elementId: 'monster-banner' })
      
      // 3단계: 0.4초 후 테마 변경하고 UI 다시 들어오기
      setTimeout(() => {
        emit('THEME_CHANGE', { theme: 'danger' })
        setState(prev => ({
          ...prev,
          monsterMode: true,
          themeMode: 'danger',
          uiAnimState: 'entering',
          monsterChatVisible: true,
          scenario: 'monster_combat' as HexaScenarioId,
        }))
        
        // 4단계: 0.4초 후 normal 상태로
        setTimeout(() => {
          setState(prev => ({ ...prev, uiAnimState: 'normal' }))
        }, 400)
      }, 400)
    }, 1500)
  }, [emit])

  // 데미지 받기
  const takeDamage = useCallback(() => {
    const randomAngle = Math.random() * 360
    const newArrow: DamageArrow = { angle: randomAngle, id: Date.now() }
    
    setState(prev => {
      const newHealth = Math.max(0, prev.player.health - 75) // 한 칸당 75 (20칸 = 1500)
      const isDead = newHealth <= 0
      
      // 🎬 이벤트 발행
      emit('HP_CHANGE', { currentHp: newHealth, maxHp: prev.player.maxHealth, damage: 75 })
      emit('DAMAGE_ARROW_SPAWN', { targetId: newArrow.id, position: { x: 0, y: 0 } })
      if (isDead) {
        emit('PLAYER_DEAD', {})
      }
      
      return {
        ...prev,
        player: { ...prev.player, health: newHealth },
        damageArrows: [...prev.damageArrows, newArrow],
        isDead,
      }
    })
  }, [emit])

  // 타겟 제거
  const removeTarget = useCallback((id: number) => {
    setState(prev => ({ ...prev, targets: prev.targets.filter(t => t.id !== id) }))
  }, [])

  // 히트마커 제거
  const removeHitMarker = useCallback((id: number) => {
    setState(prev => ({ ...prev, hitMarkers: prev.hitMarkers.filter(h => h.id !== id) }))
  }, [])

  // 데미지 화살표 제거
  const removeDamageArrow = useCallback((id: number) => {
    setState(prev => ({ ...prev, damageArrows: prev.damageArrows.filter(a => a.id !== id) }))
  }, [])

  // 사망 확인
  const confirmDeath = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDead: false,
      monsterMode: false,
      themeMode: 'normal',
      player: { ...prev.player, health: prev.player.maxHealth },
      scenario: 'idle' as HexaScenarioId,
    }))
  }, [])

  // 즉시 사망 (K키)
  const instantDeath = useCallback(() => {
    // 체력을 0으로 빠르게 감소시키는 애니메이션
    let currentHealth = stateRef.current.player.health
    const drainInterval = setInterval(() => {
      currentHealth = Math.max(0, currentHealth - 150) // 빠르게 감소
      setState(prev => ({
        ...prev,
        player: { ...prev.player, health: currentHealth },
      }))
      
      if (currentHealth <= 0) {
        clearInterval(drainInterval)
        setState(prev => ({ ...prev, isDead: true }))
      }
    }, 50) // 50ms 간격으로 빠르게
  }, [])


  // 키보드 이벤트 핸들러 - useRef로 최신 함수/상태 참조
  const handlersRef = useRef({
    startOnboarding,
    startMonsterMode,
    resetToNormal,
    takeDamage,
    instantDeath,
  })
  handlersRef.current = {
    startOnboarding,
    startMonsterMode,
    resetToNormal,
    takeDamage,
    instantDeath,
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      const handlers = handlersRef.current
      const currentState = stateRef.current
      
      if (key === '`') {
        // 백틱: 온보딩 시나리오
        handlers.startOnboarding()
      } else if (key === '1') {
        // 1번: Normal 모드로 복귀
        handlers.resetToNormal()
      } else if (key === '2') {
        // 2번: 몬스터 출현 시나리오
        handlers.startMonsterMode()
      } else if (key.toLowerCase() === 'd' && currentState.monsterMode && !currentState.isDead) {
        // D키: 데미지 받기
        handlers.takeDamage()
      } else if (key.toLowerCase() === 'k' && !currentState.isDead) {
        // K키: 즉시 사망
        handlers.instantDeath()
      } else if (key.toLowerCase() === 'f') {
        // F키: 루비안 불 토글
        const willTurnOn = !currentState.showFireRubian
        const startTime = willTurnOn ? performance.now() : null
        setState(prev => ({ 
          ...prev, 
          showFireRubian: willTurnOn, 
          fireMemberIndex: 0,
          fireStartTimes: { ...prev.fireStartTimes, rubian: startTime },
        }))
        console.log('[Fire] 루비안 토글:', willTurnOn)
        
        // 🎬 이벤트 발행
        eventSourceLog.log(willTurnOn ? 'FIRE_START' : 'FIRE_END', { target: 'rubian' })
        
        // 기존 타이머 정리
        if (fireTimerRubianRef.current) {
          clearTimeout(fireTimerRubianRef.current)
          fireTimerRubianRef.current = null
        }
        // 켜면 12초 후 자동 끄기
        if (willTurnOn) {
          fireTimerRubianRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, showFireRubian: false }))
            eventSourceLog.log('FIRE_END', { target: 'rubian' })
            console.log('[Fire] 루비안 자동 종료 (12초)')
            fireTimerRubianRef.current = null
          }, 12000)
        }
      } else if (key.toLowerCase() === 'g') {
        // G키: 수빈사랑 불 토글
        const willTurnOn = !currentState.showFireSubin
        const startTime = willTurnOn ? performance.now() : null
        setState(prev => ({ 
          ...prev, 
          showFireSubin: willTurnOn, 
          fireMemberIndex: 1,
          fireStartTimes: { ...prev.fireStartTimes, subin: startTime },
        }))
        console.log('[Fire] 수빈사랑 토글:', willTurnOn)
        
        // 🎬 이벤트 발행
        eventSourceLog.log(willTurnOn ? 'FIRE_START' : 'FIRE_END', { target: 'subin' })
        
        // 기존 타이머 정리
        if (fireTimerSubinRef.current) {
          clearTimeout(fireTimerSubinRef.current)
          fireTimerSubinRef.current = null
        }
        // 켜면 12초 후 자동 끄기
        if (willTurnOn) {
          fireTimerSubinRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, showFireSubin: false }))
            eventSourceLog.log('FIRE_END', { target: 'subin' })
            console.log('[Fire] 수빈사랑 자동 종료 (12초)')
            fireTimerSubinRef.current = null
          }, 12000)
        }
      } else if (key.toLowerCase() === 'h') {
        // H키: 둘 다 불 토글
        const bothOn = currentState.showFireRubian && currentState.showFireSubin
        const willTurnOn = !bothOn
        const startTime = willTurnOn ? performance.now() : null
        setState(prev => ({ 
          ...prev, 
          showFireRubian: willTurnOn,
          showFireSubin: willTurnOn,
          fireStartTimes: { rubian: startTime, subin: startTime },
        }))
        console.log('[Fire] 둘 다 토글:', willTurnOn)
        
        // 🎬 이벤트 발행
        eventSourceLog.log(willTurnOn ? 'FIRE_START' : 'FIRE_END', { target: 'both' })
        
        // 기존 타이머 정리
        if (fireTimerRubianRef.current) {
          clearTimeout(fireTimerRubianRef.current)
          fireTimerRubianRef.current = null
        }
        if (fireTimerSubinRef.current) {
          clearTimeout(fireTimerSubinRef.current)
          fireTimerSubinRef.current = null
        }
        // 켜면 12초 후 자동 끄기
        if (willTurnOn) {
          fireTimerRubianRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, showFireRubian: false }))
            eventSourceLog.log('FIRE_END', { target: 'rubian' })
            console.log('[Fire] 루비안 자동 종료 (12초)')
            fireTimerRubianRef.current = null
          }, 12000)
          fireTimerSubinRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, showFireSubin: false }))
            eventSourceLog.log('FIRE_END', { target: 'subin' })
            console.log('[Fire] 수빈사랑 자동 종료 (12초)')
            fireTimerSubinRef.current = null
          }, 12000)
        }
      } else if (key.toLowerCase() === 't') {
        // T키: 조정 대상 팀원 변경 (0 <-> 1)
        const newIndex = currentState.fireMemberIndex === 0 ? 1 : 0
        setState(prev => ({ ...prev, fireMemberIndex: newIndex }))
        console.log('[Fire] 조정 대상 변경:', newIndex === 0 ? '루비안' : '수빈사랑')
      } else if (key === 'ArrowLeft') {
        // 왼쪽: X 위치 감소
        const step = e.shiftKey ? 10 : 1
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], x: newOffsets[idx].x - step }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] X:`, currentState.fireOffsets[idx].x - step)
      } else if (key === 'ArrowRight') {
        // 오른쪽: X 위치 증가
        const step = e.shiftKey ? 10 : 1
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], x: newOffsets[idx].x + step }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] X:`, currentState.fireOffsets[idx].x + step)
      } else if (key === 'ArrowUp') {
        // 위: Y 위치 감소
        const step = e.shiftKey ? 10 : 1
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], y: newOffsets[idx].y - step }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] Y:`, currentState.fireOffsets[idx].y - step)
      } else if (key === 'ArrowDown') {
        // 아래: Y 위치 증가
        const step = e.shiftKey ? 10 : 1
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], y: newOffsets[idx].y + step }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] Y:`, currentState.fireOffsets[idx].y + step)
      } else if (key === '=' || key === '+') {
        // +: 스케일 증가
        const step = e.shiftKey ? 0.01 : 0.005
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], scale: Math.min(newOffsets[idx].scale + step, 1) }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] Scale:`, (currentState.fireOffsets[idx].scale + step).toFixed(3))
      } else if (key === '-') {
        // -: 스케일 감소
        const step = e.shiftKey ? 0.01 : 0.005
        const idx = currentState.fireMemberIndex
        setState(prev => {
          const newOffsets = [...prev.fireOffsets] as typeof prev.fireOffsets
          newOffsets[idx] = { ...newOffsets[idx], scale: Math.max(newOffsets[idx].scale - step, 0.01) }
          return { ...prev, fireOffsets: newOffsets }
        })
        console.log(`[Fire ${idx === 0 ? '루비안' : '수빈사랑'}] Scale:`, (currentState.fireOffsets[idx].scale - step).toFixed(3))
      } else if (key.toLowerCase() === 'p') {
        // P키: 현재 불 효과 설정값 출력
        const { fireOffsets, fireMemberIndex, showFireRubian, showFireSubin } = currentState
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('🔥 현재 불 효과 설정값:')
        console.log(`   루비안 불: ${showFireRubian}`)
        console.log(`   수빈사랑 불: ${showFireSubin}`)
        console.log(`   조정 대상: ${fireMemberIndex === 0 ? '루비안' : '수빈사랑'}`)
        console.log(`   루비안 offset: { x: ${fireOffsets[0].x}, y: ${fireOffsets[0].y}, scale: ${fireOffsets[0].scale.toFixed(4)} }`)
        console.log(`   수빈사랑 offset: { x: ${fireOffsets[1].x}, y: ${fireOffsets[1].y}, scale: ${fireOffsets[1].scale.toFixed(4)} }`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📋 루비안:', JSON.stringify({ x: fireOffsets[0].x, y: fireOffsets[0].y, scale: parseFloat(fireOffsets[0].scale.toFixed(4)) }))
        console.log('📋 수빈사랑:', JSON.stringify({ x: fireOffsets[1].x, y: fireOffsets[1].y, scale: parseFloat(fireOffsets[1].scale.toFixed(4)) }))
      } else if (SCENARIO_KEYS[key]) {
        setState(prev => ({ ...prev, scenario: SCENARIO_KEYS[key] }))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, []) // deps 배열 비움 - ref 사용으로 안정적

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setState(prev => ({ 
      ...prev, 
      mouse: { x, y },
      // 좌클릭 홀드 중이면 타겟도 따라다님
      activeTarget: prev.activeTarget ? { ...prev.activeTarget, x, y } : null
    }))
  }, [])

  // 마우스 클릭 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.monsterMode || state.isDead) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (e.button === 0) {
      // 좌클릭 - 타겟팅 시작 (홀드)
      const newTarget: TargetInfo = { x, y, id: Date.now() }
      setState(prev => ({ ...prev, activeTarget: newTarget }))
      // 🎬 이벤트 발행
      eventSourceLog.log('TARGET_LOCK', { targetId: newTarget.id, position: { x, y } })
    } else if (e.button === 2) {
      // 우클릭 - 히트마커
      const newHit: HitMarker = { x, y, id: Date.now() }
      setState(prev => ({ ...prev, hitMarkers: [...prev.hitMarkers, newHit] }))
      // 🎬 이벤트 발행
      eventSourceLog.log('HITMARKER_SPAWN', { targetId: newHit.id, position: { x, y } })
    }
  }, [state.monsterMode, state.isDead])

  // 마우스 릴리즈 핸들러
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 && state.activeTarget) {
      // 좌클릭 릴리즈 - 타겟 고정
      const targetId = state.activeTarget.id
      setState(prev => ({
        ...prev,
        targets: prev.activeTarget ? [...prev.targets, prev.activeTarget] : prev.targets,
        activeTarget: null
      }))
      // 🎬 이벤트 발행
      eventSourceLog.log('TARGET_RELEASE', { targetId })
    }
  }, [state.activeTarget])

  useEffect(() => {
    const render = () => {
      const now = performance.now()
      // 🎬 33ms (30fps)마다 상태 저장 - 부드러운 마우스 움직임을 위해
      if (now - lastStateUpdateRef.current >= 33) {
        lastStateUpdateRef.current = now
        const currentState = stateRef.current
        // 🎬 Remotion 스타일: 렌더링에 필요한 핵심 상태 저장
        onStateUpdate?.({
          timestamp: now,
          mouse: { x: currentState.mouse.x, y: currentState.mouse.y, buttons: 0 },
          targets: {},
          customData: {
            // 핵심 UI 상태
            scenario: currentState.scenario,
            onboardingStep: currentState.onboardingStep,
            monsterMode: currentState.monsterMode,
            themeMode: currentState.themeMode,
            uiAnimState: currentState.uiAnimState,
            showTeam: currentState.showTeam,
            // 플레이어 상태
            player: currentState.player,
            // 팀 상태
            teamMembers: currentState.teamMembers,
            // 전투 상태
            isDead: currentState.isDead,
            monsterBannerVisible: currentState.monsterBannerVisible,
            monsterChatVisible: currentState.monsterChatVisible,
            // 🎯 타겟팅 상태
            targets: currentState.targets,
            activeTarget: currentState.activeTarget,
            hitMarkers: currentState.hitMarkers,
            damageArrows: currentState.damageArrows,
            // 🔥 Fire 효과 상태
            showFireRubian: currentState.showFireRubian,
            showFireSubin: currentState.showFireSubin,
            fireOffsets: currentState.fireOffsets,
            fireStartTimes: currentState.fireStartTimes,
            // 배너 상태
            showBanner: currentState.showBanner,
            bannerText: currentState.bannerText,
            // 스킬 상태
            skills: currentState.skills,
          },
        })
      }
      animationRef.current = requestAnimationFrame(render)
    }
    animationRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationRef.current)
  }, [onStateUpdate])

  const showMainUI = state.onboardingStep === 'hidden' || state.onboardingStep === 'sync' || state.onboardingStep === 'complete'

  // 몬스터 모드시 빨간 테마 색상
  const currentTheme = state.themeMode === 'danger' ? {
    ...theme,
    primary: '#FF4444',
    secondary: '#AA2222',
  } : theme

  // UI 애니메이션 상태에 따른 transform 계산 (reserved for future use)
  // @ts-ignore: Reserved for future animation system
  const _getUITransform = (position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'bottomCenter') => {
    if (state.uiAnimState === 'normal') return 'translate(0, 0)'
    if (state.uiAnimState === 'exiting') {
      switch (position) {
        case 'topLeft': return 'translate(-150%, -50%)'
        case 'topRight': return 'translate(150%, -50%)'
        case 'bottomLeft': return 'translate(-150%, 50%)'
        case 'bottomRight': return 'translate(150%, 50%)'
        case 'bottomCenter': return 'translate(0, 150%)'
      }
    }
    // entering - 바깥에서 들어오는 중
    return 'translate(0, 0)'
  }

  // 🎬 렌더링 모드: 애니메이션 유지 (Remotion에서도 framer-motion 애니메이션 동작)
  // 렌더링 모드에서도 애니메이션을 유지해야 영상에서 자연스럽게 보임
  const animDuration = 0.4
  
  // 🎬 외부 타임스탬프 (Remotion 렌더링용)
  const externalTimestamp = externalState?.timestamp ?? 0
  
  return (
    <RenderModeContext.Provider value={isRenderMode}>
    <ExternalTimestampContext.Provider value={externalTimestamp}>
    <div 
      onMouseMove={handleMouseMove} 
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()} // 우클릭 메뉴 방지
      onDragStart={(e) => e.preventDefault()} // 드래그 방지
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden', 
        fontFamily: FONTS.ui, 
        color: currentTheme.text || HUD_COLORS.textMain,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        cursor: 'default',
      }}
    >
      {/* 메인 게임 영역 */}
      <div style={{
        position: 'absolute',
        inset: 0,
      }}>
      {/* ARWES 배경 효과 */}
      <MovingLines 
        lineColor={state.themeMode === 'danger' ? 'rgba(255,50,50,0.2)' : `${theme.primary || HUD_COLORS.gold}33`}
        lineWidth={1} 
        distance={40} 
        sets={4} 
        speed={12000}
        opacity={0.4}
      />
      <Illuminator 
        color={`${theme.primary || HUD_COLORS.gold}15`}
        size={400}
        opacity={0.8}
      />
      <ScanlineOverlay opacity={0.06} animated={false} />

      {/* Onboarding Popup */}
      <AnimatePresence>
        {(state.onboardingStep === 'code' || state.onboardingStep === 'voice' || state.onboardingStep === 'enter' || state.onboardingStep === 'connecting' || state.onboardingStep === 'success') && (
          <OnboardingPopup step={state.onboardingStep} />
        )}
      </AnimatePresence>

      {/* Main UI Elements - 위치 고정 (bottom 값 조건부 변경 제거) */}
      {showMainUI && (
        <>
          {/* 좌측 상단: Status Bar */}
          <FrameAnimatedDiv 
            startTime={0}
            duration={animDuration * 1000}
            from={{ opacity: 0, x: -100, y: -50 }}
            to={{ 
              opacity: 1, 
              x: state.uiAnimState === 'exiting' ? -200 : 0,
              y: state.uiAnimState === 'exiting' ? -100 : 0,
            }}
            easing="easeOutCubic"
            style={{ position: 'absolute', top: 15, left: 15 }}
          >
            <PlayerStatusWidget player={state.player} animateBars={state.onboardingStep === 'sync'} dangerMode={state.themeMode === 'danger'} />
          </FrameAnimatedDiv>

            {/* 우측 상단: Tactical Map */}
            <FrameAnimatedDiv 
              startTime={0}
              duration={animDuration * 1000}
              from={{ opacity: 0, x: 100, y: -50 }}
              to={{ 
                opacity: 1,
                x: state.uiAnimState === 'exiting' ? 200 : 0,
                y: state.uiAnimState === 'exiting' ? -100 : 0,
              }}
              easing="easeOutCubic"
              style={{ position: 'absolute', top: 15, right: 15 }}
            >
              <WindowShell 
                title="TACTICAL MAP" 
                width={112} 
                height={112} 
                glowIntensity="soft" 
                showTitlebar={true} 
                showControls={true} 
                bodyStyle={{ padding: 0 }}
                borderColor={state.themeMode === 'danger' ? '#FF4444' : undefined}
              >
                <MiniMap theme={currentTheme} />
              </WindowShell>
            </FrameAnimatedDiv>

            {/* 하단 중앙: Skill Bar */}
            <div style={{ 
              position: 'absolute', 
              bottom: 15, 
              left: 0, 
              right: 0, 
              display: 'flex', 
              justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <FrameAnimatedDiv 
                startTime={0}
                duration={animDuration * 1000}
                from={{ opacity: 0, y: 100 }}
                to={{ 
                  opacity: 1,
                  y: state.uiAnimState === 'exiting' ? 200 : 0,
                }}
                easing="easeOutCubic"
                style={{ pointerEvents: 'auto' }}
              >
              <WindowShell 
                title="MODULES" 
                width="auto" 
                glowIntensity="normal" 
                showTitlebar={true} 
                showControls={true}
                borderColor={state.themeMode === 'danger' ? '#FF4444' : undefined}
              >
                <SkillBar skills={state.skills} theme={currentTheme} />
              </WindowShell>
              </FrameAnimatedDiv>
            </div>

            {/* 좌측 하단: System Log */}
            {/* 좌측 하단: Team Status */}
            <FrameAnimatedDiv 
              startTime={0}
              duration={animDuration * 1000}
              from={{ opacity: 0, x: -100, y: 50 }}
              to={{ 
                opacity: 1,
                x: state.uiAnimState === 'exiting' ? -200 : 0,
                y: state.uiAnimState === 'exiting' ? 100 : 0,
              }}
              easing="easeOutCubic"
              style={{ position: 'absolute', bottom: 15, left: 15 }}
            >
              <TeamStatusWidget 
                dangerMode={state.themeMode === 'danger'} 
                showFireRubian={state.showFireRubian}
                showFireSubin={state.showFireSubin}
                fireOffsets={state.fireOffsets}
                fireStartTimes={state.fireStartTimes}
              />
            </FrameAnimatedDiv>

            {/* 우측 하단: Quick Access */}
            <FrameAnimatedDiv 
              startTime={0}
              duration={animDuration * 1000}
              from={{ opacity: 0, x: 100, y: 50 }}
              to={{ 
                opacity: 1,
                x: state.uiAnimState === 'exiting' ? 200 : 0,
                y: state.uiAnimState === 'exiting' ? 100 : 0,
              }}
              easing="easeOutCubic"
              style={{ position: 'absolute', bottom: 15, right: 15 }}
            >
              <WindowShell 
                title="QUICK" 
                width={130} 
                height={56} 
                glowIntensity="soft" 
                showTitlebar={true} 
                showControls={true}
                borderColor={state.themeMode === 'danger' ? '#FF4444' : undefined}
              >
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: 3 }}>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{ width: 21, height: 21, border: `1px solid ${state.themeMode === 'danger' ? '#FF4444' : HUD_COLORS.borderInner}`, background: 'rgba(255,255,255,0.05)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: state.themeMode === 'danger' ? '#FF8888' : HUD_COLORS.textDim }}>{i}</div>
                  ))}
                </div>
              </WindowShell>
            </FrameAnimatedDiv>
          </>
        )}

      {/* Sync Bottom Sheet - position: fixed 사용 */}
      {/* 동기화 메시지 - 좌측 하단 채팅 스타일 */}
      <AnimatePresence>
        {(state.onboardingStep === 'sync' || state.onboardingStep === 'complete') && (
          <SyncChatMessage 
            step={state.onboardingStep} 
            onComplete={() => setState(prev => ({ ...prev, onboardingStep: 'complete' }))} 
          />
        )}
      </AnimatePresence>

      <ConnectionBanner
        visible={state.showBanner}
        text={state.bannerText}
        scenario={state.scenario}
        showHazardStripe={state.scenario === 'monster_combat' || state.scenario === 'infected'}
        autoDismiss={true}
        dismissDelay={2000}
        onComplete={() => setState(prev => ({ ...prev, showBanner: false }))}
      />

      {/* 몬스터 출현 배너 */}
      <AnimatePresence>
        {state.monsterBannerVisible && (
          <MonsterBanner 
            visible={state.monsterBannerVisible} 
            onComplete={() => setState(prev => ({ ...prev, monsterBannerVisible: false }))} 
          />
        )}
      </AnimatePresence>

      {/* 몬스터 채팅 메시지 */}
      <MonsterChatMessage visible={state.monsterChatVisible} />

      {/* 타겟팅 UI */}
      <AnimatePresence>
        {state.targets.map(target => (
          <TargetLock key={target.id} target={target} onRemove={removeTarget} />
        ))}
      </AnimatePresence>

      {/* 히트 마커 */}
      <AnimatePresence>
        {state.hitMarkers.map(marker => (
          <HitMarkerUI key={marker.id} marker={marker} onRemove={removeHitMarker} />
        ))}
      </AnimatePresence>

      {/* 데미지 방향 화살표 */}
      <AnimatePresence>
        {state.damageArrows.map(arrow => (
          <DamageArrowUI key={arrow.id} arrow={arrow} onRemove={removeDamageArrow} />
        ))}
      </AnimatePresence>
      </div>{/* grayscale div 닫기 */}

      {/* 사망 오버레이 - grayscale 바깥에 위치 */}
      <DeathOverlay visible={state.isDead} onConfirm={confirmDeath} />

      {/* 활성 타겟 (마우스 홀드 중) */}
      {state.activeTarget && (
        <TargetLock target={state.activeTarget} onRemove={() => {}} />
      )}
    </div>
    </ExternalTimestampContext.Provider>
    </RenderModeContext.Provider>
  )
}

export default HexaTacticalHUD
