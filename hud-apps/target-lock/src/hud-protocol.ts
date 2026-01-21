// 메인 앱 → HUD 앱으로 보내는 메시지
export interface MainToHUDMessage {
  type:
    | 'INIT'
    | 'PLAY'
    | 'PAUSE'
    | 'SEEK'
    | 'SET_STATE'
    | 'CAPTURE_FRAME'

  payload?: {
    time?: number
    width?: number
    height?: number
    fps?: number
    state?: HUDState
  }
}

// HUD 앱 → 메인 앱으로 보내는 메시지
export interface HUDToMainMessage {
  type:
    | 'READY'
    | 'STATE_UPDATE'
    | 'FRAME_CAPTURED'
    | 'ERROR'

  payload?: {
    state?: HUDState
    frameData?: ImageBitmap
    error?: string
  }
}

// HUD 내부 상태
export interface HUDState {
  timestamp: number
  mouse: {
    x: number
    y: number
    buttons: number
  }
  targets?: {
    [id: string]: {
      x: number
      y: number
      locked: boolean
    }
  }
  customData?: unknown
}
