import { UIStore } from '@/stores/ui.ts'
import { RouterStore } from '@/stores/router.ts'

export type Stores = {
  uiStore: UIStore
  routerStore: RouterStore
}

export function createStores(): Stores {
  return {
    uiStore: new UIStore(),
    routerStore: new RouterStore(),
  }
}
