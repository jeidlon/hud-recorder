export const NEON_COLORS = {
  hp: '#FFF040',      // 아주 밝은 레몬 옐로우
  hpGlow: '#FFD700',  // 골드 글로우
  mp: '#40F0FF',      // 아주 밝은 시안
  mpGlow: '#00BFFF',  // 딥 스카이 블루 글로우
}

// WindowShell 테두리 글로우 강화
export const getStrongGlow = (color: string) => `0 0 10px ${color}, 0 0 20px ${color}80, inset 0 0 5px ${color}40`
