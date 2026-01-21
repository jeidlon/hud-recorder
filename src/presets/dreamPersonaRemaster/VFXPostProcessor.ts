/**
 * VFX Post Processor - WebGL 기반 후처리 효과 적용기
 * 
 * ════════════════════════════════════════════════════════════════════════════
 * react-vfx / vfx-js 라이브러리의 셰이더를 사용하여
 * Canvas에 그려진 HUD에 후처리 효과를 적용합니다.
 * 
 * 출처: https://github.com/fand/vfx-js
 * ════════════════════════════════════════════════════════════════════════════
 */

import { VFX_SHADERS, type VFXShaderPreset, DEFAULT_VERTEX_SHADER } from './vfxShaders';

export interface VFXOptions {
  intensity?: number;
  radius?: number;
  power?: number;
  shift?: number;
  speed?: number;
  color1?: [number, number, number, number];
  color2?: [number, number, number, number];
  color3?: [number, number, number, number];
  enterTime?: number;
  leaveTime?: number;
  intersection?: number;
}

export class VFXPostProcessor {
  private gl: WebGL2RenderingContext | null = null;
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private programs: Map<VFXShaderPreset, WebGLProgram> = new Map();
  private positionBuffer: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private frameBuffer: WebGLFramebuffer | null = null;
  private initialized = false;

  constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.canvas = canvas;
    this.init();
  }

  private init() {
    const gl = this.canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
    }) as WebGL2RenderingContext | null;

    if (!gl) {
      console.warn('WebGL2 not supported, VFX effects disabled');
      return;
    }

    this.gl = gl;

    // Position buffer (full screen quad)
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0,
         1, -1, 0,
        -1,  1, 0,
         1,  1, 0,
      ]),
      gl.STATIC_DRAW
    );

    // Create texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.initialized = true;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private getProgram(preset: VFXShaderPreset): WebGLProgram | null {
    if (!this.gl) return null;

    if (this.programs.has(preset)) {
      return this.programs.get(preset)!;
    }

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, DEFAULT_VERTEX_SHADER);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, VFX_SHADERS[preset]);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    this.programs.set(preset, program);
    return program;
  }

  /**
   * 소스 캔버스에 VFX 효과를 적용하여 타겟 캔버스에 그립니다
   */
  apply(
    sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    preset: VFXShaderPreset,
    time: number,
    options: VFXOptions = {}
  ): boolean {
    if (!this.initialized || !this.gl || preset === 'none') {
      // VFX 없이 그냥 복사
      targetCtx.drawImage(sourceCanvas as CanvasImageSource, 0, 0);
      return false;
    }

    const gl = this.gl;
    const program = this.getProgram(preset);
    if (!program) {
      targetCtx.drawImage(sourceCanvas as CanvasImageSource, 0, 0);
      return false;
    }

    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    // Resize if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Upload source canvas as texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas as TexImageSource);

    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const offsetLoc = gl.getUniformLocation(program, 'offset');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const autoCropLoc = gl.getUniformLocation(program, 'autoCrop');
    const srcLoc = gl.getUniformLocation(program, 'src');

    gl.uniform2f(resolutionLoc, width, height);
    gl.uniform2f(offsetLoc, 0, 0);
    gl.uniform1f(timeLoc, time);
    gl.uniform1i(autoCropLoc, 1);
    gl.uniform1i(srcLoc, 0);

    // Optional uniforms
    const intensityLoc = gl.getUniformLocation(program, 'intensity');
    if (intensityLoc) gl.uniform1f(intensityLoc, options.intensity ?? 1.0);

    const radiusLoc = gl.getUniformLocation(program, 'radius');
    if (radiusLoc) gl.uniform1f(radiusLoc, options.radius ?? 0.5);

    const powerLoc = gl.getUniformLocation(program, 'power');
    if (powerLoc) gl.uniform1f(powerLoc, options.power ?? 2.0);

    const shiftLoc = gl.getUniformLocation(program, 'shift');
    if (shiftLoc) gl.uniform1f(shiftLoc, options.shift ?? 0.0);

    const speedLoc = gl.getUniformLocation(program, 'speed');
    if (speedLoc) gl.uniform1f(speedLoc, options.speed ?? 1.0);

    const enterTimeLoc = gl.getUniformLocation(program, 'enterTime');
    if (enterTimeLoc) gl.uniform1f(enterTimeLoc, options.enterTime ?? 1.0);

    const leaveTimeLoc = gl.getUniformLocation(program, 'leaveTime');
    if (leaveTimeLoc) gl.uniform1f(leaveTimeLoc, options.leaveTime ?? 0.0);

    const intersectionLoc = gl.getUniformLocation(program, 'intersection');
    if (intersectionLoc) gl.uniform1f(intersectionLoc, options.intersection ?? 1.0);

    // Color uniforms
    if (options.color1) {
      const color1Loc = gl.getUniformLocation(program, 'color1');
      if (color1Loc) gl.uniform4fv(color1Loc, options.color1);
    }
    if (options.color2) {
      const color2Loc = gl.getUniformLocation(program, 'color2');
      if (color2Loc) gl.uniform4fv(color2Loc, options.color2);
    }
    if (options.color3) {
      const color3Loc = gl.getUniformLocation(program, 'color3');
      if (color3Loc) gl.uniform4fv(color3Loc, options.color3);
    }

    // Set up position attribute
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Copy result to target canvas
    targetCtx.drawImage(this.canvas as CanvasImageSource, 0, 0);

    return true;
  }

  /**
   * 직접 ImageData에 VFX 적용 (오프라인 렌더링용)
   */
  applyToImageData(
    imageData: ImageData,
    preset: VFXShaderPreset,
    time: number,
    options: VFXOptions = {}
  ): ImageData {
    if (!this.initialized || !this.gl || preset === 'none') {
      return imageData;
    }

    const gl = this.gl;
    const program = this.getProgram(preset);
    if (!program) return imageData;

    const { width, height } = imageData;

    // Resize if needed
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Upload ImageData as texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);

    // Set uniforms
    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const offsetLoc = gl.getUniformLocation(program, 'offset');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const autoCropLoc = gl.getUniformLocation(program, 'autoCrop');
    const srcLoc = gl.getUniformLocation(program, 'src');

    gl.uniform2f(resolutionLoc, width, height);
    gl.uniform2f(offsetLoc, 0, 0);
    gl.uniform1f(timeLoc, time);
    gl.uniform1i(autoCropLoc, 1);
    gl.uniform1i(srcLoc, 0);

    // Optional uniforms
    const intensityLoc = gl.getUniformLocation(program, 'intensity');
    if (intensityLoc) gl.uniform1f(intensityLoc, options.intensity ?? 1.0);

    const radiusLoc = gl.getUniformLocation(program, 'radius');
    if (radiusLoc) gl.uniform1f(radiusLoc, options.radius ?? 0.5);

    const powerLoc = gl.getUniformLocation(program, 'power');
    if (powerLoc) gl.uniform1f(powerLoc, options.power ?? 2.0);

    // Set up position attribute
    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Read pixels back
    const resultData = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, resultData);

    // WebGL Y축은 반전되어 있으므로 뒤집기
    const result = new ImageData(width, height);
    for (let y = 0; y < height; y++) {
      const srcRow = (height - 1 - y) * width * 4;
      const dstRow = y * width * 4;
      for (let x = 0; x < width * 4; x++) {
        result.data[dstRow + x] = resultData[srcRow + x];
      }
    }

    return result;
  }

  dispose() {
    if (!this.gl) return;

    this.programs.forEach(program => {
      this.gl!.deleteProgram(program);
    });
    this.programs.clear();

    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
    }
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
    }
    if (this.frameBuffer) {
      this.gl.deleteFramebuffer(this.frameBuffer);
    }

    this.initialized = false;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 간편 사용을 위한 Singleton
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let vfxInstance: VFXPostProcessor | null = null;
let vfxCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;

export function getVFXProcessor(width: number, height: number): VFXPostProcessor {
  if (!vfxInstance || !vfxCanvas) {
    // OffscreenCanvas 지원 확인
    if (typeof OffscreenCanvas !== 'undefined') {
      vfxCanvas = new OffscreenCanvas(width, height);
    } else {
      vfxCanvas = document.createElement('canvas');
      vfxCanvas.width = width;
      vfxCanvas.height = height;
    }
    vfxInstance = new VFXPostProcessor(vfxCanvas);
  } else if (vfxCanvas.width !== width || vfxCanvas.height !== height) {
    vfxCanvas.width = width;
    vfxCanvas.height = height;
  }
  return vfxInstance;
}

export function applyVFX(
  sourceCanvas: HTMLCanvasElement | OffscreenCanvas,
  targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  preset: VFXShaderPreset,
  time: number,
  options: VFXOptions = {}
): boolean {
  const processor = getVFXProcessor(sourceCanvas.width, sourceCanvas.height);
  return processor.apply(sourceCanvas, targetCtx, preset, time, options);
}
