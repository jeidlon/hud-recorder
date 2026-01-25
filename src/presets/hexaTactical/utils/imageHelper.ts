/**
 * 이미지 경로 헬퍼
 * 
 * Remotion 렌더링과 일반 웹 환경 모두에서 동작
 */

// Remotion 환경인지 감지
function isRemotionEnvironment(): boolean {
  // Remotion은 headless 브라우저에서 실행됨
  // __REMOTION_DEV__ 또는 window가 특정 속성을 가지고 있음
  if (typeof window !== 'undefined') {
    // Remotion은 특정 속성을 window에 추가함
    // @ts-ignore
    return !!(window.__REMOTION__ || window.remotion)
  }
  return false
}

// 정적 파일 경로 가져오기
let staticFileFn: ((path: string) => string) | null = null

// 동적으로 staticFile import 시도
try {
  // @ts-ignore
  const remotion = require('remotion')
  if (remotion && remotion.staticFile) {
    staticFileFn = remotion.staticFile
  }
} catch {
  // Remotion이 없으면 무시
}

/**
 * 환경에 맞는 이미지 경로 반환
 * 
 * @param path - public 폴더 기준 경로 (예: 'jihoon_profile_1.png')
 * @returns 환경에 맞는 전체 경로
 */
export function getImagePath(path: string): string {
  // 이미 절대 URL이면 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  
  // 경로 정규화 (앞의 / 제거)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  
  // Remotion 환경이고 staticFile 함수가 있으면 사용
  if (staticFileFn && isRemotionEnvironment()) {
    try {
      return staticFileFn(normalizedPath)
    } catch {
      // 실패하면 일반 경로 사용
    }
  }
  
  // 일반 웹 환경
  return `/${normalizedPath}`
}

/**
 * 프리로드할 이미지 목록
 */
export const PROFILE_IMAGES = {
  jihoon: 'jihoon_profile_1.png',
  soyeong: 'soyeong_pr_1.png',
  minjun: 'minjun_pr_1.png',
} as const
