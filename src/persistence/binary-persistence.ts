import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

// binary means yes or no. There is no maybe or definitely not.
// this means that the value is either positively present, or not.
// this means you can pass an id, and know whether is as been positively marked.
// example:
// ```
//   const hasBeenSeen = new BinaryPersistance("hasBeenSeen").current
//   return <div ref={() => hasBeenSeen.set()} >{hasBeenSeen.value ? 'yup' : 'nope'}</div>
// ```
//
// example:
// ```
//   // in a UI component somewhere
//   const hasClickedButton1 = new BinaryPersistance("hasClickedButton1")
//   const hasClickedButton2 = new BinaryPersistance("hasClickedButton2")
//   const hasClickedButton3 = new BinaryPersistance("hasClickedButton3")
//   hasClickedButton1.set()
//   hasClickedButton2.set()
//   hasClickedButton3.set()
//
//   // in another component somewhere else
//   const hasClickedButton1 = new BinaryPersistance("hasClickedButton1")
//   const hasClickedButton2 = new BinaryPersistance("hasClickedButton2")
//   const hasClickedButton3 = new BinaryPersistance("hasClickedButton3")
//   const hasClickedAllTheButtons = useComputed(() => {
//     return !!(hasClickedButton1.current.value && hasClickedButton2.current.value && hasClickedButton3.current.value)
//   })
//
//   return <div>{hasClickedAllTheButtons.value ? 'yup' : 'nope'}</div>
// ```

// Why isn't this just a boolean that switches on and off????
// Because that would essentially have three possible values: true, false and undefined.
// This dtata structure only has 'hasBeenSet' | 'otherwise' as the non-default value is either present or not.
// This means that the default value does not matter so long as it is different from the 'set' value.

// 'unset' | true
// undefined | 1
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
    globalThis.addEventListener('storage', this.#storageCB)

    this.#disposes.add(() =>
      globalThis.removeEventListener('storage', this.#storageCB)
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
    // resetting does not create new signal objects so their identity is stable
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#init()
  }
}
