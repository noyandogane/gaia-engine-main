import { resolveStorage } from '@/utils/storage'

import {
  PLANET_STATE_VERSION,
  deserializePlanetState,
  type PlanetState,
  type PlanetStateVersion,
} from './planetState'

export const PLANET_SAVE_FORMAT_VERSION = 1 as const
export type PlanetSaveFormatVersion = typeof PLANET_SAVE_FORMAT_VERSION

export const SAVE_SLOT_COUNT = 3 as const
const SAVE_SLOT_KEY_PREFIX = 'planet-save-slot-'
const ISO_EPOCH = new Date(0).toISOString()
const MAX_LABEL_LENGTH = 64

export class PlanetSaveSlotEmptyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanetSaveSlotEmptyError'
  }
}

export class PlanetSaveCorruptedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanetSaveCorruptedError'
  }
}

export class PlanetSaveUnsupportedVersionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanetSaveUnsupportedVersionError'
  }
}

export class PlanetSaveIncompatibleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanetSaveIncompatibleError'
  }
}

export type PlanetSaveMetadata = {
  readonly slot: number
  readonly label: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type PlanetSave = {
  readonly formatVersion: PlanetSaveFormatVersion
  readonly metadata: PlanetSaveMetadata
  readonly planetStateVersion: PlanetStateVersion
  readonly planetState: PlanetState
}

export type PlanetSaveSlotSummary =
  | {
      readonly slot: number
      readonly status: 'empty'
      readonly label: string
    }
  | {
      readonly slot: number
      readonly status: 'available'
      readonly label: string
      readonly metadata: PlanetSaveMetadata
      readonly planetStateVersion: PlanetStateVersion
    }
  | {
      readonly slot: number
      readonly status: 'corrupted'
      readonly label: string
      readonly reason: string
    }
  | {
      readonly slot: number
      readonly status: 'incompatible'
      readonly label: string
      readonly reason: string
    }

type PlanetSaveSlotSummaryAvailable = Extract<PlanetSaveSlotSummary, { status: 'available' }>

export const isPlanetSaveSlotAvailable = (
  summary: PlanetSaveSlotSummary,
): summary is PlanetSaveSlotSummaryAvailable => summary.status === 'available'

export type SavePlanetStateOptions = {
  readonly label?: string
  readonly timestamp?: Date
}

type DeserializePlanetSaveOptions = {
  readonly expectedSlot?: number
}

type PlanetSaveNormalizer = (
  payload: Record<string, unknown>,
  options?: DeserializePlanetSaveOptions,
) => PlanetSave

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const ensureString = (value: unknown, fallback: string): string =>
  isString(value) && value.trim().length > 0 ? value.trim() : fallback

const ensurePositiveInteger = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const rounded = Math.floor(value)
  return rounded > 0 ? rounded : null
}

const ensureSlotIndex = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const rounded = Math.floor(value)
  if (rounded < 0 || rounded >= SAVE_SLOT_COUNT) {
    return null
  }

  return rounded
}

const ensureISODate = (value: unknown, fallback: string): string => {
  if (isString(value)) {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString()
    }
  }

  return fallback
}

const sanitizeLabel = (value: unknown, fallback: string): string => {
  const label = ensureString(value, fallback)
  return label.length > MAX_LABEL_LENGTH ? label.slice(0, MAX_LABEL_LENGTH) : label
}

const defaultSlotLabel = (slot: number) => `Slot ${slot + 1}`

const getSlotKey = (slot: number) => `${SAVE_SLOT_KEY_PREFIX}${slot}`

const assertValidSlotIndex = (slot: number): void => {
  if (!Number.isInteger(slot) || slot < 0 || slot >= SAVE_SLOT_COUNT) {
    throw new RangeError(`Invalid save slot index: ${slot}`)
  }
}

