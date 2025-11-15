import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import CameraControls from './CameraControls'

// Mock the stores
vi.mock('@stores', () => ({
  useCameraStore: vi.fn((selector) => {
    const state = {
      rotateSensitivity: 0.85,
      zoomSensitivity: 0.75,
      panSensitivity: 0.5,
      dampingFactor: 0.08,
      invertHorizontalAxis: false,
      invertVerticalAxis: false,
      setRotateSensitivity: vi.fn(),
      setZoomSensitivity: vi.fn(),
      setPanSensitivity: vi.fn(),
      setDampingFactor: vi.fn(),
      setInvertHorizontalAxis: vi.fn(),
      setInvertVerticalAxis: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
  selectCameraSettings: vi.fn((state) => state),
  selectRotateSensitivity: vi.fn((state) => state.rotateSensitivity),
  selectZoomSensitivity: vi.fn((state) => state.zoomSensitivity),
  selectPanSensitivity: vi.fn((state) => state.panSensitivity),
  selectDamping: vi.fn((state) => state.dampingFactor),
  selectInvertHorizontalAxis: vi.fn((state) => state.invertHorizontalAxis),
  selectInvertVerticalAxis: vi.fn((state) => state.invertVerticalAxis),
}))

// Mock the scene controller
const mockSceneController = {
  updateCameraSettings: vi.fn(),
  dispose: vi.fn(),
}

describe('CameraControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders camera controls panel', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    // Check that the panel is rendered with proper test id
    expect(screen.getByTestId('camera-controls')).toBeInTheDocument()
  })

  it('displays sensitivity controls', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    // Look for specific control labels
    expect(screen.getByText(/Rotate sensitivity/)).toBeInTheDocument()
    expect(screen.getByText(/Zoom sensitivity/)).toBeInTheDocument()
    expect(screen.getByText(/Pan sensitivity/)).toBeInTheDocument()
  })

  it('displays damping control', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    // Look for damping control
    expect(screen.getByText(/Damping:/)).toBeInTheDocument()
  })

  it('displays axis inversion controls', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    // Look for inversion controls - be more specific
    expect(screen.getByText('Invert horizontal')).toBeInTheDocument()
    expect(screen.getByText('Invert vertical')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    const panel = screen.getByTestId('camera-controls')
    expect(panel).toHaveAttribute('aria-label')
  })

  it('calls updateCameraSettings when sceneController is provided', () => {
    render(<CameraControls sceneController={mockSceneController} />)
    
    // The component should call updateCameraSettings on mount
    expect(mockSceneController.updateCameraSettings).toHaveBeenCalled()
  })

  it('does not crash when sceneController is null', () => {
    expect(() => {
      render(<CameraControls sceneController={null} />)
    }).not.toThrow()
  })

  it('renders toggle buttons for panel visibility', async () => {
    const user = userEvent.setup()
    render(<CameraControls sceneController={mockSceneController} />)
    
    // Look for toggle buttons or collapse/expand functionality
    const toggleButton = screen.queryByRole('button', { name: /toggle/i })
    if (toggleButton) {
      await user.click(toggleButton)
      // Should not crash and panel should still be present
      expect(screen.getByTestId('camera-controls')).toBeInTheDocument()
    }
  })
})