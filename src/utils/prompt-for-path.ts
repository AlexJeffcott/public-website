import { type FSNode } from '@/types/mod.ts'

function isFilePath(path: string): boolean {
  const hasExtension = /\.[^/\\]+$/.test(path)
  const noTrailingSlash = !path.endsWith('/') && !path.endsWith('\\')
  return hasExtension && noTrailingSlash
}

export function promptForPath(
  msg = 'enter path for file',
  prefill = 'my-folder/my-file.txt',
): FSNode | undefined {
  const path = globalThis.prompt(msg, prefill)
  if (path === null) {
    return
  }

  if (!path) {
    return promptForPath(`Please enter a valid path like "${prefill}"`, '')
  }

  const { name, kind } = createFSNodeFromPath(path) || {}

  if (!name || !kind) {
    return promptForPath(`Please enter a valid path like "${prefill}"`, path)
  }

  return { name, path, kind }
}

export function createFSNodeFromPath(path: string) {
  const name = path?.split('/').pop()
  if (name) {
    const kind = isFilePath(name) ? 'file' as const : 'directory' as const
    return { name, kind, path }
  }
}
