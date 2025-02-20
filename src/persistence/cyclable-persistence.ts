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
  #default: 0
  current: ReadonlySignal<A[number] | undefined>

  constructor(
    stateName: string,
    list: A,
    type: 'localStorage' | 'sessionStorage' = 'localStorage',
  ) {
    this.#type = type
    this.#stateName = stateName
    this.#disposes = new Set()
    this.#default = 0
    this.#currentIndex = signal(this.#default)
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
      this.#currentIndex.value = this.#list.indexOf(val)
    } else {
      this.#currentIndex.value = this.#default
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
    if (len === 0) return
    else if (len === 1) {
      this.#currentIndex.value = 0
    } else {
      const cur = this.#currentIndex.peek()
      this.#currentIndex.value = cur < len - 1 ? cur + 1 : 0
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
    this.#disposes.forEach((dispose) => dispose())
    this.#disposes.clear()
    globalThis[this.#type].removeItem(this.#stateName)
    this.#currentIndex.value = this.#default
    this.#init()
  }
}
