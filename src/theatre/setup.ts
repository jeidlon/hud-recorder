/**
 * 🎭 Theatre.js 설정
 * 
 * Theatre.js 프로젝트와 시트를 초기화합니다.
 * 
 * 구조:
 * - Project: "HUD" (전체 프로젝트)
 * - Sheet: "Main" (메인 타임라인)
 * - Objects: 각 HUD 컴포넌트별 애니메이션 속성
 */

import { getProject, types } from '@theatre/core'

// 개발 환경에서만 Studio 로드
let studioInitialized = false

export async function initTheatreStudio() {
  if (studioInitialized) return
  
  if (import.meta.env.DEV) {
    try {
      const studio = await import('@theatre/studio')
      studio.default.initialize()
      studioInitialized = true
      console.log('[Theatre] Studio initialized')
    } catch (e) {
      console.warn('[Theatre] Failed to load studio:', e)
    }
  }
}

// 메인 프로젝트 생성
export const hudProject = getProject('HUD', {
  // 저장된 상태가 있으면 로드 (나중에 JSON으로 저장/로드)
  // state: savedState,
})

// 메인 시트 (타임라인)
export const mainSheet = hudProject.sheet('Main')

/**
 * 공통 애니메이션 속성 타입들
 */
export const AnimationProps = {
  // 기본 트랜스폼
  transform: {
    opacity: types.number(1, { range: [0, 1] }),
    x: types.number(0, { range: [-500, 500] }),
    y: types.number(0, { range: [-500, 500] }),
    scale: types.number(1, { range: [0, 3] }),
    rotate: types.number(0, { range: [-360, 360] }),
  },
  
  // 페이드인 전용
  fadeIn: {
    opacity: types.number(0, { range: [0, 1] }),
    y: types.number(20, { range: [-100, 100] }),
  },
  
  // 슬라이드 전용
  slideIn: {
    opacity: types.number(0, { range: [0, 1] }),
    x: types.number(-50, { range: [-200, 200] }),
  },
  
  // 스케일 펄스
  pulse: {
    scale: types.number(1, { range: [0.5, 2] }),
    opacity: types.number(1, { range: [0, 1] }),
  },
}

/**
 * HUD 컴포넌트별 Sheet Object 생성
 */
export function createHUDObject(
  objectId: string, 
  propType: keyof typeof AnimationProps = 'transform'
) {
  return mainSheet.object(objectId, AnimationProps[propType])
}

/**
 * 시퀀스 위치 설정 (프레임 기반)
 * @param frame 현재 프레임 번호
 * @param fps FPS (기본 60)
 */
export function setSequencePosition(frame: number, fps: number = 60) {
  const timeInSeconds = frame / fps
  mainSheet.sequence.position = timeInSeconds
}

/**
 * 시퀀스 재생
 */
export async function playSequence(options?: {
  iterationCount?: number
  range?: [number, number]
  rate?: number
}) {
  return mainSheet.sequence.play({
    iterationCount: options?.iterationCount ?? 1,
    range: options?.range,
    rate: options?.rate ?? 1,
  })
}

/**
 * 시퀀스 일시정지
 */
export function pauseSequence() {
  mainSheet.sequence.pause()
}

/**
 * 현재 시퀀스 위치 (초)
 */
export function getSequencePosition(): number {
  return mainSheet.sequence.position
}

// 타입 export
export { types } from '@theatre/core'
