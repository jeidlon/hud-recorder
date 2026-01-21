// 단일 입력 이벤트
export interface InputEvent {
  type: 'mousemove' | 'mousedown' | 'mouseup' | 'click' | 'wheel' | 'keydown' | 'keyup'
  timestamp: number // 녹화 시작부터의 경과 시간 (ms)
  data: MouseEventData | WheelEventData | KeyboardEventData
}

export interface MouseEventData {
  x: number
  y: number
  buttons: number
  button?: number // click 이벤트용
}

export interface WheelEventData {
  x: number
  y: number
  deltaX: number
  deltaY: number
}

export interface KeyboardEventData {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
}

// 전체 녹화 세션
export interface RecordingSession {
  id: string
  startTime: number // Date.now()
  duration: number // ms
  videoInfo: {
    fileName: string
    width: number
    height: number
    fps: number
    frameCount: number
  }
  hudInfo: {
    url: string
  }
  inputLog: InputEvent[]
  hudStateLog: HUDStateSnapshot[] // HUD에서 받은 상태들
}

// HUD 상태 스냅샷 (Phase 2의 HUDState 확장)
export interface HUDStateSnapshot {
  timestamp: number
  mouse: { x: number; y: number; buttons: number }
  targets?: Record<string, { x: number; y: number; locked: boolean }>
  customData?: unknown
}
