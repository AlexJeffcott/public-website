import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

type SN = string | number

// 'unset' | (string | number)
// undefined | value
export class PrimitivePersistence {
  #sig: Signal<SN | undefined>
  #disposes: Set<() => void>
  #type: 'localStorage' | 'sessionStorage'
  #stateName: string
  #default: undefined
  current: ReadonlySignal<SN | undefined>

  constructor(
    stateName: string,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#sig = signal(this.#default)
    this.#disposes = new Set()
    this.current = computed(() => this.#sig.value)

    // you should bind the context of public methods
    this.set = this.set.bind(this)
    this.reset = this.reset.bind(this)

    this.#init()
  }

  #putValueInMemory(val: string | null) {
    if (typeof val === 'string') {
      const parsedVal = parseInt(val)
      if (Number.isNaN(parsedVal)) {
        this.#sig.value = val
      } else {
        this.#sig.value = parsedVal
      }
    } else {
      this.#sig.value = this.#default
    }
  }

  #putValueInStorage(val: SN | undefined) {
    try {
      globalThis[this.#type].setItem(
        this.#stateName,
        typeof val === 'string' ? val : JSON.stringify(val),
      )
    } catch {
      console.error(
        `Error when attempting to serialize "${this.#sig.value}".`,
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

  set(value: SN) {
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
