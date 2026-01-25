/**
 * SF Game Icons - Arwes/Sci-Fi Style
 * Thin lines, geometric shapes, technical look
 */

import * as React from 'react'

export const SvgIcon: React.FC<{ path: string; color?: string; size?: number }> = ({ 
  path, 
  color = 'currentColor', 
  size = 24 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="1" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ filter: `drop-shadow(0 0 2px ${color})` }}
  >
    <path d={path} />
  </svg>
)

export const GameIcons = {
  // 공격 (Attack) - Sharp Blade
  Attack: (props: any) => (
    <SvgIcon path="M14.5 2L4 22 M20 22L9.5 2 M2 13h20" {...props} />
  ),
  
  // 방어 (Guard) - Tech Shield
  Guard: (props: any) => (
    <SvgIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4" {...props} />
  ),
  
  // 대시 (Dash) - Motion Arrows
  Dash: (props: any) => (
    <SvgIcon path="M13 5l7 7-7 7 M5 5l7 7-7 7" {...props} />
  ),
  
  // 궁극기 (Ult) - Burst/Star
  Ult: (props: any) => (
    <SvgIcon path="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6z M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" {...props} />
  ),
  
  // 회복 (Heal) - Cross/Medical
  Heal: (props: any) => (
    <SvgIcon path="M7 12h10 M12 7v10 M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" {...props} />
  ),
  
  // 플레이어 (Player) - Helmet
  Player: (props: any) => (
    <SvgIcon path="M12 2a8 8 0 0 1 8 8v7a2 2 0 0 1-2 2h-3l-3 3-3-3H6a2 2 0 0 1-2-2v-7a8 8 0 0 1 8-8z M8 11h8" {...props} />
  ),
  
  // 맵 (Map) - Pin
  MapMarker: (props: any) => (
    <SvgIcon path="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6" {...props} />
  )
}
