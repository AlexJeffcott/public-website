import { useEffect } from 'preact/hooks'

export function onMount(
  cb: () => (() => void | Promise<() => void>) | void,
): void {
  useEffect(() => cb(), [])
}
