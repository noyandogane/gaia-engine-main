export const PLANET_STATE_VERSION = 1 as const

export type PlanetStateVersion = typeof PLANET_STATE_VERSION

export type AtmosphericGasComposition = {
  readonly gas: string
  readonly percentage: number
}

export type AtmosphereState = {
  readonly gases: ReadonlyArray<AtmosphericGasComposition>
  readonly surfacePressureKPa: number
  readonly greenhouseCoefficient: number
}

export type TectonicPlateType = 'continental' | 'oceanic'

export type TectonicPlateState = {
  readonly id: string
  readonly name: string
  readonly type: TectonicPlateType
  readonly areaFraction: number
  readonly driftRateCmPerYear: number
}

export type HeightFieldState = {
  readonly width: number
  readonly height: number
  readonly unit: 'meters'
  readonly values: ReadonlyArray<number>
}

export type GeologyState = {
  readonly plates: ReadonlyArray<TectonicPlateState>
  readonly heightField: HeightFieldState
  readonly volcanismIndex: number
}

export type RiverSystemState = {
  readonly id: string
  readonly name: string
  readonly lengthKm: number
  readonly source: Coordinates
  readonly mouth: Coordinates
}

export type RiverNetworkState = {
  readonly seed: number | null
  readonly systems: ReadonlyArray<RiverSystemState>
}

export type IceCapsState = {
  readonly northCoverageFraction: number
  readonly southCoverageFraction: number
}

export type HydrologyState = {
  readonly oceanCoverage: number
  readonly rivers: RiverNetworkState
  readonly iceCaps: IceCapsState
}

export type BiomeCellState = {
  readonly biome: string
  readonly biodiversity: number
}

export type BiomeMapState = {
  readonly width: number
  readonly height: number
  readonly cells: ReadonlyArray<BiomeCellState>
}

export type BiosphereState = {
  readonly biomeMap: BiomeMapState
  readonly biodiversityIndex: number
}

export type CivilizationPopulationKind = 'outpost' | 'settlement' | 'city'

export type CivilizationTechLevel =
  | 'none'
  | 'tribal'
  | 'agrarian'
  | 'industrial'
  | 'digital'
  | 'spacefaring'

export type Coordinates = {
  readonly latitude: number
  readonly longitude: number
}

export type PopulationCenterState = {
  readonly id: string
  readonly name: string
  readonly population: number
  readonly kind: CivilizationPopulationKind
  readonly coordinates: Coordinates
}

export type CivilizationState = {
  readonly populations: ReadonlyArray<PopulationCenterState>
  readonly techLevel: CivilizationTechLevel
  readonly pollutionIndex: number
}

export type ClimateState = {
  readonly axialTiltDegrees: number
  readonly albedo: number
  readonly greenhouseMultiplier: number
  readonly currentTime: number
  readonly yearLength: number
}

export type PlanetState = {
  readonly version: PlanetStateVersion
  readonly atmosphere: AtmosphereState
  readonly geology: GeologyState
  readonly hydrology: HydrologyState
  readonly biosphere: BiosphereState
  readonly civilization: CivilizationState
  readonly climate: ClimateState
}

const DEFAULT_HEIGHT_FIELD_WIDTH = 64
const DEFAULT_HEIGHT_FIELD_HEIGHT = 32
const DEFAULT_BIOME_MAP_WIDTH = 64
const DEFAULT_BIOME_MAP_HEIGHT = 32

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const ensureNumber = (value: unknown, fallback: number): number =>
  isNumber(value) ? value : fallback

const ensurePositiveInteger = (value: unknown, fallback: number, minimum = 1): number => {
  if (!isNumber(value)) {
    return fallback
  }

  const rounded = Math.floor(value)
  if (!Number.isFinite(rounded) || rounded < minimum) {
    return fallback
  }

  return rounded
}

const ensureString = (value: unknown, fallback: string): string =>
  isString(value) && value.trim().length > 0 ? value : fallback

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 1) {
    return 1
  }

  return value
}

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 100) {
    return 100
  }

  return value
}

const clampLatitude = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < -90) {
    return -90
  }

  if (value > 90) {
    return 90
  }

  return value
}

const clampLongitude = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < -180) {
    return -180
  }

  if (value > 180) {
    return 180
  }

  return value
}

const padArray = (length: number): number[] => Array.from({ length }, () => 0)

const padBiomeCells = (length: number): BiomeCellState[] =>
  Array.from({ length }, () => ({ biome: 'ocean', biodiversity: 0 }))

