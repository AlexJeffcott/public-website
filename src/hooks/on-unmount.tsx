import { useEffect } from 'preact/hooks'
import { useStableCallback } from '@/hooks/mod.ts'

export function onUnmount(cb: () => void): void {
  const stable = useStableCallback(cb)

  useEffect(() => {
    return stable
  }, [])
}
