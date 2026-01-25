/**
 * LiveCaptureRenderer - 실제 미리보기 화면을 직접 캡처
 * 
 * 핵심 원리:
 * - 새로 React 컴포넌트를 마운트하지 않음
 * - 실제 화면에 렌더링된 HUD를 html-to-image로 캡처
 * - hudExportState를 통해 HUD 상태를 외부에서 제어
 * 
 * 이 방식으로 미리보기와 100% 동일한 품질 보장
 */

import * as toImage from 'html-to-image'
import type { ExternalHUDState } from '@/presets'
import { useAppStore } from '@/store/useAppStore'
import type { FrameState } from './InputInterpolator'

interface LiveCaptureConfig {
  width: number
  height: number
}

export class LiveCaptureRenderer {
  private config: LiveCaptureConfig
  private hudContainer: HTMLDivElement | null = null
  private renderOverlay: HTMLDivElement | null = null

  get isCapturing(): boolean {
    return this._capturing
  }
  private _capturing = false

  constructor(config: LiveCaptureConfig) {
    this.config = config
  }

  /**
   * 초기화 - HUD 컨테이너 찾기 및 오버레이 생성
   */
  async initialize(): Promise<void> {
    // HUD 컨테이너 찾기 (비디오 + HUD 영역)
    // App.tsx의 containerRef가 가리키는 요소를 찾음
    const containers = document.querySelectorAll('[class*="relative"][class*="overflow-hidden"]')
    for (const container of containers) {
      const rect = container.getBoundingClientRect()
      // 비디오 컨테이너로 추정되는 요소 찾기 (aspect ratio가 맞는 것)
      if (rect.width > 400 && rect.height > 200) {
        this.hudContainer = container as HTMLDivElement
        break
      }
    }

    if (!this.hudContainer) {
      console.warn('[LiveCapture] HUD 컨테이너를 찾지 못함, 대체 방법 시도')
      // 대체: data-hud-container 속성이 있는 요소 찾기
      this.hudContainer = document.querySelector('[data-hud-container]') as HTMLDivElement
    }

    // 렌더링 오버레이 생성
    this.renderOverlay = document.createElement('div')
    this.renderOverlay.id = 'live-capture-overlay'
    this.renderOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      font-family: 'Outfit', sans-serif;
      font-size: 1.1em;
      z-index: 999999;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `
    this.renderOverlay.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:15px; max-width:400px; text-align:center;">
        <div style="border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid white; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
        <div style="font-size: 1.2em; font-weight: 600;">HUD 렌더링 중...</div>
        <div style="font-size: 0.85em; opacity: 0.7; line-height: 1.5;">
          미리보기와 100% 동일한 퀄리티로 렌더링 중입니다.<br>
          창을 최소화하거나 다른 탭으로 이동하지 마세요.
        </div>
        <div id="live-capture-progress" style="font-size: 0.9em; color: #00FFFF;">0%</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `
    document.body.appendChild(this.renderOverlay)

    console.log('[LiveCapture] 초기화 완료')
  }

  /**
   * HUD 컨테이너 설정 (App.tsx의 containerRef 직접 전달)
   */
  setHudContainer(container: HTMLDivElement): void {
    this.hudContainer = container
    console.log('[LiveCapture] HUD 컨테이너 설정됨:', container)
  }

  /**
   * 렌더링 시작 - 오버레이 표시
   */
  startCapture(): void {
    this._capturing = true
    if (this.renderOverlay) {
      this.renderOverlay.style.opacity = '1'
    }
  }

  /**
   * 진행률 업데이트
   */
  updateProgress(percent: number): void {
    const progressEl = document.getElementById('live-capture-progress')
    if (progressEl) {
      progressEl.textContent = `${Math.round(percent)}%`
    }
  }

