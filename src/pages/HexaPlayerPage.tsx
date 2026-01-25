/**
 * HexaTactical OS 98 - 미리보기 플레이어 페이지
 * 
 * 🎬 이 페이지는 다른 사람에게 공유할 수 있습니다:
 * 1. Vercel 배포: vercel deploy
 * 2. Git 공유: git clone + npm install + npm run dev
 * 
 * 📌 URL: http://localhost:5173/#/player
 * 
 * 🎮 사용법:
 * - 키보드 1: 온보딩 시작
 * - 키보드 M: 몬스터 모드 토글
 * - 키보드 F/G: Fire 효과
 * - 마우스 클릭: 타겟팅 (몬스터 모드)
 */

import * as React from 'react'
import { useState, useCallback, useEffect } from 'react'
import { HexaTacticalHUD, ImagePathProvider } from '../presets/hexaTactical'

// 사용 가능한 시나리오
const SCENARIOS = [
  { id: 'idle', name: '기본 HUD', description: '일반 상태' },
  { id: 'onboarding', name: '온보딩', description: '시스템 부팅 시퀀스' },
  { id: 'monster', name: '몬스터 모드', description: '전투 상태' },
] as const

type ScenarioId = typeof SCENARIOS[number]['id']

export const HexaPlayerPage: React.FC = () => {
  const [scenario, setScenario] = useState<ScenarioId>('idle')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // 풀스크린 토글
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])
  
  // 풀스크린 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen])
  
  // 이미지 경로
  const imagePaths = React.useMemo(() => ({
    jihoon: '/jihoon_profile_1.png',
    soyeong: '/soyeong_pr_1.png',
    minjun: '/minjun_pr_1.png',
    fireSeq: '/fire-seq',
  }), [])
  
  return (
    <div 
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        color: '#E8E4D9',
        fontFamily: "'Noto Sans KR', 'Segoe UI', sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 헤더 */}
      {!isFullscreen && (
        <header style={{
          padding: '20px 40px',
          borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: 24, 
              color: '#FFD700',
              fontFamily: "'DungGeunMo', monospace",
            }}>
              HEXA-TACTICAL OS 98
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.7 }}>
              실시간 HUD 미리보기 - 마우스와 키보드로 인터랙션하세요
            </p>
          </div>
          
          {/* 시나리오 선택 */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => setScenario(s.id)}
                style={{
                  padding: '10px 20px',
                  background: scenario === s.id 
                    ? 'linear-gradient(180deg, #FFD700 0%, #D4A800 100%)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  color: scenario === s.id ? '#000' : '#FFD700',
                  border: `1px solid ${scenario === s.id ? '#FFD700' : 'rgba(255, 215, 0, 0.3)'}`,
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: scenario === s.id ? 600 : 400,
                  transition: 'all 0.2s',
                }}
                title={s.description}
              >
                {s.name}
              </button>
            ))}
            
            {/* 풀스크린 버튼 */}
            <button
              onClick={toggleFullscreen}
              style={{
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFD700',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
              }}
              title="풀스크린 (F)"
            >
              ⛶ 풀스크린
            </button>
          </div>
        </header>
      )}
      
      {/* HUD 미리보기 영역 */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullscreen ? 0 : 20,
      }}>
        <div style={{
          width: isFullscreen ? '100vw' : 'min(100%, 1280px)',
          aspectRatio: '16/9',
          background: '#000',
          borderRadius: isFullscreen ? 0 : 8,
          overflow: 'hidden',
          boxShadow: isFullscreen ? 'none' : '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative',
        }}>
          <ImagePathProvider value={imagePaths}>
            <HexaTacticalHUD
              width={1920}
              height={1080}
              isPlaying={true}
              onStateUpdate={() => {}}
              onReady={() => {}}
            />
          </ImagePathProvider>
        </div>
      </main>
      
      {/* 안내 */}
      {!isFullscreen && (
        <footer style={{
          padding: '20px 40px',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          gap: 40,
          fontSize: 13,
          opacity: 0.6,
          flexWrap: 'wrap',
        }}>
          <span>🎮 <strong>1</strong> 온보딩 시작</span>
          <span>👾 <strong>M</strong> 몬스터 모드</span>
          <span>🔥 <strong>F/G</strong> Fire 효과</span>
          <span>📺 <strong>F</strong> 풀스크린</span>
          <span>🖱️ <strong>클릭</strong> 타겟팅 (몬스터 모드)</span>
        </footer>
      )}
      
      {/* 풀스크린 나가기 버튼 */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: '#FFD700',
            border: '1px solid rgba(255, 215, 0, 0.5)',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            zIndex: 10000,
          }}
        >
          ESC 또는 클릭하여 나가기
        </button>
      )}
    </div>
  )
}

export default HexaPlayerPage
