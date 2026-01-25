/**
 * Remotion Render Server
 * 
 * 웹 앱에서 API 호출로 Remotion 렌더링을 트리거하는 로컬 서버
 * 
 * 사용법:
 * 1. npm run server:render 로 서버 실행
 * 2. 웹 앱에서 POST /render 로 렌더링 요청
 * 3. 결과 파일 다운로드 (ZIP)
 */

import { createServer, IncomingMessage, ServerResponse } from 'http'
import { parse } from 'url'
import { spawn } from 'child_process'
import { createReadStream, existsSync, mkdirSync, readdirSync, statSync, createWriteStream } from 'fs'
import { join, basename } from 'path'
import { writeFile, rm, copyFile } from 'fs/promises'
import archiver from 'archiver'

const PORT = 3456
const OUTPUT_DIR = join(process.cwd(), 'out')
const PUBLIC_DIR = join(process.cwd(), 'public')
const UPLOAD_DIR = join(PUBLIC_DIR, 'uploads')

// CORS 헤더
const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// 진행 중인 렌더링 상태
interface RenderJob {
  id: string
  status: 'pending' | 'rendering' | 'complete' | 'error'
  progress: number
  currentFrame: number
  totalFrames: number
  output?: string
  error?: string
  format: 'mp4' | 'png' | 'webm'
  startTime: number
}

const renderJobs: Map<string, RenderJob> = new Map()

