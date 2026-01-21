# 모듈 9: react-vfx WebGL 셰이더 통합

## 목표
react-vfx 라이브러리를 사용하여 Canvas 위에 WebGL 후처리 효과를 적용한다.

---

## 9.1 설치 확인

```bash
npm install react-vfx --legacy-peer-deps
```

---

## 9.2 VFXProvider 설정

```tsx
// DreamPersonaRemasterHUD.tsx

import { VFXProvider, VFXDiv } from 'react-vfx';

export function DreamPersonaRemasterHUD() {
  return (
    <VFXProvider>
      <HUDContainer />
    </VFXProvider>
  );
}
```

---

## 9.3 시나리오별 셰이더 매핑

```tsx
// vfxConfig.ts

import { shaders } from '@vfx-js/core'; // 실제 셰이더 코드 참조용

// 시나리오별 셰이더 설정
export const SCENARIO_VFX_CONFIG = {
  normal: {
    shader: 'none',
    uniforms: {},
  },
  sync: {
    shader: 'pixelateTransition',
    uniforms: {
      // enterTime과 leaveTime은 state에서 동적으로
    },
  },
  combat: {
    // 데미지 강도에 따라 동적 선택
    getShader: (damageIntensity: number) => {
      if (damageIntensity > 0.7) return 'glitch';
      if (damageIntensity > 0.3) return 'rgbShift';
      return 'vignette';
    },
  },
  infected: {
    shader: 'rgbGlitch',
    uniforms: {},
  },
  trauma: {
    shader: 'grayscale',
    uniforms: {},
  },
  evolved: {
    // 차징 상태에 따라 동적 선택
    getShader: (isCharging: boolean) => {
      return isCharging ? 'rainbow' : 'shine';
    },
  },
};
```

---

## 9.4 커스텀 셰이더 정의 (INFECTED용)

```typescript
// customShaders.ts

// 녹아내림 + 글리치 커스텀 셰이더
export const MELT_GLITCH_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float infectionLevel;
uniform sampler2D src;
out vec4 outColor;

// 노이즈 함수
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    
    // ═══════════════════════════════════════════════════════════════
    // 1. 녹아내림 효과 (y축 왜곡)
    // ═══════════════════════════════════════════════════════════════
    float meltAmount = infectionLevel * 0.05;
    float melt = sin(uv.x * 20.0 + time * 2.0) * meltAmount * uv.y;
    uv.y += melt;
    
    // ═══════════════════════════════════════════════════════════════
    // 2. 수평 글리치 라인
    // ═══════════════════════════════════════════════════════════════
    float lineNoise = noise(vec2(floor(uv.y * 50.0), floor(time * 10.0)));
    if (lineNoise > 0.95 && infectionLevel > 0.3) {
        uv.x += (lineNoise - 0.95) * 2.0 * infectionLevel;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // 3. RGB 분리 (색수차)
    // ═══════════════════════════════════════════════════════════════
    float aberration = infectionLevel * 0.01;
    vec4 cr = texture(src, uv + vec2(aberration, 0.0));
    vec4 cg = texture(src, uv);
    vec4 cb = texture(src, uv - vec2(aberration, 0.0));
    
    outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 3.0);
    
    // ═══════════════════════════════════════════════════════════════
    // 4. 보라색/녹색 색조
    // ═══════════════════════════════════════════════════════════════
    outColor.r *= 0.8;
    outColor.g *= 1.0 + infectionLevel * 0.3;  // 녹색 강화
    outColor.b *= 1.0 + infectionLevel * 0.5;  // 보라색 강화
    
    // ═══════════════════════════════════════════════════════════════
    // 5. 픽셀 누락
    // ═══════════════════════════════════════════════════════════════
    float dropout = noise(uv * 100.0 + time);
    if (dropout > (1.0 - infectionLevel * 0.03)) {
        outColor = vec4(0.0);
    }
}
`;

// TRAUMA용 grayscale + halftone 혼합
export const DESPAIR_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform sampler2D src;
out vec4 outColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    vec4 color = texture(src, uv);
    
    // Grayscale
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // 약간의 desaturation (완전 흑백은 아님)
    color.rgb = mix(color.rgb, vec3(gray), 0.8);
    
    // 어두운 비네트
    vec2 center = uv - 0.5;
    float vignette = 1.0 - dot(center, center) * 1.5;
    color.rgb *= vignette;
    
    outColor = color;
}
`;

// EVOLVED용 golden shine
export const GOLDEN_SHINE_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float chargeLevel;
uniform sampler2D src;
out vec4 outColor;

vec3 goldenColor = vec3(1.0, 0.843, 0.0);

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    vec4 color = texture(src, uv);
    
    // 방사형 shine
    vec2 center = uv * 2.0 - 1.0;
    float angle = atan(center.y, center.x);
    float shine = sin(angle * 8.0 + time * 3.0) * 0.5 + 0.5;
    
    // 차징 레벨에 따른 강도
    float intensity = 0.1 + chargeLevel * 0.3;
    
    // 골든 오버레이
    color.rgb += goldenColor * shine * intensity;
    
    // 글로우
    if (chargeLevel > 0.8) {
        color.rgb += goldenColor * (chargeLevel - 0.8) * 2.0;
    }
    
    outColor = color;
}
`;
```

---

## 9.5 VFX 적용 컴포넌트

```tsx
// VFXHUDWrapper.tsx

