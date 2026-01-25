import type {
  InputEvent,
  MouseEventData,
  WheelEventData,
  KeyboardEventData,
  HUDStateSnapshot,
} from '@/types/input-log'
import { animationEventLog, type AnimationEvent } from '@/theatre/animations'
import { eventSourceLog, type HUDEvent } from './EventSourceLog'

export class InputRecorder {
  private isRecording = false
  private startTime = 0
  private inputLog: InputEvent[] = []
  private hudStateLog: HUDStateSnapshot[] = []
  private targetElement: HTMLElement | null = null
  private lastMouseMoveTime = 0
  private readonly THROTTLE_MS = 16 // ~60fps

  // 바인딩된 이벤트 핸들러들
  private boundHandlers: {
    mousemove: (e: MouseEvent) => void
    mousedown: (e: MouseEvent) => void
    mouseup: (e: MouseEvent) => void
    click: (e: MouseEvent) => void
    wheel: (e: WheelEvent) => void
    keydown: (e: KeyboardEvent) => void
    keyup: (e: KeyboardEvent) => void
  }

  constructor() {
    // 핸들러 바인딩
    this.boundHandlers = {
      mousemove: this.handleMouseMove.bind(this),
      mousedown: this.handleMouseDown.bind(this),
      mouseup: this.handleMouseUp.bind(this),
      click: this.handleClick.bind(this),
      wheel: this.handleWheel.bind(this),
      keydown: this.handleKeyDown.bind(this),
      keyup: this.handleKeyUp.bind(this),
    }
  }

  start(targetElement: HTMLElement): void {
    if (this.isRecording) {
      console.warn('Already recording')
      return
    }

    this.targetElement = targetElement
    this.isRecording = true
    this.startTime = performance.now()
    this.inputLog = []
    this.hudStateLog = []
    this.lastMouseMoveTime = 0

    // 🎬 애니메이션 이벤트 녹화 시작
    animationEventLog.startRecording()
    
    // 🎬 Event Sourcing 녹화 시작
    eventSourceLog.start()

    // 이벤트 리스너 등록
    targetElement.addEventListener('mousemove', this.boundHandlers.mousemove)
    targetElement.addEventListener('mousedown', this.boundHandlers.mousedown)
    targetElement.addEventListener('mouseup', this.boundHandlers.mouseup)
    targetElement.addEventListener('click', this.boundHandlers.click)
    targetElement.addEventListener('wheel', this.boundHandlers.wheel)
    window.addEventListener('keydown', this.boundHandlers.keydown)
    window.addEventListener('keyup', this.boundHandlers.keyup)

    console.log('Input recording started')
  }

  stop(): { 
    inputLog: InputEvent[]
    hudStateLog: HUDStateSnapshot[]
    animationEvents: AnimationEvent[]
    hudEvents: HUDEvent[]
    duration: number 
  } {
    if (!this.isRecording || !this.targetElement) {
      return { inputLog: [], hudStateLog: [], animationEvents: [], hudEvents: [], duration: 0 }
    }

    // 이벤트 리스너 제거
    this.targetElement.removeEventListener('mousemove', this.boundHandlers.mousemove)
    this.targetElement.removeEventListener('mousedown', this.boundHandlers.mousedown)
    this.targetElement.removeEventListener('mouseup', this.boundHandlers.mouseup)
    this.targetElement.removeEventListener('click', this.boundHandlers.click)
    this.targetElement.removeEventListener('wheel', this.boundHandlers.wheel)
    window.removeEventListener('keydown', this.boundHandlers.keydown)
    window.removeEventListener('keyup', this.boundHandlers.keyup)

    // 🎬 애니메이션 이벤트 녹화 중지
    const animationEvents = animationEventLog.stopRecording()
    
    // 🎬 Event Sourcing 녹화 중지
    const hudEvents = eventSourceLog.stop()

    const duration = performance.now() - this.startTime
    this.isRecording = false

    console.log(
      `Input recording stopped. Duration: ${duration.toFixed(0)}ms, Events: ${this.inputLog.length}, AnimEvents: ${animationEvents.length}, HUDEvents: ${hudEvents.length}`
    )

    return {
      inputLog: [...this.inputLog],
      hudStateLog: [...this.hudStateLog],
      animationEvents,
      hudEvents,
      duration,
    }
  }

  // HUD로부터 상태 업데이트 수신
  addHUDState(state: HUDStateSnapshot): void {
    if (!this.isRecording) return

    this.hudStateLog.push({
      ...state,
      timestamp: performance.now() - this.startTime,
    })
  }

  get recording(): boolean {
    return this.isRecording
  }

  get currentTime(): number {
    if (!this.isRecording) return 0
    return performance.now() - this.startTime
  }

  get eventCount(): number {
    return this.inputLog.length
  }

  // --- 이벤트 핸들러들 ---

  private handleMouseMove(e: MouseEvent): void {
    // Throttle mousemove events
    const now = performance.now()
    if (now - this.lastMouseMoveTime < this.THROTTLE_MS) {
      return
    }
    this.lastMouseMoveTime = now
    this.logMouseEvent('mousemove', e)
  }

  private handleMouseDown(e: MouseEvent): void {
    this.logMouseEvent('mousedown', e)
  }

  private handleMouseUp(e: MouseEvent): void {
    this.logMouseEvent('mouseup', e)
  }

  private handleClick(e: MouseEvent): void {
    this.logMouseEvent('click', e)
  }

  private handleWheel(e: WheelEvent): void {
    const data: WheelEventData = {
      x: e.offsetX,
      y: e.offsetY,
      deltaX: e.deltaX,
      deltaY: e.deltaY,
    }
    this.inputLog.push({
      type: 'wheel',
      timestamp: performance.now() - this.startTime,
      data,
    })
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.logKeyboardEvent('keydown', e)
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.logKeyboardEvent('keyup', e)
  }

  private logMouseEvent(type: InputEvent['type'], e: MouseEvent): void {
    const data: MouseEventData = {
      x: e.offsetX,
      y: e.offsetY,
      buttons: e.buttons,
      button: type === 'click' ? e.button : undefined,
    }
    this.inputLog.push({
      type,
      timestamp: performance.now() - this.startTime,
      data,
    })
  }

  private logKeyboardEvent(type: 'keydown' | 'keyup', e: KeyboardEvent): void {
    const data: KeyboardEventData = {
      key: e.key,
      code: e.code,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    }
    this.inputLog.push({
      type,
      timestamp: performance.now() - this.startTime,
      data,
    })
  }
}
