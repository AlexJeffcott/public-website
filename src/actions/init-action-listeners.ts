import { createCB as createToggleColorThemeCB } from '@/actions/toggle-color-theme/mod.ts'
import { createCB as createToggleThemeCB } from '@/actions/toggle-theme/mod.ts'
import { createCB as createNavigateCB } from '@/actions/navigate/mod.ts'
import { createCB as createCreateFileCB } from '@/actions/create-file/mod.ts'

import { type Stores } from '@/stores/mod.ts'

export function initActionListeners(element: HTMLElement, stores: Stores) {
  element.addEventListener(
    'toggletheme',
    createToggleThemeCB({
      uiStore: stores.uiStore,
    }),
  )

  element.addEventListener(
    'togglecolortheme',
    createToggleColorThemeCB({
      uiStore: stores.uiStore,
    }),
  )

  element.addEventListener(
    'createfile',
    createCreateFileCB({
      finderStore: stores.finderStore,
    }),
  )

  element.addEventListener(
    'navigate',
    createNavigateCB({
      routerStore: stores.routerStore,
    }),
  )
}
