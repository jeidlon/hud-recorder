/**
 * Dream Persona HUD Remaster - 트랜지션 효과 시스템
 * 
 * [MODULE-04] GUIDE-MODULE-04-TRANSITIONS.md 기준
 * - 시나리오 간 전환 시 부드러운 애니메이션 효과
 * - 페이드, 글리치, 픽셀화, 플래시, 깨지는 효과 지원
 */

import {
    type ScenarioId,
    type TransitionType,
    type TransitionState,
    TRANSITION_TYPES,
    TRANSITION_DURATION,
} from './constants'

type DrawContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 페이드 트랜지션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawFadeTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number,
    _fromColor: string,
    _toColor: string
): void {
    ctx.save()

    // 전반부: 검은색으로 페이드 아웃
    if (progress < 0.5) {
        const fadeOut = progress * 2 // 0 -> 1
        ctx.fillStyle = `rgba(0, 0, 0, ${fadeOut})`
        ctx.fillRect(0, 0, width, height)
    }
    // 후반부: 검은색에서 페이드 인
    else {
        const fadeIn = (progress - 0.5) * 2 // 0 -> 1
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - fadeIn})`
        ctx.fillRect(0, 0, width, height)
    }

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 글리치 트랜지션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawGlitchTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number,
    time: number
): void {
    ctx.save()

    // 글리치 강도 (중간에 가장 강함)
    const intensity = Math.sin(progress * Math.PI)

    // 수평 글리치 슬라이스
    const sliceCount = Math.floor(10 + intensity * 20)
    const sliceHeight = height / sliceCount

    for (let i = 0; i < sliceCount; i++) {
        const y = i * sliceHeight

        // 랜덤 오프셋 (시드 기반)
        const seed = Math.sin(i * 12.9898 + time * 100) * 43758.5453
        const offset = (seed % 1 - 0.5) * width * 0.1 * intensity

        // 슬라이스 이동 효과
        if (Math.abs(offset) > 5) {
            // 글리치 바 그리기
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * intensity})`
            ctx.fillRect(offset > 0 ? 0 : width + offset, y, Math.abs(offset), sliceHeight)

            ctx.fillStyle = `rgba(0, 255, 255, ${0.3 * intensity})`
            ctx.fillRect(offset > 0 ? width - offset : 0, y, Math.abs(offset), sliceHeight)
        }
    }

    // 전체 노이즈 오버레이
    ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * intensity})`
    const noiseCount = Math.floor(1000 * intensity)
    for (let i = 0; i < noiseCount; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        ctx.fillRect(x, y, 2, 2)
    }

    // RGB 분리
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `rgba(255, 0, 0, ${0.05 * intensity})`
    ctx.fillRect(-5 * intensity, 0, width, height)
    ctx.fillStyle = `rgba(0, 0, 255, ${0.05 * intensity})`
    ctx.fillRect(5 * intensity, 0, width, height)
    ctx.globalCompositeOperation = 'source-over'

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 픽셀화 트랜지션
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawPixelateTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number
): void {
    ctx.save()

    // 픽셀 크기 (중간에 가장 크게)
    const maxPixelSize = 32
    const pixelSize = Math.max(1, Math.floor(
        maxPixelSize * Math.sin(progress * Math.PI)
    ))

    if (pixelSize > 1) {
        // 그리드 오버레이로 픽셀화 효과 시뮬레이션
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.lineWidth = 1

        for (let x = 0; x < width; x += pixelSize) {
            ctx.beginPath()
            ctx.moveTo(x, 0)
            ctx.lineTo(x, height)
            ctx.stroke()
        }

        for (let y = 0; y < height; y += pixelSize) {
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(width, y)
            ctx.stroke()
        }
    }

    // 전환 중 어두워지는 효과
    ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * Math.sin(progress * Math.PI)})`
    ctx.fillRect(0, 0, width, height)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 플래시 트랜지션 (EVOLVED용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawFlashTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number,
    color: string = '#FFFFFF'
): void {
    ctx.save()

    // 플래시 강도 (시작에 가장 강하고 점점 사라짐)
    const flashIntensity = progress < 0.3
        ? 1
        : Math.max(0, 1 - (progress - 0.3) / 0.7)

    ctx.fillStyle = color
    ctx.globalAlpha = flashIntensity
    ctx.fillRect(0, 0, width, height)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 깨지는 효과 (Shatter)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawShatterTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number,
    time: number
): void {
    ctx.save()

    // 깨지는 조각들
    const shardCount = 20
    const gravity = 500

    for (let i = 0; i < shardCount; i++) {
        // 조각별 시작 위치 및 속도 (시드 기반)
        const seed = i * 123.456
        const startX = (Math.sin(seed) * 0.5 + 0.5) * width
        const startY = (Math.cos(seed * 2) * 0.5 + 0.5) * height
        const velocityX = (Math.sin(seed * 3) - 0.5) * 200
        const velocityY = -100 - Math.random() * 200

        // 현재 위치 계산
        const t = progress
        const currentX = startX + velocityX * t
        const currentY = startY + velocityY * t + 0.5 * gravity * t * t

        // 조각 크기 및 회전
        const size = 20 + Math.random() * 40
        const rotation = t * (Math.sin(seed * 4) * 5)

        // 조각 그리기
        ctx.save()
        ctx.translate(currentX, currentY)
        ctx.rotate(rotation)
        ctx.globalAlpha = Math.max(0, 1 - progress)

        // 삼각형 조각
        ctx.beginPath()
        ctx.moveTo(0, -size / 2)
        ctx.lineTo(size / 2, size / 2)
        ctx.lineTo(-size / 2, size / 2)
        ctx.closePath()

        ctx.fillStyle = `rgba(100, 100, 100, 0.5)`
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.restore()
    }

    // 크랙 라인
    if (progress < 0.3) {
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.globalAlpha = 1 - progress / 0.3

        // 중앙에서 방사형 크랙
        const cx = width / 2
        const cy = height / 2

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time
            const length = 100 + progress * 300

            ctx.beginPath()
            ctx.moveTo(cx, cy)
            ctx.lineTo(
                cx + Math.cos(angle) * length,
                cy + Math.sin(angle) * length
            )
            ctx.stroke()
        }
    }

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 워프 트랜지션 (추가)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function drawWarpTransition(
    ctx: DrawContext,
    width: number,
    height: number,
    progress: number,
    _time: number
): void {
    ctx.save()

    const cx = width / 2
    const cy = height / 2
    const intensity = Math.sin(progress * Math.PI)

    // 중심에서 방사형 라인
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * intensity})`
    ctx.lineWidth = 2

    const lineCount = 24
    for (let i = 0; i < lineCount; i++) {
        const angle = (i / lineCount) * Math.PI * 2
        const innerRadius = 50 * (1 - intensity)
        const outerRadius = Math.max(width, height) * intensity

        ctx.beginPath()
        ctx.moveTo(
            cx + Math.cos(angle) * innerRadius,
            cy + Math.sin(angle) * innerRadius
        )
        ctx.lineTo(
            cx + Math.cos(angle) * outerRadius,
            cy + Math.sin(angle) * outerRadius
        )
        ctx.stroke()
    }

    // 중앙 밝은 점
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100 * intensity)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.restore()
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 트랜지션 컨트롤러
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export class TransitionController {
    private state: TransitionState = {
        isTransitioning: false,
        fromScenario: null,
        toScenario: null,
        progress: 0,
        startTime: 0,
        duration: 500,
        type: 'fade',
    }

    startTransition(
        from: ScenarioId,
        to: ScenarioId,
        currentTime: number
    ): void {
        // 전환 타입 결정
        const key = `${from}->${to}`
        const type = TRANSITION_TYPES[key]
            || (to === 'evolved' ? TRANSITION_TYPES['any->evolved'] : null)
            || TRANSITION_TYPES['default']

        this.state = {
            isTransitioning: true,
            fromScenario: from,
            toScenario: to,
            progress: 0,
            startTime: currentTime,
            duration: TRANSITION_DURATION[type],
            type,
        }
    }

    update(currentTime: number): boolean {
        if (!this.state.isTransitioning) return false

        const elapsed = (currentTime - this.state.startTime) * 1000
        this.state.progress = Math.min(1, elapsed / this.state.duration)

        if (this.state.progress >= 1) {
            this.state.isTransitioning = false
            return true // 전환 완료
        }

        return false
    }

    draw(ctx: DrawContext, width: number, height: number, time: number): void {
        if (!this.state.isTransitioning) return

        switch (this.state.type) {
            case 'fade':
                drawFadeTransition(ctx, width, height, this.state.progress, '', '')
                break
            case 'glitch':
                drawGlitchTransition(ctx, width, height, this.state.progress, time)
                break
            case 'pixelate':
                drawPixelateTransition(ctx, width, height, this.state.progress)
                break
            case 'shatter':
                drawShatterTransition(ctx, width, height, this.state.progress, time)
                break
            case 'warp':
                drawWarpTransition(ctx, width, height, this.state.progress, time)
                break
            case 'flash':
                const flashColor = this.state.toScenario === 'evolved' ? '#FFD700' : '#FFFFFF'
                drawFlashTransition(ctx, width, height, this.state.progress, flashColor)
                break
        }
    }

    get isActive(): boolean {
        return this.state.isTransitioning
    }

    get shouldSwitchNow(): boolean {
        // 50% 지점에서 실제 시나리오 전환
        return this.state.progress >= 0.5
    }

    get toScenario(): ScenarioId | null {
        return this.state.toScenario
    }

    get currentProgress(): number {
        return this.state.progress
    }

    get currentType(): TransitionType {
        return this.state.type
    }
}
