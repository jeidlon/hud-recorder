/**
 * WebGPU 기반 비디오 + HUD 컴포지터
 * 
 * Canvas 2D 대신 GPU 셰이더를 사용하여:
 * - 고품질 합성
 * - 포스트 프로세싱 효과 (글로우, 크로마틱 애버레이션 등)
 * - 더 높은 성능
 */

// WebGPU는 아직 모든 브라우저에서 지원되지 않으므로 타입을 any로 처리
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface WebGPUCompositorConfig {
  width: number
  height: number
  effects?: {
    chromaticAberration?: boolean  // 색수차 효과
    bloom?: boolean                 // 글로우/블룸 효과
    scanlines?: boolean             // 스캔라인 효과
    vignette?: boolean              // 비네팅 효과
    noise?: boolean                 // 필름 그레인 노이즈
  }
}

// 셰이더 코드 (WGSL)
const COMPOSITOR_SHADER = /* wgsl */`
// ===== Vertex Shader =====
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  // 풀스크린 쿼드 (2개의 삼각형)
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0),
    vec2f( 1.0, -1.0),
    vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0),
    vec2f( 1.0, -1.0),
    vec2f( 1.0,  1.0),
  );
  
  var uvs = array<vec2f, 6>(
    vec2f(0.0, 1.0),
    vec2f(1.0, 1.0),
    vec2f(0.0, 0.0),
    vec2f(0.0, 0.0),
    vec2f(1.0, 1.0),
    vec2f(1.0, 0.0),
  );
  
  var output: VertexOutput;
  output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

// ===== Fragment Shader =====
@group(0) @binding(0) var videoTexture: texture_external;
@group(0) @binding(1) var hudTexture: texture_2d<f32>;
@group(0) @binding(2) var texSampler: sampler;

struct Uniforms {
  time: f32,
  enableChromatic: f32,
  enableBloom: f32,
  enableScanlines: f32,
  enableVignette: f32,
  enableNoise: f32,
  resolution: vec2f,
}

@group(0) @binding(3) var<uniform> uniforms: Uniforms;

// 유틸리티 함수들
fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}

fn sampleHUDWithChromatic(uv: vec2f, offset: f32) -> vec4f {
  let r = textureSample(hudTexture, texSampler, uv + vec2f(offset, 0.0)).r;
  let g = textureSample(hudTexture, texSampler, uv).g;
  let b = textureSample(hudTexture, texSampler, uv - vec2f(offset, 0.0)).b;
  let a = textureSample(hudTexture, texSampler, uv).a;
  return vec4f(r, g, b, a);
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let uv = input.uv;
  
  // 1. 비디오 샘플링
  var videoColor = textureSampleBaseClampToEdge(videoTexture, texSampler, uv);
  
  // 2. HUD 샘플링 (크로마틱 애버레이션 옵션)
  var hudColor: vec4f;
  if (uniforms.enableChromatic > 0.5) {
    let aberrationStrength = 0.002;
    hudColor = sampleHUDWithChromatic(uv, aberrationStrength);
  } else {
    hudColor = textureSample(hudTexture, texSampler, uv);
  }
  
  // 3. 알파 블렌딩으로 합성
  var result = mix(videoColor.rgb, hudColor.rgb, hudColor.a);
  
  // 4. 블룸 효과 (간단한 버전)
  if (uniforms.enableBloom > 0.5) {
    // HUD의 밝은 부분에 글로우 추가
    let brightness = dot(hudColor.rgb, vec3f(0.299, 0.587, 0.114));
    if (brightness > 0.7) {
      let bloomColor = hudColor.rgb * 0.3;
      result += bloomColor * hudColor.a;
    }
  }
  
  // 5. 스캔라인 효과
  if (uniforms.enableScanlines > 0.5) {
    let scanline = sin(uv.y * uniforms.resolution.y * 3.14159 * 2.0) * 0.5 + 0.5;
    let scanlineIntensity = 0.05;
    result *= 1.0 - (scanlineIntensity * scanline);
  }
  
  // 6. 비네팅 효과
  if (uniforms.enableVignette > 0.5) {
    let center = vec2f(0.5, 0.5);
    let dist = distance(uv, center);
    let vignette = 1.0 - smoothstep(0.4, 0.8, dist);
    result *= vignette;
  }
  
  // 7. 필름 노이즈
  if (uniforms.enableNoise > 0.5) {
    let noise = hash(uv + uniforms.time) * 0.03;
    result += vec3f(noise);
  }
  
  return vec4f(result, 1.0);
}
`

