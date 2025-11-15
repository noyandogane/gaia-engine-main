import { describe, expect, it } from 'vitest'
import {
  calculateSolarDeclination,
  calculateZenithAngle,
  calculateDailySolarRadiation,
  calculateEffectiveTemperature,
  calculateTemperature,
  generateTemperatureBands,
  kelvinToCelsius,
  celsiusToKelvin,
  getTemperatureColor,
  getPolarCondition,
} from './climate'
import type { ClimateState } from '@sim'

describe('climate', () => {
  const mockClimateState: ClimateState = {
    axialTiltDegrees: 23.5,
    albedo: 0.3,
    greenhouseMultiplier: 1.0,
    currentTime: 0,
    yearLength: 365,
  }

  describe('calculateSolarDeclination', () => {
    it('should calculate solar declination correctly', () => {
      // At equinox (day 0), declination should be 0 for any tilt
      const declination = calculateSolarDeclination(23.5, 0)
      expect(declination).toBeCloseTo(0, 5)

      // At summer solstice (day 91.25 ~ 365/4), declination should equal tilt
      const summerDeclination = calculateSolarDeclination(23.5, 91.25)
      expect(summerDeclination).toBeCloseTo((23.5 * Math.PI) / 180, 3)

      // At winter solstice (day 273.75 ~ 3*365/4), declination should be negative tilt
      const winterDeclination = calculateSolarDeclination(23.5, 273.75)
      expect(winterDeclination).toBeCloseTo(-(23.5 * Math.PI) / 180, 3)
    })

    it('should handle zero tilt', () => {
      const declination = calculateSolarDeclination(0, 100)
      expect(declination).toBeCloseTo(0, 10)
    })

    it('should handle maximum tilt', () => {
      const declination = calculateSolarDeclination(90, 91.25)
      expect(declination).toBeCloseTo(Math.PI / 2, 3)
    })
  })

  describe('calculateZenithAngle', () => {
    it('should calculate zenith angle correctly', () => {
      // At solar noon (hourAngle = 0) on equator at equinox - sun directly overhead
      const zenith = calculateZenithAngle(0, 0, 0)
      expect(zenith).toBeCloseTo(0, 3)

      // At solar noon on Tropic of Cancer at summer solstice - sun directly overhead
      const summerZenith = calculateZenithAngle(23.5, (23.5 * Math.PI) / 180, 0)
      expect(summerZenith).toBeCloseTo(0, 3)

      // At sunrise/sunset (hourAngle = π/2) on equator at equinox
      const horizonZenith = calculateZenithAngle(0, 0, Math.PI / 2)
      expect(horizonZenith).toBeCloseTo(Math.PI / 2, 3)
    })

    it('should handle edge cases', () => {
      // At poles
      const northPole = calculateZenithAngle(90, 0, 0)
      expect(northPole).toBeCloseTo(Math.PI / 2, 3)

      const southPole = calculateZenithAngle(-90, 0, 0)
      expect(southPole).toBeCloseTo(Math.PI / 2, 3)
    })
  })

  describe('calculateDailySolarRadiation', () => {
    it('should calculate higher radiation at equator', () => {
      const equatorRadiation = calculateDailySolarRadiation(0, 23.5, 0)
      const poleRadiation = calculateDailySolarRadiation(90, 23.5, 0)
      expect(equatorRadiation).toBeGreaterThan(poleRadiation)
    })

    it('should handle polar day conditions', () => {
      // At high latitudes during summer, should have polar day
      const polarDayRadiation = calculateDailySolarRadiation(85, 23.5, 91.25)
      expect(polarDayRadiation).toBeGreaterThan(0)
    })

    it('should handle polar night conditions', () => {
      // At high latitudes during winter, should have polar night
      const polarNightRadiation = calculateDailySolarRadiation(85, 23.5, 273.75)
      expect(polarNightRadiation).toBe(0)
    })

    it('should never return negative values', () => {
      const testCases = [
        { lat: 0, tilt: 23.5, day: 0 },
        { lat: 45, tilt: 23.5, day: 91 },
        { lat: 90, tilt: 23.5, day: 182 },
        { lat: -45, tilt: 23.5, day: 274 },
      ]

      testCases.forEach(({ lat, tilt, day }) => {
        const radiation = calculateDailySolarRadiation(lat, tilt, day)
        expect(radiation).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('calculateEffectiveTemperature', () => {
    it('should calculate reasonable temperatures', () => {
      // Earth-like conditions
      const solarConstant = 1361
      const temp = calculateEffectiveTemperature(solarConstant, 0.3, 1.0)
      expect(temp).toBeGreaterThan(200) // Should be above -73°C
      expect(temp).toBeLessThan(400) // Should be below 127°C
    })

    it('should increase with greenhouse effect', () => {
      const baseTemp = calculateEffectiveTemperature(1000, 0.3, 1.0)
      const greenhouseTemp = calculateEffectiveTemperature(1000, 0.3, 2.0)
      expect(greenhouseTemp).toBeGreaterThan(baseTemp)
    })

    it('should decrease with higher albedo', () => {
      const lowAlbedoTemp = calculateEffectiveTemperature(1000, 0.1, 1.0)
      const highAlbedoTemp = calculateEffectiveTemperature(1000, 0.9, 1.0)
      expect(highAlbedoTemp).toBeLessThan(lowAlbedoTemp)
    })

    it('should handle edge cases', () => {
      // Zero radiation
      const zeroRadiation = calculateEffectiveTemperature(0, 0.3, 1.0)
      expect(zeroRadiation).toBe(0)

      // Perfect absorber
      const perfectAbsorber = calculateEffectiveTemperature(1000, 0, 1.0)
      expect(perfectAbsorber).toBeGreaterThan(0)

      // Perfect reflector
      const perfectReflector = calculateEffectiveTemperature(1000, 1, 1.0)
      expect(perfectReflector).toBe(0)
    })
  })

  describe('calculateTemperature', () => {
    it('should calculate temperature at specific location and time', () => {
      const temp = calculateTemperature(0, mockClimateState, 0)
      expect(temp).toBeGreaterThan(150) // Should be reasonable temperature
      expect(temp).toBeLessThan(400)
    })

    it('should vary with latitude', () => {
      const equatorTemp = calculateTemperature(0, mockClimateState, 0)
      const poleTemp = calculateTemperature(90, mockClimateState, 0)
      expect(equatorTemp).toBeGreaterThan(poleTemp)
    })

    it('should vary with seasons', () => {
      const northernSummer = calculateTemperature(45, mockClimateState, 91.25)
      const northernWinter = calculateTemperature(45, mockClimateState, 273.75)
      expect(northernSummer).toBeGreaterThan(northernWinter)
    })
  })

  describe('generateTemperatureBands', () => {
    it('should generate temperature bands for multiple latitudes', () => {
      const latitudes = [-90, -60, -30, 0, 30, 60, 90]
      const temperatures = generateTemperatureBands(mockClimateState, latitudes, 0)

      expect(temperatures).toHaveLength(7)
      temperatures.forEach((temp) => {
        expect(temp).toBeGreaterThan(0)
        expect(temp).toBeLessThan(500)
      })
    })

    it('should show temperature gradient from equator to poles', () => {
      const latitudes = Array.from({ length: 19 }, (_, i) => -90 + i * 10)
      const temperatures = generateTemperatureBands(mockClimateState, latitudes, 0)

      // Equator should be warmer than poles
      const equatorTemp = temperatures[9] // latitude 0
      const northPoleTemp = temperatures[0] // latitude -90
      const southPoleTemp = temperatures[18] // latitude 90

      expect(equatorTemp).toBeGreaterThan(northPoleTemp)
      expect(equatorTemp).toBeGreaterThan(southPoleTemp)
    })
  })

  describe('temperature conversions', () => {
    it('should convert between Kelvin and Celsius', () => {
      const celsius = 20
      const kelvin = celsiusToKelvin(celsius)
      expect(kelvin).toBeCloseTo(293.15, 2)

      const backToCelsius = kelvinToCelsius(kelvin)
      expect(backToCelsius).toBeCloseTo(celsius, 2)
    })

    it('should handle absolute zero', () => {
      const absoluteZeroKelvin = 0
      const absoluteZeroCelsius = kelvinToCelsius(absoluteZeroKelvin)
      expect(absoluteZeroCelsius).toBeCloseTo(-273.15, 2)

      const backToKelvin = celsiusToKelvin(absoluteZeroCelsius)
      expect(backToKelvin).toBeCloseTo(0, 2)
    })
  })

  describe('getTemperatureColor', () => {
    it('should return appropriate colors for temperature ranges', () => {
      const testCases = [
        { temp: -60, expectedColor: '#000080' }, // Navy for extreme cold
        { temp: -15, expectedColor: '#0080ff' }, // Light blue for very cold
        { temp: -5, expectedColor: '#00ffff' }, // Cyan for cold
        { temp: 5, expectedColor: '#00ff80' }, // Green-blue for cool
        { temp: 15, expectedColor: '#00ff00' }, // Green for mild
        { temp: 25, expectedColor: '#80ff00' }, // Yellow-green for warm
        { temp: 35, expectedColor: '#ffff00' }, // Yellow for hot
        { temp: 45, expectedColor: '#ff8000' }, // Orange for very hot
        { temp: 75, expectedColor: '#ff0000' }, // Red for extreme hot
      ]

      testCases.forEach(({ temp, expectedColor }) => {
        const color = getTemperatureColor(temp)
        expect(color).toBe(expectedColor)
      })
    })

    it('should handle extreme temperatures', () => {
      const extremeCold = getTemperatureColor(-100)
      expect(extremeCold).toBe('#000080') // Navy

      const extremeHot = getTemperatureColor(200)
      expect(extremeHot).toBe('#800000') // Dark red
    })
  })

  describe('getPolarCondition', () => {
    it('should detect polar day conditions', () => {
      // High latitude during summer should be polar day
      const condition = getPolarCondition(85, 23.5, 91.25)
      expect(condition).toBe('day')
    })

    it('should detect polar night conditions', () => {
      // High latitude during winter should be polar night
      const condition = getPolarCondition(85, 23.5, 273.75)
      expect(condition).toBe('night')
    })

    it('should detect normal conditions', () => {
      // Mid-latitudes should have normal day/night cycles
      const condition = getPolarCondition(45, 23.5, 0)
      expect(condition).toBe('normal')
    })

    it('should handle equator (always normal)', () => {
      const condition = getPolarCondition(0, 23.5, 91.25)
      expect(condition).toBe('normal')
    })
  })

  describe('boundary conditions and validation', () => {
    it('should handle extreme axial tilt values', () => {
      const extremeClimate: ClimateState = {
        ...mockClimateState,
        axialTiltDegrees: 90,
      }

      const temp = calculateTemperature(0, extremeClimate, 0)
      expect(temp).toBeGreaterThan(0)
      expect(temp).toBeLessThan(500)
    })

    it('should handle zero axial tilt', () => {
      const noTiltClimate: ClimateState = {
        ...mockClimateState,
        axialTiltDegrees: 0,
      }

      const temp = calculateTemperature(45, noTiltClimate, 0)
      expect(temp).toBeGreaterThan(0)
      expect(temp).toBeLessThan(500)
    })

    it('should handle extreme albedo values', () => {
      const perfectReflector: ClimateState = {
        ...mockClimateState,
        albedo: 1.0,
      }

      const perfectAbsorber: ClimateState = {
        ...mockClimateState,
        albedo: 0.0,
      }

      const reflectorTemp = calculateTemperature(0, perfectReflector, 0)
      const absorberTemp = calculateTemperature(0, perfectAbsorber, 0)

      expect(reflectorTemp).toBeLessThan(absorberTemp)
    })

    it('should handle extreme greenhouse values', () => {
      const noGreenhouse: ClimateState = {
        ...mockClimateState,
        greenhouseMultiplier: 0,
      }

      const strongGreenhouse: ClimateState = {
        ...mockClimateState,
        greenhouseMultiplier: 10,
      }

      const noGreenhouseTemp = calculateTemperature(0, noGreenhouse, 0)
      const strongGreenhouseTemp = calculateTemperature(0, strongGreenhouse, 0)

      expect(noGreenhouseTemp).toBeLessThan(strongGreenhouseTemp)
    })
  })
})
