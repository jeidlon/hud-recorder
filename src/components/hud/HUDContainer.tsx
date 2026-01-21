import * as React from 'react'
import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Unplug } from 'lucide-react'
import type { MainToHUDMessage, HUDToMainMessage, HUDState } from '@/types/hud-protocol'
import { cn } from '@/lib/utils'

interface HUDContainerProps {
  hudUrl: string // HUD 앱 URL (localhost:5174 등)
  width: number
  height: number
  isPlaying: boolean
  currentTime: number // ms
  onStateUpdate?: (state: HUDState) => void
  onReady?: () => void
  onError?: (error: string) => void
  className?: string
}

export const HUDContainer = React.forwardRef<HTMLIFrameElement, HUDContainerProps>(
  (
    {
      hudUrl,
      width,
      height,
      isPlaying,
      currentTime,
      onStateUpdate,
      onReady,
      onError,
      className,
    },
    ref
  ) => {
    const internalRef = useRef<HTMLIFrameElement>(null)
    const iframeRef = (ref as React.RefObject<HTMLIFrameElement>) || internalRef
    const [isReady, setIsReady] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // HUD로 메시지 전송
    const sendMessage = useCallback((message: MainToHUDMessage) => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(message, '*')
      }
    }, [iframeRef])

    // HUD로부터 메시지 수신
    useEffect(() => {
      const handleMessage = (event: MessageEvent<HUDToMainMessage>) => {
        // 메시지 타입 확인
        if (!event.data?.type) return

        const { type, payload } = event.data

        switch (type) {
          case 'READY':
            setIsReady(true)
            setIsLoading(false)
            setError(null)
            onReady?.()
            // 초기화 메시지 전송
            sendMessage({
              type: 'INIT',
              payload: { width, height },
            })
            break

          case 'STATE_UPDATE':
            if (payload?.state) {
              onStateUpdate?.(payload.state)
            }
            break

          case 'ERROR':
            setError(payload?.error || 'Unknown HUD error')
            onError?.(payload?.error || 'Unknown HUD error')
            break
        }
      }

      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }, [width, height, sendMessage, onStateUpdate, onReady, onError])

    // 재생 상태 변경 시 HUD에 알림
    useEffect(() => {
      if (!isReady) return
      sendMessage({
        type: isPlaying ? 'PLAY' : 'PAUSE',
        payload: { time: currentTime },
      })
    }, [isPlaying, isReady, sendMessage, currentTime])

    // 시간 업데이트
    useEffect(() => {
      if (!isReady || !isPlaying) return
      sendMessage({
        type: 'SEEK',
        payload: { time: currentTime },
      })
    }, [currentTime, isReady, isPlaying, sendMessage])

    // iframe 로드 에러 처리
    const handleIframeError = () => {
      setIsLoading(false)
      setError('HUD 앱을 로드할 수 없습니다')
    }

    // iframe 로드 완료
    const handleIframeLoad = () => {
      // READY 메시지를 기다림 (1초 타임아웃)
      setTimeout(() => {
        if (!isReady) {
          setIsLoading(false)
          setError('HUD 앱이 응답하지 않습니다')
        }
      }, 3000)
    }

    return (
      <div
        className={cn(
          'absolute inset-0 z-10',
          className
        )}
        style={{ width, height }}
      >
        {/* 로딩/에러 오버레이 */}
        {(isLoading || error) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 z-20',
              'flex flex-col items-center justify-center gap-3',
              'bg-black/40 backdrop-blur-sm'
            )}
          >
            {isLoading && !error && (
              <>
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                <span className="text-sm text-zinc-300">HUD 연결 중...</span>
              </>
            )}
            {error && (
              <>
                <Unplug className="w-6 h-6 text-amber-400" />
                <span className="text-sm text-amber-300">{error}</span>
                <span className="text-xs text-zinc-500">
                  HUD 앱이 {hudUrl}에서 실행 중인지 확인하세요
                </span>
              </>
            )}
          </motion.div>
        )}

        {/* HUD iframe */}
        <iframe
          ref={iframeRef}
          src={hudUrl}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          className="w-full h-full border-none"
          style={{
            background: 'transparent',
            pointerEvents: 'auto',
          }}
          // @ts-expect-error - allowTransparency is a valid attribute
          allowtransparency="true"
          allow="autoplay"
        />
      </div>
    )
  }
)

HUDContainer.displayName = 'HUDContainer'

// HUD 프레임 캡처용 헬퍼 (Offline Rendering 시 사용)
export async function captureHUDFrame(
  iframe: HTMLIFrameElement
): Promise<ImageBitmap | null> {
  return new Promise((resolve) => {
    const handleCapture = (event: MessageEvent<HUDToMainMessage>) => {
      if (event.data.type === 'FRAME_CAPTURED') {
        window.removeEventListener('message', handleCapture)
        resolve(event.data.payload?.frameData || null)
      }
    }

    window.addEventListener('message', handleCapture)
    iframe.contentWindow?.postMessage({ type: 'CAPTURE_FRAME' }, '*')

    // 타임아웃
    setTimeout(() => {
      window.removeEventListener('message', handleCapture)
      resolve(null)
    }, 1000)
  })
}
