import { UIStore } from '@/stores/ui.ts'
import { RouterStore } from '@/stores/router.ts'
import { EditorStore } from '@/stores/editor.ts'

export type Stores = {
  uiStore: UIStore
  routerStore: RouterStore
  editorStore: EditorStore
}

export function createStores(): Stores {
  return {
    uiStore: new UIStore(),
    routerStore: new RouterStore(),
    editorStore: new EditorStore(),
  }
}
