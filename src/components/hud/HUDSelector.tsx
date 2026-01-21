import * as React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, Link2, Check, Clock, Eye, X } from 'lucide-react'
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
    previewComponent: 'InlineTargetLockHUD',
  },
  {
    id: 'coming-soon',
    name: 'Coming Soon...',
    url: '',
    description: '새로운 HUD 준비 중',
    icon: Clock,
    available: false,
    previewComponent: null,
  },
]

// 미리보기 모달 컴포넌트
function PreviewModal({
  preset,
  onClose,
}: {
  preset: (typeof presetHUDs)[0]
  onClose: () => void
}) {
  const [mousePos, setMousePos] = React.useState({ x: 400, y: 300 })
  const [isLocked, setIsLocked] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [])

  const handleClick = useCallback(() => {
    setIsLocked((prev) => !prev)
  }, [])

  // 타겟 위치 계산
  const targetX = isLocked ? mousePos.x : mousePos.x
  const targetY = isLocked ? mousePos.y : mousePos.y
  const color = isLocked ? '#ff0000' : '#00ff00'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <preset.icon className="w-5 h-5 text-blue-400" />
            <span className="text-lg font-medium text-white">{preset.name} 미리보기</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* 미리보기 영역 */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/20 cursor-crosshair"
          style={{
            backgroundImage: 'url(/preview-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* HUD 오버레이 */}
          {preset.id === 'target-lock' && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {/* 십자선 */}
              <line
                x1={targetX - 20}
                y1={targetY}
                x2={targetX + 20}
                y2={targetY}
                stroke={color}
                strokeWidth={2}
              />
              <line
                x1={targetX}
                y1={targetY - 20}
                x2={targetX}
                y2={targetY + 20}
                stroke={color}
                strokeWidth={2}
              />

              {/* 원형 레티클 */}
              <circle cx={targetX} cy={targetY} r={30} stroke={color} strokeWidth={2} fill="none" />

              {/* 외곽 사각형 */}
              <rect
                x={targetX - 50}
                y={targetY - 50}
                width={100}
                height={100}
                stroke={color}
                strokeWidth={2}
                fill="none"
              />

              {/* 코너 마커 */}
              {[
                { x: targetX - 50, y: targetY - 50, dx: 1, dy: 1 },
                { x: targetX + 50, y: targetY - 50, dx: -1, dy: 1 },
                { x: targetX - 50, y: targetY + 50, dx: 1, dy: -1 },
                { x: targetX + 50, y: targetY + 50, dx: -1, dy: -1 },
              ].map((corner, i) => (
                <g key={i}>
                  <line
                    x1={corner.x}
                    y1={corner.y}
                    x2={corner.x + 10 * corner.dx}
                    y2={corner.y}
                    stroke={color}
                    strokeWidth={3}
                  />
                  <line
                    x1={corner.x}
                    y1={corner.y}
                    x2={corner.x}
                    y2={corner.y + 10 * corner.dy}
                    stroke={color}
                    strokeWidth={3}
                  />
                </g>
              ))}

              {/* 추가 원 (락온 시) */}
              {isLocked && (
                <>
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r={40}
                    stroke={color}
                    strokeWidth={2}
                    fill="none"
                  />
                  <text
                    x={targetX + 55}
                    y={targetY - 40}
                    fill={color}
                    fontSize={14}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    LOCKED
                  </text>
                </>
              )}

              {/* 좌표 표시 */}
              <text x={10} y={20} fill={color} fontSize={12} fontFamily="monospace">
                X: {targetX.toFixed(0)} Y: {targetY.toFixed(0)}
              </text>
              <text x={10} y={40} fill={color} fontSize={12} fontFamily="monospace">
                {isLocked ? '🔒 LOCKED' : '🎯 TRACKING'}
              </text>
            </svg>
          )}

          {/* 안내 텍스트 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <span className="text-sm text-zinc-300">
              마우스를 움직이고 <span className="text-blue-400 font-medium">클릭</span>하여 락온
              테스트
            </span>
          </div>
        </div>

        {/* 설명 */}
        <div className="mt-4 p-4 rounded-lg bg-zinc-900/80 border border-white/10">
          <h4 className="text-sm font-medium text-zinc-200 mb-2">기능 설명</h4>
          <ul className="text-xs text-zinc-400 space-y-1">
            <li>• 마우스 이동: 크로스헤어가 따라옴</li>
            <li>• 클릭: 타겟 락온/해제 토글</li>
            <li>• 녹화 시 모든 움직임이 기록됨</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  )
}

export const HUDSelector = React.forwardRef<HTMLDivElement, HUDSelectorProps>(
  ({ hudUrl, onUrlChange, isConnected, className }, ref) => {
    const [mode, setMode] = useState<'preset' | 'custom'>(
      hudUrl === INLINE_HUD_ID || presetHUDs.some((p) => p.url === hudUrl) ? 'preset' : 'custom'
    )
    const [customUrl, setCustomUrl] = useState(
      hudUrl !== INLINE_HUD_ID && !presetHUDs.some((p) => p.url === hudUrl) ? hudUrl : ''
    )
    const [previewPreset, setPreviewPreset] = useState<(typeof presetHUDs)[0] | null>(null)

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

    const handlePreview = (e: React.MouseEvent, preset: (typeof presetHUDs)[0]) => {
      e.stopPropagation()
      if (preset.available) {
        setPreviewPreset(preset)
      }
    }

    const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (customUrl.trim()) {
        onUrlChange(customUrl.trim())
      }
    }

    return (
      <>
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
                    <motion.div
                      key={preset.id}
                      whileHover={preset.available ? { scale: 1.02 } : {}}
                      className={cn(
                        'relative flex flex-col rounded-lg',
                        'border transition-all duration-200',
                        preset.available
                          ? isSelected
                            ? 'bg-blue-500/15 border-blue-500/40'
                            : 'bg-zinc-800/50 border-white/5 hover:border-white/15'
                          : 'bg-zinc-800/30 border-white/5 opacity-50'
                      )}
                    >
                      {/* 메인 버튼 */}
                      <button
                        onClick={() => handlePresetSelect(preset)}
                        disabled={!preset.available}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 text-left',
                          !preset.available && 'cursor-not-allowed'
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
                      </button>

                      {/* 미리보기 버튼 */}
                      {preset.available && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handlePreview(e, preset)}
                          className={cn(
                            'flex items-center justify-center gap-1.5 px-3 py-1.5 mx-2 mb-2',
                            'rounded-md text-xs font-medium',
                            'bg-zinc-700/50 hover:bg-zinc-600/50',
                            'border border-white/5 hover:border-white/10',
                            'text-zinc-400 hover:text-zinc-200',
                            'transition-all duration-200'
                          )}
                        >
                          <Eye className="w-3 h-3" />
                          <span>미리보기</span>
                        </motion.button>
                      )}
                    </motion.div>
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

        {/* 미리보기 모달 */}
        <AnimatePresence>
          {previewPreset && (
            <PreviewModal preset={previewPreset} onClose={() => setPreviewPreset(null)} />
          )}
        </AnimatePresence>
      </>
    )
  }
)

HUDSelector.displayName = 'HUDSelector'
