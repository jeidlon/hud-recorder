/**
 * React HUD 오프라인 렌더러 (v2 - 미리보기와 동일한 품질)
 * 
 * 핵심 원칙: 미리보기에서 사용하는 React 컴포넌트를 그대로 사용
 * 
 * 변경사항:
 * 1. html2canvas → html-to-image (더 정확한 CSS 지원)
 * 2. 숨겨진 위치 → 화면에 보이는 위치 (모든 CSS 적용 보장)
 * 3. 렌더링 중 오버레이 표시 (사용자에게 진행 상황 알림)
 */

import { createRoot, type Root } from 'react-dom/client'
import { toPng } from 'html-to-image'
import type { ComponentType } from 'react'
import type { HUDComponentProps, ExternalHUDState } from '@/presets'
import { getPresetById } from '@/presets'
import type { FrameState } from './InputInterpolator'

export interface ReactHUDRendererConfig {
  width: number
  height: number
  presetId: string
  scale?: number
}

interface HUDWrapperProps {
  HUDComponent: ComponentType<HUDComponentProps>
  width: number
  height: number
  externalState: ExternalHUDState
  onReady: () => void
}

/**
 * HUD 컴포넌트를 래핑하는 컴포넌트
 * 미리보기와 100% 동일한 React 컴포넌트 사용
 */
function HUDWrapper({ HUDComponent, width, height, externalState, onReady }: HUDWrapperProps) {
  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      <HUDComponent
        width={width}
        height={height}
        isPlaying={false}
        onStateUpdate={() => {}}
        onReady={onReady}
        externalState={externalState}
      />
    </div>
  )
}

/**
 * React HUD를 오프라인으로 렌더링하는 클래스 (v2)
 * 미리보기와 동일한 품질 보장
 */
export class ReactHUDRenderer {
  private config: ReactHUDRendererConfig
  private container: HTMLDivElement | null = null
  private root: Root | null = null
  private HUDComponent: ComponentType<HUDComponentProps> | null = null
  private _ready = false
  private scale: number

  get isReady(): boolean {
    return this._ready
  }
  private overlay: HTMLDivElement | null = null

  constructor(config: ReactHUDRendererConfig) {
    this.config = config
    this.scale = config.scale || 1
  }

  /**
   * 렌더러 초기화
   * 화면에 보이는 위치에 컨테이너 생성 (모든 CSS 적용 보장)
   */
  async initialize(): Promise<void> {
    // 프리셋에서 HUD 컴포넌트 가져오기
    const preset = getPresetById(this.config.presetId)
    if (!preset || !preset.component) {
      throw new Error(`HUD preset not found or has no component: ${this.config.presetId}`)
    }
    this.HUDComponent = preset.component

    // 렌더링 진행 오버레이 생성 (HUD 컨테이너를 가림)
    this.overlay = document.createElement('div')
    this.overlay.id = 'react-hud-renderer-overlay'
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #000;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: system-ui, sans-serif;
    `
    this.overlay.innerHTML = `
      <div style="font-size: 18px; margin-bottom: 16px; color: #FFD700;">🎬 렌더링 중...</div>
      <div style="font-size: 14px; color: #888;">미리보기와 동일한 품질로 HUD를 캡처하고 있습니다</div>
      <div style="font-size: 12px; color: #666; margin-top: 8px;">이 창을 닫거나 최소화하지 마세요</div>
      <div id="render-progress" style="font-size: 14px; color: #FFD700; margin-top: 16px;">0%</div>
    `
    document.body.appendChild(this.overlay)

    // HUD 렌더링 컨테이너 생성 (오버레이 뒤에 숨김)
    this.container = document.createElement('div')
    this.container.id = 'react-hud-renderer-container'
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(${this.scale});
      transform-origin: center center;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      z-index: 99998;
      background: transparent;
      pointer-events: none;
    `
    document.body.appendChild(this.container)

    // React 마운트
    this.root = createRoot(this.container)

    // 초기 렌더링 및 준비 대기
    await new Promise<void>((resolve) => {
      const initialExternalState: ExternalHUDState = {
        timestamp: 0,
        mouse: { x: this.config.width / 2, y: this.config.height / 2 },
        scenario: 'idle',
        customData: {},
      }

      this.root!.render(
        <HUDWrapper
          HUDComponent={this.HUDComponent!}
          width={this.config.width}
          height={this.config.height}
          externalState={initialExternalState}
          onReady={() => {
            this._ready = true
            // DOM 업데이트 + 폰트/스타일 로딩 대기
            requestAnimationFrame(() => {
              setTimeout(resolve, 200)
            })
          }}
        />
      )
    })

    console.log('[ReactHUDRenderer v2] ✅ Initialized with visible container')
    console.log(`[ReactHUDRenderer v2] Preset: ${this.config.presetId}, Size: ${this.config.width}x${this.config.height}`)
  }

  /**
   * 특정 상태로 HUD 프레임 렌더링 및 캡처
   * html-to-image 사용 (html2canvas보다 정확)
   * @param state - 프레임 상태
   * @param timestampMs - 밀리초 단위 타임스탬프 (기본값: 0)
   */
  async render(state: FrameState, timestampMs: number = 0): Promise<HTMLCanvasElement> {
    if (!this.container || !this.root || !this.HUDComponent) {
      throw new Error('ReactHUDRenderer not initialized')
    }

    // FrameState를 ExternalHUDState로 변환
    const externalState: ExternalHUDState = {
      timestamp: timestampMs,
      mouse: { x: state.mouse.x, y: state.mouse.y },
      scenario: (state.customData as { scenario?: string })?.scenario || 'idle',
      customData: state.customData as Record<string, unknown>,
    }

    // 상태 업데이트를 위해 React 리렌더링
    await new Promise<void>((resolve) => {
      this.root!.render(
        <HUDWrapper
          HUDComponent={this.HUDComponent!}
          width={this.config.width}
          height={this.config.height}
          externalState={externalState}
          onReady={() => resolve()}
        />
      )
      // React 렌더링 + DOM 업데이트 대기
      requestAnimationFrame(() => {
        setTimeout(resolve, 32) // 2 프레임 대기 (60fps 기준)
      })
    })

    // html-to-image로 캡처 (html2canvas보다 정확한 CSS 지원)
    const dataUrl = await toPng(this.container, {
      backgroundColor: undefined, // 투명 배경
      pixelRatio: this.scale,
      skipAutoScale: true,
      cacheBust: true,
      // 폰트 임베딩
      fontEmbedCSS: '',
      // 스타일 인라인
      style: {
        transform: 'none', // 캡처 시 transform 제거
      },
    })

    // Data URL을 Canvas로 변환
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = reject
      img.src = dataUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = this.config.width * this.scale
    canvas.height = this.config.height * this.scale
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)

    return canvas
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
      this.container = null
    }
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay)
      this.overlay = null
    }
    this._ready = false
    console.log('[ReactHUDRenderer v2] Destroyed')
  }
}

/**
 * React 기반 HUD 프리셋인지 확인
 * 이 목록의 프리셋은 ReactHUDRenderer를 사용하여 미리보기와 동일한 품질 보장
 */
export function isReactBasedPreset(presetId: string): boolean {
  const reactPresets = [
    'hexa-tactical',
    'dream-persona-remaster',
  ]
  return reactPresets.includes(presetId)
}
