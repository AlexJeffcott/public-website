import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

/**
 * A class that manages a persistent binary state (true/unset) across browser sessions.
 * The state is stored in either localStorage or sessionStorage and exposed as a readonly boolean signal.
 *
 * @example Create a persistent binary state named "userConsent" in localStorage
 * ```ts
 * const consent = new BinaryPersistence("userConsent");
 * console.assert(consent.current.value === false);
 *
 * consent.set();
 * console.assert(consent.current.value === true);
 *
 * consent.toggle();
 * console.assert(consent.current.value === false);
 * ```
 * @example Create a persistent binary state named "userConsent" in sessionStorage
 * ```ts
 * const consent = new BinaryPersistence("userConsent", "sessionStorage");
 * console.assert(consent.current.value === false);
 *
 * consent.set();
 * console.assert(consent.current.value === true);
 *
 * consent.toggle();
 * console.assert(consent.current.value === false);
 * ```
 *
 * The state persists across page reloads and syncs between tabs (for localStorage).
 * When unset, the value is exposed as `false`.
 * When set, the value is exposed as `true`.
 *
 * @property {ReadonlySignal<string>} current - A readonly signal of the current state
 * @property {() => void} toggle - Toggles the state
 * @property {() => void} set - Sets the state to true
 * @method {() => void} reset - Reset and re-initialize the object without creating a new observable
 */
export class BinaryPersistence {
  #sig: Signal<1 | undefined>
  #disposes: Set<() => void>
  #type: 'localStorage' | 'sessionStorage'
  #stateName: string
  current: ReadonlySignal<boolean>

  constructor(
    stateName: string,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#sig = signal(undefined)
    this.#disposes = new Set()
    this.current = computed(() => this.#sig.value === 1)

    // you should bind the context of public methods
    this.toggle = this.toggle.bind(this)
    this.set = this.set.bind(this)
    this.reset = this.reset.bind(this)

    this.#init()
  }

  #putValueInMemory(val: string | null) {
    if (typeof val === 'string') {
      if (val) {
        this.#sig.value = 1
      } else {
        this.#sig.value = undefined
      }
    }
  }

  #putValueInStorage(val: 1 | undefined) {
    if (val === undefined) {
      globalThis[this.#type].removeItem(
        this.#stateName,
      )
    } else {
      globalThis[this.#type].setItem(
        this.#stateName,
        String(1),
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

  toggle() {
    this.#sig.value = this.#sig.peek() === undefined ? 1 : undefined
  }

  set() {
    this.#sig.value = 1
  }

  reset() {
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#sig.value = undefined
    this.#init()
  }
}
