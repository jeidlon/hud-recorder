/**
 * ARWES Illuminator Effect - Ported from https://github.com/arwes/arwes
 * 마우스를 따라다니는 조명 효과
 */
import React, { useRef, useEffect, useState } from 'react'

interface IlluminatorProps {
  color?: string
  size?: number
  opacity?: number
  style?: React.CSSProperties
}

export const Illuminator: React.FC<IlluminatorProps> = ({
  color = 'rgba(255, 215, 0, 0.08)',
  size = 300,
  opacity = 1,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const illuminatorRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const illuminator = illuminatorRef.current
    if (!container || !illuminator) return

    const onMove = (event: MouseEvent) => {
      const bounds = container.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top

      const visible =
        x >= -(size / 2) &&
        x <= bounds.width + size / 2 &&
        y >= -(size / 2) &&
        y <= bounds.height + size / 2

      setIsVisible(visible)

      if (visible) {
        illuminator.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`
      }
    }

    const onLeave = () => {
      setIsVisible(false)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)

    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [size])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    >
      <div
        ref={illuminatorRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size,
          background: `radial-gradient(closest-side, ${color}, transparent)`,
          opacity: isVisible ? opacity : 0,
          transition: 'opacity 200ms ease-out',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

export default Illuminator
