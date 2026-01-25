/**
 * 🎬 Render Settings Modal
 * 
 * Export 버튼 클릭 시 표시되는 렌더링 설정 모달
 * Remotion Studio 우측 사이드바 설정을 웹앱에 맞게 포팅
 * 
 * 설정 항목:
 * - 해상도 (Resolution)
 * - 프레임 레이트 (FPS)
 * - 코덱 (Codec)
 * - CRF (품질)
 * - 이미지 포맷 (PNG/JPEG)
 * - 스케일 (Scale)
 */

import * as React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Play, 
  Monitor,
  Film,
  Settings,
  Zap,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react'
import { useAppStore, type RemotionRenderSettings } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

// 해상도 프리셋
const RESOLUTION_PRESETS = [
  { label: 'HD (720p)', width: 1280, height: 720, desc: '빠른 렌더링' },
  { label: 'Full HD (1080p)', width: 1920, height: 1080, desc: '권장' },
  { label: 'QHD (1440p)', width: 2560, height: 1440, desc: '고품질' },
  { label: '4K (2160p)', width: 3840, height: 2160, desc: '최고 품질' },
] as const

// FPS 옵션
const FPS_OPTIONS = [
  { value: 24, label: '24 FPS', desc: '영화감' },
  { value: 30, label: '30 FPS', desc: '표준' },
  { value: 60, label: '60 FPS', desc: '부드러움' },
] as const

// 비디오 코덱
const VIDEO_CODECS = [
  { value: 'h264', label: 'H.264', desc: '호환성 최고, 대부분 플레이어 지원' },
  { value: 'h265', label: 'H.265 (HEVC)', desc: '50% 작은 용량, 신형 기기만' },
  { value: 'vp9', label: 'VP9 (WebM)', desc: '웹 최적화, 투명 지원' },
] as const

// CRF (품질) - 낮을수록 품질 높음
const CRF_PRESETS = [
  { value: 1, label: '무손실', desc: 'CRF 1, 매우 큰 용량' },
  { value: 15, label: '최고 품질', desc: 'CRF 15, 권장' },
  { value: 23, label: '균형', desc: 'CRF 23, 품질/용량 균형' },
  { value: 30, label: '빠른 렌더링', desc: 'CRF 30, 작은 용량' },
] as const

// 이미지 포맷
const IMAGE_FORMATS = [
  { value: 'png', label: 'PNG', desc: '무손실, 투명 지원' },
  { value: 'jpeg', label: 'JPEG', desc: '작은 용량, 빠름' },
] as const

// 스케일 옵션
const SCALE_OPTIONS = [
  { value: 1, label: '1x', desc: '원본 크기' },
  { value: 2, label: '2x', desc: '2배 크기 (렌더링 후 축소)' },
] as const

interface RenderSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onStartRender: (format: 'png' | 'mp4') => void
  format: 'png' | 'mp4'
}

