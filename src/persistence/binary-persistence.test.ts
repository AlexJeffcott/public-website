import { assertEquals } from '@std/assert'
import { BinaryPersistence } from '@/persistence/binary-persistence.ts'

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

Deno.test('BinaryPersistence', async (t) => {
  localStorage.clear()
  sessionStorage.clear()

  await t.step('creates instance with default localStorage', () => {
    const bp = new BinaryPersistence('test')
    assertEquals(bp.current.value, false)
  })

  await t.step('creates instance with sessionStorage', () => {
    const bp = new BinaryPersistence('test', 'sessionStorage')
    assertEquals(bp.current.value, false)
  })

  await t.step('set() changes value to true', () => {
    const bp = new BinaryPersistence('test-set')
    bp.set()
    assertEquals(bp.current.value, true)
    assertEquals(localStorage.getItem('test-set'), '1')
  })

  await t.step('toggle() switches between true and false', () => {
    const bp = new BinaryPersistence('test-toggle')
    assertEquals(bp.current.value, false)

    bp.toggle()
    assertEquals(bp.current.value, true)
    assertEquals(localStorage.getItem('test-toggle'), '1')

    bp.toggle()
    assertEquals(bp.current.value, false)
    assertEquals(localStorage.getItem('test-toggle'), null)
  })

  await t.step('reset() clears the state', () => {
    const bp = new BinaryPersistence('test-reset')
    bp.set()
    assertEquals(bp.current.value, true)

    bp.reset()
    assertEquals(bp.current.value, false)
    assertEquals(localStorage.getItem('test-reset'), null)
  })

  await t.step('persists value across instances', () => {
    const bp1 = new BinaryPersistence('test-persist')
    bp1.set()

    const bp2 = new BinaryPersistence('test-persist')
    assertEquals(bp2.current.value, true)
  })

  await t.step('storage event updates value', () => {
    const bp = new BinaryPersistence('test-storage')

    const event = new StorageEvent({
      key: 'test-storage',
      newValue: '1',
      storageArea: localStorage,
    })
    globalThis.dispatchEvent(event)

    assertEquals(bp.current.value, true)
  })

  localStorage.clear()
  sessionStorage.clear()
})
