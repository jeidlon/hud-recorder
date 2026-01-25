import * as React from 'react'
import { useRef, useCallback, useEffect, useState, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Square, Play, Crosshair, Pause, RotateCcw, Download, Film, Loader2, Images, Clapperboard, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { InputRecorder } from '@/core/InputRecorder'
import { RenderingPipeline } from '@/core/RenderingPipeline'
import { exportToMP4, downloadBlob } from '@/core/Exporter'
import { exportHUDToPNGSequence } from '@/core/HUDOnlyExporter'
import { 
  checkRenderServer, 
  renderAndDownload, 
  type RenderFormat as RemotionFormat 
} from '@/core/RemotionRenderClient'
import { cn } from '@/lib/utils'
import type { HUDState } from '@/types/hud-protocol'

// 글로벌 인코딩 결과 저장 (Phase 5에서 Muxer에서 사용)
declare global {
  interface Window {
    __encodedChunks?: {
      chunks: EncodedVideoChunk[]
      metadata: EncodedVideoChunkMetadata[]
    }
  }
}

interface ControlPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  onHUDStateUpdate?: (callback: (state: HUDState) => void) => void
}

export interface ControlPanelHandle {
  stopRecordingIfActive: () => void
}

type CountdownMode = 'record' | 'practice' | null