export const RenderSettingsModal: React.FC<RenderSettingsModalProps> = ({
  isOpen,
  onClose,
  onStartRender,
  format,
}) => {
  const { remotionSettings, setRemotionSettings, recordingSession, videoFile } = useAppStore()

  // CRF와 Scale을 store에서 직접 사용
  const handleCrfChange = (crf: number) => setRemotionSettings({ crf })
  const handleScaleChange = (scale: number) => setRemotionSettings({ scale })

  // 현재 해상도 찾기
  const currentResolution = RESOLUTION_PRESETS.find(
    r => r.width === remotionSettings.width && r.height === remotionSettings.height
  )

  // 렌더링 시작
  const handleStartRender = useCallback(() => {
    // scale과 crf는 별도로 store에 저장하거나 직접 전달
    onStartRender(format)
    onClose()
  }, [format, onStartRender, onClose])

  // 예상 파일 크기 계산 (대략적)
  const estimatedSize = React.useMemo(() => {
    if (!recordingSession) return '?'
    const durationSec = recordingSession.duration / 1000
    const pixels = remotionSettings.width * remotionSettings.height
    const bitsPerPixel = format === 'mp4' 
      ? (50 - remotionSettings.crf) * 0.1  // CRF 기반 대략적 계산
      : (remotionSettings.imageFormat === 'png' ? 24 : 8)
    const totalBits = pixels * remotionSettings.fps * durationSec * bitsPerPixel
    const mb = totalBits / 8 / 1024 / 1024
    return mb < 1 ? `~${(mb * 1024).toFixed(0)} KB` : `~${mb.toFixed(0)} MB`
  }, [recordingSession, remotionSettings, format])

  // 예상 렌더링 시간 (대략적)
  const estimatedTime = React.useMemo(() => {
    if (!recordingSession) return '?'
    const frames = Math.ceil((recordingSession.duration / 1000) * remotionSettings.fps)
    const secsPerFrame = 0.1 * remotionSettings.scale // 대략적
    const totalSec = frames * secsPerFrame
    if (totalSec < 60) return `~${Math.ceil(totalSec)}초`
    return `~${Math.ceil(totalSec / 60)}분`
  }, [recordingSession, remotionSettings.fps, remotionSettings.scale])

  // 유효성 검사
  const canRender = React.useMemo(() => {
    if (!recordingSession) return { valid: false, message: '녹화된 세션이 없습니다' }
    if (format === 'mp4' && !videoFile) return { valid: false, message: 'MP4 렌더링에는 비디오 파일이 필요합니다' }
    return { valid: true, message: '' }
  }, [recordingSession, videoFile, format])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-[560px] max-h-[85vh] overflow-y-auto',
              'bg-zinc-900 border border-white/10 rounded-2xl',
              'shadow-2xl shadow-black/50'
            )}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  format === 'png' 
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-orange-500/20 text-orange-400'
                )}>
                  {format === 'png' ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {format === 'png' ? 'PNG 시퀀스 Export' : 'MP4 비디오 Export'}
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Remotion 렌더링 설정
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* 설정 본문 */}
            <div className="p-6 space-y-6">
              {/* 해상도 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-zinc-400" />
                  <label className="text-sm font-medium text-zinc-300">해상도</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {RESOLUTION_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setRemotionSettings({ width: preset.width, height: preset.height })}
                      className={cn(
                        'flex flex-col items-start p-3 rounded-lg border transition-all',
                        preset.width === remotionSettings.width && preset.height === remotionSettings.height
                          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-700/50'
                      )}
                    >
                      <span className="text-sm font-medium">{preset.label}</span>
                      <span className="text-xs opacity-60">{preset.width}×{preset.height} • {preset.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-400" />
                  <label className="text-sm font-medium text-zinc-300">프레임 레이트</label>
                </div>
                <div className="flex gap-2">
                  {FPS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setRemotionSettings({ fps: option.value })}
                      className={cn(
                        'flex-1 flex flex-col items-center p-3 rounded-lg border transition-all',
                        option.value === remotionSettings.fps
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-700/50'
                      )}
                    >
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs opacity-60">{option.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 비디오 코덱 (MP4만) */}
              {format === 'mp4' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-zinc-400" />
                    <label className="text-sm font-medium text-zinc-300">비디오 코덱</label>
                  </div>
                  <div className="space-y-2">
                    {VIDEO_CODECS.map(codec => (
                      <button
                        key={codec.value}
                        onClick={() => setRemotionSettings({ codec: codec.value as 'h264' | 'h265' | 'vp9' })}
                        className={cn(
                          'w-full flex items-center justify-between p-3 rounded-lg border transition-all',
                          codec.value === remotionSettings.codec
                            ? 'bg-purple-500/10 border-purple-500/30'
                            : 'bg-zinc-800/50 border-white/5 hover:bg-zinc-700/50'
                        )}
                      >
                        <div className="flex flex-col items-start">
                          <span className={cn(
                            'text-sm font-medium',
                            codec.value === remotionSettings.codec ? 'text-purple-300' : 'text-zinc-300'
                          )}>
                            {codec.label}
                          </span>
                          <span className="text-xs text-zinc-500">{codec.desc}</span>
                        </div>
                        {codec.value === remotionSettings.codec && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CRF 품질 (MP4만) */}
              {format === 'mp4' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-zinc-400" />
                      <label className="text-sm font-medium text-zinc-300">품질 (CRF)</label>
                    </div>
                    <span className="text-sm text-zinc-400">CRF {remotionSettings.crf}</span>
                  </div>
                  <div className="flex gap-2">
                    {CRF_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => handleCrfChange(preset.value)}
                        className={cn(
                          'flex-1 flex flex-col items-center p-2 rounded-lg border transition-all',
                          preset.value === remotionSettings.crf
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-700/50'
                        )}
                      >
                        <span className="text-xs font-medium">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 이미지 포맷 (PNG만) */}
              {format === 'png' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                    <label className="text-sm font-medium text-zinc-300">이미지 포맷</label>
                  </div>
                  <div className="flex gap-2">
                    {IMAGE_FORMATS.map(fmt => (
                      <button
                        key={fmt.value}
                        onClick={() => setRemotionSettings({ imageFormat: fmt.value as 'png' | 'jpeg' })}
                        className={cn(
                          'flex-1 flex flex-col items-center p-3 rounded-lg border transition-all',
                          fmt.value === remotionSettings.imageFormat
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                            : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:bg-zinc-700/50'
                        )}
                      >
                        <span className="text-sm font-medium">{fmt.label}</span>
                        <span className="text-xs opacity-60">{fmt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 예상 정보 */}
              <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-white/5">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500">예상 파일 크기</div>
                  <div className="text-sm font-medium text-zinc-300">{estimatedSize}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500">예상 렌더링 시간</div>
                  <div className="text-sm font-medium text-zinc-300">{estimatedTime}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500">총 프레임</div>
                  <div className="text-sm font-medium text-zinc-300">
                    {recordingSession 
                      ? Math.ceil((recordingSession.duration / 1000) * remotionSettings.fps)
                      : '?'
                    }
                  </div>
                </div>
              </div>

              {/* 경고 메시지 */}
              {!canRender.valid && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-300">{canRender.message}</span>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button
                onClick={onClose}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium',
                  'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                  'transition-colors'
                )}
              >
                취소
              </button>
              <button
                onClick={handleStartRender}
                disabled={!canRender.valid}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium',
                  'transition-all',
                  canRender.valid
                    ? format === 'png'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                )}
              >
                <Play className="w-4 h-4" />
                렌더링 시작
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default RenderSettingsModal
