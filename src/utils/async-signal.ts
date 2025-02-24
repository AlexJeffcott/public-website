import { type Signal, signal } from '@preact/signals'

type Status = 'initial' | 'loading' | 'errored' | 'fetched' | 'cancelled'

export type CreateHandlers<T> = () => [() => Promise<T>, () => void]

type Logs<T> = Array<T | string>

export type AsyncSignal<T> = {
  status: Signal<Status>
  state: Signal<T | undefined>
  error: Signal<string | undefined>
  count: Signal<number>
  cancel: () => void
  fetch: () => void
  reset: () => void
  init: (createHandlers: CreateHandlers<T>) => void
  getLogs: () => Logs<T>
}

export function asyncSignal<T>() {
  let cb: (() => Promise<T>) | undefined = undefined
  let cancellationHandler: (() => void) | undefined = undefined
  let logs: Array<T | string> = []

  const status = signal<Status>('initial')
  const state = signal<T>()
  const error = signal<string>()
  const count = signal(0)

  const getLogs = (): Logs<T> => logs

  const init = (createHandlers: CreateHandlers<T>): void => {
    const handlers = createHandlers()
    cb = handlers[0]
    cancellationHandler = handlers[1]
  }

  const cancel = (): void => {
    status.value = 'cancelled'
    cancellationHandler && cancellationHandler()
    logs.push('Operation cancelled')
  }

  const fetch = (): void => {
    count.value++
    if (status.peek() !== 'loading') {
      if (cb === undefined) {
        status.value = 'errored'
        error.value = 'Expected cb but was undefined'
        logs.push('Expected cb but was undefined')
        return
      }

      status.value = 'loading'

      cb()
        .then((res) => {
          status.value = 'fetched'
          state.value = res
          logs.push(res)
        })
        .catch((err) => {
          if (err.name === 'AbortError') {
            status.value = 'cancelled'
            error.value = 'fetch aborted'
            logs.push('fetch aborted')
          } else {
            status.value = 'errored'
            error.value = 'something went wrong'
            logs.push(err)
          }
        })
    }
  }

  const reset = (): void => {
    // do I need to refresh the controller?
    cancel()
    state.value = undefined
    error.value = undefined
    status.value = 'initial'
    count.value = 0
    cb = undefined
    cancellationHandler = undefined
    logs = []
  }

  return {
    status,
    state,
    cancel,
    error,
    fetch,
    count,
    init,
    reset,
    getLogs,
  }
}
