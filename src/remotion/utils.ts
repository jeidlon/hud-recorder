/**
 * Remotion 유틸리티
 * 
 * Remotion 환경과 일반 웹 환경 모두에서 동작하는 유틸리티
 */

import { staticFile } from 'remotion'

// Remotion 환경 감지
let isRemotionEnv = false

try {
  // Remotion 환경에서만 이 함수가 정상 동작
  staticFile('test')
  isRemotionEnv = true
} catch {
  isRemotionEnv = false
}

/**
 * 정적 파일 경로를 환경에 맞게 반환
 * 
 * @param path - public 폴더 기준 경로 (예: 'jihoon_profile_1.png')
 * @returns 환경에 맞는 파일 경로
 */
export function getStaticFile(path: string): string {
  // 이미 절대 경로면 그대로 반환
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // 경로 정규화 (앞의 / 제거)
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  
  if (isRemotionEnv) {
    return staticFile(normalizedPath)
  }
  
  // 일반 웹 환경
  return `/${normalizedPath}`
}

/**
 * Remotion 환경인지 확인
 */
export function isRemotionEnvironment(): boolean {
  return isRemotionEnv
}
