/**
 * VFX Shaders - react-vfx / vfx-js 라이브러리에서 직접 가져온 셰이더 코드
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * 출처: https://github.com/fand/vfx-js/blob/main/packages/vfx-js/src/constants.ts
 * 라이선스: MIT
 * 
 * 이 셰이더들은 WebGL에서 후처리 효과로 사용됩니다.
 * Dream Persona HUD의 각 시나리오에 맞는 효과를 적용합니다.
 * ════════════════════════════════════════════════════════════════════════════
 */

export type VFXShaderPreset =
  | "none"
  | "uvGradient"
  | "rainbow"
  | "glitch"
  | "rgbGlitch"
  | "rgbShift"
  | "shine"
  | "blink"
  | "spring"
  | "duotone"
  | "tritone"
  | "hueShift"
  | "sinewave"
  | "pixelate"
  | "halftone"
  | "slitScanTransition"
  | "warpTransition"
  | "pixelateTransition"
  | "focusTransition"
  | "invert"
  | "grayscale"
  | "vignette"
  | "chromatic";

const COMMON_HEADER = `precision highp float;
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform bool autoCrop;
uniform sampler2D src;
out vec4 outColor;
`;

const READ_TEX = `vec4 readTex(sampler2D tex, vec2 uv) {
  if (autoCrop && (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.)) {
    return vec4(0);
  }
  return texture(tex, uv);
}`;

/**
 * vfx-js에서 가져온 셰이더 프리셋들
 * 출처: packages/vfx-js/src/constants.ts
 */
export const VFX_SHADERS: Record<VFXShaderPreset, string> = {
  none: `
precision highp float;
uniform vec2 offset;
uniform vec2 resolution;
uniform sampler2D src;
out vec4 outColor;
void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) {
    discard;
  }
  outColor = texture(src, uv);
}
`,

  uvGradient: `
${COMMON_HEADER}
${READ_TEX}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  outColor = vec4(uv, sin(time) * .5 + .5, 1);

  vec4 img = readTex(src, uv);
  outColor *= smoothstep(0., 1., img.a);
}
`,

  rainbow: `
${COMMON_HEADER}
${READ_TEX}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hueShift(vec3 rgb, float t) {
  vec3 hsv = rgb2hsv(rgb);
  hsv.x = fract(hsv.x + t);
  return hsv2rgb(hsv);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 uv2 = uv;
  uv2.x *= resolution.x / resolution.y;

  float x = (uv2.x - uv2.y) - fract(time);

  vec4 img = readTex(src, uv);
  float gray = length(img.rgb);

  img.rgb = vec3(hueShift(vec3(1,0,0), x) * gray);

  outColor = img;
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // GLITCH - 데미지/피격 시 사용
  // ═══════════════════════════════════════════════════════════════════════════
  glitch: `
${COMMON_HEADER}
${READ_TEX}

float nn(float y, float t) {
  float n = (
    sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
    sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
    sin(y * 1.1 + t * 2.8) * .4
  );

  n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

  return n;
}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);

  float t = mod(time, 3.14 * 10.);

  // Seed value
  float v = fract(sin(t * 2.) * 700.);

  if (abs(nn(uv.y, t)) < 1.2) {
    v *= 0.01;
  }

  // Prepare for chromatic Abbreveation
  vec2 focus = vec2(0.5);
  float d = v * 0.6;
  vec2 ruv = focus + (uv - focus) * (1. - d);
  vec2 guv = focus + (uv - focus) * (1. - 2. * d);
  vec2 buv = focus + (uv - focus) * (1. - 3. * d);

  // Random Glitch
  if (v > 0.1) {
    // Randomize y
    float y = floor(uv.y * 13. * sin(35. * t)) + 1.;
    if (sin(36. * y * v) > 0.9) {
      ruv.x = uv.x + sin(76. * y) * 0.1;
      guv.x = uv.x + sin(34. * y) * 0.1;
      buv.x = uv.x + sin(59. * y) * 0.1;
    }

    // RGB Shift
    v = pow(v * 1.5, 2.) * 0.15;
    color.rgb *= 0.3;
    color.r += readTex(src, vec2(uv.x + sin(t * 123.45) * v, uv.y)).r;
    color.g += readTex(src, vec2(uv.x + sin(t * 157.67) * v, uv.y)).g;
    color.b += readTex(src, vec2(uv.x + sin(t * 143.67) * v, uv.y)).b;
  }

  // Compose Chromatic Abbreveation
  if (abs(nn(uv.y, t)) > 1.1) {
    color.r = color.r * 0.5 + color.r * texture(src, ruv).r;
    color.g = color.g * 0.5 + color.g * texture(src, guv).g;
    color.b = color.b * 0.5 + color.b * texture(src, buv).b;
    color *= 2.;
  }

  outColor = color;
  outColor.a = smoothstep(0.0, 0.8, max(color.r, max(color.g, color.b)));
}
`,

  pixelate: `
