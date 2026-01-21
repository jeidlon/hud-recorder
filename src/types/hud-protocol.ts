// 메인 앱 → HUD 앱으로 보내는 메시지
export interface MainToHUDMessage {
  type:
    | 'INIT' // 초기화
    | 'PLAY' // 재생 시작
    | 'PAUSE' // 일시정지
    | 'SEEK' // 특정 시간으로 이동
    | 'SET_STATE' // HUD 상태 설정 (offline rendering 시)
    | 'CAPTURE_FRAME' // 현재 프레임 캡처 요청

  payload?: {
    time?: number // 현재 시간 (ms)
    width?: number // 비디오 너비
    height?: number // 비디오 높이
    fps?: number // 프레임레이트
    state?: HUDState // 복원할 상태
  }
}

// HUD 앱 → 메인 앱으로 보내는 메시지
export interface HUDToMainMessage {
  type:
    | 'READY' // HUD 로드 완료
    | 'STATE_UPDATE' // 상태 변경 (마우스 등)
    | 'FRAME_CAPTURED' // 캡처된 프레임 데이터
    | 'ERROR'

  payload?: {
    state?: HUDState
    frameData?: ImageBitmap // 캡처된 HUD 프레임
    error?: string
  }
}

// HUD 내부 상태 (Input Recording에 사용)
export interface HUDState {
  timestamp: number // ms
  mouse: {
    x: number
    y: number
    buttons: number // 마우스 버튼 상태
  }
  targets?: {
    // HUD별 커스텀 상태 (예: target lock)
    [id: string]: {
      x: number
      y: number
      locked: boolean
    }
  }
  customData?: unknown // HUD 앱이 자유롭게 사용
}
