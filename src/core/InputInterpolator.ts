import type { InputEvent, HUDStateSnapshot, MouseEventData } from '@/types/input-log'

export interface FrameState {
  mouse: { x: number; y: number; buttons: number }
  targets?: Record<string, { x: number; y: number; locked: boolean }>
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
    // 1. HUD 상태 로그에서 가장 가까운 상태 찾기
    const hudState = this.findNearestHUDState(timestamp)

    if (hudState) {
      return {
        mouse: hudState.mouse,
        targets: hudState.targets,
      }
    }

    // 2. HUD 상태가 없으면 Input 로그에서 마우스 위치 보간
    const mouseState = this.interpolateMousePosition(timestamp)

    return {
      mouse: mouseState,
    }
  }

  private findNearestHUDState(timestamp: number): HUDStateSnapshot | null {
    if (this.hudStateLog.length === 0) return null

    // 이진 탐색으로 가장 가까운 상태 찾기
    let left = 0
    let right = this.hudStateLog.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      if (this.hudStateLog[mid].timestamp < timestamp) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    // timestamp 이전의 가장 가까운 상태 반환
    if (left > 0 && this.hudStateLog[left].timestamp > timestamp) {
      return this.hudStateLog[left - 1]
    }
    return this.hudStateLog[left]
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
