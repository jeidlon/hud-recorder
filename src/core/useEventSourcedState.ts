/**
 * 🎬 Event Sourced State Hook
 * 
 * HUD 상태 변경을 자동으로 이벤트로 기록하는 훅
 */

import { useCallback, useRef } from 'react'
import { eventSourceLog, type HUDEventType, type HUDEventPayload } from './EventSourceLog'

/**
 * 이벤트 발행 훅
 * 
 * 컴포넌트에서 사용:
 * const emit = useEventEmitter()
 * emit('SCENARIO_CHANGE', { scenario: 'monster_combat' })
 */
export function useEventEmitter() {
  const emit = useCallback((type: HUDEventType, payload: HUDEventPayload = {}) => {
    eventSourceLog.log(type, payload)
  }, [])
  
  return emit
}

/**
 * 변경 감지 및 이벤트 발행
 * 
 * 이전 값과 새 값을 비교하여 변경된 경우에만 이벤트 발행
 */
export function useChangeDetector<T>() {
  const prevRef = useRef<T | undefined>(undefined)
  
  const detectChange = useCallback((
    currentValue: T,
    eventType: HUDEventType,
    payloadBuilder: (current: T, prev: T | undefined) => HUDEventPayload
  ) => {
    if (prevRef.current !== currentValue) {
      const payload = payloadBuilder(currentValue, prevRef.current)
      eventSourceLog.log(eventType, payload)
      prevRef.current = currentValue
    }
  }, [])
  
  return detectChange
}

/**
 * 녹화 상태 확인 훅
 */
export function useIsRecording() {
  return eventSourceLog.isActive()
}

/**
 * 현재 녹화 시간 훅
 */
export function useRecordingTime() {
  return eventSourceLog.getCurrentTime()
}

export { eventSourceLog }
