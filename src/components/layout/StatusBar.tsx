import * as React from 'react'
import { motion } from 'framer-motion'
import { Monitor, Clock, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

type Status = 'idle' | 'recording' | 'rendering' | 'ready'

interface StatusBarProps {
  resolution: { width: number; height: number } | null
  fps: number
  currentTime: number
  duration: number
  status: Status
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'text-zinc-400' },
  recording: { label: 'Recording', color: 'text-red-400' },
  rendering: { label: 'Rendering', color: 'text-amber-400' },
  ready: { label: 'Export Ready', color: 'text-green-400' },
}

export const StatusBar = React.forwardRef<HTMLDivElement, StatusBarProps>(
  ({ resolution, fps, currentTime, duration, status }, ref) => {
    const formatTime = (ms: number) => {
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      const sec = s % 60
      const msec = Math.floor((ms % 1000) / 10)
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(2, '0')}`
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-zinc-900/60 backdrop-blur-xl',
          'border-t border-white/5 rounded-b-xl'
        )}
      >
        {/* 타임코드 */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="font-mono text-sm tabular-nums text-zinc-100">
            {formatTime(currentTime)}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="font-mono text-sm tabular-nums text-zinc-400">
            {formatTime(duration)}
          </span>
        </div>

        {/* 해상도 & FPS */}
        <div className="flex items-center gap-4">
          {resolution && (
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-zinc-500" />
              <span className="font-mono text-sm text-zinc-300">
                {resolution.width}×{resolution.height}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-500" />
            <span className="font-mono text-sm text-zinc-300">{fps}fps</span>
          </div>
        </div>

        {/* 상태 */}
        <div className="flex items-center gap-2">
          {status === 'recording' && (
            <motion.span
              className="w-2 h-2 bg-red-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
          <span className={cn('text-sm font-medium', statusConfig[status].color)}>
            {statusConfig[status].label}
          </span>
        </div>
      </motion.div>
    )
  }
)

StatusBar.displayName = 'StatusBar'
