import * as React from 'react'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { HUDState } from '@/types/hud-protocol'

interface InlineTargetLockHUDProps {
  width: number
  height: number
  isPlaying: boolean
  onStateUpdate?: (state: HUDState) => void
  onReady?: () => void
}

/**
 * 내장 Target Lock HUD
 * iframe 없이 직접 Canvas로 렌더링
 */
export function InlineTargetLockHUD({
  width,
  height,
  isPlaying: _isPlaying,
  onStateUpdate,
  onReady,
}: InlineTargetLockHUDProps) {
  void _isPlaying // 향후 재생 상태에 따른 동작 추가 가능
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: width / 2, y: height / 2 })
  const [isLocked, setIsLocked] = useState(false)
  const [lockedPos, setLockedPos] = useState({ x: 0, y: 0 })
  const animationRef = useRef<number>(0)
  const hasCalledReady = useRef(false)
  
  // 콜백을 ref에 저장하여 dependency 문제 방지
  const onStateUpdateRef = useRef(onStateUpdate)
  onStateUpdateRef.current = onStateUpdate

  // 초기화 알림 (한 번만 호출)
  useEffect(() => {
    if (!hasCalledReady.current && onReady) {
      hasCalledReady.current = true
      onReady()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 마우스 이벤트 핸들러
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * width
    const y = ((e.clientY - rect.top) / rect.height) * height
    setMousePos({ x, y })
  }, [width, height])

  const handleClick = useCallback(() => {
    if (isLocked) {
      setIsLocked(false)
    } else {
      setIsLocked(true)
      setLockedPos({ ...mousePos })
    }
  }, [isLocked, mousePos])

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      // 클리어
      ctx.clearRect(0, 0, width, height)

      const targetX = isLocked ? lockedPos.x : mousePos.x
      const targetY = isLocked ? lockedPos.y : mousePos.y
      const color = isLocked ? '#ff0000' : '#00ff00'

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.fillStyle = color
      ctx.font = 'bold 12px monospace'

      // 십자선
      ctx.beginPath()
      ctx.moveTo(targetX - 20, targetY)
      ctx.lineTo(targetX + 20, targetY)
      ctx.moveTo(targetX, targetY - 20)
      ctx.lineTo(targetX, targetY + 20)
      ctx.stroke()

      // 원형 레티클
      ctx.beginPath()
      ctx.arc(targetX, targetY, 30, 0, Math.PI * 2)
      ctx.stroke()

      // 외곽 사각형
      ctx.strokeRect(targetX - 50, targetY - 50, 100, 100)

      // 코너 마커
      const cornerSize = 10
      const corners = [
        { x: targetX - 50, y: targetY - 50, dx: 1, dy: 1 },
        { x: targetX + 50, y: targetY - 50, dx: -1, dy: 1 },
        { x: targetX - 50, y: targetY + 50, dx: 1, dy: -1 },
        { x: targetX + 50, y: targetY + 50, dx: -1, dy: -1 },
      ]
      ctx.lineWidth = 3
      corners.forEach(({ x, y, dx, dy }) => {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + cornerSize * dx, y)
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + cornerSize * dy)
        ctx.stroke()
      })
      ctx.lineWidth = 2

      if (isLocked) {
        // LOCKED 텍스트
        ctx.fillStyle = '#ff0000'
        ctx.font = 'bold 14px monospace'
        ctx.fillText('LOCKED', targetX + 55, targetY - 40)

        // 추가 원
        ctx.beginPath()
        ctx.arc(targetX, targetY, 40, 0, Math.PI * 2)
        ctx.stroke()

        // 펄스 효과
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7
        ctx.globalAlpha = pulse
        ctx.beginPath()
        ctx.arc(targetX, targetY, 55, 0, Math.PI * 2)
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // 좌표 표시
      ctx.fillStyle = color
      ctx.font = '12px monospace'
      ctx.fillText(`X: ${targetX.toFixed(0)} Y: ${targetY.toFixed(0)}`, 10, 20)
      ctx.fillText(isLocked ? '🔒 LOCKED' : '🎯 TRACKING', 10, 40)

      // 상태 업데이트 콜백 (ref 사용)
      onStateUpdateRef.current?.({
        timestamp: performance.now(),
        mouse: { x: mousePos.x, y: mousePos.y, buttons: 0 },
        targets: {
          main: { x: targetX, y: targetY, locked: isLocked },
        },
      })

      animationRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [width, height, mousePos, isLocked, lockedPos])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: 'crosshair',
      }}
    />
  )
}
