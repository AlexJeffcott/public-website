import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'

export class CyclablePersistence<A extends Array<string | number>> {
  #disposes: Set<() => void>
  #type: 'localStorage' | 'sessionStorage'
  #stateName: string
  #currentIndex: Signal<number>
  #list: A
  current: ReadonlySignal<A[number] | undefined>

  constructor(
    stateName: string,
    list: A,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#disposes = new Set()
    this.#currentIndex = signal(0)
    this.#list = list
    this.current = computed(() => this.#list.at(this.#currentIndex.value))

    // you should bind the context of public methods
    this.incIndex = this.incIndex.bind(this)
    this.decIndex = this.decIndex.bind(this)
    this.setIndex = this.setIndex.bind(this)
    this.reset = this.reset.bind(this)

    this.#init()
  }

  #putValueInMemory(val: string | null) {
    if (typeof val === 'string') {
      this.#currentIndex.value = this.#list.indexOf(val) || 0
    }
  }

  #putValueInStorage(val: A[number] | undefined) {
    globalThis[this.#type].setItem(
      this.#stateName,
      String(val),
    )
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

    this.#disposes.add(() => {
      globalThis.removeEventListener('storage', this.#storageCB)
    })

    // listen to changes in the "result" computed and put them in storage
    // it is important that this step is done after getting the value from storage
    // initially, lest the stored value be overridden.
    this.#disposes.add(effect(() => {
      this.#putValueInStorage(this.current.value)
    }))
  }

  setIndex(index: number) {
    this.#currentIndex.value = index
  }

  incIndex() {
    const len = this.#list.length
    if (len > 1) {
      this.#currentIndex.value = this.#currentIndex.peek() < len - 1
        ? this.#currentIndex.peek() + 1
        : 0
    }
  }

  decIndex() {
    const len = this.#list.length
    if (len > 1) {
      this.#currentIndex.value = this.#currentIndex.peek() === 0
        ? len - 1
        : this.#currentIndex.peek() - 1
    }
  }

  reset() {
    // resetting does not create new signal objects so their identity is stable
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#init()
  }
}
