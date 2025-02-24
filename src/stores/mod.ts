import { ProjectsStore } from '@/stores/projects.ts'
import { UIStore } from '@/stores/ui.ts'
import { RouterStore } from '@/stores/router.ts'
import { EditorStore } from '@/stores/editor.ts'
import { TranspilerStore } from '@/stores/transpiler.ts'

export type Stores = {
  projectsStore: ProjectsStore
  uiStore: UIStore
  routerStore: RouterStore
  editorStore: EditorStore
  transpilerStore: TranspilerStore
}

export function createStores(): Stores {
  return {
    projectsStore: new ProjectsStore(),
    uiStore: new UIStore(),
    routerStore: new RouterStore(),
    editorStore: new EditorStore(),
    transpilerStore: new TranspilerStore(),
  }
}
