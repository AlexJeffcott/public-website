import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'

type Details = {
  cb?: () => void
  color: string
  eventType: 'setcolortheme'
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    typeof d.color === 'string' &&
    d.eventType === 'setcolortheme'
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('setcolortheme', { bubbles: true })
    this.details = details
  }
}

type CreateCBArgs = Partial<{
  uiStore: Stores['uiStore']
}>

export function createCB({
  uiStore,
}: CreateCBArgs): (e: ActionEvent) => void {
  return (e: ActionEvent): void => {
    const details = e.details
    if (!uiStore || !details) {
      handleError(
        'the setcolortheme action needs a uiStore and details.',
      )
      return
    }
    action({ uiStore, color: details.color })
  }
}

function action(
  { uiStore, color }: { color: string; uiStore: Stores['uiStore'] },
) {
  try {
    uiStore.setColorTheme(color)
  } catch (err) {
    try {
      handleError(
        `the setcolortheme action errored: ${JSON.stringify(err)}`,
      )
    } catch {
      handleError(
        'the setcolortheme action errored and was not serializable',
      )
    }
  }
}
