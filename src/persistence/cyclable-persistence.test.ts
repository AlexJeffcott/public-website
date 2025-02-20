import { assertEquals } from '@std/assert'
import { CyclablePersistence } from '@/persistence/mod.ts'

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

Deno.test('CyclablePersistence', async (t) => {
  localStorage.clear()
  sessionStorage.clear()

  await t.step('initializes with default index', () => {
    const cycle = new CyclablePersistence('test', ['a', 'b', 'c'])
    assertEquals(cycle.current.value, 'a')
  })

  await t.step('increments index correctly', () => {
    const cycle = new CyclablePersistence('test-inc', ['a', 'b', 'c'])
    cycle.incIndex()
    assertEquals(cycle.current.value, 'b')
    cycle.incIndex()
    assertEquals(cycle.current.value, 'c')
    cycle.incIndex()
    assertEquals(cycle.current.value, 'a')
  })

  await t.step('decrements index correctly', () => {
    const cycle = new CyclablePersistence('test-dec', ['a', 'b', 'c'])
    cycle.decIndex()
    assertEquals(cycle.current.value, 'c')
    cycle.decIndex()
    assertEquals(cycle.current.value, 'b')
    cycle.decIndex()
    assertEquals(cycle.current.value, 'a')
  })

  await t.step('sets index directly', () => {
    const cycle = new CyclablePersistence('test-set', ['a', 'b', 'c'])
    cycle.setIndex(1)
    assertEquals(cycle.current.value, 'b')
  })

  await t.step('persists value in localStorage', () => {
    const cycle = new CyclablePersistence('test-storage', ['a', 'b', 'c'])
    cycle.incIndex()
    assertEquals(localStorage.getItem('test-storage'), 'b')
  })

  await t.step('loads persisted value from localStorage', () => {
    const key = 'test-load'
    localStorage.setItem(key, 'c')
    const cycle = new CyclablePersistence(key, ['a', 'b', 'c'])
    assertEquals(cycle.current.value, 'c')
  })

  await t.step('handles storage events', () => {
    const key = 'test-events'
    const cycle = new CyclablePersistence(key, ['a', 'b', 'c'])

    const storageEvent = new StorageEvent({
      key,
      newValue: 'b',
      storageArea: localStorage,
    })

    globalThis.dispatchEvent(storageEvent)
    assertEquals(cycle.current.value, 'b')
  })

  await t.step('resets correctly', () => {
    const key = 'test-reset'
    const cycle = new CyclablePersistence(key, ['a', 'b', 'c'])
    cycle.incIndex()
    cycle.reset()
    assertEquals(cycle.current.value, 'a')
    assertEquals(localStorage.getItem(key), 'a')
  })

  await t.step('works with single item list', () => {
    const cycle = new CyclablePersistence('test-single', ['a'])
    cycle.incIndex()
    assertEquals(cycle.current.value, 'a')
    cycle.decIndex()
    assertEquals(cycle.current.value, 'a')
  })

  await t.step('works with sessionStorage', () => {
    const key = 'test-session'
    const cycle = new CyclablePersistence(key, ['a', 'b'], 'sessionStorage')
    cycle.incIndex()
    assertEquals(sessionStorage.getItem(key), 'b')
  })

  localStorage.clear()
  sessionStorage.clear()
})
