import { UIStore } from '@/stores/ui.ts'
import { RouterStore } from '@/stores/router.ts'
import { EditorStore } from '@/stores/editor.ts'
import { TranspilerStore } from '@/stores/transpiler.ts'
import { FinderStore } from '@/stores/finder.ts'

export type Stores = {
  finderStore: FinderStore
  uiStore: UIStore
  routerStore: RouterStore
  editorStore: EditorStore
  transpilerStore: TranspilerStore
}

export function createStores(): Stores {
  return {
    finderStore: new FinderStore(),
    uiStore: new UIStore(),
    routerStore: new RouterStore(),
    editorStore: new EditorStore(),
    transpilerStore: new TranspilerStore(),
  }
}
