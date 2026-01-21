import { create } from 'zustand'
import type { InputEvent, HUDStateSnapshot, RecordingSession } from '@/types/input-log'
import type { CompositorMode, RenderingOptions } from '@/core/RenderingPipeline'

export interface WebGPUEffects {
  chromaticAberration: boolean
  bloom: boolean
  scanlines: boolean
  vignette: boolean
  noise: boolean
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
    duration: number
  ) => void
  startRendering: () => void
  setRenderProgress: (progress: number) => void
  finishRendering: () => void
  setCompositorMode: (mode: CompositorMode) => void
  setWebGPUEffect: (effect: keyof WebGPUEffects, enabled: boolean) => void
  getRenderingOptions: () => RenderingOptions
  reset: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  videoFile: null,
  videoMetadata: null,
  hudUrl: '__inline__', // 기본값: 내장 HUD
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

  // Actions
  setVideoFile: (file) => set({ videoFile: file }),

  setVideoMetadata: (meta) => set({ videoMetadata: meta }),

  setHudUrl: (url) => set({ hudUrl: url }),

  setHudReady: (ready) => set({ hudReady: ready }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  setCurrentTime: (time) => set({ currentTime: time }),

  startRecording: () => set({ isRecording: true }),

  stopRecording: (inputLog, hudStateLog, duration) => {
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
    }

    set({
      isRecording: false,
      isPlaying: false,
      recordingSession: session,
    })

    console.log('Recording session saved:', session)
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
