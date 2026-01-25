/**
 * 🎬 Export Panel - 우측 배치, Export 전용
 * 
 * [좌측: RecordControlPanel] ... [우측: ExportPanel]
 * 
 * 기능:
 * - PNG/MP4 Export 버튼
 * - Render Settings Modal 호출
 * - Render Status Log 표시
 */

import * as React from 'react'
import { useCallback, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Images, 
  Clapperboard, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { 
  checkRenderServer, 
  renderAndDownload, 
  type RenderFormat 
} from '@/core/RemotionRenderClient'
import { RenderSettingsModal } from './RenderSettingsModal'
import { cn } from '@/lib/utils'

// 렌더 로그 타입
interface RenderLog {
  id: string
  timestamp: Date
  type: 'info' | 'progress' | 'success' | 'error' | 'warning'
  message: string
}

export const ExportPanel: React.FC = () => {
  const { recordingSession, videoFile } = useAppStore()

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalFormat, setModalFormat] = useState<'png' | 'mp4'>('mp4')

  // 렌더링 상태
  const [pngProgress, setPngProgress] = useState(0)
  const [mp4Progress, setMp4Progress] = useState(0)
  const [isPngRendering, setIsPngRendering] = useState(false)
  const [isMp4Rendering, setIsMp4Rendering] = useState(false)
  const [renderServerAvailable, setRenderServerAvailable] = useState<boolean | null>(null)
  
  // 로그 상태
  const [logs, setLogs] = useState<RenderLog[]>([])
  const [isLogExpanded, setIsLogExpanded] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)
  
  // 렌더 서버 상태 확인
  useEffect(() => {
    const check = async () => {
      const ok = await checkRenderServer()
      setRenderServerAvailable(ok)
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [])
  
  // 로그 추가 함수
  const addLog = useCallback((type: RenderLog['type'], message: string) => {
    const log: RenderLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      message,
    }
    setLogs(prev => [...prev.slice(-100), log]) // 최근 100개만 유지
  }, [])
  
  // 로그 자동 스크롤
  useEffect(() => {
    if (isLogExpanded) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isLogExpanded])

  // Export 버튼 클릭 → 모달 열기
  const handleExportClick = useCallback((format: 'png' | 'mp4') => {
    setModalFormat(format)
    setIsModalOpen(true)
  }, [])

  // 렌더링 시작 (모달에서 호출)
  const handleStartRender = useCallback(async (format: RenderFormat) => {
    const { recordingSession, videoFile, getRemotionSettings } = useAppStore.getState()
    
    if (!recordingSession) {
      addLog('error', '녹화된 세션이 없습니다')
      return
    }
    
    if (format === 'mp4' && !videoFile) {
      addLog('error', 'MP4 렌더링에는 비디오 파일이 필요합니다')
      return
    }
    
    // 서버 상태 확인
    const serverOk = await checkRenderServer()
    if (!serverOk) {
      addLog('error', '⚠️ Remotion 렌더 서버 연결 실패. npm run dev 를 실행하세요.')
      return
    }
    
    const renderSettings = getRemotionSettings()
    addLog('info', `🎬 ${format.toUpperCase()} 렌더링 시작`)
    addLog('info', `📐 설정: ${renderSettings.width}×${renderSettings.height}, ${renderSettings.fps}fps`)
    
    // 상태 설정
    if (format === 'png') {
      setIsPngRendering(true)
      setPngProgress(0)
    } else {
      setIsMp4Rendering(true)
      setMp4Progress(0)
    }
    
    try {
      await renderAndDownload(
        {
          format,
          session: recordingSession,
          videoFile: videoFile || undefined,
          hudPresetId: 'hexa-tactical',
          scenario: 'idle',
          scale: 1,
          renderSettings,
        },
        (progress, status) => {
          if (format === 'png') {
            setPngProgress(progress)
          } else {
            setMp4Progress(progress)
          }
          // 🎬 진행률 로그 (5% 단위 + 시작/완료 시점)
          const shouldLog = 
            progress === 0 ||          // 시작
            progress >= 99 ||           // 완료 직전
            progress % 5 < 1            // 5% 단위
          
          if (shouldLog) {
            const progressBar = `[${'█'.repeat(Math.floor(progress / 5))}${'░'.repeat(20 - Math.floor(progress / 5))}]`
            addLog('progress', `${progressBar} ${progress}% - ${status}`)
          }
        }
      )
      addLog('success', `✅ ${format.toUpperCase()} 렌더링 완료! 다운로드가 시작됩니다.`)
    } catch (error: any) {
      addLog('error', `❌ 렌더링 실패: ${error.message}`)
    } finally {
      if (format === 'png') {
        setIsPngRendering(false)
      } else {
        setIsMp4Rendering(false)
      }
    }
  }, [addLog])

  // 로그 아이콘
  const LogIcon: React.FC<{ type: RenderLog['type'] }> = ({ type }) => {
    switch (type) {
      case 'error': return <XCircle className="w-3.5 h-3.5 text-red-400" />
      case 'success': return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
      case 'warning': return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
      case 'progress': return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
      default: return <Clock className="w-3.5 h-3.5 text-zinc-500" />
    }
  }

  const isRendering = isPngRendering || isMp4Rendering
  const hasSession = !!recordingSession

  return (
    <>
      {/* Export Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col gap-3 p-4',
          'bg-zinc-900/80 backdrop-blur-xl',
          'border border-white/10 rounded-xl'
        )}
      >
        {/* 상단: 서버 상태 + Export 버튼들 */}
        <div className="flex items-center gap-3">
          {/* 서버 상태 */}
          <div 
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              renderServerAvailable === true && 'bg-green-500/10 text-green-400 border border-green-500/20',
              renderServerAvailable === false && 'bg-red-500/10 text-red-400 border border-red-500/20',
              renderServerAvailable === null && 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            )}
          >
            <span 
              className={cn(
                'w-2 h-2 rounded-full',
                renderServerAvailable === true && 'bg-green-500',
                renderServerAvailable === false && 'bg-red-500',
                renderServerAvailable === null && 'bg-amber-500 animate-pulse'
              )}
            />
            {renderServerAvailable === true ? 'Server OK' : 
             renderServerAvailable === false ? 'Server OFF' : 'Checking...'}
          </div>

          <div className="flex-1" />

          {/* PNG Export 버튼 */}
          <motion.button
            onClick={() => isPngRendering ? null : handleExportClick('png')}
            disabled={!hasSession || isRendering}
            whileHover={{ scale: hasSession && !isRendering ? 1.02 : 1 }}
            whileTap={{ scale: hasSession && !isRendering ? 0.98 : 1 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5',
              'rounded-lg font-medium text-sm',
              'border transition-all',
              isPngRendering
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
              hasSession && !isRendering && 'hover:from-emerald-500/30 hover:to-teal-500/30',
              (!hasSession || (isRendering && !isPngRendering)) && 'opacity-40 cursor-not-allowed'
            )}
          >
            {isPngRendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pngProgress.toFixed(0)}%</span>
              </>
            ) : (
              <>
                <Images className="w-4 h-4" />
                <span>PNG Export</span>
              </>
            )}
          </motion.button>

          {/* MP4 Export 버튼 */}
          <motion.button
            onClick={() => isMp4Rendering ? null : handleExportClick('mp4')}
            disabled={!hasSession || isRendering || !videoFile}
            whileHover={{ scale: hasSession && !isRendering && videoFile ? 1.02 : 1 }}
            whileTap={{ scale: hasSession && !isRendering && videoFile ? 0.98 : 1 }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5',
              'rounded-lg font-medium text-sm',
              'border transition-all',
              isMp4Rendering
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 border-orange-500/30 text-orange-300',
              hasSession && !isRendering && videoFile && 'hover:from-orange-500/30 hover:to-pink-500/30',
              (!hasSession || (isRendering && !isMp4Rendering) || !videoFile) && 'opacity-40 cursor-not-allowed'
            )}
          >
            {isMp4Rendering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mp4Progress.toFixed(0)}%</span>
              </>
            ) : (
              <>
                <Clapperboard className="w-4 h-4" />
                <span>MP4 Export</span>
              </>
            )}
          </motion.button>
        </div>

        {/* 🖥️ 터미널 스타일 렌더 로그 패널 */}
        {logs.length > 0 && (
          <div className="border-t border-white/5 pt-3">
            {/* 터미널 헤더 */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setIsLogExpanded(!isLogExpanded)}
                className="flex items-center gap-2"
              >
                {/* 터미널 윈도우 버튼 스타일 */}
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-xs text-zinc-400 font-mono ml-2">
                  render.log ({logs.length})
                </span>
                {isLogExpanded ? (
                  <ChevronUp className="w-3 h-3 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                )}
              </button>
              <button
                onClick={() => setLogs([])}
                className="p-1.5 rounded hover:bg-white/5 transition-colors"
                title="로그 지우기"
              >
                <Trash2 className="w-3 h-3 text-zinc-600 hover:text-zinc-400" />
              </button>
            </div>

            {/* 터미널 본문 */}
            <AnimatePresence>
              {isLogExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div 
                    className={cn(
                      'max-h-48 overflow-y-auto',
                      'bg-black/90 rounded-lg border border-zinc-800',
                      'font-mono text-xs',
                      'p-3 space-y-0.5',
                      // 커스텀 스크롤바
                      'scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent'
                    )}
                  >
                    {logs.map((log, index) => (
                      <div 
                        key={log.id}
                        className="flex items-start gap-2 leading-relaxed"
                      >
                        {/* 타임스탬프 */}
                        <span className="text-zinc-600 flex-shrink-0 select-none">
                          [{log.timestamp.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit',
                            hour12: false
                          })}]
                        </span>
                        
                        {/* 상태 아이콘 */}
                        <span className="flex-shrink-0 w-4 text-center">
                          {log.type === 'error' && <span className="text-red-500">✖</span>}
                          {log.type === 'success' && <span className="text-green-500">✔</span>}
                          {log.type === 'warning' && <span className="text-amber-500">⚠</span>}
                          {log.type === 'progress' && <span className="text-cyan-500">◉</span>}
                          {log.type === 'info' && <span className="text-zinc-500">›</span>}
                        </span>
                        
                        {/* 메시지 */}
                        <span className={cn(
                          'flex-1',
                          log.type === 'error' && 'text-red-400',
                          log.type === 'success' && 'text-green-400',
                          log.type === 'warning' && 'text-amber-400',
                          log.type === 'progress' && 'text-cyan-400',
                          log.type === 'info' && 'text-zinc-300',
                        )}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    
                    {/* 커서 (렌더링 중일 때만) */}
                    {isRendering && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <span className="text-zinc-600">[--:--:--]</span>
                        <span className="w-4 text-center">_</span>
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-cyan-500"
                        >
                          ▌
                        </motion.span>
                      </div>
                    )}
                    
                    {/* 자동 스크롤용 ref */}
                    <div ref={logsEndRef} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Render Settings Modal */}
      <RenderSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStartRender={handleStartRender}
        format={modalFormat}
      />
    </>
  )
}

export default ExportPanel
