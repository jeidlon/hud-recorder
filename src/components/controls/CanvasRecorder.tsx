/**
 * 🎬 Canvas Recorder - 고품질 실시간 녹화
 * 
 * 원리: 미리보기를 그대로 캡처 (화면 녹화 방식)
 * - MediaRecorder API 사용
 * - WebM 출력 (VP9 코덱)
 * - 60fps 지원
 */

import React, { useRef, useState, useCallback } from 'react'

interface CanvasRecorderProps {
  /** 녹화 대상 요소의 ref */
  targetRef: React.RefObject<HTMLElement>
  /** 녹화 완료 콜백 */
  onRecordingComplete?: (blob: Blob) => void
  /** 품질 (0.0 ~ 1.0) */
  quality?: number
  /** FPS */
  fps?: number
}

export const useCanvasRecorder = (options: {
  quality?: number
  fps?: number
} = {}) => {
  const { quality = 0.95, fps = 60 } = options
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)

  const startRecording = useCallback(async (targetElement: HTMLElement) => {
    try {
      // @ts-ignore - captureStream은 실험적 API
      const stream = targetElement.captureStream?.(fps) as MediaStream
      
      if (!stream) {
        // fallback: getDisplayMedia 사용
        console.warn('[CanvasRecorder] captureStream not supported, using getDisplayMedia')
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: fps,
            width: 1920,
            height: 1080,
          },
          audio: false,
        })
        
        const recorder = new MediaRecorder(displayStream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 20_000_000, // 20Mbps 고화질
        })
        
        chunksRef.current = []
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data)
          }
        }
        
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' })
          setRecordedBlob(blob)
          displayStream.getTracks().forEach(t => t.stop())
        }
        
        mediaRecorderRef.current = recorder
        recorder.start(100)
        setIsRecording(true)
        return
      }
      
      // captureStream 사용 가능한 경우
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'
      
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 20_000_000, // 20Mbps
      })
      
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setRecordedBlob(blob)
      }
      
      mediaRecorderRef.current = recorder
      recorder.start(100) // 100ms 간격으로 청크 수집
      setIsRecording(true)
      
      console.log('[CanvasRecorder] Recording started', { mimeType, fps })
    } catch (error) {
      console.error('[CanvasRecorder] Failed to start recording:', error)
      throw error
    }
  }, [fps])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  const downloadRecording = useCallback((filename = 'hud-recording.webm') => {
    if (!recordedBlob) return
    
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [recordedBlob])

  return {
    isRecording,
    recordedBlob,
    startRecording,
    stopRecording,
    downloadRecording,
  }
}

/**
 * 🎬 HUD 실시간 녹화 버튼 컴포넌트
 */
export const RecordButton: React.FC<{
  hudContainerRef: React.RefObject<HTMLElement>
  className?: string
}> = ({ hudContainerRef, className }) => {
  const { isRecording, recordedBlob, startRecording, stopRecording, downloadRecording } = useCanvasRecorder({ fps: 60 })

  const handleClick = async () => {
    if (isRecording) {
      stopRecording()
    } else if (hudContainerRef.current) {
      await startRecording(hudContainerRef.current)
    }
  }

  return (
    <div className={className} style={{ display: 'flex', gap: 8 }}>
      <button
        onClick={handleClick}
        style={{
          padding: '8px 16px',
          background: isRecording ? '#ef4444' : '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        {isRecording ? '⏹ 녹화 중지' : '🔴 실시간 녹화'}
      </button>
      
      {recordedBlob && (
        <button
          onClick={() => downloadRecording()}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          💾 다운로드 ({(recordedBlob.size / 1024 / 1024).toFixed(1)}MB)
        </button>
      )}
    </div>
  )
}

export default RecordButton
