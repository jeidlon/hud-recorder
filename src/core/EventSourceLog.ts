/**
 * 🎬 Event Sourcing 시스템
 * 
 * 모든 HUD 상태 변화를 이벤트로 기록하여
 * Remotion 렌더링 시 정확한 상태 복원 가능
 * 
 * 핵심 원리:
 * - 미리보기 중: 모든 상태 변화를 타임스탬프와 함께 기록
 * - 렌더링 시: 현재 프레임 시간까지의 이벤트를 순서대로 적용
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 이벤트 타입 정의
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type HUDEventType =
  // 시나리오/모드 변경
  | 'SCENARIO_CHANGE'
  | 'THEME_CHANGE'
  | 'ONBOARDING_STEP'
  
  // UI 요소 등장/퇴장
  | 'UI_ENTER'
  | 'UI_EXIT'
  
  // 애니메이션
  | 'ANIMATION_START'
  | 'ANIMATION_END'
  
  // Fire 시퀀스
  | 'FIRE_START'
  | 'FIRE_END'
  
  // 상태 변경
  | 'HP_CHANGE'
  | 'MP_CHANGE'
  | 'PLAYER_DEAD'
  
  // 타겟팅
  | 'TARGET_LOCK'
  | 'TARGET_RELEASE'
  | 'TARGET_MOVE'
  
  // 히트마커
  | 'HITMARKER_SPAWN'
  | 'HITMARKER_REMOVE'
  
  // 대미지 화살표
  | 'DAMAGE_ARROW_SPAWN'
  | 'DAMAGE_ARROW_REMOVE'
  
  // 채팅/알림
  | 'CHAT_MESSAGE'
  | 'MONSTER_ALERT'
  
  // 마우스
  | 'MOUSE_MOVE'
  | 'MOUSE_CLICK'
  | 'MOUSE_RELEASE'

// 이벤트 페이로드 타입
export interface HUDEventPayload {
  // 공통
  elementId?: string
  
  // 시나리오
  scenario?: string
  prevScenario?: string
  
  // 테마
  theme?: 'normal' | 'danger'
  
  // 온보딩
  onboardingStep?: 'hidden' | 'boot' | 'link' | 'sync' | 'complete'
  
  // 애니메이션
  animationType?: string
  duration?: number
  from?: Record<string, number>
  to?: Record<string, number>
  
  // Fire
  target?: 'rubian' | 'subin' | 'both'
  
  // HP/MP
  currentHp?: number
  maxHp?: number
  currentMp?: number
  maxMp?: number
  damage?: number
  
  // 타겟
  targetId?: number
  position?: { x: number; y: number }
  
  // 마우스
  mouse?: { x: number; y: number; buttons: number }
  
  // 메시지
  message?: string
  
  // 기타
  [key: string]: unknown
}

// 이벤트 구조
export interface HUDEvent {
  /** 이벤트 발생 시간 (녹화 시작부터 ms) */
  timestamp: number
  /** 이벤트 타입 */
  type: HUDEventType
  /** 이벤트 데이터 */
  payload: HUDEventPayload
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 이벤트 로거 클래스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class EventSourceLogger {
  private events: HUDEvent[] = []
  private isRecording = false
  private startTime = 0
  
  /**
   * 녹화 시작
   */
  start(): void {
    this.events = []
    this.isRecording = true
    this.startTime = performance.now()
    console.log('[EventSourceLog] Recording started')
  }
  
  /**
   * 녹화 중지 및 이벤트 반환
   */
  stop(): HUDEvent[] {
    this.isRecording = false
    const result = [...this.events]
    console.log(`[EventSourceLog] Recording stopped. ${result.length} events captured`)
    return result
  }
  
  /**
   * 이벤트 기록
   */
  log(type: HUDEventType, payload: HUDEventPayload = {}): void {
    if (!this.isRecording) return
    
    const timestamp = performance.now() - this.startTime
    const event: HUDEvent = { timestamp, type, payload }
    this.events.push(event)
    
    // 디버그 로그 (마우스 이동 제외)
    if (type !== 'MOUSE_MOVE') {
      console.log(`[EventSourceLog] ${type}`, payload)
    }
  }
  
  /**
   * 현재 시간 가져오기 (녹화 시작부터 ms)
   */
  getCurrentTime(): number {
    if (!this.isRecording) return 0
    return performance.now() - this.startTime
  }
  
  /**
   * 녹화 중인지 확인
   */
  isActive(): boolean {
    return this.isRecording
  }
  
  /**
   * 현재까지 기록된 이벤트 수
   */
  getEventCount(): number {
    return this.events.length
  }
  
  /**
   * 이벤트 로그 초기화 (외부에서 주입)
   */
  loadEvents(events: HUDEvent[]): void {
    this.events = [...events]
    console.log(`[EventSourceLog] Loaded ${events.length} events`)
  }
  
  /**
   * 현재 이벤트 목록 반환 (읽기 전용)
   */
  getEvents(): readonly HUDEvent[] {
    return this.events
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 이벤트 리플레이어 (Remotion 렌더링용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ReplayedState {
  // 시나리오
  scenario: string
  theme: 'normal' | 'danger'
  onboardingStep: 'hidden' | 'boot' | 'link' | 'sync' | 'complete'
  
  // 플레이어
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  isDead: boolean
  
  // Fire 효과
  fireRubian: boolean
  fireSubin: boolean
  fireStartTime: { rubian: number | null; subin: number | null }
  
  // 타겟
  targets: Map<number, { x: number; y: number; startTime: number }>
  
  // 히트마커
  hitMarkers: Array<{ id: number; x: number; y: number; startTime: number }>
  
  // 마우스
  mouse: { x: number; y: number; buttons: number }
  
  // UI 요소 상태
  uiElements: Map<string, { visible: boolean; enterTime: number; exitTime: number | null }>
  
  // 애니메이션 상태
  animations: Map<string, { 
    type: string
    startTime: number
    duration: number
    from: Record<string, number>
    to: Record<string, number>
  }>
  
  // 채팅 메시지
  chatMessages: Array<{ message: string; time: number }>
  monsterAlertVisible: boolean
  monsterAlertTime: number | null
}

/**
 * 이벤트 기반 상태 리플레이어
 * 
 * 특정 시간까지의 모든 이벤트를 적용하여 정확한 상태 복원
 * 
 * 🎬 FPS 변경 시에도 정확한 타이밍 보장:
 * - 모든 이벤트는 ms(밀리초) 타임스탬프로 기록됨
 * - getStateAt(ms)은 해당 시점의 정확한 상태 반환
 * - 마우스 위치는 선형 보간(Interpolation)으로 부드럽게 처리
 */
export class EventReplayer {
  private events: HUDEvent[] = []
  private mouseEvents: HUDEvent[] = [] // 🎬 마우스 이벤트만 별도 캐싱
  private duration: number = 0 // 🎬 녹화 총 길이 (ms)
  
  constructor(events: HUDEvent[] = [], duration?: number) {
    this.events = [...events].sort((a, b) => a.timestamp - b.timestamp)
    // 마우스 이벤트만 별도 추출 (보간용)
    this.mouseEvents = this.events.filter(e => e.type === 'MOUSE_MOVE')
    
    // 🎬 녹화 길이 설정: 명시적으로 주어지거나, 마지막 이벤트 시간 사용
    if (duration !== undefined) {
      this.duration = duration
    } else if (this.events.length > 0) {
      this.duration = this.events[this.events.length - 1].timestamp
    }
  }
  
  /**
   * 🎬 녹화 총 길이 반환
   */
  getDuration(): number {
    return this.duration
  }
  
  /**
   * 🎬 마우스 위치 선형 보간
   * 
   * 30fps 녹화 → 60fps 렌더링 시에도 부드러운 마우스 움직임 보장
   */
  private interpolateMouse(timestampMs: number): { x: number; y: number; buttons: number } {
    if (this.mouseEvents.length === 0) {
      return { x: 960, y: 540, buttons: 0 }
    }
    
    // 현재 시간 이전/이후 마우스 이벤트 찾기
    let prevEvent: HUDEvent | null = null
    let nextEvent: HUDEvent | null = null
    
    for (let i = 0; i < this.mouseEvents.length; i++) {
      if (this.mouseEvents[i].timestamp <= timestampMs) {
        prevEvent = this.mouseEvents[i]
      } else {
        nextEvent = this.mouseEvents[i]
        break
      }
    }
    
    // 이전 이벤트가 없으면 첫 번째 이벤트 사용
    if (!prevEvent) {
      const first = this.mouseEvents[0].payload.mouse
      return first ? { ...first } : { x: 960, y: 540, buttons: 0 }
    }
    
    // 다음 이벤트가 없으면 마지막 이벤트 사용
    if (!nextEvent) {
      const last = prevEvent.payload.mouse
      return last ? { ...last } : { x: 960, y: 540, buttons: 0 }
    }
    
    // 🎬 선형 보간 (Linear Interpolation)
    const prevMouse = prevEvent.payload.mouse!
    const nextMouse = nextEvent.payload.mouse!
    const t = (timestampMs - prevEvent.timestamp) / (nextEvent.timestamp - prevEvent.timestamp)
    
    return {
      x: prevMouse.x + (nextMouse.x - prevMouse.x) * t,
      y: prevMouse.y + (nextMouse.y - prevMouse.y) * t,
      buttons: prevMouse.buttons, // buttons는 보간하지 않음 (discrete 값)
    }
  }
  
  /**
   * 특정 시간의 상태 계산
   * 
   * @param timestampMs - 밀리초 단위 타임스탬프
   * @returns 해당 시점의 HUD 상태
   * 
   * 🎬 Edge Case 처리:
   * - timestampMs < 0: 0으로 Clamp
   * - timestampMs > duration: duration으로 Clamp (마지막 상태 유지)
   */
  getStateAt(timestampMs: number): ReplayedState {
    // 🎬 타임스탬프 Clamp (녹화 범위 내로 제한)
    const clampedTimestamp = Math.max(0, Math.min(timestampMs, this.duration))
    
    // 초기 상태
    const state: ReplayedState = {
      scenario: 'normal',
      theme: 'normal',
      onboardingStep: 'hidden',
      hp: 1500,
      maxHp: 1500,
      mp: 800,
      maxMp: 800,
      isDead: false,
      fireRubian: false,
      fireSubin: false,
      fireStartTime: { rubian: null, subin: null },
      targets: new Map(),
      hitMarkers: [],
      mouse: { x: 960, y: 540, buttons: 0 },
      uiElements: new Map(),
      animations: new Map(),
      chatMessages: [],
      monsterAlertVisible: false,
      monsterAlertTime: null,
    }
    
    // 🎬 시간까지의 모든 이벤트 적용 (Clamp된 시간 사용)
    for (const event of this.events) {
      if (event.timestamp > clampedTimestamp) break
      this.applyEvent(state, event)
    }
    
    // 🎬 마우스 위치 보간 적용 (부드러운 움직임, Clamp된 시간 사용)
    state.mouse = this.interpolateMouse(clampedTimestamp)
    
    return state
  }
  
  /**
   * 이벤트 적용
   */
  private applyEvent(state: ReplayedState, event: HUDEvent): void {
    const { type, payload, timestamp } = event
    
    switch (type) {
      case 'SCENARIO_CHANGE':
        state.scenario = payload.scenario || state.scenario
        break
        
      case 'THEME_CHANGE':
        state.theme = payload.theme || state.theme
        break
        
      case 'ONBOARDING_STEP':
        state.onboardingStep = payload.onboardingStep || state.onboardingStep
        break
        
      case 'UI_ENTER':
        if (payload.elementId) {
          state.uiElements.set(payload.elementId, {
            visible: true,
            enterTime: timestamp,
            exitTime: null,
          })
        }
        break
        
      case 'UI_EXIT':
        if (payload.elementId) {
          const el = state.uiElements.get(payload.elementId)
          if (el) {
            el.visible = false
            el.exitTime = timestamp
          }
        }
        break
        
      case 'ANIMATION_START':
        if (payload.elementId) {
          state.animations.set(payload.elementId, {
            type: payload.animationType || 'default',
            startTime: timestamp,
            duration: payload.duration || 300,
            from: payload.from || {},
            to: payload.to || {},
          })
        }
        break
        
      case 'FIRE_START':
        if (payload.target === 'rubian' || payload.target === 'both') {
          state.fireRubian = true
          state.fireStartTime.rubian = timestamp
        }
        if (payload.target === 'subin' || payload.target === 'both') {
          state.fireSubin = true
          state.fireStartTime.subin = timestamp
        }
        break
        
      case 'FIRE_END':
        if (payload.target === 'rubian' || payload.target === 'both') {
          state.fireRubian = false
        }
        if (payload.target === 'subin' || payload.target === 'both') {
          state.fireSubin = false
        }
        break
        
      case 'HP_CHANGE':
        state.hp = payload.currentHp ?? state.hp
        break
        
      case 'MP_CHANGE':
        state.mp = payload.currentMp ?? state.mp
        break
        
      case 'PLAYER_DEAD':
        state.isDead = true
        break
        
      case 'TARGET_LOCK':
        if (payload.targetId !== undefined && payload.position) {
          state.targets.set(payload.targetId, {
            x: payload.position.x,
            y: payload.position.y,
            startTime: timestamp,
          })
        }
        break
        
      case 'TARGET_MOVE':
        if (payload.targetId !== undefined && payload.position) {
          const target = state.targets.get(payload.targetId)
          if (target) {
            target.x = payload.position.x
            target.y = payload.position.y
          }
        }
        break
        
      case 'TARGET_RELEASE':
        if (payload.targetId !== undefined) {
          state.targets.delete(payload.targetId)
        }
        break
        
      case 'HITMARKER_SPAWN':
        if (payload.targetId !== undefined && payload.position) {
          state.hitMarkers.push({
            id: payload.targetId,
            x: payload.position.x,
            y: payload.position.y,
            startTime: timestamp,
          })
        }
        break
        
      case 'HITMARKER_REMOVE':
        if (payload.targetId !== undefined) {
          const idx = state.hitMarkers.findIndex(h => h.id === payload.targetId)
          if (idx >= 0) state.hitMarkers.splice(idx, 1)
        }
        break
        
      case 'MOUSE_MOVE':
      case 'MOUSE_CLICK':
      case 'MOUSE_RELEASE':
        if (payload.mouse) {
          state.mouse = { ...payload.mouse }
        }
        break
        
      case 'MONSTER_ALERT':
        state.monsterAlertVisible = true
        state.monsterAlertTime = timestamp
        break
        
      case 'CHAT_MESSAGE':
        if (payload.message) {
          state.chatMessages.push({ message: payload.message, time: timestamp })
        }
        break
    }
  }
  
  /**
   * 특정 요소의 애니메이션 진행률 계산
   */
  getAnimationProgress(
    elementId: string, 
    currentTime: number, 
    state: ReplayedState
  ): { progress: number; values: Record<string, number> } | null {
    const anim = state.animations.get(elementId)
    if (!anim) return null
    
    const elapsed = currentTime - anim.startTime
    const rawProgress = Math.min(1, Math.max(0, elapsed / anim.duration))
    
    // easeOutCubic
    const progress = 1 - Math.pow(1 - rawProgress, 3)
    
    // 보간된 값 계산
    const values: Record<string, number> = {}
    for (const key of Object.keys(anim.to)) {
      const from = anim.from[key] ?? (key === 'scale' || key === 'opacity' ? 1 : 0)
      const to = anim.to[key] ?? from
      values[key] = from + (to - from) * progress
    }
    
    return { progress, values }
  }
  
  /**
   * Fire 시퀀스의 현재 프레임 계산
   */
  getFireFrame(target: 'rubian' | 'subin', currentTime: number, state: ReplayedState): number | null {
    const startTime = target === 'rubian' ? state.fireStartTime.rubian : state.fireStartTime.subin
    const isActive = target === 'rubian' ? state.fireRubian : state.fireSubin
    
    if (!isActive || startTime === null) return null
    
    const elapsed = currentTime - startTime
    const fps = 30
    const totalFrames = 360 // 12초 * 30fps
    const frame = Math.floor((elapsed / 1000) * fps) % totalFrames
    
    return frame
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 싱글톤 인스턴스
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const eventSourceLog = new EventSourceLogger()

export default eventSourceLog
