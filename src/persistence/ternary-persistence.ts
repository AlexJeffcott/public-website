import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

// 'unset' | true | false
// undefined | 1 | 0
export class TernaryPersistence {
  #sig: Signal<undefined | boolean>
  #disposes: Set<() => void>
  #type: 'localStorage' | 'sessionStorage'
  #stateName: string
  #default: undefined
  current: ReadonlySignal<undefined | boolean>

  constructor(
    stateName: string,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#default = undefined
    this.#sig = signal(this.#default)
    this.#disposes = new Set()

    this.current = computed(() => {
      if (this.#sig.value === true) {
        return true
      } else if (this.#sig.value === false) {
        return false
      } else {
        return undefined
      }
    })
    // you should bind the context of public methods
    this.set = this.set.bind(this)
    this.reset = this.reset.bind(this)

    this.#init()
  }

  #putValueInMemory(val: string | null) {
    if (val === String(1)) {
      this.#sig.value = true
    } else if (val === String(0)) {
      this.#sig.value = false
    } else {
      this.#sig.value = this.#default
    }
  }

  #putValueInStorage(val: boolean | undefined) {
    if (val === true) {
      globalThis[this.#type].setItem(
        this.#stateName,
        String(1),
      )
    } else if (val === false) {
      globalThis[this.#type].setItem(
        this.#stateName,
        String(1),
      )
    } else {
      globalThis[this.#type].removeItem(
        this.#stateName,
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

  set(value: boolean) {
    this.#sig.value = value
  }

  reset() {
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#sig.value = this.#default
    this.#init()
  }
}
