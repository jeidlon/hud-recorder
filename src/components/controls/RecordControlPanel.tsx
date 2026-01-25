/**
 * 📹 Record Control Panel - Record/Play 컨트롤만 담당
 * 
 * Export 관련 기능은 ExportPanel로 분리됨
 */

import * as React from 'react'
import { useRef, useCallback, useEffect, useState, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Circle, Square, Play, Crosshair, Pause, RotateCcw, Download } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { InputRecorder } from '@/core/InputRecorder'
import { cn } from '@/lib/utils'
import type { HUDState } from '@/types/hud-protocol'

interface RecordControlPanelProps {
  containerRef: React.RefObject<HTMLDivElement | null>
  onHUDStateUpdate?: (callback: (state: HUDState) => void) => void
}

export interface RecordControlPanelHandle {
  stopRecordingIfActive: () => void
}

type CountdownMode = 'record' | 'practice' | null

export const RecordControlPanel = React.forwardRef<RecordControlPanelHandle, RecordControlPanelProps>(
  ({ containerRef, onHUDStateUpdate }, ref) => {
    const {
      isPlaying,
      isRecording,
      recordingSession,
      isRendering,
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
              timestamp: 0,
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
          clearTimeout(countdownTimerRef.current)
        }
      }
    }, [])

    // 외부에서 녹화 종료 호출
    useImperativeHandle(ref, () => ({
      stopRecordingIfActive: () => {
        if (isRecording && recorderRef.current) {
          const result = recorderRef.current.stop()
          stopRecording(
            result.inputLog,
            result.hudStateLog,
            result.duration,
            result.animationEvents,
            result.hudEvents
          )
        }
      },
    }), [isRecording, stopRecording])

    // 녹화 시작/종료
    const handleRecord = useCallback(() => {
      // 카운트다운 취소
      if (countdownMode === 'record' && countdown !== null) {
        setCountdown(null)
        setCountdownMode(null)
        if (countdownTimerRef.current) {
          clearTimeout(countdownTimerRef.current)
        }
        return
      }

      if (isRecording) {
        // 녹화 중이면 종료
        if (recorderRef.current) {
          const result = recorderRef.current.stop()
          stopRecording(
            result.inputLog,
            result.hudStateLog,
            result.duration,
            result.animationEvents,
            result.hudEvents
          )
        }
      } else {
        // 카운트다운 시작
        setCountdownMode('record')
        setCountdown(3)
        
        const startRecordingWithCountdown = (count: number) => {
          if (count > 0) {
            countdownTimerRef.current = setTimeout(() => {
              setCountdown(count - 1)
              startRecordingWithCountdown(count - 1)
            }, 1000)
          } else {
            setCountdown(null)
            setCountdownMode(null)
            
            // 실제 녹화 시작
            if (!containerRef.current) return
            recorderRef.current = new InputRecorder()
            recorderRef.current.start(containerRef.current)
            startRecording()
            setIsPlaying(true)
          }
        }
        
        startRecordingWithCountdown(3)
      }
    }, [isRecording, countdown, countdownMode, containerRef, startRecording, stopRecording, setIsPlaying])

    // Practice 모드 (카운트다운 후 재생만)
    const handlePractice = useCallback(() => {
      if (countdownMode === 'practice' && countdown !== null) {
        setCountdown(null)
        setCountdownMode(null)
        if (countdownTimerRef.current) {
          clearTimeout(countdownTimerRef.current)
        }
        return
      }

      setCountdownMode('practice')
      setCountdown(3)
      
      const startPracticeWithCountdown = (count: number) => {
        if (count > 0) {
          countdownTimerRef.current = setTimeout(() => {
            setCountdown(count - 1)
            startPracticeWithCountdown(count - 1)
          }, 1000)
        } else {
          setCountdown(null)
          setCountdownMode(null)
          setIsPlaying(true)
        }
      }
      
      startPracticeWithCountdown(3)
    }, [countdown, countdownMode, setIsPlaying])

    // JSON Export
    const handleExportJSON = useCallback(() => {
      const { recordingSession } = useAppStore.getState()
      if (!recordingSession) return

      const json = JSON.stringify(recordingSession, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `recording-${recordingSession.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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

        {/* Practice 버튼 */}
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

        {/* 재생 컨트롤 */}
        <div className="flex items-center gap-1">
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
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </motion.button>

          <motion.button
            onClick={() => {
              setIsPlaying(false)
              const video = document.querySelector('video')
              if (video) video.currentTime = 0
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

        {/* JSON Export (디버깅용) */}
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
          title="Export JSON (디버깅용)"
        >
          <Download className="w-3.5 h-3.5" />
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

          {/* 녹화 완료 상태 */}
          {recordingSession && !isRecording && !isRendering && !isCountingDown && (
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

RecordControlPanel.displayName = 'RecordControlPanel'

export default RecordControlPanel
