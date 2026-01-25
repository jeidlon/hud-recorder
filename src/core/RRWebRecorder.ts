/**
 * 🎬 RRWeb Recorder - DOM 변화 기반 녹화 시스템
 * 
 * rrweb를 사용하여 모든 DOM 변화를 이벤트로 기록하고,
 * 나중에 완벽하게 재현할 수 있습니다.
 * 
 * 장점:
 * - "보이는 그대로" 재현
 * - Framer Motion 애니메이션 완벽 지원
 * - React 상태 변화 자동 캡처
 */

import * as rrweb from 'rrweb'
import type { eventWithTime, recordOptions } from 'rrweb'

export interface RRWebSession {
  events: eventWithTime[]
  startTime: number
  endTime: number
  duration: number
  metadata: {
    width: number
    height: number
    fps: number
    presetId?: string
  }
}

class RRWebRecorderManager {
  private events: eventWithTime[] = []
  private stopFn: (() => void) | null = null
  private startTime: number = 0
  private isRecording: boolean = false
  private metadata: RRWebSession['metadata'] = {
    width: 1920,
    height: 1080,
    fps: 60,
  }

  /**
   * 녹화 시작
   */
  startRecording(options?: {
    targetElement?: HTMLElement
    presetId?: string
  }): void {
    if (this.isRecording) {
      console.warn('[RRWebRecorder] Already recording')
      return
    }

    this.events = []
    this.startTime = Date.now()
    this.isRecording = true

    if (options?.presetId) {
      this.metadata.presetId = options.presetId
    }

    const recordOptions: Partial<recordOptions<eventWithTime>> = {
      emit: (event) => {
        this.events.push(event)
      },
      // 캔버스, 비디오 등 미디어 요소도 녹화
      recordCanvas: true,
      // 마우스 이동 샘플링 (성능 최적화)
      sampling: {
        mousemove: true,
        mouseInteraction: true,
        scroll: 150,
        input: 'last',
      },
      // 특정 요소만 녹화 (선택사항)
      // recordAfter: 'DOMContentLoaded',
    }

    // 특정 요소만 녹화하려면
    // if (options?.targetElement) {
    //   recordOptions.emit = ... 
    // }

    this.stopFn = rrweb.record(recordOptions)

    console.log('[RRWebRecorder] Recording started', {
      presetId: options?.presetId,
      startTime: this.startTime,
    })
  }

  /**
   * 녹화 중지
   */
  stopRecording(): RRWebSession {
    if (!this.isRecording || !this.stopFn) {
      console.warn('[RRWebRecorder] Not recording')
      return this.getEmptySession()
    }

    this.stopFn()
    this.stopFn = null
    this.isRecording = false

    const endTime = Date.now()
    const session: RRWebSession = {
      events: [...this.events],
      startTime: this.startTime,
      endTime,
      duration: endTime - this.startTime,
      metadata: { ...this.metadata },
    }

    console.log('[RRWebRecorder] Recording stopped', {
      eventCount: session.events.length,
      duration: session.duration,
    })

    return session
  }

  /**
   * 현재 녹화 중인지 확인
   */
  getIsRecording(): boolean {
    return this.isRecording
  }

  /**
   * 현재 이벤트 수
   */
  getEventCount(): number {
    return this.events.length
  }

  /**
   * 세션을 JSON으로 내보내기
   */
  exportSessionToJSON(session: RRWebSession): string {
    return JSON.stringify(session, null, 2)
  }

  /**
   * JSON에서 세션 가져오기
   */
  importSessionFromJSON(json: string): RRWebSession {
    try {
      return JSON.parse(json) as RRWebSession
    } catch (e) {
      console.error('[RRWebRecorder] Failed to parse session JSON:', e)
      return this.getEmptySession()
    }
  }

  /**
   * 세션 다운로드
   */
  downloadSession(session: RRWebSession, filename = 'rrweb-session.json'): void {
    const json = this.exportSessionToJSON(session)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    
    URL.revokeObjectURL(url)
  }

  private getEmptySession(): RRWebSession {
    return {
      events: [],
      startTime: 0,
      endTime: 0,
      duration: 0,
      metadata: { ...this.metadata },
    }
  }
}

// 싱글톤 인스턴스
export const rrwebRecorder = new RRWebRecorderManager()
export default rrwebRecorder