const normalizePlanetSaveV1: PlanetSaveNormalizer = (payload, options) => {
  const metadataRaw = payload.metadata
  if (!isRecord(metadataRaw)) {
    throw new PlanetSaveCorruptedError('Save metadata is missing or invalid')
  }

  const slotFromPayload = ensureSlotIndex(metadataRaw.slot)
  const expectedSlot = options?.expectedSlot

  if (slotFromPayload === null) {
    if (typeof expectedSlot === 'number') {
      throw new PlanetSaveCorruptedError('Save metadata slot is invalid')
    }

    throw new PlanetSaveCorruptedError('Save metadata slot is missing')
  }

  if (typeof expectedSlot === 'number' && slotFromPayload !== expectedSlot) {
    throw new PlanetSaveCorruptedError(
      `Save metadata slot ${slotFromPayload} does not match expected slot ${expectedSlot}`,
    )
  }

  const slot = slotFromPayload
  const fallbackLabel = defaultSlotLabel(slot)
  const createdAt = ensureISODate(metadataRaw.createdAt, ISO_EPOCH)
  const updatedCandidate = ensureISODate(metadataRaw.updatedAt, createdAt)
  const createdTimestamp = Date.parse(createdAt)
  const updatedTimestamp = Date.parse(updatedCandidate)

  const metadata: PlanetSaveMetadata = {
    slot,
    label: sanitizeLabel(metadataRaw.label, fallbackLabel),
    createdAt,
    updatedAt:
      Number.isNaN(updatedTimestamp) || updatedTimestamp < createdTimestamp
        ? createdAt
        : new Date(updatedTimestamp).toISOString(),
  }

  if (!('planetStateVersion' in payload)) {
    throw new PlanetSaveCorruptedError('Save payload is missing the planet state version')
  }

  const planetStateVersionRaw = ensurePositiveInteger(payload.planetStateVersion)
  if (planetStateVersionRaw === null) {
    throw new PlanetSaveCorruptedError('Save payload includes an invalid planet state version')
  }

  if (planetStateVersionRaw > PLANET_STATE_VERSION) {
    throw new PlanetSaveIncompatibleError(
      `Planet state version ${planetStateVersionRaw} is newer than supported version ${PLANET_STATE_VERSION}`,
    )
  }

  if (!('planetState' in payload)) {
    throw new PlanetSaveCorruptedError('Save payload is missing the planet state data')
  }

  let planetState: PlanetState
  try {
    planetState = deserializePlanetState(payload.planetState)
  } catch (error) {
    throw new PlanetSaveIncompatibleError(
      error instanceof Error ? error.message : 'Failed to load saved planet state',
    )
  }

  return {
    formatVersion: PLANET_SAVE_FORMAT_VERSION,
    metadata,
    planetStateVersion: planetState.version,
    planetState,
  }
}

const PLANET_SAVE_NORMALIZERS: Record<number, PlanetSaveNormalizer> = {
  [PLANET_SAVE_FORMAT_VERSION]: normalizePlanetSaveV1,
}

const parseSavePayload = (payload: string | unknown, options?: DeserializePlanetSaveOptions): PlanetSave => {
  let raw: unknown = payload

  if (typeof payload === 'string') {
    try {
      raw = JSON.parse(payload) as unknown
    } catch {
      throw new PlanetSaveCorruptedError('Save payload is not valid JSON')
    }
  }

  if (!isRecord(raw)) {
    throw new PlanetSaveCorruptedError('Save payload must be an object')
  }

  const versionValue = raw.version
  if (!('version' in raw)) {
    throw new PlanetSaveCorruptedError('Save payload is missing the format version')
  }

  const version = ensurePositiveInteger(versionValue)
  if (version === null) {
    throw new PlanetSaveCorruptedError('Save payload has an invalid format version')
  }

  const normalizer = PLANET_SAVE_NORMALIZERS[version]
  if (!normalizer) {
    throw new PlanetSaveUnsupportedVersionError(
      `Unsupported save format version: ${String(versionValue)}`,
    )
  }

  return normalizer(raw, options)
}

const readSaveFromStorage = (storage: Storage, slot: number): PlanetSave => {
  const key = getSlotKey(slot)
  const raw = storage.getItem(key)

  if (raw === null) {
    throw new PlanetSaveSlotEmptyError(`Save slot ${slot + 1} is empty`)
  }

  return parseSavePayload(raw, { expectedSlot: slot })
}

const tryReadSaveFromStorage = (storage: Storage, slot: number): PlanetSave | null => {
  try {
    return readSaveFromStorage(storage, slot)
  } catch (error) {
    if (
      error instanceof PlanetSaveSlotEmptyError ||
      error instanceof PlanetSaveCorruptedError ||
      error instanceof PlanetSaveUnsupportedVersionError ||
      error instanceof PlanetSaveIncompatibleError
    ) {
      return null
    }

    throw error
  }
}