  /**
   * 프레임 캡처 - hudExportState 설정 후 화면 캡처
   * @param state - 프레임 상태
   * @param timestampMs - 밀리초 단위 타임스탬프 (기본값: 0)
   */
  async captureFrame(state: FrameState, timestampMs: number = 0): Promise<HTMLCanvasElement | null> {
    if (!this.hudContainer) {
      console.warn('[LiveCapture] HUD 컨테이너 없음')
      return null
    }

    // 1. hudExportState 업데이트 (HUD 컴포넌트가 이 상태를 반영)
    const exportState: ExternalHUDState = {
      timestamp: timestampMs,
      mouse: { x: state.mouse.x, y: state.mouse.y },
      customData: state.customData as Record<string, unknown>,
    }
    useAppStore.getState().setHudExportState(exportState)

    // 2. DOM 업데이트 대기 (React 리렌더링)
    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    }))
    // 추가 딜레이 (애니메이션 안정화)
    await new Promise(resolve => setTimeout(resolve, 16))

    try {
      // 3. 화면 캡처 (html-to-image)
      // skipFonts: true - 외부 CSS 접근 CORS 에러 방지
      // 폰트는 이미 브라우저에 로드되어 있으므로 캡처 시 적용됨
      const dataUrl = await toImage.toPng(this.hudContainer, {
        width: this.config.width,
        height: this.config.height,
        pixelRatio: 1,
        backgroundColor: undefined, // 투명 배경
        skipFonts: true, // CORS 에러 방지 - 이미 로드된 폰트는 적용됨
        cacheBust: true,
        style: {
          // 🔥 해상도 강제 적용 - 콘솔 열림 등 뷰포트 변화에 관계없이 정확한 크기
          width: `${this.config.width}px`,
          height: `${this.config.height}px`,
          minWidth: `${this.config.width}px`,
          minHeight: `${this.config.height}px`,
          maxWidth: `${this.config.width}px`,
          maxHeight: `${this.config.height}px`,
          transform: 'none',
          margin: '0',
        },
      })

      // 4. Canvas로 변환
      const img = new Image()
      img.src = dataUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = this.config.width
      canvas.height = this.config.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, this.config.width, this.config.height)
      }

      return canvas
    } catch (error) {
      console.error('[LiveCapture] 캡처 실패:', error)
      return null
    }
  }

  /**
   * HUD만 캡처 (비디오 없이)
   * HUD 오버레이 레이어만 캡처
   * @param state - 프레임 상태
   * @param timestampMs - 밀리초 단위 타임스탬프 (기본값: 0)
   */
  async captureHUDOnly(state: FrameState, timestampMs: number = 0): Promise<HTMLCanvasElement | null> {
    // HUD 오버레이 레이어 찾기
    const hudOverlay = this.hudContainer?.querySelector('[style*="z-index: 10"]') as HTMLDivElement
    if (!hudOverlay && this.hudContainer) {
      // 대체: HUD 컨테이너 내의 첫 번째 absolute 자식
      const children = this.hudContainer.querySelectorAll(':scope > div')
      for (const child of children) {
        const style = window.getComputedStyle(child)
        if (style.position === 'absolute' && style.zIndex) {
          return this.captureElement(child as HTMLDivElement, state, timestampMs)
        }
      }
    }

    if (hudOverlay) {
      return this.captureElement(hudOverlay, state, timestampMs)
    }

    // HUD 오버레이를 찾지 못하면 전체 컨테이너 캡처
    return this.captureFrame(state, timestampMs)
  }

  /**
   * 특정 요소 캡처
   */
  private async captureElement(element: HTMLDivElement, state: FrameState, timestampMs: number = 0): Promise<HTMLCanvasElement | null> {
    // hudExportState 업데이트
    const exportState: ExternalHUDState = {
      timestamp: timestampMs,
      mouse: { x: state.mouse.x, y: state.mouse.y },
      customData: state.customData as Record<string, unknown>,
    }
    useAppStore.getState().setHudExportState(exportState)

    await new Promise(resolve => requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    }))
    await new Promise(resolve => setTimeout(resolve, 16))

    try {
      // skipFonts: true - 외부 CSS 접근 CORS 에러 방지
      // 폰트는 이미 브라우저에 로드되어 있으므로 캡처 시 적용됨
      const dataUrl = await toImage.toPng(element, {
        width: this.config.width,
        height: this.config.height,
        pixelRatio: 1,
        backgroundColor: 'transparent',
        skipFonts: true, // CORS 에러 방지 - 이미 로드된 폰트는 적용됨
        cacheBust: true,
        style: {
          // 🔥 해상도 강제 적용
          width: `${this.config.width}px`,
          height: `${this.config.height}px`,
          minWidth: `${this.config.width}px`,
          minHeight: `${this.config.height}px`,
          maxWidth: `${this.config.width}px`,
          maxHeight: `${this.config.height}px`,
        },
      })

      const img = new Image()
      img.src = dataUrl
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = this.config.width
      canvas.height = this.config.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, this.config.width, this.config.height)
      }

      return canvas
    } catch (error) {
      console.error('[LiveCapture] 요소 캡처 실패:', error)
      return null
    }
  }

  /**
   * 렌더링 종료
   */
  stopCapture(): void {
    this._capturing = false
    // hudExportState 리셋
    useAppStore.getState().setHudExportState(null)

    if (this.renderOverlay) {
      this.renderOverlay.style.opacity = '0'
    }
  }

  /**
   * 정리
   */
  destroy(): void {
    this.stopCapture()
    if (this.renderOverlay && this.renderOverlay.parentNode) {
      this.renderOverlay.parentNode.removeChild(this.renderOverlay)
    }
    this.renderOverlay = null
    this.hudContainer = null
    console.log('[LiveCapture] 정리 완료')
  }
}