export const createDefaultAtmosphereState = (): AtmosphereState => ({
  gases: [
    { gas: 'nitrogen', percentage: 78 },
    { gas: 'oxygen', percentage: 21 },
    { gas: 'argon', percentage: 0.9 },
    { gas: 'carbon-dioxide', percentage: 0.04 },
  ],
  surfacePressureKPa: 101.325,
  greenhouseCoefficient: 0.3,
})

export const createDefaultHeightFieldState = (): HeightFieldState => ({
  width: DEFAULT_HEIGHT_FIELD_WIDTH,
  height: DEFAULT_HEIGHT_FIELD_HEIGHT,
  unit: 'meters',
  values: padArray(DEFAULT_HEIGHT_FIELD_WIDTH * DEFAULT_HEIGHT_FIELD_HEIGHT),
})

const createDefaultTectonicPlates = (): ReadonlyArray<TectonicPlateState> => []

export const createDefaultGeologyState = (): GeologyState => ({
  plates: createDefaultTectonicPlates(),
  heightField: createDefaultHeightFieldState(),
  volcanismIndex: 0,
})

export const createDefaultRiverNetworkState = (): RiverNetworkState => ({
  seed: null,
  systems: [],
})

export const createDefaultIceCapsState = (): IceCapsState => ({
  northCoverageFraction: 0.05,
  southCoverageFraction: 0.04,
})

export const createDefaultHydrologyState = (): HydrologyState => ({
  oceanCoverage: 0.72,
  rivers: createDefaultRiverNetworkState(),
  iceCaps: createDefaultIceCapsState(),
})

export const createDefaultBiomeMapState = (): BiomeMapState => ({
  width: DEFAULT_BIOME_MAP_WIDTH,
  height: DEFAULT_BIOME_MAP_HEIGHT,
  cells: padBiomeCells(DEFAULT_BIOME_MAP_WIDTH * DEFAULT_BIOME_MAP_HEIGHT),
})

export const createDefaultBiosphereState = (): BiosphereState => ({
  biomeMap: createDefaultBiomeMapState(),
  biodiversityIndex: 0.1,
})

export const createDefaultCivilizationState = (): CivilizationState => ({
  populations: [],
  techLevel: 'none',
  pollutionIndex: 0,
})

export const createDefaultClimateState = (): ClimateState => ({
  axialTiltDegrees: 23.5,
  albedo: 0.3,
  greenhouseMultiplier: 1.0,
  currentTime: 0,
  yearLength: 365,
})

export const createDefaultPlanetState = (): PlanetState => ({
  version: PLANET_STATE_VERSION,
  atmosphere: createDefaultAtmosphereState(),
  geology: createDefaultGeologyState(),
  hydrology: createDefaultHydrologyState(),
  biosphere: createDefaultBiosphereState(),
  civilization: createDefaultCivilizationState(),
  climate: createDefaultClimateState(),
})

const normalizeAtmosphericGas = (value: unknown): AtmosphericGasComposition | null => {
  if (!isRecord(value)) {
    return null
  }

  const gas = ensureString(value.gas, '')
  if (gas.length === 0) {
    return null
  }

  const percentage = value.percentage
  if (!isNumber(percentage)) {
    return null
  }

  return {
    gas,
    percentage: clampPercentage(percentage),
  }
}

const normalizeAtmosphere = (value: unknown): AtmosphereState => {
  const defaults = createDefaultAtmosphereState()
  if (!isRecord(value)) {
    return defaults
  }

  const gasesRaw = Array.isArray(value.gases) ? value.gases : null
  const gases = gasesRaw
    ?.map((entry) => normalizeAtmosphericGas(entry))
    .filter((entry): entry is AtmosphericGasComposition => Boolean(entry))

  return {
    gases: gases && gases.length > 0 ? gases : defaults.gases,
    surfacePressureKPa: ensureNumber(value.surfacePressureKPa, defaults.surfacePressureKPa),
    greenhouseCoefficient: ensureNumber(
      value.greenhouseCoefficient,
      defaults.greenhouseCoefficient,
    ),
  }
}

const normalizeTectonicPlate = (value: unknown): TectonicPlateState | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = ensureString(value.id, '')
  if (id.length === 0) {
    return null
  }

  const name = ensureString(value.name, id)
  const type = value.type === 'oceanic' ? 'oceanic' : 'continental'

  return {
    id,
    name,
    type,
    areaFraction: clamp01(ensureNumber(value.areaFraction, 0)),
    driftRateCmPerYear: ensureNumber(value.driftRateCmPerYear, 0),
  }
}

