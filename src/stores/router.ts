import { type Signal, signal } from '@preact/signals'
import { BaseStore } from './base.ts'

export class RouterStore extends BaseStore {
  currentPath: Signal<string>

  // NOTE: I should probably pass in globalThis or possibly globalThis.location and globalThis.history
  constructor() {
    super('routerStore')
    this.currentPath = signal(globalThis.location.pathname)

    // Listen for popstate events (browser back/forward)
    globalThis.addEventListener('popstate', () => {
      this.currentPath.value = globalThis.location.pathname
    })

    this.logger.info('RouterStore initialized', {
      initialPath: this.currentPath.value,
    })
  }

  navigate(path: string) {
    this.logger.debug('Navigating to', { path })
    globalThis.history.pushState(null, '', path)
    this.currentPath.value = path
  }
}
