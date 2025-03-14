import {
  computed,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'

export class RouterStore extends BaseStore {
  location: Signal<{
    path: string
    hash: string
    search: typeof globalThis.location.search
  }>
  path: ReadonlySignal<string>
  hash: ReadonlySignal<string>
  decodedHash: ReadonlySignal<string>
  search: ReadonlySignal<typeof globalThis.location.search>

  constructor() {
    super('routerStore')
    const location = globalThis.location
    this.location = signal({
      path: location.pathname,
      hash: location.hash,
      search: location.search,
    })

    this.path = computed(() => this.location.value.path)
    this.hash = computed(() => this.location.value.hash)
    this.decodedHash = computed(() =>
      decodeURIComponent(this.location.value.hash).slice(1)
    )
    this.search = computed(() => this.location.value.search)

    globalThis.addEventListener('popstate', (_e) => {
      this.setLocation()
    })

    globalThis.addEventListener('hashchange', (_e) => {
      this.setLocation()
    })

    this.logger.info('RouterStore initialized', {
      initialPath: this.path.value,
    })

    this.setLocation = this.setLocation.bind(this)
    this.navigate = this.navigate.bind(this)
  }

  setLocation() {
    this.location.value = {
      path: globalThis.location.pathname,
      hash: globalThis.location.hash,
      search: globalThis.location.search,
    }
  }

  navigate(path: string) {
    this.logger.debug('Navigating to', { path })
    globalThis.history.pushState(null, '', path)
    this.setLocation()
  }
}