${COMMON_HEADER}
${READ_TEX}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  float b = sin(time * 2.) * 32. + 48.;
  uv = floor(uv * b) / b;
  outColor = readTex(src, uv);
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // RGB GLITCH - 감염 시나리오용
  // ═══════════════════════════════════════════════════════════════════════════
  rgbGlitch: `
${COMMON_HEADER}
${READ_TEX}

float random(vec2 st) {
  return fract(sin(dot(st, vec2(948.,824.))) * 30284.);
}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 uvr = uv, uvg = uv, uvb = uv;

  float tt = mod(time, 17.);

  if (fract(tt * 0.73) > .8 || fract(tt * 0.91) > .8) {
    float t = floor(tt * 11.);

    float n = random(vec2(t, floor(uv.y * 17.7)));
    if (n > .7) {
      uvr.x = uv.x + random(vec2(t, 1.)) * .1 - 0.05;
      uvg.x = uv.x + random(vec2(t, 2.)) * .1 - 0.05;
      uvb.x = uv.x + random(vec2(t, 3.)) * .1 - 0.05;
    }

    float ny = random(vec2(t * 17. + floor(uv * 19.7)));
    if (ny > .7) {
      uvr.x = uv.x + random(vec2(t, 4.)) * .1 - 0.05;
      uvg.x = uv.x + random(vec2(t, 5.)) * .1 - 0.05;
      uvb.x = uv.x + random(vec2(t, 6.)) * .1 - 0.05;
    }
  }

  vec4 cr = readTex(src, uvr);
  vec4 cg = readTex(src, uvg);
  vec4 cb = readTex(src, uvb);

  outColor = vec4(
    cr.r,
    cg.g,
    cb.b,
    step(.1, cr.a + cg.a + cb.a)
  );
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // RGB SHIFT - 전투/데미지용
  // ═══════════════════════════════════════════════════════════════════════════
  rgbShift: `
${COMMON_HEADER}
${READ_TEX}

float nn(float y, float t) {
  float n = (
    sin(y * .07 + t * 8. + sin(y * .5 + t * 10.)) +
    sin(y * .7 + t * 2. + sin(y * .3 + t * 8.)) * .7 +
    sin(y * 1.1 + t * 2.8) * .4
  );

  n += sin(y * 124. + t * 100.7) * sin(y * 877. - t * 38.8) * .3;

  return n;
}

