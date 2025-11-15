// Simplex noise implementation using multiple octaves (fractional Brownian motion)
// Based on seeded pseudo-random noise generation

const P = new Uint8Array(512)

function initializePermutation(seed: number) {
  const permutation = new Uint8Array(256)
  for (let i = 0; i < 256; i++) {
    permutation[i] = i
  }

  // Fisher-Yates shuffle with seed
  let state = seed
  for (let i = 255; i > 0; i--) {
    state = (state * 9301 + 49297) % 233280
    const j = Math.floor((state / 233280) * (i + 1))
    const temp = permutation[i]
    permutation[i] = permutation[j]
    permutation[j] = temp
  }

  // Duplicate the permutation table
  for (let i = 0; i < 256; i++) {
    P[i] = permutation[i]
    P[i + 256] = permutation[i]
  }
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a)
}

function grad(hash: number, x: number, y: number, z: number, w: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  const w_ = h < 4 ? z : h === 12 || h === 14 ? y : w
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v) + ((h & 4) === 0 ? w_ : -w_)
}

export function perlin4D(x: number, y: number, z: number, w: number): number {
  const xi = Math.floor(x) & 255
  const yi = Math.floor(y) & 255
  const zi = Math.floor(z) & 255
  const wi = Math.floor(w) & 255

  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const zf = z - Math.floor(z)
  const wf = w - Math.floor(w)

  const u = fade(xf)
  const v = fade(yf)
  const t = fade(zf)
  const s = fade(wf)

  const p0 = P[xi]
  const p1 = P[xi + 1]

  const p00 = P[p0 + yi]
  const p01 = P[p0 + yi + 1]
  const p10 = P[p1 + yi]
  const p11 = P[p1 + yi + 1]

  const p000 = P[p00 + zi]
  const p001 = P[p00 + zi + 1]
  const p010 = P[p01 + zi]
  const p011 = P[p01 + zi + 1]
  const p100 = P[p10 + zi]
  const p101 = P[p10 + zi + 1]
  const p110 = P[p11 + zi]
  const p111 = P[p11 + zi + 1]

  const g0000 = grad(P[p000 + wi], xf, yf, zf, wf)
  const g0001 = grad(P[p000 + wi + 1], xf, yf, zf, wf - 1)
  const g0010 = grad(P[p001 + wi], xf, yf, zf - 1, wf)
  const g0011 = grad(P[p001 + wi + 1], xf, yf, zf - 1, wf - 1)
  const g0100 = grad(P[p010 + wi], xf, yf - 1, zf, wf)
  const g0101 = grad(P[p010 + wi + 1], xf, yf - 1, zf, wf - 1)
  const g0110 = grad(P[p011 + wi], xf, yf - 1, zf - 1, wf)
  const g0111 = grad(P[p011 + wi + 1], xf, yf - 1, zf - 1, wf - 1)
  const g1000 = grad(P[p100 + wi], xf - 1, yf, zf, wf)
  const g1001 = grad(P[p100 + wi + 1], xf - 1, yf, zf, wf - 1)
  const g1010 = grad(P[p101 + wi], xf - 1, yf, zf - 1, wf)
  const g1011 = grad(P[p101 + wi + 1], xf - 1, yf, zf - 1, wf - 1)
  const g1100 = grad(P[p110 + wi], xf - 1, yf - 1, zf, wf)
  const g1101 = grad(P[p110 + wi + 1], xf - 1, yf - 1, zf, wf - 1)
  const g1110 = grad(P[p111 + wi], xf - 1, yf - 1, zf - 1, wf)
  const g1111 = grad(P[p111 + wi + 1], xf - 1, yf - 1, zf - 1, wf - 1)

  const l0000 = lerp(s, g0000, g0001)
  const l0001 = lerp(s, g0010, g0011)
  const l0010 = lerp(s, g0100, g0101)
  const l0011 = lerp(s, g0110, g0111)
  const l0100 = lerp(s, g1000, g1001)
  const l0101 = lerp(s, g1010, g1011)
  const l0110 = lerp(s, g1100, g1101)
  const l0111 = lerp(s, g1110, g1111)

  const l000 = lerp(t, l0000, l0001)
  const l001 = lerp(t, l0010, l0011)
  const l010 = lerp(t, l0100, l0101)
  const l011 = lerp(t, l0110, l0111)

  const l00 = lerp(v, l000, l001)
  const l01 = lerp(v, l010, l011)

  return lerp(u, l00, l01)
}

export function initNoise(seed: number): void {
  initializePermutation(seed)
}

export function fbmNoise(
  x: number,
  y: number,
  z: number,
  w: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += perlin4D(x * frequency, y * frequency, z * frequency, w * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }

  return value / maxValue
}
