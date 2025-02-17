import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'

type Details = {
  cb?: () => void
  eventType: 'toggletheme'
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    d.eventType === 'toggletheme'
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('toggletheme', { bubbles: true })
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
        'the toggletheme action needs a uiStore and details.',
      )
      return
    }
    action({ uiStore })
  }
}

function action({ uiStore }: { uiStore: Stores['uiStore'] }) {
  try {
    uiStore.toggleTheme()
  } catch (err) {
    try {
      handleError(
        `the toggletheme action errored: ${JSON.stringify(err)}`,
      )
    } catch {
      handleError(
        'the toggletheme action errored and was not serializable',
      )
    }
  }
}