float step2(float t, vec2 uv) {
  return step(t, uv.x) * step(t, uv.y);
}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec2 uvr = uv, uvg = uv, uvb = uv;

  float t = mod(time, 30.);

  float amp = 10. / resolution.x;

  if (abs(nn(uv.y, t)) > 1.) {
    uvr.x += nn(uv.y, t) * amp;
    uvg.x += nn(uv.y, t + 10.) * amp;
    uvb.x += nn(uv.y, t + 20.) * amp;
  }

  vec4 cr = readTex(src, uvr);
  vec4 cg = readTex(src, uvg);
  vec4 cb = readTex(src, uvb);

  outColor = vec4(
    cr.r,
    cg.g,
    cb.b,
    smoothstep(.0, 1., cr.a + cg.a + cb.a)
  );
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // HALFTONE - 레트로 스타일
  // ═══════════════════════════════════════════════════════════════════════════
  halftone: `
// Halftone Effect by zoidberg
// https://www.interactiveshaderformat.com/sketches/234

${COMMON_HEADER}
${READ_TEX}

// TODO: uniform
#define gridSize 10.0
#define dotSize 0.7
#define smoothing 0.15
#define speed 1.0

#define IMG_PIXEL(x, y) readTex(x, (y - offset) / resolution);

vec4 gridRot = vec4(15.0, 45.0, 75.0, 0.0);

vec2 originOffsets[4];

void main() {
  vec2 fragCoord = gl_FragCoord.xy - offset;

  originOffsets[0] = vec2(-1.0, 0.0);
  originOffsets[1] = vec2(0.0, 1.0);
  originOffsets[2] = vec2(1.0, 0.0);
  originOffsets[3] = vec2(0.0, -1.0);

  vec3 rgbAmounts = vec3(0.0);

  for (float i=0.0; i<3.0; ++i) {
    float rotRad = radians(gridRot[int(i)]);

    mat2 ccTrans = mat2(vec2(cos(rotRad), sin(rotRad)), vec2(-1.0*sin(rotRad), cos(rotRad)));
    mat2 cTrans = mat2(vec2(cos(rotRad), -1.0*sin(rotRad)), vec2(sin(rotRad), cos(rotRad)));

    vec2 gridFragLoc = cTrans * fragCoord.xy;

    vec2 gridOriginLoc = vec2(floor(gridFragLoc.x/gridSize), floor(gridFragLoc.y/gridSize));

    vec2 tmpGridCoords = gridFragLoc/vec2(gridSize);
    bool fragAtTopOfGrid = ((tmpGridCoords.y-floor(tmpGridCoords.y)) > (gridSize/2.0)) ? true : false;
    bool fragAtRightOfGrid = ((tmpGridCoords.x-floor(tmpGridCoords.x)) > (gridSize/2.0)) ? true : false;
    if (fragAtTopOfGrid)
      gridOriginLoc.y = gridOriginLoc.y + 1.0;
    if (fragAtRightOfGrid)
      gridOriginLoc.x = gridOriginLoc.x + 1.0;

    vec2 gridDotLoc = vec2(gridOriginLoc.x*gridSize, gridOriginLoc.y*gridSize) + vec2(gridSize/2.0);

    vec2 renderDotLoc = ccTrans * gridDotLoc;

    vec4 renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

    float imageChannelAmount = renderDotImageColorRGB[int(i)];

    float dotRadius = imageChannelAmount * (gridSize * dotSize);
    float fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
    if (fragDistanceToDotCenter < dotRadius) {
      rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
    }

    for (float j=0.0; j<4.0; ++j) {
      gridDotLoc = vec2((gridOriginLoc.x+originOffsets[int(j)].x)*gridSize, (gridOriginLoc.y+originOffsets[int(j)].y)*gridSize) + vec2(gridSize/2.0);

      renderDotLoc = ccTrans * gridDotLoc;
      renderDotImageColorRGB = IMG_PIXEL(src, renderDotLoc + offset);

      imageChannelAmount = renderDotImageColorRGB[int(i)];
      dotRadius = imageChannelAmount * (gridSize*1.50/2.0);
      fragDistanceToDotCenter = distance(fragCoord.xy, renderDotLoc);
      if (fragDistanceToDotCenter < dotRadius) {
        rgbAmounts[int(i)] += smoothstep(dotRadius, dotRadius-(dotRadius*smoothing), fragDistanceToDotCenter);
      }
    }
  }

  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 original = readTex(src, uv);
  float alpha = step(.1, rgbAmounts[0] + rgbAmounts[1] + rgbAmounts[2] + original.a);

  outColor = vec4(rgbAmounts[0], rgbAmounts[1], rgbAmounts[2], alpha);
}
`,

  sinewave: `
${COMMON_HEADER}
${READ_TEX}

vec4 draw(vec2 uv) {
  vec2 uvr = uv, uvg = uv, uvb = uv;

  float amp = 20. / resolution.x;

  uvr.x += sin(uv.y * 7. + time * 3.) * amp;
  uvg.x += sin(uv.y * 7. + time * 3. + .4) * amp;
  uvb.x += sin(uv.y * 7. + time * 3. + .8) * amp;

  vec4 cr = readTex(src, uvr);
  vec4 cg = readTex(src, uvg);
  vec4 cb = readTex(src, uvb);

  return vec4(
    cr.r,
    cg.g,
    cb.b,
    cr.a + cg.a + cb.a
  );
}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  // x blur
  vec2 dx = vec2(2, 0) / resolution.x;
  outColor = (draw(uv) * 2. + draw(uv + dx) + draw(uv - dx)) / 4.;
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // SHINE - 진화 시나리오용 빛나는 효과
  // ═══════════════════════════════════════════════════════════════════════════
  shine: `
