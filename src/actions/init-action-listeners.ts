import { createCB as createSetColorThemeCB } from '@/actions/set-color-theme/mod.ts'
import { createCB as createNavigateCB } from '@/actions/navigate/mod.ts'
import { createCB as createCreateFileOrDirectoryCB } from '@/actions/create-file-or-directory/mod.ts'
import { createCB as createDeleteFileOrDirectoryCB } from '@/actions/delete-file-or-directory/mod.ts'
import { createCB as createCopyFileOrDirectoryCB } from '@/actions/copy-file-or-directory/mod.ts'

import { type Stores } from '@/stores/mod.ts'

export function initActionListeners(element: HTMLElement, stores: Stores) {
  element.addEventListener(
    'setcolortheme',
    createSetColorThemeCB({
      uiStore: stores.uiStore,
    }),
  )

  element.addEventListener(
    'createfileordirectory',
    createCreateFileOrDirectoryCB({
      finderStore: stores.finderStore,
    }),
  )

  element.addEventListener(
    'deletefileordirectory',
    createDeleteFileOrDirectoryCB({
      finderStore: stores.finderStore,
      routerStore: stores.routerStore,
    }),
  )

  element.addEventListener(
    'copyfileordirectory',
    createCopyFileOrDirectoryCB({
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
