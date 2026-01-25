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

import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Crosshair, Clock, Gamepad2, Sparkles, Cpu, Hexagon } from 'lucide-react'
import { TargetLockHUD } from './TargetLockHUD'
import { DreamPersonaHUD } from './DreamPersonaHUD'
import { DreamPersonaRemasterHUD } from './dreamPersonaRemaster/DreamPersonaRemasterHUD'
import { CyberpunkHUD } from './remotion/CyberpunkHUD'
import { HexaTacticalHUD } from './hexaTactical'
import type { HUDState } from '@/types/hud-protocol'

// 외부에서 주입되는 HUD 상태 (오프라인 렌더링용)
export interface ExternalHUDState {
  timestamp: number
  mouse: { x: number; y: number }
  scenario?: string
  customData?: Record<string, unknown>
}

// HUD 컴포넌트의 공통 Props 인터페이스
export interface HUDComponentProps {
  width: number
  height: number
  isPlaying?: boolean
  onStateUpdate?: (state: HUDState) => void
  onReady?: () => void
  /** 오프라인 렌더링 시 외부에서 주입되는 상태 */
  externalState?: ExternalHUDState
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
    id: 'hexa-tactical',
    name: 'Hexa-Tactical OS 98',
    description: '줄콘티 Scene 8~12 대응 | Win98 홀로그램 크롬',
    icon: Hexagon,
    component: HexaTacticalHUD,
    available: true,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk HUD',
    description: 'Remotion 스타일 | 스프링 애니메이션 | 글리치 효과',
    icon: Cpu,
    component: CyberpunkHUD,
    available: false, // 비활성화
  },
  {
    id: 'dream-persona-remaster',
    name: '몽중게임 REMASTER',
    description: '5가지 시나리오 | ARWES + react-vfx 셰이더',
    icon: Sparkles,
    component: DreamPersonaRemasterHUD,
    available: false, // 비활성화
  },
  {
    id: 'dream-persona',
    name: '몽중게임 HUD',
    description: '7가지 시나리오 | 레트로-퓨처리스틱',
    icon: Gamepad2,
    component: DreamPersonaHUD,
    available: false, // 비활성화
  },
  {
    id: 'target-lock',
    name: 'Target Lock',
    description: '크로스헤어 + 타겟 락온',
    icon: Crosshair,
    component: TargetLockHUD,
    available: false, // 비활성화
  },
  // ─────────────────────────────────────────────
  // 새 프리셋은 여기에 추가하세요!
  // ─────────────────────────────────────────────
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
