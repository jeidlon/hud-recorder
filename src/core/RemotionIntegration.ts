/**
 * Remotion Integration
 * 
 * 웹 앱에서 Remotion 렌더링을 통합하는 유틸리티
 * 
 * 두 가지 접근법:
 * 1. CLI 명령어 생성 (사용자가 터미널에서 실행)
 * 2. Remotion Studio 연동 (브라우저에서 직접 렌더링)
 */

import type { RecordingSession } from '@/types/input-log'

export type RenderFormat = 'mp4' | 'png-sequence' | 'webm-alpha'

export interface RemotionRenderConfig {
  /** 출력 포맷 */
  format: RenderFormat
  /** 세션 데이터 */
  session: RecordingSession
  /** 비디오 소스 경로 (HUDOverlay용) */
  videoSrc?: string
  /** 출력 경로 */
  outputPath?: string
  /** 품질 (1-100) */
  quality?: number
  /** FPS */
  fps?: number
}

/**
 * Remotion CLI 렌더링 명령어 생성
 */
export function generateRemotionCommand(config: RemotionRenderConfig): string {
  const { format, session, videoSrc, outputPath, quality = 90, fps = 30 } = config
  
  const baseCmd = 'npx remotion render src/remotion/index.ts'
  
  // 세션 데이터를 임시 파일로 저장해야 하므로 props 대신 환경변수나 파일 경로 사용
  const hudStateLogJson = JSON.stringify(session.hudStateLog).replace(/'/g, "\\'")
  
  switch (format) {
    case 'mp4':
      return [
        baseCmd,
        'HUDOverlay',
        '--codec h264',
        `--props '{"videoSrc":"${videoSrc || 'public/sample.mp4'}","hudPresetId":"hexa-tactical","hudStateLogJson":${JSON.stringify(hudStateLogJson)}}'`,
        `--output "${outputPath || `out/hud-${session.id.slice(0, 8)}.mp4`}"`,
        `--crf ${Math.round((100 - quality) / 3)}`, // CRF: 0-33 (lower = better)
      ].join(' \\\n  ')
      
    case 'png-sequence':
      return [
        baseCmd,
        'HUDOnly',
        '--image-format png',
        '--sequence',
        `--props '{"hudPresetId":"hexa-tactical","hudStateLogJson":${JSON.stringify(hudStateLogJson)}}'`,
        `--output "${outputPath || `out/frames-${session.id.slice(0, 8)}`}"`,
      ].join(' \\\n  ')
      
    case 'webm-alpha':
      return [
        baseCmd,
        'HUDOnly',
        '--codec vp8', // VP8 supports alpha
        `--props '{"hudPresetId":"hexa-tactical","hudStateLogJson":${JSON.stringify(hudStateLogJson)}}'`,
        `--output "${outputPath || `out/hud-alpha-${session.id.slice(0, 8)}.webm`}"`,
      ].join(' \\\n  ')
      
    default:
      return baseCmd
  }
}

/**
 * 세션 데이터를 Remotion Props JSON 파일로 저장
 */
export function exportSessionAsRemotionProps(session: RecordingSession): string {
  const props = {
    videoSrc: 'public/sample.mp4',
    hudPresetId: 'hexa-tactical',
    inputLogJson: JSON.stringify(session.inputLog),
    hudStateLogJson: JSON.stringify(session.hudStateLog),
  }
  
  return JSON.stringify(props, null, 2)
}

/**
 * 세션 데이터를 파일로 다운로드
 */
export function downloadSessionForRemotion(session: RecordingSession): void {
  const propsJson = exportSessionAsRemotionProps(session)
  const blob = new Blob([propsJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `remotion-props-${session.id.slice(0, 8)}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

/**
 * Remotion Studio URL 생성 (props 포함)
 * 
 * Remotion Studio에서 바로 프리뷰할 수 있는 URL
 */
export function getRemotionStudioUrl(
  session: RecordingSession, 
  compositionId: 'HUDOverlay' | 'HUDOnly' = 'HUDOverlay'
): string {
  const baseUrl = 'http://localhost:3000'
  
  // Remotion Studio는 URL params로 props를 받지 않음
  // 대신 사용자가 Studio에서 직접 props를 수정해야 함
  return `${baseUrl}/${compositionId}`
}

/**
 * 간단한 렌더링 가이드 생성
 */
export function generateRenderGuide(session: RecordingSession): string {
  const sessionId = session.id.slice(0, 8)
  
  return `
# HUD 렌더링 가이드 (Session: ${sessionId})

## 1. 세션 데이터 준비
먼저 세션 데이터 JSON 파일을 저장하세요.

## 2. Remotion Studio 열기
\`\`\`bash
cd hud-recorder
npm run remotion:studio
\`\`\`
→ http://localhost:3000 에서 확인

## 3. 렌더링 명령어

### MP4 출력 (비디오 + HUD)
\`\`\`bash
npm run remotion:render:mp4
\`\`\`

### PNG 시퀀스 (투명 배경 HUD)
\`\`\`bash
npm run remotion:render:png
\`\`\`

### WebM with Alpha (투명 배경 동영상)
\`\`\`bash
npm run remotion:render:webm
\`\`\`

## 4. 고급 옵션

### Props 파일 사용
\`\`\`bash
npx remotion render src/remotion/index.ts HUDOnly \\
  --props props.json \\
  --image-format png \\
  --sequence \\
  --output out/frames
\`\`\`

### 해상도 변경
\`\`\`bash
npx remotion render src/remotion/index.ts HUDOnly \\
  --width 3840 --height 2160 \\
  --image-format png \\
  --sequence
\`\`\`

---
Duration: ${(session.duration / 1000).toFixed(1)}s
Frames: ${Math.ceil(session.duration / 1000 * 30)}
Resolution: ${session.videoInfo.width}x${session.videoInfo.height}
`.trim()
}

/**
 * 브라우저에서 Remotion 렌더링이 가능한지 확인
 * 
 * 현재는 CLI만 지원하므로 항상 false
 * 향후 @remotion/lambda 또는 WebContainer 통합 시 true 반환 가능
 */
export function canRenderInBrowser(): boolean {
  return false
}

/**
 * 렌더링 옵션 UI용 타입
 */
export interface RenderOption {
  id: RenderFormat
  label: string
  description: string
  icon: string
  command: string
}

export const RENDER_OPTIONS: RenderOption[] = [
  {
    id: 'mp4',
    label: 'MP4 (비디오 + HUD)',
    description: '비디오 위에 HUD가 합성된 최종 영상',
    icon: '🎬',
    command: 'npm run remotion:render:mp4',
  },
  {
    id: 'png-sequence',
    label: 'PNG 시퀀스 (투명 배경)',
    description: 'After Effects/Premiere에서 합성용',
    icon: '🖼️',
    command: 'npm run remotion:render:png',
  },
  {
    id: 'webm-alpha',
    label: 'WebM Alpha (투명 동영상)',
    description: '투명 배경 동영상 (웹/OBS용)',
    icon: '🎥',
    command: 'npm run remotion:render:webm',
  },
]
