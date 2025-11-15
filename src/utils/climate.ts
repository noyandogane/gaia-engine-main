import type { ClimateState } from '@sim'

export const SOLAR_CONSTANT = 1361 // W/m² at 1 AU
export const STEFAN_BOLTZMANN = 5.67e-8 // W/(m²·K⁴)

/**
 * Calculate the solar declination angle based on axial tilt and time of year
 * @param axialTiltDegrees Planet's axial tilt in degrees
 * @param dayOfYear Current day in the year (0-365)
 * @returns Solar declination angle in radians
 */
export const calculateSolarDeclination = (axialTiltDegrees: number, dayOfYear: number): number => {
  const tiltRadians = (axialTiltDegrees * Math.PI) / 180
  const dayAngle = (2 * Math.PI * dayOfYear) / 365
  return tiltRadians * Math.sin(dayAngle)
}

/**
 * Calculate the solar zenith angle at a given latitude and time
 * @param latitude Latitude in degrees (-90 to 90)
 * @param declination Solar declination angle in radians
 * @param hourAngle Hour angle in radians (0 = solar noon)
 * @returns Solar zenith angle in radians
 */
export const calculateZenithAngle = (
  latitude: number,
  declination: number,
  hourAngle: number,
): number => {
  const latRadians = (latitude * Math.PI) / 180
  const cosZenith =
    Math.sin(latRadians) * Math.sin(declination) +
    Math.cos(latRadians) * Math.cos(declination) * Math.cos(hourAngle)
  return Math.acos(Math.max(-1, Math.min(1, cosZenith)))
}

/**
 * Calculate the average daily solar radiation at a given latitude
 * @param latitude Latitude in degrees (-90 to 90)
 * @param axialTiltDegrees Planet's axial tilt in degrees
 * @param dayOfYear Current day in the year (0-365)
 * @returns Daily average solar radiation in W/m²
 */
export const calculateDailySolarRadiation = (
  latitude: number,
  axialTiltDegrees: number,
  dayOfYear: number,
): number => {
  const declination = calculateSolarDeclination(axialTiltDegrees, dayOfYear)
  const latRadians = (latitude * Math.PI) / 180

  // Calculate sunrise and sunset hour angles
  const cosHourAngle = -Math.tan(latRadians) * Math.tan(declination)

  // Polar day/night conditions
  if (cosHourAngle <= -1) {
    // Polar day - 24 hours of sunlight
    return (
      SOLAR_CONSTANT *
      (Math.sin(latRadians) * Math.sin(declination) +
        (2 / Math.PI) * Math.cos(latRadians) * Math.cos(declination))
    )
  }

  if (cosHourAngle >= 1) {
    // Polar night - 24 hours of darkness
    return 0
  }

  const hourAngle = Math.acos(cosHourAngle)

  // Daily average solar radiation
  const dailyRadiation =
    (SOLAR_CONSTANT / Math.PI) *
    (hourAngle * Math.sin(latRadians) * Math.sin(declination) +
      Math.cos(latRadians) * Math.cos(declination) * Math.sin(hourAngle))

  return Math.max(0, dailyRadiation)
}

/**
 * Calculate the effective temperature considering albedo and greenhouse effect
 * @param solarRadiation Incoming solar radiation in W/m²
 * @param albedo Planetary albedo (0-1)
 * @param greenhouseMultiplier Greenhouse effect multiplier (1.0 = no greenhouse)
 * @returns Temperature in Kelvin
 */
export const calculateEffectiveTemperature = (
  solarRadiation: number,
  albedo: number,
  greenhouseMultiplier: number,
): number => {
  const absorbedRadiation = solarRadiation * (1 - albedo)
  const baseTemp = Math.pow(
    (absorbedRadiation * greenhouseMultiplier) / (4 * STEFAN_BOLTZMANN),
    0.25,
  )
  return baseTemp
}

/**
 * Calculate temperature at a specific latitude and time
 * @param latitude Latitude in degrees (-90 to 90)
 * @param climateState Climate state parameters
 * @param dayOfYear Current day in the year (0-365)
 * @returns Temperature in Kelvin
 */
export const calculateTemperature = (
  latitude: number,
  climateState: ClimateState,
  dayOfYear: number,
): number => {
  const solarRadiation = calculateDailySolarRadiation(
    latitude,
    climateState.axialTiltDegrees,
    dayOfYear,
  )

  return calculateEffectiveTemperature(
    solarRadiation,
    climateState.albedo,
    climateState.greenhouseMultiplier,
  )
}

/**
 * Generate temperature bands for the entire planet
 * @param climateState Climate state parameters
 * @param latitudes Array of latitudes to calculate temperatures for
 * @param dayOfYear Current day in the year (0-365)
 * @returns Array of temperatures in Kelvin corresponding to the input latitudes
 */
export const generateTemperatureBands = (
  climateState: ClimateState,
  latitudes: number[],
  dayOfYear: number,
): number[] => {
  return latitudes.map((lat) => calculateTemperature(lat, climateState, dayOfYear))
}

/**
 * Convert temperature from Kelvin to Celsius
 * @param tempKelvin Temperature in Kelvin
 * @returns Temperature in Celsius
 */
export const kelvinToCelsius = (tempKelvin: number): number => tempKelvin - 273.15

/**
 * Convert temperature from Celsius to Kelvin
 * @param tempCelsius Temperature in Celsius
 * @returns Temperature in Kelvin
 */
export const celsiusToKelvin = (tempCelsius: number): number => tempCelsius + 273.15

/**
 * Get a color for temperature visualization
 * @param tempCelsius Temperature in Celsius
 * @returns RGB color as hex string
 */
export const getTemperatureColor = (tempCelsius: number): string => {
  // Temperature ranges for color mapping (in Celsius)
  const ranges = [
    { min: -50, max: -20, color: '#0000ff' }, // Deep blue - extreme cold
    { min: -20, max: -10, color: '#0080ff' }, // Light blue - very cold
    { min: -10, max: 0, color: '#00ffff' }, // Cyan - cold
    { min: 0, max: 10, color: '#00ff80' }, // Green-blue - cool
    { min: 10, max: 20, color: '#00ff00' }, // Green - mild
    { min: 20, max: 30, color: '#80ff00' }, // Yellow-green - warm
    { min: 30, max: 40, color: '#ffff00' }, // Yellow - hot
    { min: 40, max: 50, color: '#ff8000' }, // Orange - very hot
    { min: 50, max: 100, color: '#ff0000' }, // Red - extreme hot
  ]

  for (const range of ranges) {
    if (tempCelsius >= range.min && tempCelsius < range.max) {
      return range.color
    }
  }

  return tempCelsius < -50 ? '#000080' : '#800000' // Navy for extreme cold, dark red for extreme hot
}

/**
 * Check if a point is in polar day or polar night
 * @param latitude Latitude in degrees (-90 to 90)
 * @param axialTiltDegrees Planet's axial tilt in degrees
 * @param dayOfYear Current day in the year (0-365)
 * @returns 'day', 'night', or 'normal'
 */
export const getPolarCondition = (
  latitude: number,
  axialTiltDegrees: number,
  dayOfYear: number,
): 'day' | 'night' | 'normal' => {
  const declination = calculateSolarDeclination(axialTiltDegrees, dayOfYear)
  const latRadians = (latitude * Math.PI) / 180

  const cosHourAngle = -Math.tan(latRadians) * Math.tan(declination)

  if (cosHourAngle <= -1) {
    return 'day' // Polar day
  }

  if (cosHourAngle >= 1) {
    return 'night' // Polar night
  }

  return 'normal'
}
