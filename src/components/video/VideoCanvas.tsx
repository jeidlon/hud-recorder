import * as React from 'react'
import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { MP4Demuxer } from '@/core/MP4Demuxer'
import { VideoDecoderWrapper } from '@/core/VideoDecoderWrapper'
import { cn } from '@/lib/utils'

interface VideoCanvasProps {
  videoFile: File | null
  onFrameReady?: (frame: VideoFrame) => void
  onMetadata?: (width: number, height: number, duration: number) => void
  onDecodeProgress?: (current: number, total: number) => void
  onDecodeComplete?: (totalFrames: number) => void
}

export const VideoCanvas = React.forwardRef<HTMLCanvasElement, VideoCanvasProps>(
  ({ videoFile, onMetadata, onDecodeProgress, onDecodeComplete }, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null)
    const canvasRef = (ref as React.RefObject<HTMLCanvasElement>) || internalCanvasRef

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [frameCount, setFrameCount] = useState(0)

    // 프레임 저장용 (나중에 offline rendering 시 사용)
    const framesRef = useRef<VideoFrame[]>([])
    const decoderRef = useRef<VideoDecoderWrapper | null>(null)
    const demuxerRef = useRef<MP4Demuxer | null>(null)

    useEffect(() => {
      if (!videoFile || !canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      setIsLoading(true)
      setError(null)
      setFrameCount(0)
      framesRef.current = []

      // Decoder 설정
      const decoder = new VideoDecoderWrapper({
        onFrame: (frame) => {
          // 첫 프레임이면 캔버스 크기 설정 및 렌더링
          if (framesRef.current.length === 0) {
            canvas.width = frame.displayWidth
            canvas.height = frame.displayHeight
            ctx.drawImage(frame, 0, 0)
            onMetadata?.(frame.displayWidth, frame.displayHeight, 0)
          }

          // 프레임 카운트 업데이트
          framesRef.current.push(frame)
          setFrameCount(framesRef.current.length)
          onDecodeProgress?.(framesRef.current.length, 0)

          // ⚠️ 중요: 메모리 관리 - 첫 프레임 외에는 즉시 close
          // Offline rendering 시에는 다른 전략 필요
          if (framesRef.current.length > 1) {
            frame.close()
          }
        },
        onError: (err) => {
          setError(err.message)
          setIsLoading(false)
        },
      })

      decoderRef.current = decoder

      // Demuxer 설정
      const demuxer = new MP4Demuxer({
        onConfig: (config) => {
          console.log('Video config:', config)
          decoder.configure(config)
        },
        onChunk: (chunk) => {
          decoder.decode(chunk)
        },
        onComplete: async () => {
          await decoder.flush()
          setIsLoading(false)
          const totalFrames = framesRef.current.length
          console.log(`Decoded ${totalFrames} frames`)
          onDecodeComplete?.(totalFrames)
        },
        onError: (err) => {
          setError(err.message)
          setIsLoading(false)
        },
      })

      demuxerRef.current = demuxer
      demuxer.loadFile(videoFile)

      // Cleanup
      return () => {
        decoder.destroy()
        demuxer.destroy()
        // 프레임 메모리 해제
        framesRef.current.forEach((f) => {
          try {
            f.close()
          } catch {
            // ignore
          }
        })
        framesRef.current = []
      }
    }, [videoFile, onMetadata, onDecodeProgress, onDecodeComplete])

    return (
      <div className="relative w-full">
        {/* 로딩 오버레이 */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'absolute inset-0 z-10',
              'flex flex-col items-center justify-center gap-3',
              'bg-black/60 backdrop-blur-sm rounded-xl'
            )}
          >
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-300">
              디코딩 중... {frameCount > 0 && `(${frameCount} frames)`}
            </span>
          </motion.div>
        )}

        {/* 에러 표시 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              'absolute inset-0 z-10',
              'flex flex-col items-center justify-center gap-2',
              'bg-red-950/60 backdrop-blur-sm rounded-xl'
            )}
          >
            <span className="text-red-400 font-medium">에러 발생</span>
            <span className="text-sm text-red-300">{error}</span>
          </motion.div>
        )}

        {/* 캔버스 */}
        <canvas
          ref={canvasRef}
          className={cn(
            'w-full rounded-xl',
            'bg-zinc-900/80 border border-white/10',
            !videoFile && 'min-h-[300px]'
          )}
        />
      </div>
    )
  }
)

VideoCanvas.displayName = 'VideoCanvas'
