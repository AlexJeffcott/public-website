import { assert, assertEquals } from '@std/assert'
import { PrimitivePersistence } from '@/persistence/mod.ts'

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

Deno.test('PrimitivePersistence', async (t) => {
  localStorage.clear()
  sessionStorage.clear()

  await t.step('should initialize with undefined if no value is stored', () => {
    const persistence = new PrimitivePersistence('testKey')
    assertEquals(persistence.current.value, undefined)
  })

  await t.step('should set and retrieve string value', () => {
    const persistence = new PrimitivePersistence('stringKey')
    persistence.set('testString')

    assertEquals(persistence.current.value, 'testString')
    assertEquals(localStorage.getItem('stringKey'), 'testString')
  })

  await t.step('should set and retrieve number value', () => {
    const persistence = new PrimitivePersistence('numberKey')
    persistence.set(42)

    assertEquals(persistence.current.value, 42)
    assertEquals(localStorage.getItem('numberKey'), '42')
  })

  await t.step('should reset value to undefined', () => {
    const persistence = new PrimitivePersistence('resetKey')
    persistence.set('willReset')
    assertEquals(persistence.current.value, 'willReset')

    persistence.reset()
    assertEquals(persistence.current.value, undefined)
    assertEquals(localStorage.getItem('resetKey'), 'undefined')
  })

  await t.step('should handle NaN gracefully', () => {
    const persistence = new PrimitivePersistence('nanKey')
    persistence.set(NaN as unknown as string | number)

    assert(Number.isNaN(persistence.current.value))
  })

  await t.step('should listen to storage events', () => {
    const persistence = new PrimitivePersistence('eventKey')
    persistence.set('initial')

    // Simulate a storage event
    globalThis.dispatchEvent(
      new StorageEvent({
        key: 'eventKey',
        newValue: 'updatedValue',
        storageArea: localStorage,
      }),
    )

    assertEquals(persistence.current.value, 'updatedValue')
  })

  localStorage.clear()
  sessionStorage.clear()
})
