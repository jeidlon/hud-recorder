import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  videoFile: File
  isPlaying: boolean
  onPlayingChange: (playing: boolean) => void
  onMetadata: (width: number, height: number, duration: number, fps: number) => void
  onTimeUpdate: (currentTime: number) => void
  onVideoEnded?: () => void
  className?: string
}

/**
 * HTML5 Video 기반 플레이어
 * 네이티브 비디오 재생으로 안정적인 미리보기 제공
 */
export function VideoPlayer({
  videoFile,
  isPlaying,
  onPlayingChange,
  onMetadata,
  onTimeUpdate,
  onVideoEnded,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // 파일 URL 생성
  useEffect(() => {
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  // 재생/일시정지 제어
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.play().catch(console.error)
    } else {
      video.pause()
    }
  }, [isPlaying])

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return

    const w = video.videoWidth
    const h = video.videoHeight
    const d = video.duration * 1000 // ms로 변환
    const fps = 30 // 기본값, 정확한 fps는 WebCodecs로 확인 가능

    setDuration(d)
    onMetadata(w, h, d, fps)
  }

  // 시간 업데이트 스로틀링 (100ms 간격으로 제한)
  const lastTimeUpdateRef = useRef(0)
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const now = performance.now()
    // 100ms 이내면 스킵 (10fps 업데이트로 제한)
    if (now - lastTimeUpdateRef.current < 100) return
    lastTimeUpdateRef.current = now

    const time = video.currentTime * 1000 // ms로 변환
    setCurrentTime(time)
    onTimeUpdate(time)
  }, [onTimeUpdate])

  const handleEnded = () => {
    onPlayingChange(false)
    onVideoEnded?.()
  }

  const handleRestart = () => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    setCurrentTime(0)
    onTimeUpdate(0)
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn('relative w-full h-full', className)}>
      {/* 비디오 */}
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onClick={() => onPlayingChange(!isPlaying)}
          className="w-full h-full object-contain bg-black cursor-pointer"
          style={{ 
            willChange: 'contents',
            transform: 'translateZ(0)', // GPU 레이어 강제 생성
          }}
          playsInline
          muted={false}
        />
      )}

      {/* 오버레이 컨트롤 (호버 시 표시) */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className={cn(
          'absolute bottom-0 left-0 right-0',
          'bg-gradient-to-t from-black/80 to-transparent',
          'p-4 pt-8'
        )}
      >
        {/* 진행 바 */}
        <div className="mb-3">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 컨트롤 버튼 */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onPlayingChange(!isPlaying)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRestart}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-white" />
          </motion.button>

          {/* 시간 표시 */}
          <span className="text-sm text-white/80 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
