import type { InputEvent, HUDStateSnapshot, MouseEventData } from '@/types/input-log'

export interface FrameState {
  mouse: { x: number; y: number; buttons: number }
  targets?: Record<string, { x: number; y: number; locked: boolean }>
  customData?: unknown // HUD에서 전달한 커스텀 데이터
}

/**
 * 특정 타임스탬프에서의 입력 상태를 계산
 * Offline Rendering 시 각 프레임에 해당하는 상태를 얻기 위해 사용
 */
export class InputInterpolator {
  private inputLog: InputEvent[]
  private hudStateLog: HUDStateSnapshot[]

  constructor(inputLog: InputEvent[], hudStateLog: HUDStateSnapshot[]) {
    this.inputLog = inputLog
    this.hudStateLog = hudStateLog
  }

  /**
   * 특정 시간의 프레임 상태를 계산
   * @param timestamp - 밀리초 단위 타임스탬프
   */
  getStateAtTime(timestamp: number): FrameState {
    // 1. HUD 상태 로그에서 보간된 상태 가져오기
    const interpolatedState = this.interpolateHUDState(timestamp)

    if (interpolatedState) {
      return interpolatedState
    }

    // 2. HUD 상태가 없으면 Input 로그에서 마우스 위치 보간
    const mouseState = this.interpolateMousePosition(timestamp)

    return {
      mouse: mouseState,
    }
  }

  /**
   * HUD 상태 로그에서 선형 보간
   * 마우스 위치를 부드럽게 연결
   */
  private interpolateHUDState(timestamp: number): FrameState | null {
    if (this.hudStateLog.length === 0) return null

    // 이진 탐색으로 timestamp 이전/이후 상태 찾기
    let beforeIdx = -1
    let afterIdx = -1

    // 이진 탐색으로 timestamp 직전 상태 찾기
    let left = 0
    let right = this.hudStateLog.length - 1

    while (left <= right) {
      const mid = Math.floor((left + right) / 2)
      if (this.hudStateLog[mid].timestamp <= timestamp) {
        beforeIdx = mid
        left = mid + 1
      } else {
        right = mid - 1
      }
    }

    // 이후 상태
    afterIdx = beforeIdx + 1

    // 경계 조건 처리
    if (beforeIdx < 0) {
      // timestamp가 첫 상태보다 이전
      const state = this.hudStateLog[0]
      return {
        mouse: state.mouse,
        targets: state.targets,
        customData: state.customData,
      }
    }

    if (afterIdx >= this.hudStateLog.length) {
      // timestamp가 마지막 상태 이후
      const state = this.hudStateLog[this.hudStateLog.length - 1]
      return {
        mouse: state.mouse,
        targets: state.targets,
        customData: state.customData,
      }
    }

    // 선형 보간
    const before = this.hudStateLog[beforeIdx]
    const after = this.hudStateLog[afterIdx]
    
    const t = (timestamp - before.timestamp) / (after.timestamp - before.timestamp)
    
    // 마우스 위치 보간
    const interpolatedMouse = {
      x: before.mouse.x + (after.mouse.x - before.mouse.x) * t,
      y: before.mouse.y + (after.mouse.y - before.mouse.y) * t,
      buttons: before.mouse.buttons, // 버튼 상태는 보간하지 않음
    }

    // targets 보간
    let interpolatedTargets: Record<string, { x: number; y: number; locked: boolean }> | undefined
    
    if (before.targets && after.targets) {
      interpolatedTargets = {}
      for (const key of Object.keys(before.targets)) {
        if (after.targets[key]) {
          interpolatedTargets[key] = {
            x: before.targets[key].x + (after.targets[key].x - before.targets[key].x) * t,
            y: before.targets[key].y + (after.targets[key].y - before.targets[key].y) * t,
            locked: before.targets[key].locked, // locked 상태는 보간하지 않음
          }
        }
      }
    } else {
      interpolatedTargets = before.targets
    }

    // customData는 이전 상태 사용 (보간 불가)
    return {
      mouse: interpolatedMouse,
      targets: interpolatedTargets,
      customData: before.customData,
    }
  }

  private interpolateMousePosition(timestamp: number): {
    x: number
    y: number
    buttons: number
  } {
    // 마우스 이벤트만 필터링
    const mouseEvents = this.inputLog.filter(
      (e) => e.type === 'mousemove' || e.type === 'mousedown' || e.type === 'mouseup'
    )

    if (mouseEvents.length === 0) {
      return { x: 0, y: 0, buttons: 0 }
    }

    // timestamp 전후의 이벤트 찾기
    let before: InputEvent | null = null
    let after: InputEvent | null = null

    for (const event of mouseEvents) {
      if (event.timestamp <= timestamp) {
        before = event
      } else {
        after = event
        break
      }
    }

    // 보간 계산
    if (!before) {
      const data = after!.data as MouseEventData
      return { x: data.x, y: data.y, buttons: data.buttons }
    }
    if (!after) {
      const data = before.data as MouseEventData
      return { x: data.x, y: data.y, buttons: data.buttons }
    }

    // 선형 보간
    const beforeData = before.data as MouseEventData
    const afterData = after.data as MouseEventData
    const t = (timestamp - before.timestamp) / (after.timestamp - before.timestamp)

    return {
      x: Math.round(beforeData.x + (afterData.x - beforeData.x) * t),
      y: Math.round(beforeData.y + (afterData.y - beforeData.y) * t),
      buttons: beforeData.buttons, // 버튼 상태는 보간하지 않음
    }
  }

  /**
   * 전체 녹화에서 프레임별 상태 배열 생성
   * @param fps - 프레임레이트
   * @param duration - 총 길이 (ms)
   */
  generateFrameStates(fps: number, duration: number): FrameState[] {
    const frameInterval = 1000 / fps
    const frameCount = Math.ceil(duration / frameInterval)
    const states: FrameState[] = []

    for (let i = 0; i < frameCount; i++) {
      const timestamp = i * frameInterval
      states.push(this.getStateAtTime(timestamp))
    }

    return states
  }
}
