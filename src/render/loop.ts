export type RenderLoopController = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
}

export const createRenderLoop = (step: (deltaTime: number) => void): RenderLoopController => {
  let frameId: number | null = null
  let previousTime: number | null = null

  const loop = (time: number) => {
    if (previousTime === null) {
      previousTime = time
    }

    const delta = (time - previousTime) / 1000
    previousTime = time

    step(delta)
    frameId = window.requestAnimationFrame(loop)
  }

  return {
    start: () => {
      if (frameId !== null) {
        return
      }

      previousTime = null
      frameId = window.requestAnimationFrame(loop)
    },
    stop: () => {
      if (frameId === null) {
        return
      }

      window.cancelAnimationFrame(frameId)
      frameId = null
      previousTime = null
    },
    isRunning: () => frameId !== null,
  }
}
