/**
 * ARWES Moving Lines Background - Ported from https://github.com/arwes/arwes
 * 배경에 수직으로 움직이는 라인 효과
 */
import React, { useRef, useEffect, useCallback } from 'react'

interface MovingLinesProps {
  lineWidth?: number
  lineColor?: string
  distance?: number
  sets?: number
  speed?: number // ms per cycle
  opacity?: number
  style?: React.CSSProperties
}

interface Line {
  axis1: number
  axis2Initial: number
  length: number
}

const random = (min: number, max: number): number => (max - min) * Math.random()

const randomizeList = <T,>(list: T[]): T[] => {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const createLinesSet = (
  positionsLength: number,
  margin: number,
  distance: number,
  size: number
): Line[] => {
  const linesLength = Math.floor(random(0.1, 0.5) * positionsLength)
  const positions = Array(positionsLength)
    .fill(0)
    .map((_, i) => i)
  const positionsRandom = randomizeList(positions)
  const positionsSelected = positionsRandom.slice(0, linesLength)

  return positionsSelected.map((position) => ({
    axis1: margin / 2 + position * distance,
    axis2Initial: Math.random() * (size / 2),
    length: Math.floor(random(0.1, 0.5) * size),
  }))
}

export const MovingLines: React.FC<MovingLinesProps> = ({
  lineWidth = 1,
  lineColor = 'rgba(255, 215, 0, 0.3)',
  distance = 30,
  sets = 5,
  speed = 10000,
  opacity = 0.5,
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const linesSetsRef = useRef<Line[][]>([])
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(performance.now())

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 2, 2)

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      linesSetsRef.current = [] // 리사이즈 시 재생성
    }

    const positionsLength = 1 + Math.floor(width / distance)
    const margin = width % distance

    // 라인 셋 생성 (첫 실행 또는 리사이즈 후)
    if (linesSetsRef.current.length === 0) {
      linesSetsRef.current = Array(sets)
        .fill(null)
        .map(() => createLinesSet(positionsLength, margin, distance, height))
    }

    // 인터벌 진행도 계산
    const elapsed = performance.now() - startTimeRef.current
    const intervalProgress = (elapsed % speed) / speed

    ctx.clearRect(0, 0, width, height)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = lineColor
    ctx.shadowBlur = lineWidth
    ctx.shadowColor = lineColor

    linesSetsRef.current.forEach((linesSet, linesSetIndex) => {
      const linesSetProgressOffset = (1 / sets) * linesSetIndex
      const progress = (intervalProgress + linesSetProgressOffset) % 1
      const progressEase = easeInOutCubic(progress)

      linesSet.forEach((line) => {
        const { axis1, axis2Initial, length } = line
        const axis2Move = height * 2 * progressEase - height

        ctx.beginPath()
        ctx.moveTo(axis1, height - (axis2Initial + axis2Move))
        ctx.lineTo(axis1, height - (axis2Initial + length + axis2Move))
        ctx.stroke()
        ctx.closePath()
      })
    })

    animationRef.current = requestAnimationFrame(draw)
  }, [lineWidth, lineColor, distance, sets, speed])

  useEffect(() => {
    startTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        ...style,
      }}
    />
  )
}

export default MovingLines