// 유니크 ID 생성
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// JSON 응답 헬퍼
function jsonResponse(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { ...corsHeaders, 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// 🎬 렌더링 설정 인터페이스
interface RenderConfig {
  width?: number
  height?: number
  fps?: number
  imageFormat?: 'png' | 'jpeg'
  quality?: number
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9'
  crf?: number // 0-51, 낮을수록 품질 높음
  scale?: number // 렌더링 스케일
}

// 렌더링 실행
async function executeRender(
  job: RenderJob, 
  props: Record<string, unknown>,
  renderConfig?: RenderConfig
): Promise<void> {
  const { id, format } = job
  
  // 🎬 렌더링 설정 (기본값 적용)
  const width = renderConfig?.width || 1920
  const height = renderConfig?.height || 1080
  const fps = renderConfig?.fps || 30
  const imageFormat = renderConfig?.imageFormat || 'png'
  const quality = renderConfig?.quality || 90
  const codec = renderConfig?.codec || 'h264'
  const crf = renderConfig?.crf || 15 // 기본 최고 품질
  const scale = renderConfig?.scale || 1
  
  // 출력 폴더 생성
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true })
  }
  
  // Props 파일 저장
  const propsFile = join(OUTPUT_DIR, `props-${id}.json`)
  await writeFile(propsFile, JSON.stringify(props))
  
  // Remotion 명령어 구성
  let outputPath: string
  let args: string[]
  
  // 🎬 공통 옵션: 고품질 렌더링 + 사용자 설정
  const commonArgs = [
    'remotion', 'render', 'src/remotion/index.ts',
    '--props', propsFile,
    '--log', 'verbose',  // 상세 로그
    '--width', String(width),
    '--height', String(height),
  ]
  
  switch (format) {
    case 'png':
      outputPath = join(OUTPUT_DIR, `frames-${id}`)
      args = [
        ...commonArgs,
        'HUDOnly',
        '--image-format', imageFormat,
        '--sequence',
        '--scale', String(scale),
        ...(imageFormat === 'jpeg' ? ['--jpeg-quality', String(quality)] : []),
        '--output', outputPath,
      ]
      break
      
    case 'webm':
      outputPath = join(OUTPUT_DIR, `hud-${id}.webm`)
      args = [
        ...commonArgs,
        'HUDOnly',
        '--codec', 'vp8',
        '--scale', String(scale),
        '--output', outputPath,
      ]
      break
      
    case 'mp4':
    default:
      outputPath = join(OUTPUT_DIR, `video-${id}.mp4`)
      args = [
        ...commonArgs,
        'HUDOverlay',
        '--codec', codec,
        '--crf', String(crf),  // 🎬 CRF 값 적용 (낮을수록 품질 높음, 0-51 범위)
        '--scale', String(scale),
        '--output', outputPath,
      ]
      break
  }
  
  job.output = outputPath
  job.status = 'rendering'
  job.startTime = Date.now()
  
  const workingDir = process.cwd()
  
  console.log(`[Render] Starting job ${id}: ${format}`)
  console.log(`[Render] Command: npx ${args.join(' ')}`)
  
  return new Promise((resolve, reject) => {
    const childProcess = spawn('npx', args, {
      cwd: workingDir,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    
    let stderr = ''
    
    // stdout과 stderr 모두에서 진행률 파싱
    const parseOutput = (data: Buffer) => {
      const output = data.toString()
      
      // "Rendered X/Y" 형식 파싱
      const renderedMatch = output.match(/Rendered\s+(\d+)\/(\d+)/i)
      if (renderedMatch) {
        job.currentFrame = parseInt(renderedMatch[1])
        job.totalFrames = parseInt(renderedMatch[2])
        job.progress = Math.round((job.currentFrame / job.totalFrames) * 100)
        console.log(`[Render ${id}] Progress: ${job.currentFrame}/${job.totalFrames} (${job.progress}%)`)
      }
      
      // "X%" 형식 파싱 (번들링 등)
      const percentMatch = output.match(/(\d+)%/)
      if (percentMatch && !renderedMatch) {
        const percent = parseInt(percentMatch[1])
        // 번들링은 0-10% 범위로 표시
        if (output.includes('Bundling')) {
          job.progress = Math.min(10, Math.round(percent / 10))
        }
      }
    }
    
    childProcess.stdout?.on('data', (data) => {
      console.log(`[Render ${id}]`, data.toString().trim())
      parseOutput(data)
    })
    
    childProcess.stderr?.on('data', (data) => {
      const output = data.toString()
      // 에러가 아닌 진행 정보도 stderr로 올 수 있음
      if (!output.includes('Error') && !output.includes('error')) {
        parseOutput(data)
      } else {
        stderr += output
        console.error(`[Render ${id} ERR]`, output.trim())
      }
    })
    
    childProcess.on('close', async (code) => {
      // Props 파일 정리
      try {
        await rm(propsFile, { force: true })
      } catch {}
      
      const elapsed = ((Date.now() - job.startTime) / 1000).toFixed(1)
      
      if (code === 0) {
        job.status = 'complete'
        job.progress = 100
        console.log(`[Render] Job ${id} complete in ${elapsed}s: ${outputPath}`)
        resolve()
      } else {
        job.status = 'error'
        job.error = stderr || `Process exited with code ${code}`
        console.error(`[Render] Job ${id} failed after ${elapsed}s:`, job.error)
        reject(new Error(job.error))
      }
    })
    
    childProcess.on('error', (err) => {
      job.status = 'error'
      job.error = err.message
      console.error(`[Render] Job ${id} error:`, err)
      reject(err)
    })
  })
}

// ZIP 파일 생성 및 스트리밍
async function streamZip(res: ServerResponse, folderPath: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 5 } })
    
    res.writeHead(200, {
      ...corsHeaders,
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
    
    archive.pipe(res)
    
    archive.on('error', (err) => {
      console.error('[ZIP Error]', err)
      reject(err)
    })
    
    archive.on('end', () => {
      console.log(`[ZIP] Archive complete: ${filename}`)
      resolve()
    })
    
    // 폴더 내 모든 PNG 파일 추가
    archive.directory(folderPath, false)
    archive.finalize()
  })
}

// 비디오 업로드 처리
async function handleVideoUpload(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return new Promise((resolve, reject) => {
    // uploads 폴더 생성
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
    
    const videoId = generateId()
    const videoPath = join(UPLOAD_DIR, `video-${videoId}.mp4`)
    const writeStream = createWriteStream(videoPath)
    
    let bytesReceived = 0
    
    req.on('data', (chunk) => {
      bytesReceived += chunk.length
      writeStream.write(chunk)
    })
    
    req.on('end', () => {
      writeStream.end()
      console.log(`[Upload] Video saved: ${videoPath} (${(bytesReceived / 1024 / 1024).toFixed(2)} MB)`)
      
      // staticFile 경로 반환 (public 폴더 기준)
      const staticPath = `uploads/video-${videoId}.mp4`
      jsonResponse(res, { 
        id: videoId, 
        path: staticPath,
        size: bytesReceived,
      })
      resolve()
    })
    
    req.on('error', (err) => {
      console.error('[Upload] Error:', err)
      jsonResponse(res, { error: err.message }, 500)
      reject(err)
    })
  })
}