export const ControlPanel = React.forwardRef<ControlPanelHandle, ControlPanelProps>(
  ({ containerRef, onHUDStateUpdate }, ref) => {
    const {
      isPlaying,
      isRecording,
      recordingSession,
      isRendering,
      renderProgress,
      setIsPlaying,
      startRecording,
      stopRecording,
      videoFile,
    } = useAppStore()

    const recorderRef = useRef<InputRecorder | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [countdown, setCountdown] = useState<number | null>(null)
    const [countdownMode, setCountdownMode] = useState<CountdownMode>(null)
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)
    
    // Remotion 렌더링 상태 (포맷별 분리)
    const [pngProgress, setPngProgress] = useState(0)
    const [mp4Progress, setMp4Progress] = useState(0)
    const [isPngRendering, setIsPngRendering] = useState(false)
    const [isMp4Rendering, setIsMp4Rendering] = useState(false)
    const [renderServerAvailable, setRenderServerAvailable] = useState<boolean | null>(null)
    const [currentRenderJobId, setCurrentRenderJobId] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    // 녹화 시간 업데이트
    useEffect(() => {
      if (!isRecording) {
        setRecordingTime(0)
        return
      }

      const interval = setInterval(() => {
        if (recorderRef.current) {
          setRecordingTime(recorderRef.current.currentTime)
        }
      }, 100)

      return () => clearInterval(interval)
    }, [isRecording])

    // HUD 상태 업데이트 콜백 등록
    useEffect(() => {
      if (onHUDStateUpdate && recorderRef.current) {
        onHUDStateUpdate((state: HUDState) => {
          if (recorderRef.current?.recording) {
            recorderRef.current.addHUDState({
              timestamp: 0, // InputRecorder에서 재계산됨
              mouse: state.mouse,
              targets: state.targets,
              customData: state.customData,
            })
          }
        })
      }
    }, [onHUDStateUpdate, isRecording])

    // 카운트다운 클린업
    useEffect(() => {
      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
        }
      }
    }, [])
    
    // 렌더 서버 상태 체크
    useEffect(() => {
      const checkServer = async () => {
        const available = await checkRenderServer()
        setRenderServerAvailable(available)
      }
      checkServer()
      
      // 30초마다 체크
      const interval = setInterval(checkServer, 30000)
      return () => clearInterval(interval)
    }, [])

    // 카운트다운 취소
    const cancelCountdown = useCallback(() => {
      setCountdown(null)
      setCountdownMode(null)
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }, [])

    // 실제 녹화 시작
    const startActualRecording = useCallback(() => {
      if (!containerRef.current) return

      recorderRef.current = new InputRecorder()
      recorderRef.current.start(containerRef.current)
      startRecording()
      setIsPlaying(true) // 비디오 재생도 시작
    }, [containerRef, startRecording, setIsPlaying])

    // 녹화 종료 (내부 + 외부에서 호출 가능)
    const stopCurrentRecording = useCallback(() => {
      if (recorderRef.current) {
        const result = recorderRef.current.stop()
        // 🎬 animationEvents + hudEvents (Event Sourcing) 함께 저장
        stopRecording(
          result.inputLog, 
          result.hudStateLog, 
          result.duration, 
          result.animationEvents,
          result.hudEvents
        )
        recorderRef.current = null
      }
    }, [stopRecording])

    // 외부에서 녹화 종료 호출용
    useImperativeHandle(ref, () => ({
      stopRecordingIfActive: () => {
        if (recorderRef.current?.recording) {
          stopCurrentRecording()
        }
      },
    }), [stopCurrentRecording])

    // 3초 카운트다운 시작
    const startCountdown = useCallback((mode: CountdownMode, onComplete: () => void) => {
      setCountdown(3)
      setCountdownMode(mode)

      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            // 카운트다운 종료
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current)
              countdownTimerRef.current = null
            }
            setCountdownMode(null)
            // 다음 틱에서 실행
            setTimeout(onComplete, 0)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }, [])

    // Record 버튼 핸들러
    const handleRecord = useCallback(() => {
      if (!containerRef.current) return

      if (!isRecording) {
        if (countdown !== null) {
          // 카운트다운 중 취소
          cancelCountdown()
          return
        }

        // 3초 카운트다운 시작 → 녹화
        startCountdown('record', startActualRecording)
      } else {
        // 녹화 종료
        stopCurrentRecording()
      }
    }, [isRecording, countdown, containerRef, cancelCountdown, startCountdown, startActualRecording, stopCurrentRecording])

    // Practice 버튼 핸들러 (3초 후 재생만)
    const handlePractice = useCallback(() => {
      if (countdown !== null) {
        // 카운트다운 중 취소
        cancelCountdown()
        return
      }

      // 3초 카운트다운 시작 → 재생만
      startCountdown('practice', () => {
        setIsPlaying(true)
      })
    }, [countdown, cancelCountdown, startCountdown, setIsPlaying])

    // JSON Export (디버깅용)
    const handleExportJSON = useCallback(() => {
      if (!recordingSession) {
        return
      }

      const blob = new Blob([JSON.stringify(recordingSession, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recording-${recordingSession.id}.json`
      a.click()
      URL.revokeObjectURL(url)
    }, [recordingSession])

    // MP4 Export
    const handleExportMP4 = useCallback(async () => {
      const { videoMetadata, recordingSession, startRendering, setRenderProgress, finishRendering } =
        useAppStore.getState()

      // 렌더링된 청크 가져오기
      const encoded = window.__encodedChunks

      if (!encoded || !videoMetadata || !recordingSession) {
        alert('먼저 렌더링을 완료해주세요')
        return
      }

      try {
        startRendering()

        const blob = await exportToMP4(
          encoded.chunks,
          encoded.metadata,
          {
            width: videoMetadata.width,
            height: videoMetadata.height,
            fps: videoMetadata.fps,
          },
          (progress) => {
            setRenderProgress(progress)
          }
        )

        // 다운로드
        const filename = `hud-${recordingSession.id.slice(0, 8)}.mp4`
        downloadBlob(blob, filename)

        finishRendering()
        alert(`다운로드 완료: ${filename}`)
      } catch (error) {
        console.error('Export failed:', error)
        finishRendering()
        alert('Export 실패: ' + (error as Error).message)
      }
    }, [])

    // PNG 시퀀스 Export (HUD만 투명 배경)
    const handleExportPNGSequence = useCallback(async () => {
      const { recordingSession, startRendering, setRenderProgress, finishRendering } =
        useAppStore.getState()

      if (!recordingSession) {
        alert('녹화된 세션이 필요합니다')
        return
      }

      try {
        startRendering()

        await exportHUDToPNGSequence(recordingSession, {
          onProgress: (progress, current, total) => {
            setRenderProgress(progress)
            console.log(`PNG Export: ${current}/${total} (${progress.toFixed(1)}%)`)
          },
          onComplete: (blob) => {
            const filename = `hud-sequence-${recordingSession.id.slice(0, 8)}.zip`
            downloadBlob(blob, filename)
            finishRendering()
            alert(`PNG 시퀀스 다운로드 완료: ${filename}`)
          },
          onError: (error) => {
            console.error('PNG Export failed:', error)
            finishRendering()
            alert('PNG Export 실패: ' + error.message)
          },
        })
      } catch (error) {
        console.error('PNG Export failed:', error)
        finishRendering()
        alert('PNG Export 실패: ' + (error as Error).message)
      }
    }, [])

    // Remotion 렌더링 핸들러 (포맷별 상태 분리)
    const handleRemotionRender = useCallback(async (format: RemotionFormat = 'mp4') => {
      const { recordingSession, videoFile, getRemotionSettings } = useAppStore.getState()
      
      if (!recordingSession) {
        alert('녹화된 세션이 필요합니다')
        return
      }
      
      // MP4는 비디오 파일 필요
      if (format === 'mp4' && !videoFile) {
        alert('MP4 렌더링에는 비디오 파일이 필요합니다')
        return
      }
      
      // 서버 상태 재확인
      const serverOk = await checkRenderServer()
      if (!serverOk) {
        alert(
          '⚠️ Remotion 렌더 서버가 실행 중이 아닙니다!\n\n' +
          '터미널에서 다음 명령어를 실행하세요:\n' +
          'npm run dev:all\n\n' +
          '또는 별도 터미널에서:\n' +
          'npm run server:render'
        )
        return
      }
      
      // 🎬 렌더링 설정 가져오기
      const renderSettings = getRemotionSettings()
      
      // 포맷별 상태 설정
      if (format === 'png') {
        setIsPngRendering(true)
        setPngProgress(0)
      } else {
        setIsMp4Rendering(true)
        setMp4Progress(0)
      }
      
      // 취소용 AbortController 생성
      abortControllerRef.current = new AbortController()
      
      try {
        await renderAndDownload(
          {
            format,
            session: recordingSession,
            videoFile: videoFile || undefined,
            hudPresetId: 'hexa-tactical',
            scenario: 'idle',
            scale: 1,  // 🎬 scale은 이제 renderSettings에서 관리
            renderSettings,  // 🎬 렌더링 설정 전달
          },
          (progress, _status) => {
            if (format === 'png') {
              setPngProgress(progress)
            } else {
              setMp4Progress(progress)
            }
          }
        )
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Remotion render failed:', error)
          alert('Remotion 렌더링 실패: ' + error.message)
        }
      } finally {
        if (format === 'png') {
          setIsPngRendering(false)
        } else {
          setIsMp4Rendering(false)
        }
        abortControllerRef.current = null
      }
    }, [])
    
    // 렌더 취소 핸들러
    const handleCancelRender = useCallback(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setIsPngRendering(false)
      setIsMp4Rendering(false)
      setPngProgress(0)
      setMp4Progress(0)
      alert('렌더링이 취소되었습니다')
    }, [])
    
    const handleRender = useCallback(async () => {
      const { 
        recordingSession, 
        videoFile, 
        startRendering, 
        setRenderProgress, 
        finishRendering,
        getRenderingOptions,
      } = useAppStore.getState()

      if (!recordingSession || !videoFile) {
        alert('녹화된 세션과 비디오 파일이 필요합니다')
        return
      }

      startRendering()

      try {
        // WebGPU 렌더링 옵션 가져오기
        const renderingOptions = getRenderingOptions()
        console.log('[ControlPanel] Rendering with options:', renderingOptions)

        const pipeline = new RenderingPipeline(
          recordingSession, 
          videoFile, 
          {
            onProgress: (progress, current, total) => {
              setRenderProgress(progress)
              console.log(`Rendering: ${current}/${total} (${progress.toFixed(1)}%)`)
            },
            onComplete: (chunks, metadata) => {
              console.log('Rendering complete!', chunks.length, 'chunks')
              finishRendering()

              // Phase 5에서 Muxing 처리
              // 지금은 chunks를 전역에 저장
              window.__encodedChunks = { chunks, metadata }
              alert('렌더링 완료! Export 버튼으로 MP4를 다운로드하세요.')
            },
            onError: (error) => {
              console.error('Rendering error:', error)
              finishRendering()
              alert('렌더링 실패: ' + error.message)
            },
          },
          renderingOptions  // WebGPU 옵션 전달
        )

        await pipeline.start()
      } catch (error) {
        console.error('Rendering failed:', error)
        useAppStore.getState().finishRendering()
      }
    }, [])

    const formatTime = (ms: number) => {
      const s = Math.floor(ms / 1000)
      const m = Math.floor(s / 60)
      const sec = s % 60
      const msec = Math.floor((ms % 1000) / 10)
      return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${msec.toString().padStart(2, '0')}`
    }

    const isCountingDown = countdown !== null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 p-4',
          'bg-zinc-900/80 backdrop-blur-xl',
          'border border-white/10 rounded-xl'
        )}
      >
        {/* Record 버튼 */}
        <motion.button
          onClick={handleRecord}
          disabled={isRendering || (isCountingDown && countdownMode !== 'record')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative flex items-center gap-2 px-5 py-2.5',
            'rounded-lg font-medium text-sm',
            'border transition-all duration-200',
            isRecording
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : countdownMode === 'record'
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30',
            (isRendering || (isCountingDown && countdownMode !== 'record')) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {/* 녹화 인디케이터 */}
          <AnimatePresence>
            {isRecording && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              >
                <motion.span
                  className="absolute inset-0 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.5, 1], scale: [1, 1.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </motion.span>
            )}
          </AnimatePresence>

          {isRecording ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Stop</span>
            </>
          ) : countdownMode === 'record' ? (
            <>
              <motion.span
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-6 h-6 flex items-center justify-center text-lg font-bold"
              >
                {countdown}
              </motion.span>
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 fill-red-500 text-red-500" />
              <span>Record</span>
            </>
          )}
        </motion.button>

        {/* Practice 버튼 - 3초 후 재생 */}
        <motion.button
          onClick={handlePractice}
          disabled={isRecording || isRendering || isPlaying || (isCountingDown && countdownMode !== 'practice')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5',
            'rounded-lg font-medium text-sm',
            'border transition-all duration-200',
            countdownMode === 'practice'
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
              : 'bg-blue-500/20 border-blue-500/30 text-blue-300 hover:bg-blue-500/30',
            (isRecording || isRendering || isPlaying || (isCountingDown && countdownMode !== 'practice')) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {countdownMode === 'practice' ? (
            <>
              <motion.span
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-6 h-6 flex items-center justify-center text-lg font-bold"
              >
                {countdown}
              </motion.span>
              <span>Cancel</span>
            </>
          ) : (
            <>
              <Crosshair className="w-4 h-4" />
              <span>Practice</span>
            </>
          )}
        </motion.button>

        {/* 구분선 */}
        <div className="w-px h-8 bg-white/10" />

        {/* 재생 컨트롤 (아이콘만) */}
        <div className="flex items-center gap-1">
          {/* Play/Pause 버튼 */}
          <motion.button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={isRecording || isRendering || isCountingDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'p-2.5 rounded-lg',
              'border transition-all duration-200',
              isPlaying
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-zinc-700/50 border-white/10 text-zinc-300 hover:bg-zinc-600/50',
              (isRecording || isRendering || isCountingDown) && 'opacity-50 cursor-not-allowed'
            )}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </motion.button>

          {/* Stop (처음으로) 버튼 */}
          <motion.button
            onClick={() => {
              setIsPlaying(false)
              // 비디오를 처음으로 되돌림
              const video = document.querySelector('video')
              if (video) {
                video.currentTime = 0
              }
            }}
            disabled={isRecording || isRendering || isCountingDown}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'p-2.5 rounded-lg',
              'border transition-all duration-200',
              'bg-zinc-700/50 border-white/10 text-zinc-300 hover:bg-zinc-600/50',
              (isRecording || isRendering || isCountingDown) && 'opacity-50 cursor-not-allowed'
            )}
            title="처음으로"
          >
            <RotateCcw className="w-5 h-5" />
          </motion.button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-8 bg-white/10" />
        
        {/* Remotion PNG 시퀀스 버튼 */}
        <motion.button
          onClick={() => isPngRendering ? handleCancelRender() : handleRemotionRender('png')}
          disabled={!recordingSession || isRendering || isMp4Rendering}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5',
            'rounded-lg font-medium text-sm',
            isPngRendering 
              ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-500/40 text-red-300'
              : 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:from-emerald-500/40 hover:to-teal-500/40',
            'transition-all duration-200',
            (!recordingSession || isRendering || isMp4Rendering) && 'opacity-50 cursor-not-allowed'
          )}
          title={isPngRendering ? "클릭하여 취소" : "Remotion 고품질 PNG 시퀀스 (투명 배경)"}
        >
          {/* 서버 상태 인디케이터 */}
          <span 
            className={cn(
              'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-zinc-800',
              renderServerAvailable === true && 'bg-green-500',
              renderServerAvailable === false && 'bg-red-500',
              renderServerAvailable === null && 'bg-yellow-500 animate-pulse'
            )}
          />
          
          {isPngRendering ? (
            <>
              <X className="w-4 h-4" />
              <span>{pngProgress.toFixed(0)}%</span>
            </>
          ) : (
            <>
              <Images className="w-4 h-4" />
              <span>PNG</span>
            </>
          )}
        </motion.button>
        
        {/* Remotion MP4 버튼 (비디오 + HUD 합성) */}
        <motion.button
          onClick={() => isMp4Rendering ? handleCancelRender() : handleRemotionRender('mp4')}
          disabled={!recordingSession || isRendering || isPngRendering || !videoFile}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2.5',
            'rounded-lg font-medium text-sm',
            isMp4Rendering
              ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-500/40 text-red-300'
              : 'bg-gradient-to-r from-orange-500/30 to-pink-500/30 border border-orange-500/40 text-orange-300 hover:from-orange-500/40 hover:to-pink-500/40',
            'transition-all duration-200',
            (!recordingSession || isRendering || isPngRendering || !videoFile) && 'opacity-50 cursor-not-allowed'
          )}
          title={isMp4Rendering ? "클릭하여 취소" : (videoFile ? "Remotion 고품질 MP4 (비디오 + HUD 합성)" : "비디오 파일이 필요합니다")}
        >
          {/* 서버 상태 인디케이터 */}
          <span 
            className={cn(
              'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-zinc-800',
              renderServerAvailable === true && 'bg-green-500',
              renderServerAvailable === false && 'bg-red-500',
              renderServerAvailable === null && 'bg-yellow-500 animate-pulse'
            )}
          />
          
          {isMp4Rendering ? (
            <>
              <X className="w-4 h-4" />
              <span>{mp4Progress.toFixed(0)}%</span>
            </>
          ) : (
            <>
              <Clapperboard className="w-4 h-4" />
              <span>MP4</span>
            </>
          )}
        </motion.button>
        
        {/* Export JSON 버튼 (디버깅용, 작은 버튼) */}
        <motion.button
          onClick={handleExportJSON}
          disabled={!recordingSession || isRendering}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2',
            'rounded-lg font-medium text-xs',
            'bg-zinc-800/80 border border-white/10',
            'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/80',
            'transition-all duration-200',
            (!recordingSession || isRendering) && 'opacity-50 cursor-not-allowed'
          )}
          title="Export recording session as JSON (for debugging)"
        >
          <span>JSON</span>
        </motion.button>

        {/* 상태 표시 */}
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          {/* 카운트다운 표시 */}
          <AnimatePresence>
            {isCountingDown && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <motion.span
                  className="w-2 h-2 bg-amber-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <span className="text-sm text-amber-300">
                  {countdownMode === 'record' ? '녹화' : '재생'} 시작까지 {countdown}초...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 녹화 시간 */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="font-mono text-sm tabular-nums text-red-300">
                  {formatTime(recordingTime)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remotion 렌더링 상태 */}
          <AnimatePresence>
            {(isPngRendering || isMp4Rendering) && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg"
              >
                <Loader2 className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                <span className="text-sm text-orange-300">
                  {isPngRendering ? `PNG ${pngProgress.toFixed(0)}%` : `MP4 ${mp4Progress.toFixed(0)}%`}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 녹화 완료 상태 */}
          {recordingSession && !isRecording && !isRendering && !isPngRendering && !isMp4Rendering && !isCountingDown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm text-green-400">
                {recordingSession.inputLog.length.toLocaleString()} events
              </span>
              <span className="text-xs text-zinc-500">
                ({formatTime(recordingSession.duration)})
              </span>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }
)

ControlPanel.displayName = 'ControlPanel'
