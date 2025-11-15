import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { resolveStorage } from '@/utils/storage'

export type CameraSettings = {
  rotateSensitivity: number
  zoomSensitivity: number
  panSensitivity: number
  dampingFactor: number
  invertHorizontalAxis: boolean
  invertVerticalAxis: boolean
}

const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  rotateSensitivity: 0.85,
  zoomSensitivity: 0.75,
  panSensitivity: 0.5,
  dampingFactor: 0.08,
  invertHorizontalAxis: false,
  invertVerticalAxis: false,
}

const createDefaultCameraSettings = (): CameraSettings => ({
  ...DEFAULT_CAMERA_SETTINGS,
})

export type CameraStoreState = CameraSettings & {
  setRotateSensitivity: (value: number) => void
  setZoomSensitivity: (value: number) => void
  setPanSensitivity: (value: number) => void
  setDampingFactor: (value: number) => void
  setInvertHorizontalAxis: (value: boolean) => void
  setInvertVerticalAxis: (value: boolean) => void
  reset: () => void
}

export const useCameraStore = create<CameraStoreState>()(
  persist(
    (set) => ({
      ...createDefaultCameraSettings(),
      setRotateSensitivity: (value) => set(() => ({ rotateSensitivity: value })),
      setZoomSensitivity: (value) => set(() => ({ zoomSensitivity: value })),
      setPanSensitivity: (value) => set(() => ({ panSensitivity: value })),
      setDampingFactor: (value) => set(() => ({ dampingFactor: value })),
      setInvertHorizontalAxis: (value) => set(() => ({ invertHorizontalAxis: value })),
      setInvertVerticalAxis: (value) => set(() => ({ invertVerticalAxis: value })),
      reset: () => set(() => createDefaultCameraSettings()),
    }),
    {
      name: 'camera-settings',
      version: 1,
      storage: createJSONStorage(resolveStorage),
      partialize: (state) => ({
        rotateSensitivity: state.rotateSensitivity,
        zoomSensitivity: state.zoomSensitivity,
        panSensitivity: state.panSensitivity,
        dampingFactor: state.dampingFactor,
        invertHorizontalAxis: state.invertHorizontalAxis,
        invertVerticalAxis: state.invertVerticalAxis,
      }),
    },
  ),
)

export const selectCameraSettings = (state: CameraStoreState): CameraSettings => ({
  rotateSensitivity: state.rotateSensitivity,
  zoomSensitivity: state.zoomSensitivity,
  panSensitivity: state.panSensitivity,
  dampingFactor: state.dampingFactor,
  invertHorizontalAxis: state.invertHorizontalAxis,
  invertVerticalAxis: state.invertVerticalAxis,
})
export const selectRotateSensitivity = (state: CameraStoreState) => state.rotateSensitivity
export const selectZoomSensitivity = (state: CameraStoreState) => state.zoomSensitivity
export const selectPanSensitivity = (state: CameraStoreState) => state.panSensitivity
export const selectDamping = (state: CameraStoreState) => state.dampingFactor
export const selectInvertHorizontalAxis = (state: CameraStoreState) => state.invertHorizontalAxis
export const selectInvertVerticalAxis = (state: CameraStoreState) => state.invertVerticalAxis
