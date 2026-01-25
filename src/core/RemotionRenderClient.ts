/**
 * Remotion Render Client
 * 
 * 웹 앱에서 Remotion 렌더 서버에 렌더링을 요청하는 클라이언트
 */

import type { RecordingSession, HUDStateSnapshot } from '@/types/input-log'
import type { RemotionRenderSettings } from '@/store/useAppStore'

const RENDER_SERVER_URL = 'http://localhost:3456'

export type RenderFormat = 'mp4' | 'png' | 'webm'

export interface RenderJobStatus {
  id: string
  status: 'pending' | 'rendering' | 'complete' | 'error'
  progress: number
  error?: string
  downloadUrl?: string
}

export interface RenderOptions {
  format: RenderFormat
  session: RecordingSession
  videoSrc?: string
  videoFile?: File  // 비디오 파일 (업로드용)
  hudPresetId?: string
  scenario?: string
  scale?: number  // 렌더링 스케일 (기본 2x)
  // 🎬 Remotion 렌더링 설정
  renderSettings?: RemotionRenderSettings
}

/**
 * 렌더 서버 상태 확인
 */
export async function checkRenderServer(): Promise<boolean> {
  try {
    const response = await fetch(`${RENDER_SERVER_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * 비디오 파일을 렌더 서버에 업로드
 */
export async function uploadVideoFile(file: File): Promise<string> {
  const response = await fetch(`${RENDER_SERVER_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'video/mp4',
    },
    body: file,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(error.error || 'Failed to upload video')
  }
  
  const data = await response.json()
  return data.path  // staticFile 경로 반환
}

/**
 * 렌더링 작업 시작
 */
export async function startRender(options: RenderOptions): Promise<string> {
  const { 
    format, 
    session, 
    videoSrc, 
    videoFile,
    hudPresetId = 'hexa-tactical', 
    scenario = 'idle',
    scale = 2,  // 기본 2x 스케일
    renderSettings,  // 🎬 Remotion 렌더링 설정
  } = options
  
  // 🎬 렌더링 설정에서 값 가져오기
  const fps = renderSettings?.fps || 30
  const width = renderSettings?.width || 1920
  const height = renderSettings?.height || 1080
  const imageFormat = renderSettings?.imageFormat || 'png'
  const quality = renderSettings?.quality || 90
  const codec = renderSettings?.codec || 'h264'
  const crf = renderSettings?.crf || 15
  const renderScale = renderSettings?.scale || 1
  
  // Props 구성
  const props: Record<string, any> = {
    hudPresetId,
    hudStateLogJson: JSON.stringify(session.hudStateLog || []),
    scenario,
    scale,
  }
  
  // MP4는 비디오 소스 필요
  if (format === 'mp4') {
    // 비디오 파일이 있으면 업로드
    if (videoFile) {
      console.log('[Render] Uploading video file...')
      const uploadedPath = await uploadVideoFile(videoFile)
      props.videoSrc = uploadedPath
      console.log('[Render] Video uploaded:', uploadedPath)
    } else if (videoSrc && !videoSrc.startsWith('blob:')) {
      // blob URL이 아닌 경우에만 사용
      props.videoSrc = videoSrc
    } else {
      throw new Error('MP4 렌더링에는 비디오 파일이 필요합니다. blob URL은 사용할 수 없습니다.')
    }
    props.inputLogJson = JSON.stringify(session.inputLog || [])
  }
  
  // 녹화 duration 기반으로 frames 계산
  const duration = session.duration || 10000 // ms
  const durationInFrames = Math.ceil((duration / 1000) * fps)
  props.durationInFrames = durationInFrames
  
  // 🎬 렌더링 설정을 서버에 전달
  const renderConfig = {
    width,
    height,
    fps,
    imageFormat,
    quality,
    codec,
    crf,
    scale: renderScale,
  }
  
  const response = await fetch(`${RENDER_SERVER_URL}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format, props, renderConfig }),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to start render')
  }
  
  const data = await response.json()
  return data.id
}

/**
 * 렌더링 상태 확인
 */
export async function getRenderStatus(jobId: string): Promise<RenderJobStatus> {
  const response = await fetch(`${RENDER_SERVER_URL}/status/${jobId}`)
  
  if (!response.ok) {
    throw new Error('Failed to get render status')
  }
  
  return response.json()
}

/**
 * 렌더링 결과 다운로드 (ZIP 또는 비디오)
 */
export async function downloadRenderResult(jobId: string, filename?: string): Promise<void> {
  const status = await getRenderStatus(jobId)
  
  if (status.status !== 'complete') {
    throw new Error('Render not complete')
  }
  
  // 브라우저에서 다운로드 트리거
  const downloadUrl = `${RENDER_SERVER_URL}/download/${jobId}`
  
  const response = await fetch(downloadUrl)
  
  // Content-Type 확인
  const contentType = response.headers.get('content-type') || ''
  
  // 에러 응답 처리
  if (contentType.includes('application/json')) {
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    return
  }
  
  if (!response.ok) {
    throw new Error('Download failed')
  }
  
  // Blob으로 변환 후 다운로드
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  
  // 파일명 결정 (ZIP 또는 비디오)
  let downloadFilename = filename
  if (!downloadFilename) {
    if (contentType.includes('application/zip')) {
      downloadFilename = `hud-sequence-${jobId}.zip`
    } else if (contentType.includes('video/webm')) {
      downloadFilename = `hud-${jobId}.webm`
    } else {
      downloadFilename = `hud-${jobId}.mp4`
    }
  }
  
  const a = document.createElement('a')
  a.href = url
  a.download = downloadFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  console.log(`[Download] Complete: ${downloadFilename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`)
}

/**
 * 렌더링 상태를 폴링하며 진행률 업데이트
 */
export async function pollRenderProgress(
  jobId: string,
  onProgress: (status: RenderJobStatus) => void,
  intervalMs = 1000
): Promise<RenderJobStatus> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const status = await getRenderStatus(jobId)
        onProgress(status)
        
        if (status.status === 'complete') {
          resolve(status)
          return
        }
        
        if (status.status === 'error') {
          reject(new Error(status.error || 'Render failed'))
          return
        }
        
        // 계속 폴링
        setTimeout(poll, intervalMs)
      } catch (err) {
        reject(err)
      }
    }
    
    poll()
  })
}

/**
 * 한 번에 렌더링하고 다운로드
 */
export async function renderAndDownload(
  options: RenderOptions,
  onProgress?: (progress: number, status: string) => void
): Promise<void> {
  // 서버 상태 확인
  const serverOk = await checkRenderServer()
  if (!serverOk) {
    throw new Error(
      'Remotion 렌더 서버가 실행 중이 아닙니다.\n' +
      'npm run server:render 로 서버를 시작하거나\n' +
      'npm run dev:all 로 모든 서버를 한번에 시작하세요.'
    )
  }
  
  onProgress?.(0, '렌더링 시작...')
  
  // 렌더링 시작
  const jobId = await startRender(options)
  onProgress?.(5, '렌더링 작업 생성됨')
  
  // 상태 폴링
  const finalStatus = await pollRenderProgress(jobId, (status) => {
    const progressText = status.status === 'rendering' 
      ? `렌더링 중... ${status.progress}%`
      : status.status
    onProgress?.(status.progress, progressText)
  })
  
  // 다운로드
  onProgress?.(100, '다운로드 중...')
  
  // PNG는 폴더에 저장되므로 파일명 불필요
  if (options.format === 'png') {
    await downloadRenderResult(jobId)
    onProgress?.(100, '완료! (폴더에 저장됨)')
  } else {
    const extension = options.format === 'webm' ? 'webm' : 'mp4'
    const filename = `hud-export-${Date.now()}.${extension}`
    await downloadRenderResult(jobId, filename)
    onProgress?.(100, '완료!')
  }
}
