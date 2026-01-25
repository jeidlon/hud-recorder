/**
 * Puppeteer 기반 고품질 HUD 렌더러
 * 
 * Headless Chrome에서 실제 시간을 흘려보내면서 프레임을 캡처합니다.
 * framer-motion 애니메이션이 완벽하게 동작합니다.
 * 
 * 사용법:
 * POST /render-puppeteer
 * { hudStateLogJson, duration, fps, format: 'png' | 'webm' }
 */

import puppeteer, { Browser, Page } from 'puppeteer'
import { mkdir, writeFile, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import archiver from 'archiver'
import { createWriteStream } from 'fs'

const OUTPUT_DIR = join(process.cwd(), 'out')

interface RenderOptions {
  /** HUD 상태 로그 JSON */
  hudStateLogJson: string
  /** 총 재생 시간 (ms) */
  duration: number
  /** 프레임 레이트 */
  fps: number
  /** 출력 형식 */
  format: 'png' | 'webm'
  /** 출력 너비 */
  width?: number
  /** 출력 높이 */
  height?: number
}

interface RenderProgress {
  currentFrame: number
  totalFrames: number
  percent: number
}

// 브라우저 인스턴스 재사용
let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    })
  }
  return browserInstance
}

/**
 * Puppeteer로 HUD를 렌더링하여 PNG 시퀀스 생성
 */
export async function renderWithPuppeteer(
  options: RenderOptions,
  onProgress?: (progress: RenderProgress) => void
): Promise<string> {
  const {
    hudStateLogJson,
    duration,
    fps = 30,
    format = 'png',
    width = 1920,
    height = 1080,
  } = options

  const totalFrames = Math.ceil((duration / 1000) * fps)
  const frameInterval = 1000 / fps
  const jobId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
  const outputDir = join(OUTPUT_DIR, `puppeteer-${jobId}`)

  // 출력 폴더 생성
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  console.log(`[Puppeteer] Starting render: ${totalFrames} frames @ ${fps}fps`)

  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    // 뷰포트 설정
    await page.setViewport({ width, height, deviceScaleFactor: 2 }) // 2x for high quality

    // HUD 페이지 로드 (Vite dev server)
    const hudUrl = `http://localhost:5173/?renderMode=true`
    await page.goto(hudUrl, { waitUntil: 'networkidle0', timeout: 30000 })

    console.log(`[Puppeteer] Page loaded: ${hudUrl}`)

    // HUD 상태 로그 주입
    const hudStateLog = JSON.parse(hudStateLogJson)
    await page.evaluate((log) => {
      (window as any).__hudStateLog = log
      (window as any).__renderMode = true
    }, hudStateLog)

    // 각 프레임 캡처
    for (let frame = 0; frame < totalFrames; frame++) {
      const timestamp = frame * frameInterval

      // HUD 상태 업데이트 (현재 타임스탬프에 해당하는 상태 찾기)
      await page.evaluate((ts: number, log: any[]) => {
        // 타임스탬프에 해당하는 상태 찾기
        let state = log[0]
        for (let i = 0; i < log.length; i++) {
          if (log[i].timestamp <= ts) {
            state = log[i]
          } else {
            break
          }
        }

        // 상태 이벤트 발생
        if (state) {
          const event = new CustomEvent('hudStateUpdate', { detail: { ...state, timestamp: ts } })
          window.dispatchEvent(event)
        }
      }, timestamp, hudStateLog)

      // 애니메이션 안정화 대기
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)))
      await page.waitForTimeout(16) // 추가 안정화

      // 스크린샷 캡처
      const framePath = join(outputDir, `frame_${String(frame).padStart(5, '0')}.png`)
      await page.screenshot({
        path: framePath,
        type: 'png',
        omitBackground: true, // 투명 배경
        clip: { x: 0, y: 0, width, height },
      })

      // 진행률 보고
      const progress: RenderProgress = {
        currentFrame: frame + 1,
        totalFrames,
        percent: Math.round(((frame + 1) / totalFrames) * 100),
      }
      onProgress?.(progress)

      if ((frame + 1) % 30 === 0) {
        console.log(`[Puppeteer] Rendered ${frame + 1}/${totalFrames} frames (${progress.percent}%)`)
      }
    }

    console.log(`[Puppeteer] Render complete: ${outputDir}`)

    // PNG 시퀀스를 ZIP으로 압축
    if (format === 'png') {
      const zipPath = join(OUTPUT_DIR, `hud-sequence-${jobId}.zip`)
      await zipDirectory(outputDir, zipPath)
      
      // 임시 폴더 삭제
      await rm(outputDir, { recursive: true, force: true })
      
      return zipPath
    }

    return outputDir
  } finally {
    await page.close()
  }
}

/**
 * 디렉토리를 ZIP으로 압축
 */
async function zipDirectory(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

/**
 * 브라우저 종료
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
