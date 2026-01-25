/**
 * ARWES Text Decipher Effect - Ported from https://github.com/arwes/arwes
 * 텍스트가 글리치처럼 해독되는 효과
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'

const CIPHERED_CHARACTERS =
  '    ----____abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

interface TextDecipherProps {
  text: string
  duration?: number // ms
  characters?: string
  isActive?: boolean
  style?: React.CSSProperties
  className?: string
  onComplete?: () => void
}

// Fisher-Yates Shuffle
const randomizeList = <T,>(list: T[]): T[] => {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export const TextDecipher: React.FC<TextDecipherProps> = ({
  text,
  duration = 1000,
  characters = CIPHERED_CHARACTERS,
  isActive = true,
  style,
  className,
  onComplete,
}) => {
  const [displayText, setDisplayText] = useState('')
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const indexesRef = useRef<number[]>([])
  const decipheredRef = useRef<Record<number, boolean>>({})

  const animate = useCallback(() => {
    const now = performance.now()
    const elapsed = now - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)

    const length = text.length
    const newPositionsLength = Math.round(length * progress)

    // 어떤 문자가 해독되었는지 기록
    for (let i = 0; i < length; i++) {
      decipheredRef.current[indexesRef.current[i]] = i < newPositionsLength
    }

    // 텍스트 생성
    const newText = text
      .split('')
      .map((char, index) => {
        if (char === ' ') return ' '
        if (decipheredRef.current[index]) return char
        return characters[Math.floor(Math.random() * characters.length)]
      })
      .join('')

    setDisplayText(newText)

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      setDisplayText(text)
      onComplete?.()
    }
  }, [text, duration, characters, onComplete])

  useEffect(() => {
    if (!isActive) {
      setDisplayText(text)
      return
    }

    // 랜덤 인덱스 생성
    indexesRef.current = randomizeList(
      Array(text.length)
        .fill(null)
        .map((_, i) => i)
    )
    decipheredRef.current = {}
    startTimeRef.current = performance.now()

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [text, isActive, animate])

  return (
    <span style={style} className={className}>
      {displayText || text}
    </span>
  )
}

export default TextDecipher
