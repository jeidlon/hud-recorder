import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HexaPlayerPage from './pages/HexaPlayerPage.tsx'

/**
 * 간단한 해시 기반 라우터
 * 
 * 📌 사용법:
 * - 기본 웹앱: http://localhost:5173/
 * - Remotion Player: http://localhost:5173/#/player
 */
function Router() {
  const [route, setRoute] = useState(window.location.hash)
  
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])
  
  // 라우팅
  if (route === '#/player' || route === '#player') {
    return <HexaPlayerPage />
  }
  
  // 기본: 메인 앱
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)
