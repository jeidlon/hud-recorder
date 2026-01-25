/**
 * Remotion Export Panel
 * 
 * Remotion 렌더링 옵션을 표시하고 세션 데이터 내보내기를 제공하는 UI
 */

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'
import {
  RENDER_OPTIONS,
  generateRenderGuide,
  downloadSessionForRemotion,
  exportSessionAsRemotionProps,
  type RenderFormat,
} from '@/core/RemotionIntegration'

interface RemotionExportPanelProps {
  onClose?: () => void
}

export const RemotionExportPanel: React.FC<RemotionExportPanelProps> = ({ onClose }) => {
  const { recordingSession } = useAppStore()
  const [selectedFormat, setSelectedFormat] = useState<RenderFormat>('mp4')
  const [copied, setCopied] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const selectedOption = RENDER_OPTIONS.find(opt => opt.id === selectedFormat)

  const handleCopyCommand = useCallback(() => {
    if (!selectedOption) return
    navigator.clipboard.writeText(selectedOption.command)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [selectedOption])

  const handleExportProps = useCallback(() => {
    if (!recordingSession) {
      alert('녹화된 세션이 없습니다')
      return
    }
    downloadSessionForRemotion(recordingSession)
  }, [recordingSession])

  const handleCopyPropsJson = useCallback(() => {
    if (!recordingSession) return
    const json = exportSessionAsRemotionProps(recordingSession)
    navigator.clipboard.writeText(json)
    alert('Props JSON이 클립보드에 복사되었습니다')
  }, [recordingSession])

  const handleOpenStudio = useCallback(() => {
    window.open('http://localhost:3000', '_blank')
  }, [])

  if (!recordingSession) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>🎬 Remotion Export</h3>
          {onClose && (
            <button onClick={onClose} style={closeButtonStyle}>✕</button>
          )}
        </div>
        <div style={emptyStyle}>
          녹화된 세션이 없습니다.<br />
          먼저 HUD를 녹화하세요.
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {/* 헤더 */}
      <div style={headerStyle}>
        <h3 style={titleStyle}>🎬 Remotion Export</h3>
        {onClose && (
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        )}
      </div>

      {/* 세션 정보 */}
      <div style={sessionInfoStyle}>
        <span>Session: {recordingSession.id.slice(0, 8)}</span>
        <span>Duration: {(recordingSession.duration / 1000).toFixed(1)}s</span>
        <span>Frames: {Math.ceil(recordingSession.duration / 1000 * 30)}</span>
      </div>

      {/* 출력 포맷 선택 */}
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>출력 포맷</h4>
        <div style={optionsGridStyle}>
          {RENDER_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedFormat(option.id)}
              style={{
                ...optionButtonStyle,
                ...(selectedFormat === option.id ? optionButtonActiveStyle : {}),
              }}
            >
              <span style={optionIconStyle}>{option.icon}</span>
              <span style={optionLabelStyle}>{option.label}</span>
              <span style={optionDescStyle}>{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 명령어 표시 */}
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>렌더링 명령어</h4>
        <div style={commandBoxStyle}>
          <code style={commandCodeStyle}>{selectedOption?.command}</code>
          <button 
            onClick={handleCopyCommand}
            style={copyButtonStyle}
          >
            {copied ? '✓ 복사됨' : '📋 복사'}
          </button>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div style={actionsStyle}>
        <button onClick={handleOpenStudio} style={actionButtonStyle}>
          🎨 Remotion Studio 열기
        </button>
        <button onClick={handleExportProps} style={actionButtonStyle}>
          📦 Props JSON 다운로드
        </button>
        <button onClick={handleCopyPropsJson} style={actionButtonStyle}>
          📋 Props JSON 복사
        </button>
        <button 
          onClick={() => setShowGuide(!showGuide)} 
          style={actionButtonStyle}
        >
          📖 {showGuide ? '가이드 숨기기' : '전체 가이드 보기'}
        </button>
      </div>

      {/* 가이드 */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={guideContainerStyle}
          >
            <pre style={guideStyle}>
              {generateRenderGuide(recordingSession)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 경고 */}
      <div style={warningStyle}>
        ⚠️ Remotion Studio가 실행 중이어야 합니다:<br />
        <code style={inlineCodeStyle}>npm run remotion:studio</code>
      </div>
    </div>
  )
}

// 스타일
const containerStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  border: '1px solid rgba(255, 220, 100, 0.3)',
  borderRadius: 8,
  padding: 16,
  maxWidth: 500,
  fontFamily: "'Outfit', sans-serif",
  color: '#fff',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  color: 'rgba(255, 220, 100, 1)',
}

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: 18,
  cursor: 'pointer',
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#888',
  padding: 20,
}

const sessionInfoStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  fontSize: 12,
  color: '#888',
  marginBottom: 16,
  paddingBottom: 12,
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 16,
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: 12,
  color: '#888',
  textTransform: 'uppercase',
  letterSpacing: 1,
}

const optionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
}

const optionButtonStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  padding: '12px 8px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
  cursor: 'pointer',
  color: '#fff',
  transition: 'all 0.2s',
}

const optionButtonActiveStyle: React.CSSProperties = {
  background: 'rgba(255, 220, 100, 0.15)',
  borderColor: 'rgba(255, 220, 100, 0.5)',
}

const optionIconStyle: React.CSSProperties = {
  fontSize: 24,
}

const optionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textAlign: 'center',
}

const optionDescStyle: React.CSSProperties = {
  fontSize: 9,
  color: '#888',
  textAlign: 'center',
}

const commandBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 4,
  padding: 8,
}

const commandCodeStyle: React.CSSProperties = {
  flex: 1,
  fontSize: 12,
  fontFamily: 'monospace',
  color: 'rgba(255, 220, 100, 0.9)',
  wordBreak: 'break-all',
}

const copyButtonStyle: React.CSSProperties = {
  padding: '4px 8px',
  background: 'rgba(255, 220, 100, 0.2)',
  border: '1px solid rgba(255, 220, 100, 0.3)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 11,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const actionsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 8,
  marginBottom: 16,
}

const actionButtonStyle: React.CSSProperties = {
  padding: 8,
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 4,
  color: '#fff',
  fontSize: 11,
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const guideContainerStyle: React.CSSProperties = {
  overflow: 'hidden',
}

const guideStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'monospace',
  background: 'rgba(0, 0, 0, 0.5)',
  padding: 12,
  borderRadius: 4,
  whiteSpace: 'pre-wrap',
  maxHeight: 300,
  overflow: 'auto',
  color: '#ccc',
}

const warningStyle: React.CSSProperties = {
  fontSize: 11,
  color: 'rgba(255, 180, 100, 0.8)',
  padding: 8,
  background: 'rgba(255, 180, 100, 0.1)',
  borderRadius: 4,
  textAlign: 'center',
}

const inlineCodeStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  background: 'rgba(0, 0, 0, 0.3)',
  padding: '2px 6px',
  borderRadius: 3,
}

export default RemotionExportPanel
