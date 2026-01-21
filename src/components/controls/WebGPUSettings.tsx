import * as React from 'react'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, Sparkles, Monitor, Scan, Circle, Film } from 'lucide-react'
import { useAppStore, type WebGPUEffects } from '@/store/useAppStore'
import { checkWebGPUSupport } from '@/core/WebGPUSupport'
import type { CompositorMode } from '@/core/RenderingPipeline'
import { cn } from '@/lib/utils'

interface EffectToggleProps {
  icon: React.ReactNode
  label: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}

const EffectToggle: React.FC<EffectToggleProps> = ({
  icon,
  label,
  enabled,
  onToggle,
  disabled,
}) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.02 }}
    whileTap={disabled ? {} : { scale: 0.98 }}
    onClick={onToggle}
    disabled={disabled}
    className={cn(
      'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
      'border text-sm font-medium',
      disabled
        ? 'opacity-50 cursor-not-allowed bg-zinc-800/30 border-zinc-700/30 text-zinc-500'
        : enabled
        ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
    )}
  >
    {icon}
    <span>{label}</span>
    {enabled && !disabled && (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="ml-auto w-2 h-2 bg-purple-400 rounded-full"
      />
    )}
  </motion.button>
)

export const WebGPUSettings: React.FC = () => {
  const {
    compositorMode,
    webgpuEffects,
    setCompositorMode,
    setWebGPUEffect,
  } = useAppStore()

  const [webgpuSupported, setWebgpuSupported] = useState<boolean | null>(null)
  const [gpuInfo, setGpuInfo] = useState<string>('')

  useEffect(() => {
    checkWebGPUSupport().then((result) => {
      setWebgpuSupported(result.supported)
      if (result.supported && result.adapter) {
        // GPU 정보 추출
        const info = result.adapter.info
        if (info) {
          setGpuInfo(`${info.vendor} ${info.architecture}`.trim() || 'GPU 감지됨')
        }
      }
    })
  }, [])

  const isWebGPUActive = compositorMode !== 'canvas2d' && webgpuSupported
  const hasAnyEffect = Object.values(webgpuEffects).some(Boolean)

  const effectsConfig: {
    key: keyof WebGPUEffects
    icon: React.ReactNode
    label: string
  }[] = [
    { key: 'chromaticAberration', icon: <Sparkles className="w-4 h-4" />, label: '색수차' },
    { key: 'bloom', icon: <Zap className="w-4 h-4" />, label: '블룸' },
    { key: 'scanlines', icon: <Scan className="w-4 h-4" />, label: '스캔라인' },
    { key: 'vignette', icon: <Circle className="w-4 h-4" />, label: '비네팅' },
    { key: 'noise', icon: <Film className="w-4 h-4" />, label: '필름 노이즈' },
  ]

  const modeOptions: { value: CompositorMode; label: string; icon: React.ReactNode }[] = [
    { value: 'auto', label: 'Auto', icon: <Zap className="w-4 h-4" /> },
    { value: 'webgpu', label: 'WebGPU', icon: <Cpu className="w-4 h-4" /> },
    { value: 'canvas2d', label: 'Canvas 2D', icon: <Monitor className="w-4 h-4" /> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl',
        'bg-zinc-900/80 backdrop-blur-xl',
        'border border-white/10'
      )}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-zinc-200">렌더링 엔진</h3>
        </div>
        
        {/* WebGPU 지원 상태 */}
        <div className="flex items-center gap-2">
          {webgpuSupported === null ? (
            <span className="text-xs text-zinc-500">확인 중...</span>
          ) : webgpuSupported ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              WebGPU 지원
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-400">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
              WebGPU 미지원
            </span>
          )}
        </div>
      </div>

      {/* GPU 정보 */}
      {gpuInfo && (
        <div className="mb-4 px-3 py-2 bg-zinc-800/50 rounded-lg">
          <span className="text-xs text-zinc-400">{gpuInfo}</span>
        </div>
      )}

      {/* 컴포지터 모드 선택 */}
      <div className="mb-4">
        <label className="text-xs text-zinc-400 mb-2 block">컴포지터 모드</label>
        <div className="flex gap-2">
          {modeOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCompositorMode(option.value)}
              disabled={option.value === 'webgpu' && !webgpuSupported}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
                'border text-sm font-medium transition-all duration-200',
                option.value === 'webgpu' && !webgpuSupported
                  ? 'opacity-50 cursor-not-allowed bg-zinc-800/30 border-zinc-700/30'
                  : compositorMode === option.value
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* WebGPU 효과 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-zinc-400">포스트 프로세싱 효과</label>
          {hasAnyEffect && isWebGPUActive && (
            <span className="text-xs text-purple-400">{Object.values(webgpuEffects).filter(Boolean).length}개 활성</span>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {effectsConfig.map(({ key, icon, label }) => (
            <EffectToggle
              key={key}
              icon={icon}
              label={label}
              enabled={webgpuEffects[key]}
              onToggle={() => setWebGPUEffect(key, !webgpuEffects[key])}
              disabled={!isWebGPUActive}
            />
          ))}
        </div>

        {!isWebGPUActive && (
          <p className="mt-3 text-xs text-zinc-500">
            WebGPU 모드에서만 효과를 사용할 수 있습니다
          </p>
        )}
      </div>
    </motion.div>
  )
}
