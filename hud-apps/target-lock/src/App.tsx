import { useEffect, useRef, useState, useCallback } from 'react'
import type { MainToHUDMessage, HUDToMainMessage, HUDState } from './hud-protocol'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isLocked, setIsLocked] = useState(false)
  const [lockedTarget, setLockedTarget] = useState<{ x: number; y: number } | null>(null)

  // 메인 앱으로 메시지 전송
  const sendToMain = useCallback((message: HUDToMainMessage) => {
    window.parent.postMessage(message, '*')
  }, [])

  // 메인 앱으로부터 메시지 수신
  useEffect(() => {
    const handleMessage = (event: MessageEvent<MainToHUDMessage>) => {
      if (!event.data?.type) return
      
      const { type, payload } = event.data

      switch (type) {
        case 'INIT':
          if (payload?.width && payload?.height) {
            setDimensions({ width: payload.width, height: payload.height })
          }
          break

        case 'SET_STATE':
          // Offline Rendering 시 상태 복원
          if (payload?.state) {
            setMousePos(payload.state.mouse)
            if (payload.state.targets?.main) {
              setIsLocked(payload.state.targets.main.locked)
              setLockedTarget({
                x: payload.state.targets.main.x,
                y: payload.state.targets.main.y,
              })
            }
          }
          break

        case 'CAPTURE_FRAME':
          // 현재 캔버스 캡처하여 전송
          captureAndSend()
          break
      }
    }

    window.addEventListener('message', handleMessage)

    // 준비 완료 알림
    sendToMain({ type: 'READY' })

    return () => window.removeEventListener('message', handleMessage)
  }, [sendToMain])

  // 마우스 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newPos = { x: e.clientX, y: e.clientY }
      setMousePos(newPos)

      // 상태 업데이트 전송
      const state: HUDState = {
        timestamp: performance.now(),
        mouse: { ...newPos, buttons: e.buttons },
        targets: lockedTarget
          ? { main: { ...lockedTarget, locked: isLocked } }
          : undefined,
      }
      sendToMain({ type: 'STATE_UPDATE', payload: { state } })
    }

    const handleClick = (e: MouseEvent) => {
      if (!isLocked) {
        // 타겟 잠금
        setIsLocked(true)
        setLockedTarget({ x: e.clientX, y: e.clientY })
      } else {
        // 잠금 해제
        setIsLocked(false)
        setLockedTarget(null)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleClick)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleClick)
    }
  }, [isLocked, lockedTarget, sendToMain])

  // HUD 렌더링
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 클리어 (투명)
    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    const targetX = isLocked && lockedTarget ? lockedTarget.x : mousePos.x
    const targetY = isLocked && lockedTarget ? lockedTarget.y : mousePos.y

    // 외곽 원형 레티클
    ctx.strokeStyle = isLocked ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)'
    ctx.lineWidth = 2
    ctx.shadowColor = isLocked ? '#ff0000' : '#00ff00'
    ctx.shadowBlur = 10

    // 외곽 원
    ctx.beginPath()
    ctx.arc(targetX, targetY, 40, 0, Math.PI * 2)
    ctx.stroke()

    // 내부 원
    ctx.beginPath()
    ctx.arc(targetX, targetY, 20, 0, Math.PI * 2)
    ctx.stroke()

    // 십자선
    ctx.beginPath()
    ctx.moveTo(targetX - 50, targetY)
    ctx.lineTo(targetX - 25, targetY)
    ctx.moveTo(targetX + 25, targetY)
    ctx.lineTo(targetX + 50, targetY)
    ctx.moveTo(targetX, targetY - 50)
    ctx.lineTo(targetX, targetY - 25)
    ctx.moveTo(targetX, targetY + 25)
    ctx.lineTo(targetX, targetY + 50)
    ctx.stroke()

    // 중앙 점
    ctx.fillStyle = isLocked ? '#ff0000' : '#00ff00'
    ctx.beginPath()
    ctx.arc(targetX, targetY, 3, 0, Math.PI * 2)
    ctx.fill()

    // 리셋 shadow
    ctx.shadowBlur = 0

    if (isLocked) {
      // LOCKED 텍스트
      ctx.fillStyle = 'rgba(255, 0, 0, 0.9)'
      ctx.font = 'bold 12px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('● LOCKED', targetX, targetY + 60)

      // 깜빡이는 코너 마커
      const time = performance.now()
      const alpha = 0.5 + 0.5 * Math.sin(time / 100)
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`
      ctx.lineWidth = 3

      const corners = [
        { x: targetX - 45, y: targetY - 45, dx: 15, dy: 0, dx2: 0, dy2: 15 },
        { x: targetX + 45, y: targetY - 45, dx: -15, dy: 0, dx2: 0, dy2: 15 },
        { x: targetX - 45, y: targetY + 45, dx: 15, dy: 0, dx2: 0, dy2: -15 },
        { x: targetX + 45, y: targetY + 45, dx: -15, dy: 0, dx2: 0, dy2: -15 },
      ]

      corners.forEach(({ x, y, dx, dy, dx2, dy2 }) => {
        ctx.beginPath()
        ctx.moveTo(x + dx, y + dy)
        ctx.lineTo(x, y)
        ctx.lineTo(x + dx2, y + dy2)
        ctx.stroke()
      })
    } else {
      // 좌표 표시
      ctx.fillStyle = 'rgba(0, 255, 0, 0.7)'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`X: ${Math.round(targetX)}`, targetX + 55, targetY - 5)
      ctx.fillText(`Y: ${Math.round(targetY)}`, targetX + 55, targetY + 10)
    }
  }, [mousePos, isLocked, lockedTarget, dimensions])

  // 프레임 캡처
  const captureAndSend = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const bitmap = await createImageBitmap(canvas)
    sendToMain({
      type: 'FRAME_CAPTURED',
      payload: { frameData: bitmap },
    })
  }

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
    />
  )
}

export default App
