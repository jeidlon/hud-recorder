/**
 * 🎬 RRWeb Renderer Server
 * 
 * rrweb 세션을 Puppeteer에서 재생하면서 프레임을 캡처합니다.
 * 
 * 흐름:
 * 1. 클라이언트에서 rrweb 세션 JSON 전송
 * 2. Puppeteer에서 rrweb-player로 재생
 * 3. 각 프레임마다 스크린샷 캡처
 * 4. PNG 시퀀스 또는 ZIP으로 반환
 */

import express from 'express'
import cors from 'cors'
import puppeteer, { Browser, Page } from 'puppeteer'
import path from 'path'
import fs from 'fs'
import archiver from 'archiver'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json({ limit: '500mb' })) // 큰 세션 데이터 허용

let browser: Browser | null = null

// Puppeteer 브라우저 초기화
async function initBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--allow-file-access-from-files',
      ],
    })
    console.log('[RRWebRenderer] Browser initialized')
  }
  return browser
}

// rrweb 재생 HTML 생성
function generateReplayHTML(events: any[], width: number, height: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: ${width}px; 
      height: ${height}px; 
      overflow: hidden;
      background: transparent;
    }
    .replayer-wrapper {
      position: relative;
      width: ${width}px;
      height: ${height}px;
    }
    .replayer-wrapper iframe {
      border: none;
      width: 100%;
      height: 100%;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/rrweb@latest/dist/rrweb.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/index.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/style.css">
</head>
<body>
  <div id="player-container"></div>
  <script>
    const events = ${JSON.stringify(events)};
    
    // Replayer 생성 (컨트롤 없이)
    const replayer = new rrweb.Replayer(events, {
      root: document.getElementById('player-container'),
      skipInactive: false,
      showWarning: false,
      showDebug: false,
      blockClass: 'rr-block',
      liveMode: false,
      insertStyleRules: [],
      triggerFocus: false,
    });
    
    // 재생 제어를 위한 전역 함수
    window.seekTo = (timeMs) => {
      replayer.pause(timeMs);
    };
    
    window.getReplayerState = () => {
      return {
        currentTime: replayer.getCurrentTime(),
        duration: replayer.getMetaData().totalTime,
      };
    };
    
    window.replayerReady = true;
    console.log('[RRWebRenderer] Replayer ready, duration:', replayer.getMetaData().totalTime);
  </script>
</body>
</html>
  `
}

// 프레임 렌더링 API
app.post('/api/rrweb/render-frames', async (req, res) => {
  const { session, fps = 30, format = 'png' } = req.body

  if (!session?.events || session.events.length === 0) {
    return res.status(400).json({ error: 'No events in session' })
  }

  const outputDir = path.join(__dirname, '../out', `rrweb-${Date.now()}`)
  fs.mkdirSync(outputDir, { recursive: true })

  try {
    const b = await initBrowser()
    const page = await b.newPage()

    const width = session.metadata?.width || 1920
    const height = session.metadata?.height || 1080

    await page.setViewport({ width, height, deviceScaleFactor: 2 })

    // HTML 로드
    const html = generateReplayHTML(session.events, width, height)
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Replayer 준비 대기
    await page.waitForFunction('window.replayerReady === true', { timeout: 30000 })

    // 재생 시간 가져오기
    const { duration } = await page.evaluate(() => (window as any).getReplayerState())
    const totalFrames = Math.ceil((duration / 1000) * fps)

    console.log(`[RRWebRenderer] Rendering ${totalFrames} frames at ${fps}fps`)

    const frameInterval = 1000 / fps
    const frames: string[] = []

    for (let i = 0; i < totalFrames; i++) {
      const timeMs = i * frameInterval

      // 해당 시간으로 이동
      await page.evaluate((t) => (window as any).seekTo(t), timeMs)
      await page.waitForTimeout(50) // DOM 업데이트 대기

      // 스크린샷 캡처
      const framePath = path.join(outputDir, `frame-${String(i).padStart(5, '0')}.png`)
      await page.screenshot({
        path: framePath,
        type: 'png',
        omitBackground: true, // 투명 배경!
      })

      frames.push(framePath)

      // 진행 상황 로그
      if (i % 30 === 0) {
        console.log(`[RRWebRenderer] Progress: ${i}/${totalFrames} (${Math.round(i / totalFrames * 100)}%)`)
      }
    }

    await page.close()

    console.log(`[RRWebRenderer] Rendering complete: ${frames.length} frames`)

    // ZIP 파일 생성
    const zipPath = path.join(outputDir, 'frames.zip')
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 5 } })

    archive.pipe(output)
    
    for (const frame of frames) {
      archive.file(frame, { name: path.basename(frame) })
    }

    await archive.finalize()

    // ZIP 파일 전송
    res.download(zipPath, 'rrweb-frames.zip', () => {
      // 정리
      fs.rmSync(outputDir, { recursive: true, force: true })
    })

  } catch (error) {
    console.error('[RRWebRenderer] Error:', error)
    res.status(500).json({ error: String(error) })
  }
})

// 상태 확인
app.get('/api/rrweb/status', (req, res) => {
  res.json({
    status: 'ok',
    browserReady: !!browser,
    timestamp: Date.now(),
  })
})

app.listen(PORT, () => {
  console.log(`\n🎬 RRWeb Renderer Server running at http://localhost:${PORT}`)
  console.log('   POST /api/rrweb/render-frames - Render rrweb session to PNG sequence')
  console.log('   GET  /api/rrweb/status        - Check server status\n')
  
  // 브라우저 미리 초기화
  initBrowser().catch(console.error)
})