${COMMON_HEADER}
${READ_TEX}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  vec2 p = uv * 2. - 1.;
  float a = atan(p.y, p.x);

  vec4 col = readTex(src, uv);
  float gray = length(col.rgb);

  float level = 1. + sin(a * 10. + time * 3.) * 0.2;

  outColor = vec4(1, 1, .5, col.a) * level;
}
`,

  blink: `
${COMMON_HEADER}
${READ_TEX}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  outColor = readTex(src, uv) * (sin(time * 5.) * 0.2 + 0.8);
}
`,

  spring: `
${COMMON_HEADER}
${READ_TEX}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  uv = (uv - .5) * (1.05 + sin(time * 5.) * 0.05) + .5;
  outColor = readTex(src, uv);
}
`,

  duotone: `
${COMMON_HEADER}
${READ_TEX}

uniform vec4 color1;
uniform vec4 color2;
uniform float speed;

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);

  float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
  float t = mod(gray * 2.0 + time * speed, 2.0);

  if (t < 1.) {
    outColor = mix(color1, color2, fract(t));
  } else {
    outColor = mix(color2, color1, fract(t));
  }

  outColor.a *= color.a;
}
`,

  tritone: `
${COMMON_HEADER}
${READ_TEX}

uniform vec4 color1;
uniform vec4 color2;
uniform vec4 color3;
uniform float speed;

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);

  float gray = dot(color.rgb, vec3(0.2, 0.7, 0.08));
  float t = mod(gray * 3.0 + time * speed, 3.0);

  if (t < 1.) {
    outColor = mix(color1, color2, fract(t));
  } else if (t < 2.) {
    outColor = mix(color2, color3, fract(t));
  } else {
    outColor = mix(color3, color1, fract(t));
  }

  outColor.a *= color.a;
}
`,

  hueShift: `
${COMMON_HEADER}
${READ_TEX}

uniform float shift;

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hueShiftFn(vec3 rgb, float t) {
  vec3 hsv = rgb2hsv(rgb);
  hsv.x = fract(hsv.x + t);
  return hsv2rgb(hsv);
}

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);
  color.rgb = hueShiftFn(color.rgb, shift);
  outColor = color;
}
`,

  warpTransition: `
${COMMON_HEADER}
uniform float enterTime;
uniform float leaveTime;

${READ_TEX}

#define DURATION 1.0

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  float t1 = enterTime / DURATION;
  float t2 = leaveTime / DURATION;
  float t = clamp(min(t1, 1. - t2), 0., 1.);

  if (t == 0.) {
    discard;
  }

  if (t < 1.) {
    uv.x += sin(floor(uv.y * 300.)) * 3. * exp(t * -10.);
  }

  outColor = readTex(src, uv);
}
`,

  slitScanTransition: `
${COMMON_HEADER}
${READ_TEX}

uniform float enterTime;
uniform float leaveTime;

#define DURATION 1.0

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  float t1 = enterTime / DURATION;
  float t2 = leaveTime / DURATION;

  if (t1 < 0. || 1. < t2) {
    discard;
  }

  if (0. < t2) {
    float t = 1. - t2;
    uv.y = uv.y < t ? uv.y : t;
  } else if (t1 < 1.) {
    float t = 1. - t1;
    uv.y = uv.y < t ? t : uv.y;
  }

  outColor = readTex(src, uv);
}
`,

  pixelateTransition: `
${COMMON_HEADER}
${READ_TEX}