const normalizeHeightField = (value: unknown): HeightFieldState => {
  const defaults = createDefaultHeightFieldState()
  if (!isRecord(value)) {
    return defaults
  }

  const width = ensurePositiveInteger(value.width, defaults.width)
  const height = ensurePositiveInteger(value.height, defaults.height)
  const expectedLength = width * height
  const valuesRaw = Array.isArray(value.values) ? value.values : []
  const values = valuesRaw.map((entry) => ensureNumber(entry, 0)).slice(0, expectedLength)

  if (values.length < expectedLength) {
    values.push(...padArray(expectedLength - values.length))
  }

  return {
    width,
    height,
    unit: 'meters',
    values,
  }
}

const normalizeGeology = (value: unknown): GeologyState => {
  const defaults = createDefaultGeologyState()
  if (!isRecord(value)) {
    return defaults
  }

  const platesRaw = Array.isArray(value.plates) ? value.plates : null
  const plates = platesRaw
    ?.map((plate) => normalizeTectonicPlate(plate))
    .filter((plate): plate is TectonicPlateState => Boolean(plate))

  return {
    plates: plates ?? defaults.plates,
    heightField: normalizeHeightField(value.heightField),
    volcanismIndex: clamp01(ensureNumber(value.volcanismIndex, defaults.volcanismIndex)),
  }
}

const normalizeCoordinates = (value: unknown): Coordinates => {
  if (!isRecord(value)) {
    return { latitude: 0, longitude: 0 }
  }

  return {
    latitude: clampLatitude(ensureNumber(value.latitude, 0)),
    longitude: clampLongitude(ensureNumber(value.longitude, 0)),
  }
}

const normalizeRiverSystem = (value: unknown): RiverSystemState | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = ensureString(value.id, '')
  if (id.length === 0) {
    return null
  }

  const name = ensureString(value.name, id)

  return {
    id,
    name,
    lengthKm: ensureNumber(value.lengthKm, 0),
    source: normalizeCoordinates(value.source),
    mouth: normalizeCoordinates(value.mouth),
  }
}

const normalizeRiverNetwork = (value: unknown): RiverNetworkState => {
  const defaults = createDefaultRiverNetworkState()
  if (!isRecord(value)) {
    return defaults
  }

  const systemsRaw = Array.isArray(value.systems) ? value.systems : null
  const systems = systemsRaw
    ?.map((system) => normalizeRiverSystem(system))
    .filter((system): system is RiverSystemState => Boolean(system))

  return {
    seed: isNumber(value.seed) ? value.seed : defaults.seed,
    systems: systems ?? defaults.systems,
  }
}

const normalizeIceCaps = (value: unknown): IceCapsState => {
  const defaults = createDefaultIceCapsState()
  if (!isRecord(value)) {
    return defaults
  }

  return {
    northCoverageFraction: clamp01(
      ensureNumber(value.northCoverageFraction, defaults.northCoverageFraction),
    ),
    southCoverageFraction: clamp01(
      ensureNumber(value.southCoverageFraction, defaults.southCoverageFraction),
    ),
  }
}

const normalizeHydrology = (value: unknown): HydrologyState => {
  const defaults = createDefaultHydrologyState()
  if (!isRecord(value)) {
    return defaults
  }

  return {
    oceanCoverage: clamp01(ensureNumber(value.oceanCoverage, defaults.oceanCoverage)),
    rivers: normalizeRiverNetwork(value.rivers),
    iceCaps: normalizeIceCaps(value.iceCaps),
  }
}

const normalizeBiomeCell = (value: unknown): BiomeCellState | null => {
  if (!isRecord(value)) {
    return null
  }

  const biome = ensureString(value.biome, '')
  if (biome.length === 0) {
    return null
  }

  return {
    biome,
    biodiversity: clamp01(ensureNumber(value.biodiversity, 0)),
  }
}

const normalizeBiomeMap = (value: unknown): BiomeMapState => {
  const defaults = createDefaultBiomeMapState()
  if (!isRecord(value)) {
    return defaults
  }

  const width = ensurePositiveInteger(value.width, defaults.width)
  const height = ensurePositiveInteger(value.height, defaults.height)
  const expectedLength = width * height
  const rawCells = Array.isArray(value.cells) ? value.cells : []
  const cells = rawCells
    .map((cell) => normalizeBiomeCell(cell))
    .filter((cell): cell is BiomeCellState => Boolean(cell))
    .slice(0, expectedLength)

  if (cells.length < expectedLength) {
    cells.push(...padBiomeCells(expectedLength - cells.length))
  }

  return {
    width,
    height,
    cells,
  }
}

