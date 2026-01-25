/**
 * 🎬 RRWeb Export Button
 * 
 * rrweb 세션을 녹화하고 서버로 전송하여 PNG 시퀀스로 렌더링합니다.
 */

import React, { useState, useCallback } from 'react'
import { rrwebRecorder, RRWebSession } from '../../core/RRWebRecorder'

interface RRWebExportButtonProps {
  presetId?: string
  className?: string
}

export const RRWebExportButton: React.FC<RRWebExportButtonProps> = ({
  presetId,
  className,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [session, setSession] = useState<RRWebSession | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // 녹화 시작/중지
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      const recordedSession = rrwebRecorder.stopRecording()
      setSession(recordedSession)
      setIsRecording(false)
      console.log('[RRWebExport] Session recorded:', {
        events: recordedSession.events.length,
        duration: recordedSession.duration,
      })
    } else {
      rrwebRecorder.startRecording({ presetId })
      setIsRecording(true)
      setSession(null)
      setError(null)
    }
  }, [isRecording, presetId])

  // 세션 다운로드 (JSON)
  const downloadSession = useCallback(() => {
    if (session) {
      rrwebRecorder.downloadSession(session, `hud-session-${Date.now()}.json`)
    }
  }, [session])

  // 서버에서 PNG 시퀀스 렌더링
  const renderToFrames = useCallback(async () => {
    if (!session) return

    setIsRendering(true)
    setProgress(0)
    setError(null)

    try {
      const response = await fetch('http://localhost:3002/api/rrweb/render-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session,
          fps: 60,
          format: 'png',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Render failed')
      }

      // ZIP 다운로드
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rrweb-frames-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)

      setProgress(100)
      console.log('[RRWebExport] Frames downloaded')

    } catch (err) {
      console.error('[RRWebExport] Render error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRendering(false)
    }
  }, [session])

  return (
    <div className={className} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* 녹화 버튼 */}
      <button
        onClick={toggleRecording}
        disabled={isRendering}
        style={{
          padding: '10px 20px',
          background: isRecording ? '#ef4444' : '#8b5cf6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: isRendering ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: isRendering ? 0.6 : 1,
        }}
      >
        {isRecording ? (
          <>
            <span style={{ 
              width: 12, 
              height: 12, 
              background: '#fff', 
              borderRadius: 2,
            }} />
            RRWeb 녹화 중지
          </>
        ) : (
          <>
            <span style={{ 
              width: 12, 
              height: 12, 
              background: '#fff', 
              borderRadius: '50%',
            }} />
            RRWeb 녹화 시작
          </>
        )}
      </button>

      {/* 세션 정보 & 내보내기 */}
      {session && session.events.length > 0 && (
        <>
          <span style={{ 
            color: '#a1a1aa', 
            fontSize: 12,
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
          }}>
            {session.events.length} events | {(session.duration / 1000).toFixed(1)}s
          </span>

          {/* JSON 다운로드 */}
          <button
            onClick={downloadSession}
            style={{
              padding: '10px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            💾 JSON 저장
          </button>

          {/* PNG 렌더링 */}
          <button
            onClick={renderToFrames}
            disabled={isRendering}
            style={{
              padding: '10px 16px',
              background: isRendering ? '#6b7280' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: isRendering ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {isRendering ? `🔄 렌더링 중...` : '🎬 PNG 시퀀스 렌더'}
          </button>
        </>
      )}

      {/* 에러 표시 */}
      {error && (
        <span style={{ 
          color: '#ef4444', 
          fontSize: 12,
          padding: '4px 8px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 4,
        }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  )
}

export default RRWebExportButton