uniform float enterTime;
uniform float leaveTime;

#define DURATION 1.0

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  float t1 = enterTime / DURATION;
  float t2 = leaveTime / DURATION;
  float t = clamp(min(t1, 1. - t2), 0., 1.);

  if (t == 0.) {
    discard;
  } else if (t < 1.) {
    float b = floor(t * 64.);
    uv = (floor(uv * b) + .5) / b;
  }

  outColor = readTex(src, uv);
}
`,

  focusTransition: `
${COMMON_HEADER}
${READ_TEX}

uniform float intersection;

void main (void) {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  float t = smoothstep(0., 1., intersection);

  outColor = mix(
    readTex(src, uv + vec2(1. - t, 0)),
    readTex(src, uv + vec2(-(1. - t), 0)),
    0.5
  ) * intersection;
}
`,

  invert: `
${COMMON_HEADER}
${READ_TEX}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);
  outColor = vec4(1.0 - color.rgb, color.a);
}
`,

  grayscale: `
${COMMON_HEADER}
${READ_TEX}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  vec4 color = readTex(src, uv);
  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  outColor = vec4(vec3(gray), color.a);
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // VIGNETTE - 모든 시나리오 공통
  // ═══════════════════════════════════════════════════════════════════════════
  vignette: `
${COMMON_HEADER}
${READ_TEX}

uniform float intensity;
uniform float radius;
uniform float power;

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  outColor = readTex(src, uv);

  vec2 p = uv * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;

  float l = max(length(p) - radius, 0.);
  outColor *= 1. - pow(l, power) * intensity;
}
`,

  // ═══════════════════════════════════════════════════════════════════════════
  // CHROMATIC - 색수차 효과 (피격/글리치용)
  // ═══════════════════════════════════════════════════════════════════════════
  chromatic: `
${COMMON_HEADER}
${READ_TEX}

uniform float intensity;
uniform float radius;
uniform float power;

vec4 mirrorTex(sampler2D tex, vec2 uv) {
  vec2 uv2 = 1. - abs(1. - mod(uv, 2.0));
  return texture(tex, uv2);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;

  vec2 p = uv * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;

  float l = max(length(p) - radius, 0.);
  float d = pow(l, power) * (intensity * 0.1);

  vec2 uvR = (uv - .5) / (1.0 + d * 1.) + 0.5;
  vec2 uvG = (uv - .5) / (1.0 + d * 2.) + 0.5;
  vec2 uvB = (uv - .5) / (1.0 + d * 3.) + 0.5;

  vec4 cr = mirrorTex(src, uvR);
  vec4 cg = mirrorTex(src, uvG);
  vec4 cb = mirrorTex(src, uvB);

  outColor = vec4(cr.r, cg.g, cb.b, (cr.a + cg.a + cb.a) / 3.0);
}
`,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dream Persona 시나리오별 VFX 매핑
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCENARIO_VFX_MAPPING = {
  sync: {
    default: 'none',
    connecting: 'pixelateTransition', // 접속 중
    complete: 'shine',                 // 동기화 완료
  },
  combat: {
    default: 'none',
    damage: 'rgbShift',               // 데미지 받을 때
    heavyDamage: 'glitch',            // 큰 데미지
    locked: 'chromatic',              // 락온
  },
  infected: {
    default: 'rgbGlitch',             // 기본이 글리치
    corrupted: 'glitch',              // 강한 오염
    sinewave: 'sinewave',             // 웨이브 효과
  },
  trauma: {
    default: 'grayscale',             // 기본 흑백
    despair: 'vignette',              // 절망
    flashback: 'pixelate',            // 플래시백
  },
  evolved: {
    default: 'rainbow',               // 레인보우
    charging: 'shine',                // 차징
    blast: 'chromatic',               // 발사
  },
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Vertex Shader (vfx-js에서 가져옴)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEFAULT_VERTEX_SHADER = `
precision highp float;
in vec3 position;
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

export const DEFAULT_VERTEX_SHADER_100 = `
precision highp float;
attribute vec3 position;
void main() {
  gl_Position = vec4(position, 1.0);
}
`;
