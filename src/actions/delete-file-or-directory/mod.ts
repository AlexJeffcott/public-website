import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'
import { type FSNode, isFSNode } from '@/types/fs.ts'

type Details = {
  cb?: () => void
  fsNode: FSNode
  eventType: 'deletefileordirectory'
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    d.eventType === 'deletefileordirectory' &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    isFSNode(d.fsNode)
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('deletefileordirectory', { bubbles: true })
    this.details = details
  }
}

type CreateCBArgs = Partial<{
  finderStore: Stores['finderStore']
  routerStore: Stores['routerStore']
}>

export function createCB({
  finderStore,
  routerStore,
}: CreateCBArgs): (e: ActionEvent) => void {
  return (e: ActionEvent): void => {
    const details = e.details
    if (!routerStore || !finderStore || !details) {
      handleError(
        'the deletefileordirectory action needs a routerStore and finderStore and details.',
      )
      return
    }
    action({ cb: details.cb, finderStore, routerStore, fsNode: details.fsNode })
  }
}

function action(
  { cb, finderStore, fsNode, routerStore }: {
    finderStore: Stores['finderStore']
    routerStore: Stores['routerStore']
    fsNode: Details['fsNode']
    cb: Details['cb']
  },
) {
  if (isFSNode(fsNode)) {
    finderStore.exists(fsNode).then((exists) => {
      if (exists) {
        finderStore.delete(fsNode)
        routerStore.navigate('/fs')
        if (typeof cb === 'function') {
          cb()
        }
      } else {
        throw new Error('path doesn’t exist')
      }
    })
  } else {
    throw new Error('fsNode doesn’t exist')
  }
}
