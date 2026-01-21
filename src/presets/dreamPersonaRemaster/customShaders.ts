/**
 * Dream Persona HUD Remaster - 커스텀 WebGL 셰이더
 * 
 * [MODULE-09] GUIDE-MODULE-09-REACT-VFX.md 기준
 * react-vfx 라이브러리와 함께 사용되는 커스텀 GLSL 셰이더 정의
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INFECTED 시나리오용: 녹아내림 + 글리치 셰이더
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRAUMA 시나리오용: Grayscale + Halftone 혼합 (절망)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVOLVED 시나리오용: Golden Shine (골든 빛 효과)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMBAT 시나리오용: 데미지 비네트 + 글리치
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DAMAGE_VIGNETTE_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float damageIntensity;
uniform sampler2D src;
out vec4 outColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    vec4 color = texture(src, uv);
    
    // 붉은 비네트
    vec2 center = uv - 0.5;
    float dist = length(center);
    float vignette = smoothstep(0.2, 0.7, dist);
    
    // 데미지 강도에 따른 붉은색 오버레이
    vec3 redTint = vec3(0.8, 0.1, 0.1);
    color.rgb = mix(color.rgb, redTint, vignette * damageIntensity * 0.5);
    
    // 펄스 효과
    float pulse = sin(time * 8.0) * 0.5 + 0.5;
    color.rgb = mix(color.rgb, redTint, damageIntensity * pulse * 0.2);
    
    outColor = color;
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SYNC 시나리오용: 픽셀화 트랜지션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYNC_PIXELATE_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float syncProgress;
uniform sampler2D src;
out vec4 outColor;

void main() {
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;
    
    // 동기화 진행률에 따라 픽셀 크기 결정
    float pixelSize = mix(1.0, 8.0, (1.0 - syncProgress) * (1.0 - syncProgress));
    
    if (pixelSize > 1.0) {
        vec2 pixelatedUV = floor(uv * resolution / pixelSize) * pixelSize / resolution;
        outColor = texture(src, pixelatedUV);
    } else {
        outColor = texture(src, uv);
    }
    
    // Cyan 색조 추가
    vec3 cyanTint = vec3(0.0, 0.83, 1.0);
    float cyanIntensity = 0.1 * syncProgress;
    outColor.rgb = mix(outColor.rgb, cyanTint, cyanIntensity);
}
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 시나리오별 셰이더 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ScenarioId = 'normal' | 'sync' | 'combat' | 'infected' | 'trauma' | 'evolved'

export interface ShaderConfig {
    shader: string | undefined
    uniforms: Record<string, number | boolean | number[]>
}

export function getScenarioShaderConfig(
    scenario: ScenarioId,
    options: {
        syncProgress?: number
        damageIntensity?: number
        infectionLevel?: number
        chargeLevel?: number
    } = {}
): ShaderConfig {
    switch (scenario) {
        case 'normal':
            return { shader: undefined, uniforms: {} }

        case 'sync':
            return {
                shader: SYNC_PIXELATE_SHADER,
                uniforms: {
                    syncProgress: options.syncProgress ?? 0,
                },
            }

        case 'combat':
            const damageIntensity = options.damageIntensity ?? 0
            if (damageIntensity > 0.7) {
                return { shader: 'glitch', uniforms: {} }
            } else if (damageIntensity > 0.3) {
                return { shader: 'rgbShift', uniforms: {} }
            }
            return {
                shader: DAMAGE_VIGNETTE_SHADER,
                uniforms: {
                    damageIntensity,
                },
            }

        case 'infected':
            return {
                shader: MELT_GLITCH_SHADER,
                uniforms: {
                    infectionLevel: (options.infectionLevel ?? 78) / 100,
                },
            }

        case 'trauma':
            return {
                shader: DESPAIR_SHADER,
                uniforms: {},
            }

        case 'evolved':
            return {
                shader: GOLDEN_SHINE_SHADER,
                uniforms: {
                    chargeLevel: options.chargeLevel ?? 0,
                },
            }

        default:
            return { shader: undefined, uniforms: {} }
    }
}
