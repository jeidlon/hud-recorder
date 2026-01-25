import * as React from 'react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Check, Eye, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hudPresets, type HUDPreset } from '@/presets'

// 내장 HUD 식별자 (프리셋 ID를 포함)
export const INLINE_HUD_PREFIX = '__inline__:'
export const INLINE_HUD_ID = '__inline__:target-lock' // 기존 호환성 유지

// 프리셋 ID가 내장 HUD인지 확인
export function isInlineHUDUrl(url: string): boolean {
  return url.startsWith(INLINE_HUD_PREFIX)
}

// 내장 HUD URL에서 프리셋 ID 추출
export function getPresetIdFromInlineUrl(url: string): string | null {
  if (!isInlineHUDUrl(url)) return null
  return url.replace(INLINE_HUD_PREFIX, '')
}

interface HUDSelectorProps {
  hudUrl: string
  onUrlChange: (url: string) => void
  isConnected: boolean
  onReconnect?: () => void
  className?: string
}

// 미리보기 모달 컴포넌트
function PreviewModal({ preset, onClose }: { preset: HUDPreset; onClose: () => void }) {
  const HUDComponent = preset.component
  const [showHint, setShowHint] = useState(true)

  // 3초 후 힌트 페이드아웃
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(timer)
  }, [])

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
          className="relative w-full rounded-xl overflow-hidden border border-white/20 cursor-crosshair"
          style={{
            aspectRatio: '16 / 9',
            backgroundImage: 'url(/preview-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* 실제 HUD 컴포넌트 렌더링 */}
          {HUDComponent && (
            <HUDComponent
              width={1280}
              height={720}
              isPlaying={false}
              onStateUpdate={() => {}}
              onReady={() => {}}
            />
          )}

          {/* 안내 텍스트 - 3초 후 페이드아웃 */}
          <AnimatePresence>
            {showHint && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10"
              >
                <span className="text-sm text-zinc-300">
                  마우스를 움직이고 <span className="text-blue-400 font-medium">클릭</span>하여 테스트
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 설명 */}
        <div className="mt-4 p-4 rounded-lg bg-zinc-900/80 border border-white/10">
          <h4 className="text-sm font-medium text-zinc-200 mb-2">{preset.name}</h4>
          <p className="text-xs text-zinc-400">{preset.description}</p>
        </div>

        {/* Hexa-Tactical 키 조작법 */}
        {preset.id === 'hexa-tactical' && (
          <div className="mt-3 p-4 rounded-lg bg-zinc-900/80 border border-cyan-500/20">
            <h4 className="text-xs font-medium text-cyan-400 mb-3">⌨️ 키 조작법</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {/* 시나리오 */}
              <div className="col-span-2 text-zinc-500 font-medium mb-1">시나리오</div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">`</kbd>
                <span className="text-zinc-400">온보딩 (접속 애니메이션)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">1</kbd>
                <span className="text-zinc-400">Normal 모드</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">2</kbd>
                <span className="text-zinc-400">몬스터 출현</span>
              </div>
              
              {/* 불 효과 */}
              <div className="col-span-2 text-zinc-500 font-medium mt-2 mb-1">🔥 불 효과 (12초 후 자동 종료)</div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">F</kbd>
                <span className="text-zinc-400">루비안 불 토글</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">G</kbd>
                <span className="text-zinc-400">수빈사랑 불 토글</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">H</kbd>
                <span className="text-zinc-400">둘 다 토글</span>
              </div>

              {/* 몬스터 모드 액션 */}
              <div className="col-span-2 text-zinc-500 font-medium mt-2 mb-1">⚔️ 몬스터 모드 (2번 상태)</div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">좌클릭</kbd>
                <span className="text-zinc-400">타겟팅 UI</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">좌클릭 홀드</kbd>
                <span className="text-zinc-400">타겟 따라가기</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">우클릭</kbd>
                <span className="text-zinc-400">히트마커 (FPS)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">D</kbd>
                <span className="text-zinc-400">피격 (HP -1칸)</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-300 font-mono">K</kbd>
                <span className="text-zinc-400">즉시 사망</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// 프리셋 ID를 URL로 변환 (모든 내장 프리셋 지원)
function presetIdToUrl(presetId: string): string {
  const preset = hudPresets.find((p) => p.id === presetId)
  if (preset && preset.available && preset.component) {
    return `${INLINE_HUD_PREFIX}${presetId}`
  }
  return ''
}

// URL을 프리셋 ID로 변환
function urlToPresetId(url: string): string | null {
  if (isInlineHUDUrl(url)) {
    return getPresetIdFromInlineUrl(url)
  }
  return null
}

export const HUDSelector = React.forwardRef<HTMLDivElement, HUDSelectorProps>(
  ({ hudUrl, onUrlChange, isConnected, className }, ref) => {
    const currentPresetId = urlToPresetId(hudUrl)

    const [mode, setMode] = useState<'preset' | 'custom'>(currentPresetId ? 'preset' : 'custom')
    const [customUrl, setCustomUrl] = useState(currentPresetId ? '' : hudUrl)
    const [previewPreset, setPreviewPreset] = useState<HUDPreset | null>(null)

    const isInline = isInlineHUDUrl(hudUrl)

    const handleModeChange = (newMode: 'preset' | 'custom') => {
      setMode(newMode)
      if (newMode === 'preset') {
        // 첫 번째 사용 가능한 프리셋 선택
        const firstAvailable = hudPresets.find((p) => p.available)
        if (firstAvailable) {
          onUrlChange(presetIdToUrl(firstAvailable.id))
        }
      }
    }

    const handlePresetSelect = (preset: HUDPreset) => {
      if (!preset.available) return
      onUrlChange(presetIdToUrl(preset.id))
    }

    const handlePreview = (e: React.MouseEvent, preset: HUDPreset) => {
      e.stopPropagation()
      if (preset.available && preset.component) {
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
                {hudPresets.map((preset) => {
                  const Icon = preset.icon
                  const isSelected = currentPresetId === preset.id

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
                      {preset.available && preset.component && (
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

        {/* 미리보기 모달 - 실제 HUD 컴포넌트 사용 */}
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