// 폴백 셰이더 (효과 없이 단순 합성만)
const SIMPLE_COMPOSITOR_SHADER = /* wgsl */`
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f( 1.0, -1.0), vec2f(-1.0,  1.0),
    vec2f(-1.0,  1.0), vec2f( 1.0, -1.0), vec2f( 1.0,  1.0),
  );
  var uvs = array<vec2f, 6>(
    vec2f(0.0, 1.0), vec2f(1.0, 1.0), vec2f(0.0, 0.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(1.0, 0.0),
  );
  
  var output: VertexOutput;
  output.position = vec4f(positions[vertexIndex], 0.0, 1.0);
  output.uv = uvs[vertexIndex];
  return output;
}

@group(0) @binding(0) var videoTexture: texture_external;
@group(0) @binding(1) var hudTexture: texture_2d<f32>;
@group(0) @binding(2) var texSampler: sampler;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let video = textureSampleBaseClampToEdge(videoTexture, texSampler, input.uv);
  let hud = textureSample(hudTexture, texSampler, input.uv);
  let result = mix(video.rgb, hud.rgb, hud.a);
  return vec4f(result, 1.0);
}
`

// WebGPU Buffer 사용 플래그 상수
const GPU_BUFFER_USAGE_UNIFORM = 0x0040
const GPU_BUFFER_USAGE_COPY_DST = 0x0008
const GPU_TEXTURE_USAGE_TEXTURE_BINDING = 0x0004
const GPU_TEXTURE_USAGE_COPY_DST = 0x0002
const GPU_TEXTURE_USAGE_RENDER_ATTACHMENT = 0x0010

export class WebGPUCompositor {
  private device: any      // GPUDevice
  private pipeline: any    // GPURenderPipeline
  private sampler: any     // GPUSampler
  private outputCanvas: OffscreenCanvas
  private context: any     // GPUCanvasContext
  private config: WebGPUCompositorConfig

  // Uniform buffer for effects
  private uniformBuffer: any  // GPUBuffer
  private uniformData: Float32Array
  private hasEffects: boolean  // 효과 사용 여부

  private frameIndex = 0

  private constructor(
    device: any,
    pipeline: any,
    sampler: any,
    outputCanvas: OffscreenCanvas,
    context: any,
    uniformBuffer: any,
    config: WebGPUCompositorConfig,
    hasEffects: boolean
  ) {
    this.device = device
    this.pipeline = pipeline
    this.sampler = sampler
    this.outputCanvas = outputCanvas
    this.context = context
    this.uniformBuffer = uniformBuffer
    this.config = config
    this.hasEffects = hasEffects

    // [time, chromatic, bloom, scanlines, vignette, noise, resX, resY]
    this.uniformData = new Float32Array(8)
    this.uniformData[0] = 0 // time
    this.uniformData[1] = config.effects?.chromaticAberration ? 1 : 0
    this.uniformData[2] = config.effects?.bloom ? 1 : 0
    this.uniformData[3] = config.effects?.scanlines ? 1 : 0
    this.uniformData[4] = config.effects?.vignette ? 1 : 0
    this.uniformData[5] = config.effects?.noise ? 1 : 0
    this.uniformData[6] = config.width
    this.uniformData[7] = config.height
  }