// HTTP 서버 생성
const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const parsedUrl = parse(req.url || '', true)
  const pathname = parsedUrl.pathname
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders)
    res.end()
    return
  }
  
  // 라우팅
  try {
    // POST /upload - 비디오 업로드
    if (req.method === 'POST' && pathname === '/upload') {
      await handleVideoUpload(req, res)
      return
    }
    
    // POST /render - 렌더링 시작
    if (req.method === 'POST' && pathname === '/render') {
      let body = ''
      req.on('data', chunk => { body += chunk })
      req.on('end', async () => {
        try {
          const data = JSON.parse(body)
          const { format = 'mp4', props, renderConfig } = data
          
          if (!props) {
            jsonResponse(res, { error: 'props is required' }, 400)
            return
          }
          
          const id = generateId()
          const job: RenderJob = {
            id,
            status: 'pending',
            progress: 0,
            currentFrame: 0,
            totalFrames: 0,
            format,
            startTime: Date.now(),
          }
          
          renderJobs.set(id, job)
          
          // 🎬 비동기로 렌더링 시작 (renderConfig 포함)
          executeRender(job, props, renderConfig).catch(err => {
            console.error(`[Render] Job ${id} failed:`, err)
          })
          
          jsonResponse(res, { id, status: job.status })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          jsonResponse(res, { error: message }, 500)
        }
      })
      return
    }
    
    // GET /status/:id - 상태 확인
    if (req.method === 'GET' && pathname?.startsWith('/status/')) {
      const id = pathname.replace('/status/', '')
      const job = renderJobs.get(id)
      
      if (!job) {
        jsonResponse(res, { error: 'Job not found' }, 404)
        return
      }
      
      jsonResponse(res, {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentFrame: job.currentFrame,
        totalFrames: job.totalFrames,
        error: job.error,
        downloadUrl: job.status === 'complete' ? `/download/${id}` : undefined,
      })
      return
    }
    
    // GET /download/:id - 결과 다운로드 (ZIP 또는 파일)
    if (req.method === 'GET' && pathname?.startsWith('/download/')) {
      const id = pathname.replace('/download/', '')
      const job = renderJobs.get(id)
      
      if (!job || job.status !== 'complete' || !job.output) {
        jsonResponse(res, { error: 'File not ready' }, 404)
        return
      }
      
      // PNG 시퀀스는 ZIP으로 묶어서 전송
      if (job.format === 'png') {
        if (!existsSync(job.output)) {
          jsonResponse(res, { error: 'Folder not found' }, 404)
          return
        }
        
        const files = readdirSync(job.output).filter(f => f.endsWith('.png'))
        if (files.length === 0) {
          jsonResponse(res, { error: 'No PNG files found' }, 404)
          return
        }
        
        const zipFilename = `hud-sequence-${id}.zip`
        console.log(`[Download] Streaming ZIP: ${zipFilename} (${files.length} files)`)
        
        await streamZip(res, job.output, zipFilename)
        return
      }
      
      // 단일 파일 다운로드
      if (!existsSync(job.output)) {
        jsonResponse(res, { error: 'File not found' }, 404)
        return
      }
      
      const filename = basename(job.output)
      const contentType = job.format === 'webm' ? 'video/webm' : 'video/mp4'
      const stat = statSync(job.output)
      
      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${filename}"`,
      })
      
      createReadStream(job.output).pipe(res)
      return
    }
    
    // GET /health - 헬스 체크
    if (req.method === 'GET' && pathname === '/health') {
      const activeJobs = Array.from(renderJobs.values()).filter(j => j.status === 'rendering')
      jsonResponse(res, { 
        status: 'ok', 
        totalJobs: renderJobs.size,
        activeJobs: activeJobs.length,
      })
      return
    }
    
    // 404
    jsonResponse(res, { error: 'Not found' }, 404)
    
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Server Error]', err)
    jsonResponse(res, { error: message }, 500)
  }
})

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎬 Remotion Render Server v2                            ║
║                                                           ║
║   Server running at http://localhost:${PORT}               ║
║                                                           ║
║   Endpoints:                                              ║
║   - POST /render       Start a render job                 ║
║   - GET  /status/:id   Check job status + progress        ║
║   - GET  /download/:id Download result (ZIP for PNG)      ║
║   - GET  /health       Health check                       ║
║                                                           ║
║   Features:                                               ║
║   - Real-time progress tracking                           ║
║   - ZIP download for PNG sequences                        ║
║   - High quality rendering                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `)
})
