import * as React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Link2, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

// 내장 HUD 식별자
export const INLINE_HUD_ID = '__inline__'

interface HUDSelectorProps {
  hudUrl: string
  onUrlChange: (url: string) => void
  isConnected: boolean
  onReconnect?: () => void
  className?: string
}

// 프리셋 HUD 목록
const presetHUDs = [
  {
    id: 'target-lock',
    name: 'Target Lock',
    url: INLINE_HUD_ID,
    description: '크로스헤어 + 타겟 락온',
    icon: Crosshair,
    available: true,
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon...',
    url: '',
    description: '새로운 HUD 준비 중',
    icon: Clock,
    available: false,
  },
]

export const HUDSelector = React.forwardRef<HTMLDivElement, HUDSelectorProps>(
  ({ hudUrl, onUrlChange, isConnected, className }, ref) => {
    const [mode, setMode] = useState<'preset' | 'custom'>(
      hudUrl === INLINE_HUD_ID || presetHUDs.some((p) => p.url === hudUrl) ? 'preset' : 'custom'
    )
    const [customUrl, setCustomUrl] = useState(
      hudUrl !== INLINE_HUD_ID && !presetHUDs.some((p) => p.url === hudUrl) ? hudUrl : ''
    )

    const isInline = hudUrl === INLINE_HUD_ID

    const handleModeChange = (newMode: 'preset' | 'custom') => {
      setMode(newMode)
      if (newMode === 'preset') {
        // 첫 번째 프리셋 선택
        onUrlChange(presetHUDs[0].url)
      }
    }

    const handlePresetSelect = (preset: (typeof presetHUDs)[0]) => {
      if (!preset.available) return
      onUrlChange(preset.url)
    }

    const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (customUrl.trim()) {
        onUrlChange(customUrl.trim())
      }
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-xl',
          'bg-zinc-900/80 backdrop-blur-xl',
          'border border-white/10',
          className
        )}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">오버레이 UI 선택</span>
          </div>

          {/* 연결 상태 */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
              )}
            />
            <span className="text-xs text-zinc-400">
              {isConnected ? (isInline ? '내장' : '연결됨') : '대기중'}
            </span>
          </div>
        </div>

        {/* 모드 선택 탭 */}
        <div className="flex gap-2 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeChange('preset')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
              'border transition-all duration-200',
              mode === 'preset'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10'
            )}
          >
            프리셋
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeChange('custom')}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium',
              'border transition-all duration-200',
              mode === 'custom'
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:border-white/10'
            )}
          >
            Custom URL (iframe)
          </motion.button>
        </div>

        {/* 프리셋 모드 */}
        <AnimatePresence mode="wait">
          {mode === 'preset' && (
            <motion.div
              key="preset"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-2"
            >
              {presetHUDs.map((preset) => {
                const Icon = preset.icon
                const isSelected = hudUrl === preset.url

                return (
                  <motion.button
                    key={preset.id}
                    whileHover={preset.available ? { scale: 1.02 } : {}}
                    whileTap={preset.available ? { scale: 0.98 } : {}}
                    onClick={() => handlePresetSelect(preset)}
                    disabled={!preset.available}
                    className={cn(
                      'relative flex items-center gap-3 px-4 py-3 rounded-lg',
                      'border transition-all duration-200 text-left',
                      preset.available
                        ? isSelected
                          ? 'bg-blue-500/15 border-blue-500/40'
                          : 'bg-zinc-800/50 border-white/5 hover:border-white/15'
                        : 'bg-zinc-800/30 border-white/5 cursor-not-allowed opacity-50'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 flex-shrink-0',
                        preset.available
                          ? isSelected
                            ? 'text-green-400'
                            : 'text-zinc-400'
                          : 'text-zinc-600'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'text-sm font-medium truncate',
                          preset.available
                            ? isSelected
                              ? 'text-blue-300'
                              : 'text-zinc-200'
                            : 'text-zinc-500'
                        )}
                      >
                        {preset.name}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{preset.description}</div>
                    </div>
                    {isSelected && preset.available && (
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </motion.button>
                )
              })}
            </motion.div>
          )}

          {/* Custom URL 모드 */}
          {mode === 'custom' && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleCustomSubmit} className="space-y-3">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:5174"
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-zinc-800/70 border border-white/10',
                    'text-sm text-zinc-100 placeholder:text-zinc-600',
                    'focus:outline-none focus:border-blue-500/50',
                    'transition-colors'
                  )}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!customUrl.trim()}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg',
                    'bg-blue-500/20 border border-blue-500/30',
                    'text-sm font-medium text-blue-300',
                    'hover:bg-blue-500/30 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  연결
                </motion.button>

                {/* 현재 연결된 URL 표시 */}
                {hudUrl && hudUrl !== INLINE_HUD_ID && mode === 'custom' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-green-400 font-mono truncate">{hudUrl}</span>
                  </div>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)

HUDSelector.displayName = 'HUDSelector'
