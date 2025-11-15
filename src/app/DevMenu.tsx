import { ChangeEvent, useCallback, useMemo, useState } from 'react'

import {
  clearPlanetSaveSlot,
  isPlanetSaveSlotAvailable,
  listPlanetSaveSlots,
  loadPlanetSaveSlot,
  savePlanetStateToSlot,
  type PlanetSaveSlotSummary,
  PlanetSaveCorruptedError,
  PlanetSaveIncompatibleError,
  PlanetSaveSlotEmptyError,
  PlanetSaveUnsupportedVersionError,
} from '@sim'
import {
  selectLoadLastSaveOnStartup,
  selectPlanetLastLoadedSlot,
  selectPlanetState,
  usePlanetStore,
  useSettingsStore,
} from '@stores'

const DEFAULT_SLOT_LABEL = (slot: number) => `Slot ${slot + 1}`

const summarizeSlotStatus = (summary: PlanetSaveSlotSummary) => {
  switch (summary.status) {
    case 'available':
      return `Updated ${summary.metadata.updatedAt}`
    case 'corrupted':
    case 'incompatible':
      return summary.reason
    case 'empty':
    default:
      return 'Empty slot'
  }
}

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof PlanetSaveUnsupportedVersionError) {
    return 'Save format is not supported by this build.'
  }

  if (error instanceof PlanetSaveIncompatibleError) {
    return 'Saved planet state is incompatible with the current schema.'
  }

  if (error instanceof PlanetSaveCorruptedError) {
    return 'Save slot data is corrupted.'
  }

  if (error instanceof PlanetSaveSlotEmptyError) {
    return 'Save slot is empty.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred while handling the save slot.'
}

const DevMenu = () => {
  const planetState = usePlanetStore(selectPlanetState)
  const setPlanetState = usePlanetStore((state) => state.setPlanetState)
  const lastLoadedSlot = usePlanetStore(selectPlanetLastLoadedSlot)

  const loadLastSaveOnStartup = useSettingsStore(selectLoadLastSaveOnStartup)
  const setLoadLastSaveOnStartup = useSettingsStore((state) => state.setLoadLastSaveOnStartup)

  const [slots, setSlots] = useState<ReadonlyArray<PlanetSaveSlotSummary>>(() => listPlanetSaveSlots())
  const [message, setMessage] = useState<{
    readonly type: 'success' | 'error' | 'info'
    readonly text: string
  } | null>(null)

  const refreshSlots = useCallback(() => {
    setSlots(listPlanetSaveSlots())
  }, [])

  const handleSave = useCallback(
    (slot: number) => {
      try {
        savePlanetStateToSlot(slot, planetState)
        setMessage({ type: 'success', text: `Saved ${DEFAULT_SLOT_LABEL(slot)}` })
      } catch (error) {
        setMessage({ type: 'error', text: resolveErrorMessage(error) })
      } finally {
        refreshSlots()
      }
    },
    [planetState, refreshSlots],
  )

  const handleLoad = useCallback(
    (slot: number) => {
      try {
        const save = loadPlanetSaveSlot(slot)
        setPlanetState(save.planetState, slot)
        setMessage({ type: 'success', text: `Loaded ${save.metadata.label}` })
      } catch (error) {
        setMessage({ type: 'error', text: resolveErrorMessage(error) })
      } finally {
        refreshSlots()
      }
    },
    [refreshSlots, setPlanetState],
  )

  const handleClear = useCallback(
    (slot: number) => {
      try {
        clearPlanetSaveSlot(slot)
        setMessage({ type: 'info', text: `Cleared ${DEFAULT_SLOT_LABEL(slot)}` })
      } catch (error) {
        setMessage({ type: 'error', text: resolveErrorMessage(error) })
      } finally {
        refreshSlots()
      }
    },
    [refreshSlots],
  )

  const handleAutoLoadToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setLoadLastSaveOnStartup(event.target.checked)
  }

  const mostRecentSlot = useMemo(() => {
    const available = slots.filter(isPlanetSaveSlotAvailable)
    if (available.length === 0) {
      return null
    }

    return available.reduce((latest, current) => {
      const latestTime = Date.parse(latest.metadata.updatedAt)
      const currentTime = Date.parse(current.metadata.updatedAt)

      if (Number.isNaN(currentTime)) {
        return latest
      }

      if (Number.isNaN(latestTime) || currentTime > latestTime) {
        return current
      }

      return latest
    })
  }, [slots])

  return (
    <section className="app__dev-menu" aria-label="Developer tools">
      <header className="app__dev-menu-header">
        <div>
          <h2>Developer menu</h2>
          <p>Save and load planet state snapshots while testing features.</p>
        </div>

        {message ? (
          <span className="app__dev-menu-message" data-variant={message.type} role="status">
            {message.text}
          </span>
        ) : null}
      </header>

      <div className="app__dev-menu-settings">
        <label className="app__dev-menu-checkbox">
          <input
            type="checkbox"
            checked={loadLastSaveOnStartup}
            onChange={handleAutoLoadToggle}
          />
          Load most recent save on startup
        </label>

        {mostRecentSlot ? (
          <span className="app__dev-menu-recent" aria-live="polite">
            Last updated: {mostRecentSlot.metadata.updatedAt}
          </span>
        ) : null}
      </div>

      <ul className="app__dev-menu-slots">
        {slots.map((summary) => {
          const isAvailable = isPlanetSaveSlotAvailable(summary)
          const isActive = isAvailable && lastLoadedSlot === summary.slot
          const description = summarizeSlotStatus(summary)

          return (
            <li
              key={summary.slot}
              className="app__dev-menu-slot"
              data-status={summary.status}
              data-active={isActive}
            >
              <div className="app__dev-menu-slot-info">
                <span className="app__dev-menu-slot-title">
                  {isAvailable ? summary.metadata.label : DEFAULT_SLOT_LABEL(summary.slot)}
                </span>
                <span className="app__dev-menu-slot-meta" data-status={summary.status}>
                  {description}
                </span>
              </div>

              <div className="app__dev-menu-actions">
                <button
                  type="button"
                  className="app__dev-menu-button"
                  onClick={() => handleSave(summary.slot)}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="app__dev-menu-button"
                  data-variant="primary"
                  onClick={() => handleLoad(summary.slot)}
                  disabled={!isAvailable}
                >
                  Load
                </button>
                <button
                  type="button"
                  className="app__dev-menu-button"
                  data-variant="danger"
                  onClick={() => handleClear(summary.slot)}
                  disabled={summary.status === 'empty'}
                >
                  Clear
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default DevMenu
