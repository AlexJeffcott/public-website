import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'
import { type FSNode, isFSNode } from '@/types/fs.ts'

type Details = {
  cb?: () => void
  sourceFSNode: FSNode
  destinationFSNode: FSNode
  eventType: 'copyfileordirectory'
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    d.eventType === 'copyfileordirectory' &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    isFSNode(d.sourceFSNode) &&
    isFSNode(d.destinationFSNode)
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('copyfileordirectory', { bubbles: true })
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
        'the copyfileordirectory action needs a finderStore and details.',
      )
      return
    }

    action({
      cb: details.cb,
      destinationFSNode: details.destinationFSNode,
      finderStore,
      sourceFSNode: details.sourceFSNode,
    })
  }
}

function action(
  { cb, finderStore, sourceFSNode, destinationFSNode }: {
    finderStore: Stores['finderStore']
    sourceFSNode: Details['sourceFSNode']
    destinationFSNode: Details['destinationFSNode']
    cb: Details['cb']
  },
) {
  finderStore.exists(sourceFSNode).then((sourceExists) => {
    if (sourceExists) {
      finderStore.exists(destinationFSNode).then((destinationExists) => {
        if (destinationExists) {
          throw new Error('destination path already exists')
        } else {
          finderStore.copy(sourceFSNode, destinationFSNode)
          if (typeof cb === 'function') {
            cb()
          }
        }
      })
    } else {
      throw new Error('source path doesn’t exist')
    }
  })
}
