/**
 * WebGPU 지원 확인 유틸리티
 */

export interface WebGPUSupportResult {
  supported: boolean
  adapter: GPUAdapter | null
  device: GPUDevice | null
  features: string[]
  limits: Record<string, number>
  error?: string
}

let cachedResult: WebGPUSupportResult | null = null

/**
 * WebGPU 지원 여부 및 디바이스 정보 확인
 * 결과는 캐시되어 재사용됨
 */
export async function checkWebGPUSupport(): Promise<WebGPUSupportResult> {
  if (cachedResult) {
    return cachedResult
  }

  // navigator.gpu 존재 확인
  if (!navigator.gpu) {
    cachedResult = {
      supported: false,
      adapter: null,
      device: null,
      features: [],
      limits: {},
      error: 'WebGPU is not supported in this browser',
    }
    return cachedResult
  }

  try {
    // 어댑터 요청
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    })

    if (!adapter) {
      cachedResult = {
        supported: false,
        adapter: null,
        device: null,
        features: [],
        limits: {},
        error: 'No WebGPU adapter available',
      }
      return cachedResult
    }

    // 디바이스 요청
    const device = await adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {},
    })

    // 지원되는 피처 목록
    const features = Array.from(adapter.features)

    // 리미트 정보
    const limits: Record<string, number> = {}
    const limitKeys = [
      'maxTextureDimension2D',
      'maxTextureArrayLayers',
      'maxBindGroups',
      'maxUniformBufferBindingSize',
      'maxStorageBufferBindingSize',
    ]
    for (const key of limitKeys) {
      const value = adapter.limits[key as keyof GPUSupportedLimits]
      if (typeof value === 'number') {
        limits[key] = value
      }
    }

    cachedResult = {
      supported: true,
      adapter,
      device,
      features,
      limits,
    }

    console.log('[WebGPU] Initialized successfully')
    console.log('[WebGPU] Features:', features)
    console.log('[WebGPU] Limits:', limits)

    return cachedResult
  } catch (error) {
    cachedResult = {
      supported: false,
      adapter: null,
      device: null,
      features: [],
      limits: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    return cachedResult
  }
}

/**
 * 캐시된 WebGPU 디바이스 가져오기 (이미 초기화된 경우)
 */
export function getCachedWebGPUDevice(): GPUDevice | null {
  return cachedResult?.device ?? null
}
