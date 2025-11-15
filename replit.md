# Gaia Engine - Planet Simulation

## Overview

Gaia Engine is a 3D planet simulation and terrain editor built with React, TypeScript, Three.js, and Zustand. It allows users to create, customize, and visualize procedurally generated planets with realistic terrain, climate systems, and seasonal effects.

**Current State**: The project is a working prototype/terrain editor with procedural planet generation, climate effects, and an interactive 3D view.

## Purpose

This application serves as a planet simulation engine where users can:
- Generate procedural terrain using noise algorithms
- Adjust climate parameters (temperature, axial tilt, albedo)
- Control time and observe seasonal changes
- Manipulate camera controls and visualization settings
- Save and load planet states

## Recent Changes

- **2024-11-15**: Configured for Replit environment
  - Updated Vite configuration to run on port 5000 with proper host settings (0.0.0.0)
  - Fixed HMR WebSocket configuration for Replit proxy (WSS with proper domain)
  - Fixed TypeScript import issues with `verbatimModuleSyntax` (separated type/value imports)
  - Added proper path aliases for module resolution (both with and without wildcard)
  - Fixed Three.js OrbitControls import path (examples/jsm → addons)
  - Disabled axis inversion feature (incompatible with current Three.js OrbitControls API)
  - Fixed infinite render loop in CameraControls component (removed object selector dependency)
  - Dependencies installed and workflow configured

## Project Architecture

### Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **3D Rendering**: Three.js
- **State Management**: Zustand
- **Testing**: Vitest (unit tests), Playwright (e2e tests)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

### Directory Structure

```
src/
├── app/          # React UI components and application logic
│   ├── App.tsx   # Main application component
│   ├── CameraControls.tsx
│   ├── ClimateControls.tsx
│   ├── TerrainControls.tsx
│   ├── SimulationControls.tsx
│   ├── HudStats.tsx
│   └── NotificationCenter.tsx
├── render/       # Three.js 3D rendering engine
│   ├── planetScene.ts    # Main 3D scene setup
│   ├── terrainShader.ts  # Custom terrain shaders
│   └── loop.ts          # Render loop management
├── sim/          # Simulation logic and game mechanics
│   ├── planetState.ts   # Planet state management
│   ├── eventBus.ts      # Event system
│   ├── tickScheduler.ts # Time/simulation control
│   ├── saveSlots.ts     # Save/load functionality
│   └── notifications.ts # Notification system
├── stores/       # Zustand state stores
│   ├── planetStore.ts
│   ├── terrainStore.ts
│   ├── climateStore.ts
│   ├── cameraStore.ts
│   ├── simulationStore.ts
│   └── settingsStore.ts
├── utils/        # Utility functions
│   ├── terrainGenerator.ts
│   ├── climate.ts
│   └── noise.ts
└── ui/           # Global styles and UI primitives
    └── global.css
```

### Key Features

1. **Procedural Terrain Generation**
   - Perlin/Simplex noise-based terrain
   - Adjustable parameters: seed, scale, persistence, lacunarity, octaves
   - Multiple elevation zones: water, beach, plains, hills, mountains

2. **Climate System**
   - Temperature overlays based on latitude and axial tilt
   - Seasonal changes driven by time progression
   - Configurable: axial tilt, albedo, greenhouse effect

3. **Interactive Camera**
   - Orbit controls for rotation, zoom, and pan
   - Customizable sensitivity and damping
   - Axis inversion options

4. **Time Simulation**
   - Adjustable simulation speed (0.5x to 8x)
   - Play/pause functionality
   - Day/season tracking

5. **Save/Load System**
   - Local storage-based save slots
   - Auto-load on startup (optional)
   - Planet state persistence

## Development

### Running Locally

The app is configured to run on port 5000:

```bash
npm install
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server (port 5000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Check code quality
- `npm run lint:fix` - Fix linting issues
- `npm run format` - Format code with Prettier

### Replit-Specific Configuration

- **Port**: 5000 (configured in vite.config.ts)
- **Host**: 0.0.0.0 (allows external access)
- **HMR**: Configured for WSS with Replit domain
- **Workflow**: `dev` workflow runs `npm run dev`

## User Preferences

None documented yet. User preferences will be added here as they are expressed during development.

## Known Limitations

This is a prototype, not a complete game:

- No gameplay objectives or goals
- No civilization management (exists as data only)
- No disasters or random events
- No progression system
- Limited to terrain editing and parameter adjustment

## Dependencies

### Production
- react: UI framework
- react-dom: React DOM renderer
- three: 3D graphics library
- zustand: State management

### Development
- vite: Build tool and dev server
- typescript: Type system
- vitest: Unit testing
- playwright: E2E testing
- eslint: Linting
- prettier: Code formatting

## Technical Notes

### TypeScript Configuration

The project uses strict TypeScript with:
- `verbatimModuleSyntax: true` - Requires explicit `type` imports
- Path aliases for clean imports (@app, @render, @sim, @stores, @ui, @assets)
- Strict mode enabled for maximum type safety

### WebGL Requirement

This application requires WebGL support in the browser. The Three.js renderer creates a WebGL context for 3D rendering.

## Resources

- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [Three.js Documentation](https://threejs.org/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