import React, { useMemo } from 'react';
import { VFXDiv } from 'react-vfx';
import { 
  MELT_GLITCH_SHADER, 
  DESPAIR_SHADER, 
  GOLDEN_SHINE_SHADER 
} from './customShaders';

interface VFXHUDWrapperProps {
  scenario: ScenarioId;
  state: HUDState;
  children: React.ReactNode;
}

export function VFXHUDWrapper({ scenario, state, children }: VFXHUDWrapperProps) {
  // 시나리오별 셰이더 및 유니폼 결정
  const { shader, uniforms } = useMemo(() => {
    switch (scenario) {
      case 'normal':
        return { shader: undefined, uniforms: {} };
      
      case 'sync':
        return {
          shader: 'pixelateTransition',
          uniforms: {
            enterTime: state.syncRate / 100,
            leaveTime: 0,
          },
        };
      
      case 'combat':
        const damageIntensity = state.damageIntensity ?? 0;
        if (damageIntensity > 0.7) {
          return { shader: 'glitch', uniforms: {} };
        } else if (damageIntensity > 0.3) {
          return { shader: 'rgbShift', uniforms: {} };
        }
        return {
          shader: 'vignette',
          uniforms: {
            intensity: 0.5 + damageIntensity,
            radius: 0.3,
            power: 2,
          },
        };
      
      case 'infected':
        return {
          shader: MELT_GLITCH_SHADER,
          uniforms: {
            infectionLevel: (state.infectionLevel ?? 78) / 100,
          },
        };
      
      case 'trauma':
        return {
          shader: DESPAIR_SHADER,
          uniforms: {},
        };
      
      case 'evolved':
        return {
          shader: GOLDEN_SHINE_SHADER,
          uniforms: {
            chargeLevel: state.cannonCharge ?? 0,
          },
        };
      
      default:
        return { shader: undefined, uniforms: {} };
    }
  }, [scenario, state]);
  
  // 셰이더가 없으면 그냥 children 반환
  if (!shader) {
    return <>{children}</>;
  }
  
  return (
    <VFXDiv shader={shader} uniforms={uniforms}>
      {children}
    </VFXDiv>
  );
}
```

---

## 9.6 최종 통합

```tsx
// DreamPersonaRemasterHUD.tsx

import { VFXProvider } from 'react-vfx';
import { VFXHUDWrapper } from './VFXHUDWrapper';

export function DreamPersonaRemasterHUD() {
  const [state, setState] = useState<HUDState>(createInitialState());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Canvas 렌더링 로직...
  
  return (
    <VFXProvider>
      <VFXHUDWrapper scenario={state.scenario} state={state}>
        <div className="hud-container">
          <canvas ref={canvasRef} />
          {/* 기타 UI 요소들 */}
        </div>
      </VFXHUDWrapper>
    </VFXProvider>
  );
}
```

---

## 9.7 프리셋 셰이더 목록 (react-vfx 내장)

| 프리셋 | 설명 | 사용 시나리오 |
|--------|------|--------------|
| `none` | 효과 없음 | NORMAL |
| `glitch` | RGB분리 + 노이즈 + 라인 글리치 | COMBAT (큰 데미지) |
| `rgbShift` | 부드러운 RGB 채널 분리 | COMBAT (일반 데미지) |
| `rgbGlitch` | 랜덤한 RGB 글리치 | INFECTED |
| `pixelate` | 동적 픽셀화 | - |
| `pixelateTransition` | 등장/퇴장 픽셀화 | SYNC |
| `rainbow` | 무지개 색상 순환 | EVOLVED (차징) |
| `shine` | 방사형 빛 효과 | EVOLVED (기본) |
| `chromatic` | 가장자리 색수차 | COMBAT (락온) |
| `vignette` | 가장자리 어둡게 | COMBAT (기본 피격) |
| `grayscale` | 흑백 | TRAUMA |
| `halftone` | 하프톤 인쇄 효과 | TRAUMA (보스 영역) |
| `invert` | 색상 반전 | 특수 이벤트 |
| `blink` | 깜빡임 | 경고 |

---

## 9.8 검증 체크리스트

- [ ] VFXProvider가 최상위에 있는가?
- [ ] NORMAL에서는 효과 없이 깔끔한가?
- [ ] SYNC에서 픽셀화 트랜지션이 적용되는가?
- [ ] COMBAT에서 데미지에 따라 효과가 변하는가?
- [ ] INFECTED에서 녹아내림 + RGB분리가 보이는가?
- [ ] TRAUMA에서 grayscale이 적용되는가?
- [ ] EVOLVED에서 골든 shine이 보이는가?
- [ ] 커스텀 셰이더가 정상 작동하는가?

---

## 9.9 성능 최적화 팁

1. **불필요한 셰이더 변경 방지**: `useMemo`로 shader/uniforms 캐싱
2. **NORMAL 상태 최적화**: 셰이더 없이 그냥 렌더링
3. **uniforms 업데이트 최소화**: 변경된 값만 업데이트
4. **복잡한 셰이더 분리**: INFECTED용 커스텀 셰이더는 필요할 때만 로드
