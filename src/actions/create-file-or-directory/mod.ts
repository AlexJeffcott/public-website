import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'
import { type FSNode, isFSNode } from '@/types/fs.ts'

type Details = {
  cb?: () => void
  newFSNode: FSNode
  eventType: 'createfileordirectory'
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    d.eventType === 'createfileordirectory' &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    isFSNode(d.newFSNode)
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('createfileordirectory', { bubbles: true })
    this.details = details
  }
}

type CreateCBArgs = Partial<{
  finderStore: Stores['finderStore']
}>

export function createCB({
  finderStore,
}: CreateCBArgs): (e: ActionEvent) => void {
  return (e: ActionEvent): void => {
    const details = e.details
    if (!finderStore || !details) {
      handleError(
        'the createfileordirectory action needs a finderStore and details.',
      )
      return
    }

    action({ cb: details.cb, finderStore, newFSNode: details.newFSNode })
  }
}

function action(
  { cb, finderStore, newFSNode }: {
    finderStore: Stores['finderStore']
    newFSNode: Details['newFSNode']
    cb: Details['cb']
  },
) {
  finderStore.exists(newFSNode).then((exists) => {
    if (exists) {
      throw new Error('path already exists')
    } else {
      finderStore.create(newFSNode)
      if (typeof cb === 'function') {
        cb()
      }
    }
  })
}