const normalizeBiosphere = (value: unknown): BiosphereState => {
  const defaults = createDefaultBiosphereState()
  if (!isRecord(value)) {
    return defaults
  }

  return {
    biomeMap: normalizeBiomeMap(value.biomeMap),
    biodiversityIndex: clamp01(ensureNumber(value.biodiversityIndex, defaults.biodiversityIndex)),
  }
}

const normalizePopulationCenter = (value: unknown): PopulationCenterState | null => {
  if (!isRecord(value)) {
    return null
  }

  const id = ensureString(value.id, '')
  if (id.length === 0) {
    return null
  }

  const name = ensureString(value.name, id)
  const kind = value.kind === 'settlement' || value.kind === 'city' ? value.kind : 'outpost'

  return {
    id,
    name,
    kind,
    population: Math.max(0, ensureNumber(value.population, 0)),
    coordinates: normalizeCoordinates(value.coordinates),
  }
}

const normalizeCivilization = (value: unknown): CivilizationState => {
  const defaults = createDefaultCivilizationState()
  if (!isRecord(value)) {
    return defaults
  }

  const populationsRaw = Array.isArray(value.populations) ? value.populations : null
  const populations = populationsRaw
    ?.map((population) => normalizePopulationCenter(population))
    .filter((population): population is PopulationCenterState => Boolean(population))

  const techLevel = value.techLevel
  const normalizedTechLevel: CivilizationTechLevel =
    techLevel === 'tribal' ||
    techLevel === 'agrarian' ||
    techLevel === 'industrial' ||
    techLevel === 'digital' ||
    techLevel === 'spacefaring'
      ? techLevel
      : 'none'

  return {
    populations: populations ?? defaults.populations,
    techLevel: normalizedTechLevel,
    pollutionIndex: clamp01(ensureNumber(value.pollutionIndex, defaults.pollutionIndex)),
  }
}

const normalizeClimate = (value: unknown): ClimateState => {
  const defaults = createDefaultClimateState()
  if (!isRecord(value)) {
    return defaults
  }

  return {
    axialTiltDegrees: Math.min(
      Math.max(ensureNumber(value.axialTiltDegrees, defaults.axialTiltDegrees), 0),
      90,
    ),
    albedo: clamp01(ensureNumber(value.albedo, defaults.albedo)),
    greenhouseMultiplier: Math.max(
      0,
      ensureNumber(value.greenhouseMultiplier, defaults.greenhouseMultiplier),
    ),
    currentTime: Math.max(0, ensureNumber(value.currentTime, defaults.currentTime)),
    yearLength: Math.max(1, ensureNumber(value.yearLength, defaults.yearLength)),
  }
}

const normalizePlanetStateV1 = (value: Record<string, unknown>): PlanetState => ({
  version: PLANET_STATE_VERSION,
  atmosphere: normalizeAtmosphere(value.atmosphere),
  geology: normalizeGeology(value.geology),
  hydrology: normalizeHydrology(value.hydrology),
  biosphere: normalizeBiosphere(value.biosphere),
  civilization: normalizeCivilization(value.civilization),
  climate: normalizeClimate(value.climate),
})

const PLANET_STATE_NORMALIZERS: Record<number, (value: Record<string, unknown>) => PlanetState> = {
  [PLANET_STATE_VERSION]: normalizePlanetStateV1,
}

const migratePlanetState = (value: unknown): PlanetState => {
  if (!isRecord(value)) {
    return createDefaultPlanetState()
  }

  const version = ensurePositiveInteger(value.version, PLANET_STATE_VERSION)
  const normalizer = PLANET_STATE_NORMALIZERS[version]
  if (!normalizer) {
    throw new Error(`Unsupported planet state version: ${version}`)
  }

  return normalizer(value)
}

export const serializePlanetState = (state: PlanetState): string => JSON.stringify(state)

export const deserializePlanetState = (payload: string | unknown): PlanetState => {
  if (typeof payload === 'string') {
    const parsed = JSON.parse(payload) as unknown
    return migratePlanetState(parsed)
  }

  return migratePlanetState(payload)
}
