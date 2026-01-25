/**
 * 🎬 Animation Event Log
 * 
 * UI 요소의 등장/사라짐 이벤트를 기록합니다.
 * 이 로그를 통해 렌더링 시 각 요소의 정확한 애니메이션 시작 시간을 알 수 있습니다.
 * 
 * 핵심 원리:
 * 1. 미리보기 중: 요소가 마운트될 때 이벤트 기록
 * 2. 렌더링 중: 이벤트 로그를 참조하여 애니메이션 재생
 */

import type { AnimationPresetName } from './presets'

export type AnimationEventType = 'enter' | 'exit' | 'trigger'

export interface AnimationEvent {
  /** 이벤트 발생 시간 (ms) */
  timestamp: number
  /** UI 요소 ID */
  elementId: string
  /** 이벤트 타입 */
  type: AnimationEventType
  /** 애니메이션 프리셋 */
  preset?: AnimationPresetName
  /** 애니메이션 지속 시간 (ms) */
  duration?: number
  /** 추가 데이터 (위치, 크기 등) */
  data?: Record<string, unknown>
}

class AnimationEventLogManager {
  private events: AnimationEvent[] = []
  private startTime: number = 0
  private isRecording: boolean = false

  /**
   * 녹화 시작
   */
  startRecording(): void {
    this.events = []
    this.startTime = performance.now()
    this.isRecording = true
    console.log('[AnimationEventLog] Recording started')
  }

  /**
   * 녹화 중지
   */
  stopRecording(): AnimationEvent[] {
    this.isRecording = false
    console.log('[AnimationEventLog] Recording stopped, events:', this.events.length)
    return [...this.events]
  }

  /**
   * 이벤트 기록
   */
  logEvent(event: Omit<AnimationEvent, 'timestamp'>): void {
    if (!this.isRecording) return

    const timestamp = performance.now() - this.startTime
    this.events.push({
      ...event,
      timestamp,
    })
  }

  /**
   * 요소 등장 기록
   */
  logEnter(elementId: string, preset?: AnimationPresetName, duration?: number, data?: Record<string, unknown>): void {
    this.logEvent({
      elementId,
      type: 'enter',
      preset,
      duration,
      data,
    })
  }

  /**
   * 요소 사라짐 기록
   */
  logExit(elementId: string, preset?: AnimationPresetName, duration?: number): void {
    this.logEvent({
      elementId,
      type: 'exit',
      preset,
      duration,
    })
  }

  /**
   * 트리거 이벤트 기록 (히트마커, 데미지 효과 등)
   */
  logTrigger(elementId: string, data?: Record<string, unknown>): void {
    this.logEvent({
      elementId,
      type: 'trigger',
      data,
    })
  }

  /**
   * 특정 요소의 가장 최근 Enter 이벤트 시간 가져오기
   */
  getLastEnterTime(elementId: string, beforeTimestamp?: number): number | undefined {
    const relevantEvents = this.events.filter(e => 
      e.elementId === elementId && 
      e.type === 'enter' &&
      (beforeTimestamp === undefined || e.timestamp <= beforeTimestamp)
    )
    
    if (relevantEvents.length === 0) return undefined
    return relevantEvents[relevantEvents.length - 1].timestamp
  }

  /**
   * 특정 시간대의 모든 활성 요소 가져오기
   */
  getActiveElements(atTimestamp: number): Map<string, AnimationEvent> {
    const activeElements = new Map<string, AnimationEvent>()
    
    for (const event of this.events) {
      if (event.timestamp > atTimestamp) break
      
      if (event.type === 'enter') {
        activeElements.set(event.elementId, event)
      } else if (event.type === 'exit') {
        activeElements.delete(event.elementId)
      }
    }
    
    return activeElements
  }

  /**
   * 이벤트 로그 가져오기
   */
  getEvents(): AnimationEvent[] {
    return [...this.events]
  }

  /**
   * 이벤트 로그 설정 (렌더링 모드용)
   */
  setEvents(events: AnimationEvent[]): void {
    this.events = [...events]
  }

  /**
   * 녹화 중인지 확인
   */
  getIsRecording(): boolean {
    return this.isRecording
  }

  /**
   * 이벤트 로그를 JSON으로 직렬화
   */
  toJSON(): string {
    return JSON.stringify(this.events)
  }

  /**
   * JSON에서 이벤트 로그 복원
   */
  fromJSON(json: string): void {
    try {
      this.events = JSON.parse(json)
    } catch (e) {
      console.error('[AnimationEventLog] Failed to parse JSON:', e)
      this.events = []
    }
  }
}

// 싱글톤 인스턴스
export const animationEventLog = new AnimationEventLogManager()

/**
 * React 훅: 요소 마운트/언마운트 시 자동 기록
 */
import { useEffect, useRef } from 'react'

export function useAnimationEventLog(
  elementId: string,
  options?: {
    enterPreset?: AnimationPresetName
    exitPreset?: AnimationPresetName
    duration?: number
    data?: Record<string, unknown>
  }
): void {
  const hasLogged = useRef(false)

  useEffect(() => {
    if (!hasLogged.current) {
      animationEventLog.logEnter(
        elementId,
        options?.enterPreset,
        options?.duration,
        options?.data
      )
      hasLogged.current = true
    }

    return () => {
      animationEventLog.logExit(elementId, options?.exitPreset)
    }
  }, [elementId, options?.enterPreset, options?.exitPreset, options?.duration])
}

export default animationEventLog
