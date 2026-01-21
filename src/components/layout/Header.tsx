import * as React from 'react'
import { motion } from 'framer-motion'
import { Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  className?: string
}

export const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ className }, ref) => {
    return (
      <motion.header
        ref={ref}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center justify-between px-6 py-4',
          'bg-zinc-900/60 backdrop-blur-xl',
          'border-b border-white/5',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Video className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">HUD Recorder</h1>
            <p className="text-xs text-zinc-500">WebCodecs Video Processing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-mono text-zinc-400 bg-zinc-800/50 rounded border border-white/5">
            Phase 1
          </span>
        </div>
      </motion.header>
    )
  }
)

Header.displayName = 'Header'
