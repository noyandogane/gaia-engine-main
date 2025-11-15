import { useEffect, useState } from 'react'

const FRAME_SAMPLE_WINDOW_MS = 250

const clampFps = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

export const useFrameRate = () => {
  const [fps, setFps] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      return
    }

    let animationFrame: number | null = null
    let lastTimestamp = performance.now()
    let frameCount = 0

    const handleFrame = (timestamp: number) => {
      frameCount += 1
      const delta = timestamp - lastTimestamp

      if (delta >= FRAME_SAMPLE_WINDOW_MS) {
        const nextFps = clampFps((frameCount * 1000) / delta)
        setFps(nextFps)
        frameCount = 0
        lastTimestamp = timestamp
      }

      animationFrame = window.requestAnimationFrame(handleFrame)
    }

    animationFrame = window.requestAnimationFrame(handleFrame)

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return fps
}

export default useFrameRate
