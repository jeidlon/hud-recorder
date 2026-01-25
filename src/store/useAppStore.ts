import { create } from 'zustand'
import type { InputEvent, HUDStateSnapshot, RecordingSession } from '@/types/input-log'
import type { CompositorMode, RenderingOptions } from '@/core/RenderingPipeline'
import type { ExternalHUDState } from '@/presets'

export interface WebGPUEffects {
  chromaticAberration: boolean
  bloom: boolean
  scanlines: boolean
  vignette: boolean
  noise: boolean
}

// 🎬 Remotion 렌더링 설정
export interface RemotionRenderSettings {
  width: number
  height: number
  fps: number
  imageFormat: 'png' | 'jpeg'
  quality: number // 1-100 for jpeg
  codec: 'h264' | 'h265' | 'vp8' | 'vp9'
  crf: number // 0-51, 낮을수록 품질 높음 (비디오용)
  scale: number // 렌더링 스케일 (1 또는 2)
}

export const DEFAULT_RENDER_SETTINGS: RemotionRenderSettings = {
  width: 1920,
  height: 1080,
  fps: 30,
  imageFormat: 'png',
  quality: 90,
  codec: 'h264',
  crf: 15, // 기본 최고 품질
  scale: 1,
}

interface AppState {
  // 비디오 상태
  videoFile: File | null
  videoMetadata: {
    width: number
    height: number
    fps: number
    duration: number
    frameCount: number
  } | null

  // HUD 상태
  hudUrl: string
  hudReady: boolean

  // 재생 상태
  isPlaying: boolean
  currentTime: number

  // 녹화 상태
  isRecording: boolean
  recordingSession: RecordingSession | null

  // 렌더링 상태
  isRendering: boolean
  renderProgress: number

  // WebGPU 렌더링 옵션
  compositorMode: CompositorMode
  webgpuEffects: WebGPUEffects

  // 🎬 Remotion 렌더링 설정
  remotionSettings: RemotionRenderSettings

  // Export 모드: HUD 상태를 외부에서 제어 (null이면 정상 모드)
  hudExportState: ExternalHUDState | null
  // HUD 캡처용 컨테이너 ref
  hudContainerRef: HTMLDivElement | null

  // Actions
  setVideoFile: (file: File | null) => void
  setVideoMetadata: (meta: AppState['videoMetadata']) => void
  setHudUrl: (url: string) => void
  setHudReady: (ready: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  startRecording: () => void
  stopRecording: (
    inputLog: InputEvent[],
    hudStateLog: HUDStateSnapshot[],
    duration: number,
    animationEvents?: Array<{ timestamp: number; elementId: string; type: string; preset?: string; duration?: number; data?: Record<string, unknown> }>,
    hudEvents?: Array<{ timestamp: number; type: string; payload: Record<string, unknown> }>
  ) => void
  startRendering: () => void
  setRenderProgress: (progress: number) => void
  finishRendering: () => void
  setCompositorMode: (mode: CompositorMode) => void
  setWebGPUEffect: (effect: keyof WebGPUEffects, enabled: boolean) => void
  getRenderingOptions: () => RenderingOptions
  // 🎬 Remotion 설정
  setRemotionSettings: (settings: Partial<RemotionRenderSettings>) => void
  getRemotionSettings: () => RemotionRenderSettings
  setHudExportState: (state: ExternalHUDState | null) => void
  setHudContainerRef: (ref: HTMLDivElement | null) => void
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  videoFile: null,
  videoMetadata: null,
  hudUrl: '__inline__:hexa-tactical', // 기본값: 내장 HUD (hexa-tactical 프리셋)
  hudReady: false,
  isPlaying: false,
  currentTime: 0,
  isRecording: false,
  recordingSession: null,
  isRendering: false,
  renderProgress: 0,
  
  // WebGPU 기본값: auto 모드, 모든 효과 비활성화
  compositorMode: 'auto',
  webgpuEffects: {
    chromaticAberration: false,
    bloom: false,
    scanlines: false,
    vignette: false,
    noise: false,
  },

  // 🎬 Remotion 렌더링 설정 기본값
  remotionSettings: { ...DEFAULT_RENDER_SETTINGS },

  // Export 모드: null이면 정상 모드
  hudExportState: null,
  hudContainerRef: null,

  // Actions
  setVideoFile: (file) => set({ videoFile: file }),

  setVideoMetadata: (meta) => set({ videoMetadata: meta }),

  setHudUrl: (url) => set({ hudUrl: url }),

  setHudReady: (ready) => set({ hudReady: ready }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  startRecording: () => set({ isRecording: true }),

  stopRecording: (inputLog, hudStateLog, duration, animationEvents, hudEvents) => {
    const { videoFile, videoMetadata, hudUrl } = get()

    const session: RecordingSession = {
      id: crypto.randomUUID(),
      startTime: Date.now(),
      duration,
      videoInfo: {
        fileName: videoFile?.name || '',
        width: videoMetadata?.width || 0,
        height: videoMetadata?.height || 0,
        fps: videoMetadata?.fps || 30,
        frameCount: videoMetadata?.frameCount || 0,
      },
      hudInfo: { url: hudUrl },
      inputLog,
      hudStateLog,
      animationEvents: animationEvents as RecordingSession['animationEvents'],
      hudEvents: hudEvents as RecordingSession['hudEvents'],
    }

    set({
      isRecording: false,
      isPlaying: false,
      recordingSession: session,
    })

    console.log('Recording session saved:', session, 'AnimEvents:', animationEvents?.length ?? 0)
  },

  startRendering: () => set({ isRendering: true, renderProgress: 0 }),

  setRenderProgress: (progress) => set({ renderProgress: progress }),

  finishRendering: () => set({ isRendering: false, renderProgress: 100 }),

  setCompositorMode: (mode) => set({ compositorMode: mode }),

  setWebGPUEffect: (effect, enabled) =>
    set((state) => ({
      webgpuEffects: {
        ...state.webgpuEffects,
        [effect]: enabled,
      },
    })),

  getRenderingOptions: () => {
    const { compositorMode, webgpuEffects } = get()
    return {
      compositorMode,
      effects: webgpuEffects,
    }
  },

  // 🎬 Remotion 설정 업데이트
  setRemotionSettings: (settings) =>
    set((state) => ({
      remotionSettings: {
        ...state.remotionSettings,
        ...settings,
      },
    })),

  getRemotionSettings: () => get().remotionSettings,

  setHudExportState: (state) => set({ hudExportState: state }),

  setHudContainerRef: (ref) => set({ hudContainerRef: ref }),

  reset: () =>
    set({
      isPlaying: false,
      currentTime: 0,
      isRecording: false,
      recordingSession: null,
      isRendering: false,
      renderProgress: 0,
    }),
}))
