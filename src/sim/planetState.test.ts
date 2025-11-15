import { describe, expect, it } from 'vitest'

import {
  PLANET_STATE_VERSION,
  createDefaultPlanetState,
  deserializePlanetState,
  serializePlanetState,
  type PlanetState,
} from './planetState'

describe('planetState', () => {
  it('creates a default state with the current schema version', () => {
    const state = createDefaultPlanetState()

    expect(state.version).toBe(PLANET_STATE_VERSION)
    expect(state.atmosphere.gases).not.toHaveLength(0)
    expect(state.geology.heightField.values).toHaveLength(
      state.geology.heightField.width * state.geology.heightField.height,
    )
  })

  it('round-trips through serialization helpers without data loss', () => {
    const customState: PlanetState = {
      version: PLANET_STATE_VERSION,
      atmosphere: {
        gases: [
          { gas: 'nitrogen', percentage: 70 },
          { gas: 'oxygen', percentage: 28 },
          { gas: 'argon', percentage: 1.5 },
          { gas: 'methane', percentage: 0.4 },
        ],
        surfacePressureKPa: 98.2,
        greenhouseCoefficient: 0.42,
      },
      geology: {
        plates: [
          {
            id: 'plate-alpha',
            name: 'Plate Alpha',
            type: 'continental',
            areaFraction: 0.31,
            driftRateCmPerYear: 2.3,
          },
        ],
        heightField: {
          width: 4,
          height: 2,
          unit: 'meters',
          values: [120, 45, -30, 88, 5, 0, -12, 64],
        },
        volcanismIndex: 0.56,
      },
      hydrology: {
        oceanCoverage: 0.63,
        rivers: {
          seed: 42,
          systems: [
            {
              id: 'river-1',
              name: 'Great River',
              lengthKm: 780,
              source: { latitude: 30, longitude: -120 },
              mouth: { latitude: 12, longitude: -100 },
            },
          ],
        },
        iceCaps: {
          northCoverageFraction: 0.14,
          southCoverageFraction: 0.08,
        },
      },
      biosphere: {
        biomeMap: {
          width: 2,
          height: 2,
          cells: [
            { biome: 'ocean', biodiversity: 0.2 },
            { biome: 'forest', biodiversity: 0.8 },
            { biome: 'savanna', biodiversity: 0.5 },
            { biome: 'tundra', biodiversity: 0.3 },
          ],
        },
        biodiversityIndex: 0.52,
      },
      civilization: {
        populations: [
          {
            id: 'pop-1',
            name: 'New Horizon',
            population: 125_000,
            kind: 'city',
            coordinates: { latitude: 14.2, longitude: 48.6 },
          },
        ],
        techLevel: 'industrial',
        pollutionIndex: 0.37,
      },
      climate: {
        axialTiltDegrees: 28.7,
        albedo: 0.25,
        greenhouseMultiplier: 1.3,
        currentTime: 150,
        yearLength: 400,
      },
    }

    const serialized = serializePlanetState(customState)
    const restored = deserializePlanetState(serialized)

    expect(restored).toEqual(customState)
  })

  it('normalizes invalid payloads when deserializing', () => {
    const corruptedPayload = {
      version: PLANET_STATE_VERSION,
      atmosphere: {
        gases: [
          { gas: '', percentage: 99 },
          { gas: 'valid', percentage: 'not-a-number' },
        ],
        surfacePressureKPa: 'invalid',
        greenhouseCoefficient: 'nope',
      },
      hydrology: {
        oceanCoverage: 1.7,
        rivers: {
          seed: null,
          systems: [
            {
              id: '',
              name: 'Nameless',
              lengthKm: -10,
              source: { latitude: -400, longitude: 800 },
              mouth: {},
            },
          ],
        },
        iceCaps: {
          northCoverageFraction: 2,
          southCoverageFraction: -1,
        },
      },
      biosphere: {
        biomeMap: {
          width: 1,
          height: 1,
          cells: [{ biome: '', biodiversity: 5 }],
        },
        biodiversityIndex: -2,
      },
      civilization: {
        populations: [
          {
            id: '',
            name: 'Ghost City',
            population: -100,
            kind: 'galactic',
            coordinates: { latitude: 200, longitude: -500 },
          },
        ],
        techLevel: 'galactic',
        pollutionIndex: 4,
      },
    }

    const normalized = deserializePlanetState(corruptedPayload)
    const defaults = createDefaultPlanetState()

    expect(normalized.atmosphere).toEqual(defaults.atmosphere)
    expect(normalized.hydrology.oceanCoverage).toBe(1)
    expect(normalized.hydrology.rivers.systems).toEqual([])
    expect(normalized.hydrology.iceCaps.northCoverageFraction).toBeGreaterThanOrEqual(0)
    expect(normalized.hydrology.iceCaps.northCoverageFraction).toBeLessThanOrEqual(1)
    expect(normalized.biosphere.biomeMap.cells).toHaveLength(
      normalized.biosphere.biomeMap.width * normalized.biosphere.biomeMap.height,
    )
    expect(normalized.civilization.techLevel).toBe('none')
    expect(normalized.civilization.populations).toEqual([])
    expect(normalized.civilization.pollutionIndex).toBeLessThanOrEqual(1)
  })

  it('throws when provided with an unsupported schema version', () => {
    expect(() => deserializePlanetState({ version: PLANET_STATE_VERSION + 1 })).toThrow(
      /Unsupported planet state version/,
    )
  })
})
