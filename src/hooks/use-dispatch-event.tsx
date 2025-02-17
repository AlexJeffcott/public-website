import { useStableCallback } from '@/hooks/mod.ts'
import { type RefObject } from 'preact'
import { useRef } from 'preact/hooks'

export function useEventDispatcher<E extends HTMLElement, T extends Event>(): [
  RefObject<E>,
  (event: T) => void,
] {
  const ref = useRef<E>(null)

  const dispatch = useStableCallback((event: Event) => {
    if (typeof ref.current?.dispatchEvent === 'function') {
      ref.current.dispatchEvent(event)
    } else {
      console.error('something went wrong when dispatching an event')
    }
  })

  return [ref, dispatch]
}
