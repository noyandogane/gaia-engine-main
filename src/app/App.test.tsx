import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import App from './App'

// Mock the render module
vi.mock('@render', () => ({
  createPlanetScene: vi.fn(() => ({
    dispose: vi.fn(),
    updateCameraSettings: vi.fn(),
    updateClimateParams: vi.fn(),
  })),
}))

// Mock the sim module
vi.mock('@sim', () => ({
  createTickScheduler: vi.fn(() => ({
    play: vi.fn(),
    dispose: vi.fn(),
    speeds: { normal: 1, fast: 2, slow: 0.5 },
  })),
  DEFAULT_SIMULATION_SPEEDS: { normal: 1, fast: 2, slow: 0.5 },
  findMostRecentValidSaveSlot: vi.fn(() => null),
  loadPlanetSaveSlot: vi.fn(),
}))

// Mock the stores
vi.mock('@stores', () => ({
  useClimateStore: vi.fn((selector) => {
    const state = {
      climate: {
        axialTiltDegrees: 23.5,
        albedo: 0.3,
        greenhouseMultiplier: 1.0,
        currentTime: 0,
        yearLength: 365,
      },
      showTemperatureOverlay: false,
      setAxialTilt: vi.fn(),
      setAlbedo: vi.fn(),
      setGreenhouseMultiplier: vi.fn(),
      setCurrentTime: vi.fn(),
      setYearLength: vi.fn(),
      incrementTime: vi.fn(),
      toggleTemperatureOverlay: vi.fn(),
      setShowTemperatureOverlay: vi.fn(),
      reset: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
  useCameraStore: {
    getState: vi.fn(() => ({
      rotateSensitivity: 0.85,
      zoomSensitivity: 0.75,
      panSensitivity: 0.5,
      dampingFactor: 0.08,
      invertHorizontalAxis: false,
      invertVerticalAxis: false,
    })),
  },
  useSimulationStore: vi.fn((selector) => {
    const state = {
      hydrateFromScheduler: vi.fn(() => vi.fn()),
    }
    return selector ? selector(state) : state
  }),
  useSettingsStore: vi.fn((selector) => {
    const state = {
      loadLastSaveOnStartup: false,
    }
    return selector ? selector(state) : state
  }),
  usePlanetStore: vi.fn((selector) => {
    const state = {
      setPlanetState: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
  selectCameraSettings: vi.fn((state) => state),
  selectLoadLastSaveOnStartup: vi.fn((state) => state.loadLastSaveOnStartup),
}))

// Mock the sub-components
vi.mock('./CameraControls', () => ({
  default: ({ sceneController }: { sceneController: { dispose: () => void } | null }) => (
    <div data-testid="camera-controls">
      Camera Controls {sceneController ? 'connected' : 'disconnected'}
    </div>
  ),
}))

vi.mock('./TerrainControls', () => ({
  default: ({ sceneController }: { sceneController: { dispose: () => void } | null }) => (
    <div data-testid="terrain-controls">
      Terrain Controls {sceneController ? 'connected' : 'disconnected'}
    </div>
  ),
}))

vi.mock('./HudStats', () => ({
  default: () => <div data-testid="hud-stats">HUD Stats</div>,
}))

vi.mock('./SimulationControls', () => ({
  default: () => <div data-testid="simulation-controls">Simulation Controls</div>,
}))

vi.mock('./ClimateControls', () => ({
  default: ({ sceneController }: { sceneController: { dispose: () => void } | null }) => (
    <div data-testid="climate-controls">
      Climate Controls {sceneController ? 'connected' : 'disconnected'}
    </div>
  ),
}))

vi.mock('./NotificationCenter', () => ({
  default: () => <div data-testid="notification-center">Notification Center</div>,
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main application structure', () => {
    render(<App />)

    // Check that the main HUD container is present
    const mainElement = screen.getByRole('main', { name: 'Planet simulation interface' })
    expect(mainElement).toBeInTheDocument()
  })

  it('renders the canvas element', () => {
    render(<App />)

    const canvas = screen.getByLabelText('Planet visualization')
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
  })

  it('renders all control panels', () => {
    render(<App />)

    // Check that all control components are rendered
    expect(screen.getByTestId('terrain-controls')).toBeInTheDocument()
    expect(screen.getByTestId('camera-controls')).toBeInTheDocument()
    expect(screen.getByTestId('climate-controls')).toBeInTheDocument()
    expect(screen.getByTestId('hud-stats')).toBeInTheDocument()
    expect(screen.getByTestId('simulation-controls')).toBeInTheDocument()
    expect(screen.getByTestId('notification-center')).toBeInTheDocument()
  })

  it('renders the overlay structure correctly', () => {
    render(<App />)

    // Check for overlay structure
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveClass('hud')

    const canvas = screen.getByLabelText('Planet visualization')
    expect(canvas).toHaveClass('hud__scene')
  })

  it('has proper accessibility attributes', () => {
    render(<App />)

    // Check ARIA labels
    const mainElement = screen.getByRole('main')
    expect(mainElement).toHaveAttribute('aria-label', 'Planet simulation interface')

    const canvas = screen.getByLabelText('Planet visualization')
    expect(canvas).toHaveAttribute('aria-label', 'Planet visualization')
  })

  it('renders CSS classes correctly', () => {
    render(<App />)

    const mainElement = screen.getByRole('main')
    expect(mainElement.className).toContain('hud')

    const canvas = screen.getByLabelText('Planet visualization')
    expect(canvas.className).toContain('hud__scene')
  })
})