  /**
   * WebGPU Compositor 생성 (비동기)
   */
  static async create(
    device: any,
    config: WebGPUCompositorConfig
  ): Promise<WebGPUCompositor> {
    const { width, height, effects } = config

    // 출력 캔버스 생성
    const outputCanvas = new OffscreenCanvas(width, height)
    const context = outputCanvas.getContext('webgpu') as any

    if (!context) {
      throw new Error('Failed to get WebGPU context')
    }

    // 캔버스 컨텍스트 설정
    const nav = navigator as any
    const format = nav.gpu.getPreferredCanvasFormat()
    context.configure({
      device,
      format,
      alphaMode: 'opaque',
    })

    // 셰이더 모듈 생성 (효과가 있으면 복잡한 셰이더, 없으면 단순 셰이더)
    const hasEffects = !!(effects && Object.values(effects).some(v => v))
    const shaderCode = hasEffects ? COMPOSITOR_SHADER : SIMPLE_COMPOSITOR_SHADER

    const shaderModule = device.createShaderModule({
      code: shaderCode,
    })

    // 샘플러 생성
    const sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
      mipmapFilter: 'linear',
    })

    // 파이프라인 생성
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }],
      },
      primitive: {
        topology: 'triangle-list',
      },
    })

    // Uniform buffer 생성 (효과용)
    const uniformBuffer = device.createBuffer({
      size: 32, // 8 floats * 4 bytes
      usage: GPU_BUFFER_USAGE_UNIFORM | GPU_BUFFER_USAGE_COPY_DST,
    })

    console.log('[WebGPUCompositor] Initialized')
    console.log(`[WebGPUCompositor] Resolution: ${width}x${height}`)
    console.log('[WebGPUCompositor] Effects:', effects)
    console.log('[WebGPUCompositor] Using effects shader:', hasEffects)

    return new WebGPUCompositor(
      device,
      pipeline,
      sampler,
      outputCanvas,
      context,
      uniformBuffer,
      config,
      hasEffects
    )
  }

  /**
   * 비디오 프레임과 HUD를 합성
   */
  composite(
    videoFrame: VideoFrame,
    hudCanvas: OffscreenCanvas | HTMLCanvasElement | null,
    timestamp: number
  ): VideoFrame {
    const { device, pipeline, sampler, context, config } = this

    // Uniform 업데이트 (효과 셰이더일 때만)
    if (this.hasEffects) {
      this.uniformData[0] = this.frameIndex / 60 // time in seconds
      device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData)
    }

    // 비디오 텍스처 생성 (external texture)
    const videoTexture = device.importExternalTexture({
      source: videoFrame,
    })

    // HUD 텍스처 생성
    let hudTexture: any
    if (hudCanvas) {
      hudTexture = device.createTexture({
        size: [config.width, config.height],
        format: 'rgba8unorm',
        usage: GPU_TEXTURE_USAGE_TEXTURE_BINDING | GPU_TEXTURE_USAGE_COPY_DST | GPU_TEXTURE_USAGE_RENDER_ATTACHMENT,
      })

      // HUD 캔버스 데이터를 텍스처로 복사
      device.queue.copyExternalImageToTexture(
        { source: hudCanvas },
        { texture: hudTexture },
        [config.width, config.height]
      )
    } else {
      // 빈 HUD (투명)
      hudTexture = device.createTexture({
        size: [1, 1],
        format: 'rgba8unorm',
        usage: GPU_TEXTURE_USAGE_TEXTURE_BINDING,
      })
    }

    // 바인드 그룹 생성 (효과 사용 여부에 따라 다른 엔트리)
    const bindGroupEntries: any[] = [
      { binding: 0, resource: videoTexture },
      { binding: 1, resource: hudTexture.createView() },
      { binding: 2, resource: sampler },
    ]
    
    // 효과 셰이더일 때만 uniform buffer 바인딩 추가
    if (this.hasEffects) {
      bindGroupEntries.push({ binding: 3, resource: { buffer: this.uniformBuffer } })
    }
    
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: bindGroupEntries,
    })

    // 렌더 패스 실행
    const commandEncoder = device.createCommandEncoder()
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: context.getCurrentTexture().createView(),
        loadOp: 'clear',
        storeOp: 'store',
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
      }],
    })

    renderPass.setPipeline(pipeline)
    renderPass.setBindGroup(0, bindGroup)
    renderPass.draw(6) // 풀스크린 쿼드
    renderPass.end()

    device.queue.submit([commandEncoder.finish()])

    // 임시 텍스처 정리
    hudTexture.destroy()

    this.frameIndex++

    // 결과를 VideoFrame으로 변환
    const resultFrame = new VideoFrame(this.outputCanvas, {
      timestamp,
      alpha: 'discard',
    })

    return resultFrame
  }

  /**
   * 효과 설정 업데이트
   */
  updateEffects(effects: WebGPUCompositorConfig['effects']): void {
    this.uniformData[1] = effects?.chromaticAberration ? 1 : 0
    this.uniformData[2] = effects?.bloom ? 1 : 0
    this.uniformData[3] = effects?.scanlines ? 1 : 0
    this.uniformData[4] = effects?.vignette ? 1 : 0
    this.uniformData[5] = effects?.noise ? 1 : 0

    console.log('[WebGPUCompositor] Effects updated:', effects)
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.uniformBuffer.destroy()
    this.frameIndex = 0
    console.log('[WebGPUCompositor] Destroyed')
  }
}