const buildSerializedSavePayload = (planetState: PlanetState, metadata: PlanetSaveMetadata) => ({
  version: PLANET_SAVE_FORMAT_VERSION,
  metadata,
  planetStateVersion: planetState.version,
  planetState,
})

export const serializePlanetSave = (planetState: PlanetState, metadata: PlanetSaveMetadata): string =>
  JSON.stringify(buildSerializedSavePayload(planetState, metadata))

export const deserializePlanetSave = (
  payload: string | unknown,
  options?: DeserializePlanetSaveOptions,
): PlanetSave => parseSavePayload(payload, options)

export const savePlanetStateToSlot = (
  slot: number,
  planetState: PlanetState,
  options?: SavePlanetStateOptions,
): PlanetSave => {
  assertValidSlotIndex(slot)

  const storage = resolveStorage()
  const existing = tryReadSaveFromStorage(storage, slot)
  const timestamp = (options?.timestamp ?? new Date()).toISOString()

  const metadata: PlanetSaveMetadata = {
    slot,
    label: sanitizeLabel(
      options?.label ?? existing?.metadata.label ?? defaultSlotLabel(slot),
      defaultSlotLabel(slot),
    ),
    createdAt: existing?.metadata.createdAt ?? timestamp,
    updatedAt: timestamp,
  }

  const serialized = buildSerializedSavePayload(planetState, metadata)
  storage.setItem(getSlotKey(slot), JSON.stringify(serialized))

  return {
    formatVersion: PLANET_SAVE_FORMAT_VERSION,
    metadata,
    planetStateVersion: planetState.version,
    planetState,
  }
}

export const loadPlanetSaveSlot = (slot: number): PlanetSave => {
  assertValidSlotIndex(slot)
  const storage = resolveStorage()
  return readSaveFromStorage(storage, slot)
}

export const clearPlanetSaveSlot = (slot: number): void => {
  assertValidSlotIndex(slot)
  const storage = resolveStorage()
  storage.removeItem(getSlotKey(slot))
}

export const listPlanetSaveSlots = (): PlanetSaveSlotSummary[] => {
  const storage = resolveStorage()
  const summaries: PlanetSaveSlotSummary[] = []

  for (let slot = 0; slot < SAVE_SLOT_COUNT; slot += 1) {
    const key = getSlotKey(slot)
    const label = defaultSlotLabel(slot)
    const raw = storage.getItem(key)

    if (raw === null) {
      summaries.push({ slot, status: 'empty', label })
      continue
    }

    try {
      const save = parseSavePayload(raw, { expectedSlot: slot })
      summaries.push({
        slot,
        status: 'available',
        label: save.metadata.label,
        metadata: save.metadata,
        planetStateVersion: save.planetStateVersion,
      })
    } catch (error) {
      if (error instanceof PlanetSaveUnsupportedVersionError || error instanceof PlanetSaveIncompatibleError) {
        summaries.push({
          slot,
          status: 'incompatible',
          label,
          reason: error.message,
        })
      } else if (error instanceof PlanetSaveCorruptedError) {
        summaries.push({
          slot,
          status: 'corrupted',
          label,
          reason: error.message,
        })
      } else {
        throw error
      }
    }
  }

  return summaries
}

export const findMostRecentValidSaveSlot = (): PlanetSaveSlotSummaryAvailable | null => {
  const summaries = listPlanetSaveSlots()
  let latest: PlanetSaveSlotSummaryAvailable | null = null

  for (const summary of summaries) {
    if (!isPlanetSaveSlotAvailable(summary)) {
      continue
    }

    if (!latest) {
      latest = summary
      continue
    }

    const latestTimestamp = Date.parse(latest.metadata.updatedAt)
    const candidateTimestamp = Date.parse(summary.metadata.updatedAt)

    if (Number.isNaN(candidateTimestamp)) {
      continue
    }

    if (Number.isNaN(latestTimestamp) || candidateTimestamp > latestTimestamp) {
      latest = summary
    }
  }

  return latest
}
