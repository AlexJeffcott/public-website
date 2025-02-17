import { useRef } from 'preact/hooks'

// deno-lint-ignore ban-types
export function useStableCallback<T extends Function>(cb: T): T {
  const ref = useRef<T>(cb)
  return ref.current
}
