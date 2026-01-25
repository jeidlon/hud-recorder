/**
 * ConnectionBanner - "CONNECTION COMPLETE" 배너
 * 
 * 레퍼런스 이미지 기준:
 * - 중앙 하단 위치
 * - slide-up 등장 애니메이션 (220ms)
 * - fade 퇴장 (600ms 후 300ms 동안)
 * - Hazard Stripe 배경 (선택)
 */

import * as React from 'react'
import { useState, useEffect, useMemo, type CSSProperties } from 'react'
import {
  CONNECTION_BANNER,
  HAZARD_STRIPE,
  FONTS,
  HUD_COLORS,
  type HexaScenarioId,
  getScenarioTheme,
} from '../constants'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Props 타입
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ConnectionBannerProps {
  visible: boolean
  text?: string
  scenario?: HexaScenarioId
  showHazardStripe?: boolean
  onComplete?: () => void
  autoDismiss?: boolean
  dismissDelay?: number
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hazard Stripe 배경
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const HazardStripeBackground: React.FC<{ animationOffset: number }> = ({ animationOffset }) => {
  const style: CSSProperties = useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    opacity: CONNECTION_BANNER.background.opacity,
    background: `repeating-linear-gradient(
      ${HAZARD_STRIPE.stripeAngle}deg,
      ${HAZARD_STRIPE.colors.primary} 0px,
      ${HAZARD_STRIPE.colors.primary} ${HAZARD_STRIPE.stripeWidth}px,
      ${HAZARD_STRIPE.colors.secondary} ${HAZARD_STRIPE.stripeWidth}px,
      ${HAZARD_STRIPE.colors.secondary} ${HAZARD_STRIPE.stripeWidth * 2}px
    )`,
    backgroundPosition: `${animationOffset}px 0`,
    zIndex: -1,
  }), [animationOffset])

  return <div style={style} />
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 메인 컴포넌트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({
  visible,
  text = CONNECTION_BANNER.text,
  scenario = 'idle',
  showHazardStripe = false,
  onComplete,
  autoDismiss = true,
  dismissDelay = CONNECTION_BANNER.animation.exit.delay,
}) => {
  const [phase, setPhase] = useState<'hidden' | 'entering' | 'visible' | 'exiting'>('hidden')
  const [stripeOffset, setStripeOffset] = useState(0)
  const theme = useMemo(() => getScenarioTheme(scenario), [scenario])

  // 표시 상태 관리
  useEffect(() => {
    if (visible && phase === 'hidden') {
      setPhase('entering')
      
      // 진입 완료
      const enterTimer = setTimeout(() => {
        setPhase('visible')
        
        // 자동 퇴장
        if (autoDismiss) {
          const exitTimer = setTimeout(() => {
            setPhase('exiting')
            
            // 퇴장 완료
            setTimeout(() => {
              setPhase('hidden')
              onComplete?.()
            }, CONNECTION_BANNER.animation.exit.duration)
          }, dismissDelay)
          
          return () => clearTimeout(exitTimer)
        }
      }, CONNECTION_BANNER.animation.enter.duration)
      
      return () => clearTimeout(enterTimer)
    } else if (!visible && phase !== 'hidden') {
      setPhase('exiting')
      const timer = setTimeout(() => {
        setPhase('hidden')
      }, CONNECTION_BANNER.animation.exit.duration)
      return () => clearTimeout(timer)
    }
  }, [visible, phase, autoDismiss, dismissDelay, onComplete])

  // Hazard Stripe 애니메이션
  useEffect(() => {
    if (!showHazardStripe || phase === 'hidden') return

    const interval = setInterval(() => {
      setStripeOffset(prev => (prev + HAZARD_STRIPE.animation.speed / 60) % (HAZARD_STRIPE.stripeWidth * 2))
    }, 1000 / 60)

    return () => clearInterval(interval)
  }, [showHazardStripe, phase])

  if (phase === 'hidden') return null

  // 애니메이션 스타일 계산
  const getTransformStyle = (): CSSProperties => {
    const baseStyle: CSSProperties = {
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '16px 48px',
      zIndex: 9000,
      overflow: 'hidden',
      transition: `all ${CONNECTION_BANNER.animation.enter.duration}ms ease-out`,
    }

    switch (phase) {
      case 'entering':
        return {
          ...baseStyle,
          transform: `translateX(-50%) translateY(${CONNECTION_BANNER.animation.enter.from.y}px)`,
          opacity: CONNECTION_BANNER.animation.enter.from.opacity,
        }
      case 'visible':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) translateY(0)',
          opacity: 1,
        }
      case 'exiting':
        return {
          ...baseStyle,
          transform: 'translateX(-50%) translateY(0)',
          opacity: 0,
          transition: `all ${CONNECTION_BANNER.animation.exit.duration}ms ease-in`,
        }
      default:
        return baseStyle
    }
  }

  const textStyle: CSSProperties = {
    fontFamily: FONTS.display,
    fontSize: CONNECTION_BANNER.fontSize,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: theme.text || CONNECTION_BANNER.color,
    textShadow: `0 0 12px ${theme.primaryGlow || HUD_COLORS.goldGlow}`,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    position: 'relative',
    zIndex: 1,
  }

  return (
    <div style={getTransformStyle()}>
      {showHazardStripe && <HazardStripeBackground animationOffset={stripeOffset} />}
      <span style={textStyle}>{text}</span>
    </div>
  )
}

export default ConnectionBanner
