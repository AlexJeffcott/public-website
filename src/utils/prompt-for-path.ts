import { type FSNode } from '@/types/fs.ts'

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

  const name = path?.split('/').pop()

  if (!name) {
    return promptForPath(`Please enter a valid path like "${prefill}"`, path)
  }

  const kind = isFilePath(name) ? 'file' as const : 'directory' as const

  return { name, path, kind }
}
