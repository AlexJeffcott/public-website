import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

// serializable means anything that JSON.stringify will not error on
// this could be useful for holding complex values for a particular 'key'
// example: `const state = {
// 'my-project-1': {
//     'my-file-1.ts': 'console.log('hello')',
//     'my-file-2.ts': 'console.log('bye')'
//   }
// }
export class SerializablePersistence<A> {
  #sig: Signal<A | undefined>
  #disposes: Set<() => void>
  #type: 'localStorage' | 'sessionStorage'
  #stateName: string
  #default: undefined
  current: ReadonlySignal<A | undefined>

  constructor(
    stateName: string,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#default = undefined
    this.#sig = signal(this.#default)
    this.#disposes = new Set()
    this.current = computed(() => this.#sig.value)

    // you should bind the context of public methods
    this.set = this.set.bind(this)
    this.reset = this.reset.bind(this)

    this.#init()
  }

  #putValueInMemory(val: string | null) {
    try {
      this.#sig.value = typeof val === 'string'
        ? JSON.parse(val)
        : this.#default
    } catch {
      console.error(
        `Error when attempting to parse "${val}".`,
      )
    }
  }

  #putValueInStorage(val: A | undefined) {
    try {
      globalThis[this.#type].setItem(
        this.#stateName,
        JSON.stringify(val),
      )
    } catch {
      console.error(
        `Error when attempting to serialize "${val}".`,
      )
    }
  }

  #storageCB(event: StorageEvent) {
    if (event.key === this.#stateName) {
      this.#putValueInMemory(event.newValue)
    }
  }

  #init() {
    // set in-memory value from storage right away
    this.#putValueInMemory(globalThis[this.#type].getItem(this.#stateName))

    // then listen for any storage changes and update the in-memory value accordingly
    globalThis.addEventListener(
      'storage',
      (event: StorageEvent) => this.#storageCB(event),
    )

    this.#disposes.add(() =>
      globalThis.removeEventListener(
        'storage',
        (event: StorageEvent) => this.#storageCB(event),
      )
    )
    // listen to changes in the private signal and put them in storage
    // it is important that this step is done after getting the value from storage
    // initially, lest the stored value be overridden.
    this.#disposes.add(effect(() => this.#putValueInStorage(this.#sig.value)))
  }

  set(value: A) {
    this.#sig.value = value
  }

  reset() {
    // resetting does not create new signal objects so their identity is stable
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#sig.value = this.#default
    this.#init()
  }
}
