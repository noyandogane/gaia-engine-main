import { fbmNoise, initNoise } from './noise'

type GeometryAttribute = {
  count: number
  getX(index: number): number
  getY(index: number): number
  getZ(index: number): number
}

type GeometryWithPositions = {
  attributes: {
    position: GeometryAttribute
  }
}

export type TerrainParams = {
  seed: number
  scale: number
  persistence: number
  lacunarity: number
  octaves: number
}

export type ColorThresholds = {
  waterLevel: number
  beachLevel: number
  plainsLevel: number
  hillsLevel: number
}

export type BiomeColor = {
  r: number
  g: number
  b: number
}

export function getBiomeColor(height: number, thresholds: ColorThresholds): BiomeColor {
  if (height < thresholds.waterLevel) {
    // Deep water - dark blue
    return { r: 0.1, g: 0.2, b: 0.4 }
  }

  if (height < thresholds.beachLevel) {
    // Shallow water to beach transition
    const t = (height - thresholds.waterLevel) / (thresholds.beachLevel - thresholds.waterLevel)
    return {
      r: 0.1 + t * 0.9,
      g: 0.3 + t * 0.5,
      b: 0.1 + t * 0.2,
    }
  }

  if (height < thresholds.plainsLevel) {
    // Beach to plains transition
    const t = (height - thresholds.beachLevel) / (thresholds.plainsLevel - thresholds.beachLevel)
    return {
      r: 1.0 - t * 0.2,
      g: 0.8 + t * 0.1,
      b: 0.3 - t * 0.2,
    }
  }

  if (height < thresholds.hillsLevel) {
    // Plains to hills transition
    const t = (height - thresholds.plainsLevel) / (thresholds.hillsLevel - thresholds.plainsLevel)
    return {
      r: 0.8 - t * 0.2,
      g: 0.9 - t * 0.2,
      b: 0.1 + t * 0.1,
    }
  }

  // Mountains - rocky peaks
  const t = (height - thresholds.hillsLevel) / (1 - thresholds.hillsLevel)
  return {
    r: 0.6 + t * 0.3,
    g: 0.6 + t * 0.3,
    b: 0.6 + t * 0.3,
  }
}

export function generateHeightmapOnSphere(
  geometry: GeometryWithPositions,
  params: TerrainParams,
): Float32Array {
  initNoise(params.seed)

  const positions = geometry.attributes.position
  const count = positions.count
  const heights = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    const z = positions.getZ(i)

    // Convert position to spherical coordinates for 4D noise input
    const theta = Math.atan2(x, z)
    const phi = Math.acos(y)

    // Add time-like dimension for 4D noise
    const w = Math.sin(theta) * Math.cos(phi)

    // Generate noise value with FBM
    const noiseValue = fbmNoise(
      theta * params.scale,
      phi * params.scale,
      z * params.scale,
      w * params.scale,
      params.octaves,
      params.persistence,
      params.lacunarity,
    )

    // Normalize noise from [-1, 1] to [0, 1]
    const normalizedHeight = (noiseValue + 1) / 2

    heights[i] = normalizedHeight
  }

  return heights
}

export function colorizeHeightmap(heights: Float32Array, thresholds: ColorThresholds): Uint8Array {
  const colors = new Uint8Array(heights.length * 3)

  for (let i = 0; i < heights.length; i++) {
    const biomeColor = getBiomeColor(heights[i], thresholds)

    colors[i * 3] = Math.round(biomeColor.r * 255)
    colors[i * 3 + 1] = Math.round(biomeColor.g * 255)
    colors[i * 3 + 2] = Math.round(biomeColor.b * 255)
  }

  return colors
}
