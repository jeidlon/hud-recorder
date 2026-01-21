/**
 * 프리셋 HUD 레지스트리
 *
 * 새 프리셋 추가 방법:
 * 1. src/presets/ 폴더에 HUD 컴포넌트 파일 생성 (예: MyHUD.tsx)
 * 2. 아래 hudPresets 배열에 등록
 *
 * 예시:
 * {
 *   id: 'my-hud',
 *   name: 'My HUD',
 *   description: '내 커스텀 HUD',
 *   icon: Target,  // lucide-react 아이콘
 *   component: MyHUD,
 *   available: true,
 * }
 */

import { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Crosshair, Clock } from 'lucide-react'
import { TargetLockHUD } from './TargetLockHUD'
import type { HUDState } from '@/types/hud-protocol'

// HUD 컴포넌트의 공통 Props 인터페이스
export interface HUDComponentProps {
  width: number
  height: number
  isPlaying?: boolean
  onStateUpdate?: (state: HUDState) => void
  onReady?: () => void
}

// 프리셋 정의 인터페이스
export interface HUDPreset {
  id: string
  name: string
  description: string
  icon: LucideIcon
  component: ComponentType<HUDComponentProps> | null
  available: boolean
}

/**
 * 등록된 HUD 프리셋 목록
 *
 * 새 HUD를 추가하려면 여기에 등록하세요!
 */
export const hudPresets: HUDPreset[] = [
  {
    id: 'target-lock',
    name: 'Target Lock',
    description: '크로스헤어 + 타겟 락온',
    icon: Crosshair,
    component: TargetLockHUD,
    available: true,
  },
  // ─────────────────────────────────────────────
  // 새 프리셋은 여기에 추가하세요!
  // ─────────────────────────────────────────────
  // {
  //   id: 'health-bar',
  //   name: 'Health Bar',
  //   description: '체력바 + 마나바',
  //   icon: Heart,
  //   component: HealthBarHUD,
  //   available: true,
  // },
  {
    id: 'coming-soon',
    name: 'Coming Soon...',
    description: '새로운 HUD 준비 중',
    icon: Clock,
    component: null,
    available: false,
  },
]

// 프리셋 ID로 찾기
export function getPresetById(id: string): HUDPreset | undefined {
  return hudPresets.find((p) => p.id === id)
}

// 사용 가능한 프리셋만 필터링
export function getAvailablePresets(): HUDPreset[] {
  return hudPresets.filter((p) => p.available)
}
