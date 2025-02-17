import { isObject } from '@/types/is-object.ts'
import { handleError } from '@/actions/handle-error.ts'
import { type Stores } from '@/stores/mod.ts'

type Details = {
  cb?: () => void
  eventType: 'navigate'
  to: string
}

export function isDetails(
  d: Details | unknown,
): d is Details {
  return (
    isObject(d) &&
    (d.cb === undefined || typeof d.cb === 'function') &&
    d.eventType === 'navigate' &&
    typeof d.to === 'string'
  )
}

export class ActionEvent extends Event {
  details?: Details
  constructor(details: Details) {
    super('navigate', { bubbles: true })
    this.details = details
  }
}

type CreateCBArgs = Partial<{
  routerStore: Stores['routerStore']
}>

export function createCB({
  routerStore,
}: CreateCBArgs): (e: ActionEvent) => void {
  return (e: ActionEvent): void => {
    const details = e.details
    if (!routerStore || !details) {
      handleError(
        'the navigate action needs a routerStore and details.',
      )
      return
    }
    action({ routerStore, to: details.to })
  }
}

function action(
  { routerStore, to }: { routerStore: Stores['routerStore']; to: string },
) {
  try {
    routerStore.navigate(to)
  } catch (err) {
    try {
      handleError(
        `the navigate action errored: ${JSON.stringify(err)}`,
      )
    } catch {
      handleError(
        'the navigate action errored and was not serializable',
      )
    }
  }
}
