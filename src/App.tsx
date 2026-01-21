import * as React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { Header } from '@/components/layout/Header'
import { StatusBar } from '@/components/layout/StatusBar'
import { VideoDropzone } from '@/components/video/VideoDropzone'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { HUDContainer } from '@/components/hud/HUDContainer'
import { HUDSelector, isInlineHUDUrl, getPresetIdFromInlineUrl } from '@/components/hud/HUDSelector'
import { getPresetById } from '@/presets'
import { ControlPanel, type ControlPanelHandle } from '@/components/controls/ControlPanel'
import { WebGPUSettings } from '@/components/controls/WebGPUSettings'
import { checkWebCodecsSupport } from '@/utils/checkSupport'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import type { HUDState } from '@/types/hud-protocol'

interface SupportDetails {
  videoDecoder: boolean
  videoEncoder: boolean
  h264Decode: boolean
  h264Encode: boolean
}

function App() {
  const {
    videoFile,
    videoMetadata,
    hudUrl,
    hudReady,
    isPlaying,
    isRecording,
    currentTime,
    recordingSession,
    setVideoFile,
    setVideoMetadata,
    setHudUrl,
    setHudReady,
    setIsPlaying,
    setCurrentTime,
  } = useAppStore()

  const [supported, setSupported] = React.useState<boolean | null>(null)
  const [supportDetails, setSupportDetails] = React.useState<SupportDetails | null>(null)

  // 비디오 + HUD 컨테이너 ref (녹화 대상)
  const containerRef = useRef<HTMLDivElement>(null)
  // ControlPanel ref (외부에서 녹화 종료 호출용)
  const controlPanelRef = useRef<ControlPanelHandle>(null)

  // HUD 상태 업데이트 콜백
  const hudStateCallbackRef = useRef<((state: HUDState) => void) | null>(null)

  // 내장 HUD 사용 여부
  const isInlineHUD = isInlineHUDUrl(hudUrl)
  
  // 현재 선택된 프리셋의 HUD 컴포넌트 가져오기
  const currentPresetId = getPresetIdFromInlineUrl(hudUrl)
  const currentPreset = currentPresetId ? getPresetById(currentPresetId) : null
  const InlineHUDComponent = currentPreset?.component || null

  useEffect(() => {
    checkWebCodecsSupport().then((result) => {
      setSupported(result.supported)
      setSupportDetails(result.details)
      if (!result.supported) {
        console.warn('WebCodecs 지원 상태:', result.details)
      }
    })
  }, [])

  // 내장 HUD 선택 시 즉시 ready
  useEffect(() => {
    if (isInlineHUD) {
      setHudReady(true)
    }
  }, [isInlineHUD, setHudReady])

  const handleFileSelect = (file: File) => {
    setVideoFile(file)
    if (!isInlineHUD) {
      setHudReady(false)
    }
  }

  const handleHUDStateUpdate = useCallback((state: HUDState) => {
    // 녹화 중일 때 콜백으로 전달
    if (hudStateCallbackRef.current) {
      hudStateCallbackRef.current(state)
    }
  }, [])

  const handleHUDReconnect = () => {
    if (isInlineHUD) return
    setHudReady(false)
    const currentUrl = hudUrl
    setHudUrl('')
    setTimeout(() => setHudUrl(currentUrl), 100)
  }

  const handleVideoMetadata = useCallback(
    (width: number, height: number, duration: number, fps: number) => {
      setVideoMetadata({
        width,
        height,
        duration,
        fps,
        frameCount: Math.ceil((duration / 1000) * fps),
      })
    },
    [setVideoMetadata]
  )

  // 로딩 상태
  if (supported === null) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex flex-col items-center gap-4 p-8',
              'bg-zinc-900/80 backdrop-blur-xl',
              'border border-white/10 rounded-2xl'
            )}
          >
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-zinc-300">브라우저 호환성 확인 중...</span>
          </motion.div>
        </div>
      </AppShell>
    )
  }

  // 미지원 상태
  if (!supported) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'max-w-md w-full p-8',
              'bg-zinc-900/80 backdrop-blur-xl',
              'border border-red-500/20 rounded-2xl'
            )}
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-xl font-semibold text-zinc-100">WebCodecs API 미지원</h2>
            </div>

            <p className="text-zinc-400 mb-6">
              이 브라우저는 WebCodecs API를 지원하지 않습니다. Chrome 94 이상 버전을 사용해주세요.
            </p>

            {supportDetails && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-300 mb-2">지원 상태:</div>
                {Object.entries(supportDetails).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-2 px-3 bg-zinc-800/50 rounded-lg"
                  >
                    <span className="text-sm text-zinc-400">{key}</span>
                    {value ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </AppShell>
    )
  }

  // 메인 UI
  return (
    <AppShell>
      <Header />

      <main className="p-6 space-y-6 pb-24">
        {/* HUD 선택기 */}
        <HUDSelector
          hudUrl={hudUrl}
          onUrlChange={setHudUrl}
          isConnected={hudReady}
          onReconnect={handleHUDReconnect}
        />

        {/* 파일 선택 영역 */}
        <AnimatePresence mode="wait">
          {!videoFile ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VideoDropzone onFileSelect={handleFileSelect} hasFile={false} />
            </motion.div>
          ) : (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* 파일 정보 & 변경 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-sm text-green-400 font-medium">{videoFile.name}</span>
                  </div>
                  {videoMetadata && (
                    <span className="text-sm text-zinc-500">
                      {videoMetadata.width}x{videoMetadata.height} • {videoMetadata.fps}fps
                    </span>
                  )}
                  {recordingSession && (
                    <span className="text-sm text-purple-400">• Recording ready</span>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setVideoFile(null)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium',
                    'bg-zinc-800/80 hover:bg-zinc-700/80',
                    'border border-white/10 rounded-lg',
                    'transition-colors duration-200'
                  )}
                >
                  Change Video
                </motion.button>
              </div>

              {/* 비디오 + HUD 컨테이너 */}
              <motion.div
                ref={containerRef}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  'relative overflow-hidden rounded-xl mx-auto',
                  'bg-black',
                  'border',
                  isRecording ? 'border-red-500/50' : 'border-white/10'
                )}
                style={{
                  width: videoMetadata?.width ? Math.min(videoMetadata.width, 1200) : '100%',
                  aspectRatio: videoMetadata
                    ? `${videoMetadata.width} / ${videoMetadata.height}`
                    : '16 / 9',
                }}
              >
                {/* 녹화 인디케이터 */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-lg"
                    >
                      <motion.span
                        className="w-2 h-2 bg-white rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <span className="text-xs font-medium text-white">REC</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 비디오 플레이어 (HTML5 <video>) */}
                <VideoPlayer
                  videoFile={videoFile}
                  isPlaying={isPlaying}
                  onPlayingChange={setIsPlaying}
                  onMetadata={handleVideoMetadata}
                  onTimeUpdate={setCurrentTime}
                  onVideoEnded={() => {
                    // 비디오 종료 시 녹화도 자동 종료
                    controlPanelRef.current?.stopRecordingIfActive()
                  }}
                />

                {/* HUD 오버레이 레이어 */}
                {videoMetadata && hudUrl && (
                  <div
                    className="absolute inset-0 pointer-events-auto"
                    style={{ zIndex: 10 }}
                  >
                    {isInlineHUD && InlineHUDComponent ? (
                      // 내장 HUD (프리셋 컴포넌트 동적 렌더링)
                      <InlineHUDComponent
                        width={videoMetadata.width}
                        height={videoMetadata.height}
                        isPlaying={isPlaying}
                        onStateUpdate={handleHUDStateUpdate}
                        onReady={() => setHudReady(true)}
                      />
                    ) : !isInlineHUD ? (
                      // 외부 HUD (iframe)
                      <HUDContainer
                        hudUrl={hudUrl}
                        width={videoMetadata.width}
                        height={videoMetadata.height}
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        onReady={() => setHudReady(true)}
                        onStateUpdate={handleHUDStateUpdate}
                        onError={(err) => console.error('HUD Error:', err)}
                      />
                    ) : null}
                  </div>
                )}
              </motion.div>

              {/* 컨트롤 패널 */}
              <ControlPanel
                ref={controlPanelRef}
                containerRef={containerRef}
                onHUDStateUpdate={(callback) => {
                  hudStateCallbackRef.current = callback
                }}
              />

              {/* WebGPU 렌더링 설정 */}
              <WebGPUSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 상태바 */}
      <div className="fixed bottom-0 left-0 right-0">
        <div className="max-w-6xl mx-auto">
          <StatusBar
            resolution={
              videoMetadata ? { width: videoMetadata.width, height: videoMetadata.height } : null
            }
            fps={videoMetadata?.fps || 30}
            currentTime={currentTime}
            duration={videoMetadata?.duration || 0}
            status={isRecording ? 'recording' : recordingSession ? 'ready' : 'idle'}
          />
        </div>
      </div>
    </AppShell>
  )
}

export default App
