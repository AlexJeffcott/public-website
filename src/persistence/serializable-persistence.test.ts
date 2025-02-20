import { assertEquals } from '@std/assert'
import { TernaryPersistence } from '@/persistence/mod.ts'

type Details = {
  key: string
  newValue: string
  storageArea: typeof localStorage | typeof sessionStorage
}
/** Implements StorageEvent so it works well enough to test */
class StorageEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('storage', { bubbles: true })

    Object.assign(this, details)
  }
}

Deno.test('TernaryPersistence', async (t) => {
  localStorage.clear()
  sessionStorage.clear()

  await t.step('initializes with undefined value', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-initialize-test',
    )
    assertEquals(persistence.current.value, undefined)
  })

  await t.step('sets value to true', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-set-to-true-test',
    )
    persistence.set(true)
    assertEquals(persistence.current.value, true)
    assertEquals(
      localStorage.getItem('TernaryPersistence-set-to-true-test'),
      '1',
    )
  })

  await t.step('sets value to false', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-set-to-false-test',
    )
    persistence.set(false)
    assertEquals(persistence.current.value, false)
    assertEquals(
      localStorage.getItem('TernaryPersistence-set-to-false-test'),
      '1',
    )
  })

  await t.step('resets to undefined', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-resets-to-undefined-test',
    )
    persistence.set(true)
    persistence.reset()
    assertEquals(persistence.current.value, undefined)
    assertEquals(
      localStorage.getItem('TernaryPersistence-resets-to-undefined-test'),
      null,
    )
  })

  await t.step('uses sessionStorage when specified', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-sessionStorage-test',
      'sessionStorage',
    )
    persistence.set(true)
    assertEquals(
      sessionStorage.getItem('TernaryPersistence-sessionStorage-test'),
      '1',
    )
    assertEquals(
      localStorage.getItem('TernaryPersistence-sessionStorage-test'),
      null,
    )
  })

  await t.step('responds to storage events', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-storage-events-test',
    )
    const event = new StorageEvent({
      key: 'TernaryPersistence-storage-events-test',
      newValue: '1',
      storageArea: localStorage,
    })
    globalThis.dispatchEvent(event)
    assertEquals(persistence.current.value, true)
  })

  await t.step('ignores storage events for other keys', () => {
    const persistence = new TernaryPersistence(
      'TernaryPersistence-ignores-other-storage-events-test',
    )
    const event = new StorageEvent({
      key: 'other',
      newValue: '1',
      storageArea: localStorage,
    })
    globalThis.dispatchEvent(event)
    assertEquals(persistence.current.value, undefined)
  })

  localStorage.clear()
  sessionStorage.clear()
})
