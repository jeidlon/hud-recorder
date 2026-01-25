/**
 * 🎬 Remotion 렌더링 설정 패널
 * 
 * - 해상도 (1920x1080, 1280x720, 2560x1440, 3840x2160)
 * - FPS (30, 60)
 * - 이미지 포맷 (PNG, JPEG)
 * - 비디오 코덱 (H.264, H.265, VP8, VP9)
 */

import * as React from 'react'
import { motion } from 'framer-motion'
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore, type RemotionRenderSettings } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

// 프리셋 해상도
const RESOLUTION_PRESETS = [
  { label: 'HD (1280×720)', width: 1280, height: 720 },
  { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
  { label: 'QHD (2560×1440)', width: 2560, height: 1440 },
  { label: '4K (3840×2160)', width: 3840, height: 2160 },
] as const

// FPS 옵션
const FPS_OPTIONS = [24, 30, 60] as const

// 이미지 포맷
const IMAGE_FORMATS = [
  { label: 'PNG (무손실, 투명 지원)', value: 'png' },
  { label: 'JPEG (작은 파일, 빠름)', value: 'jpeg' },
] as const

// 비디오 코덱
const VIDEO_CODECS = [
  { label: 'H.264 (호환성 최고)', value: 'h264' },
  { label: 'H.265 (효율적 압축)', value: 'h265' },
  { label: 'VP8 (WebM)', value: 'vp8' },
  { label: 'VP9 (WebM, 효율적)', value: 'vp9' },
] as const

export const RenderSettingsPanel: React.FC = () => {
  const { remotionSettings, setRemotionSettings } = useAppStore()
  const [isExpanded, setIsExpanded] = React.useState(false)

  const handleResolutionChange = (width: number, height: number) => {
    setRemotionSettings({ width, height })
  }

  const handleFpsChange = (fps: number) => {
    setRemotionSettings({ fps })
  }

  const handleImageFormatChange = (imageFormat: RemotionRenderSettings['imageFormat']) => {
    setRemotionSettings({ imageFormat })
  }

  const handleCodecChange = (codec: RemotionRenderSettings['codec']) => {
    setRemotionSettings({ codec })
  }

  const handleQualityChange = (quality: number) => {
    setRemotionSettings({ quality })
  }

  // 현재 해상도 찾기
  const currentResolution = RESOLUTION_PRESETS.find(
    (r) => r.width === remotionSettings.width && r.height === remotionSettings.height
  ) || { label: `${remotionSettings.width}×${remotionSettings.height}`, width: remotionSettings.width, height: remotionSettings.height }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden"
    >
      {/* 헤더 - 토글 버튼 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'hover:bg-white/5 transition-colors',
        )}
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">렌더링 설정</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 현재 설정 요약 */}
          <span className="text-xs text-zinc-500">
            {currentResolution.label} • {remotionSettings.fps}fps • {remotionSettings.imageFormat.toUpperCase()}
          </span>
          
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>

      {/* 확장된 설정 패널 */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 py-4 space-y-4 border-t border-white/5">
          {/* 해상도 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">해상도</label>
            <div className="flex flex-wrap gap-2">
              {RESOLUTION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleResolutionChange(preset.width, preset.height)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    preset.width === remotionSettings.width && preset.height === remotionSettings.height
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700/50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">프레임 레이트</label>
            <div className="flex gap-2">
              {FPS_OPTIONS.map((fps) => (
                <button
                  key={fps}
                  onClick={() => handleFpsChange(fps)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                    fps === remotionSettings.fps
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700/50'
                  )}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>

          {/* 이미지 포맷 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">이미지 시퀀스 포맷</label>
            <div className="flex gap-2">
              {IMAGE_FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleImageFormatChange(format.value as RemotionRenderSettings['imageFormat'])}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    format.value === remotionSettings.imageFormat
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700/50'
                  )}
                >
                  {format.label}
                </button>
              ))}
            </div>
            
            {/* JPEG 품질 슬라이더 */}
            {remotionSettings.imageFormat === 'jpeg' && (
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-zinc-500">품질:</span>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={remotionSettings.quality}
                  onChange={(e) => handleQualityChange(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-400"
                />
                <span className="text-xs text-zinc-400 w-8">{remotionSettings.quality}%</span>
              </div>
            )}
          </div>

          {/* 비디오 코덱 */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-wide">비디오 코덱</label>
            <div className="flex flex-wrap gap-2">
              {VIDEO_CODECS.map((codec) => (
                <button
                  key={codec.value}
                  onClick={() => handleCodecChange(codec.value as RemotionRenderSettings['codec'])}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    codec.value === remotionSettings.codec
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-800/50 text-zinc-400 border border-white/5 hover:bg-zinc-700/50'
                  )}
                >
                  {codec.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default RenderSettingsPanel
