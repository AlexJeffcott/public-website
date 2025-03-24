import { isObject } from '@/types/is-object.ts'

export type FSNode = {
  name: string
  kind: 'file' | 'directory'
  path: string
  children?: FSNode[]
}

export function isFSNode(fsNode: FSNode | unknown): fsNode is FSNode {
  return isObject(fsNode) &&
    typeof fsNode.name === 'string' &&
    typeof fsNode.path === 'string' &&
    (fsNode.kind === 'file' || fsNode.kind === 'directory') &&
    (fsNode.children === undefined ||
      (Array.isArray(fsNode.children) && fsNode.children.every(isFSNode)))
}

export type FileSystemItem = {
  name: string
  kind: 'file' | 'directory'
  isFile: boolean
  isDirectory: boolean
  getFile: () => Promise<File>
  getEntries: () => AsyncIterable<FileSystemItem>
}

export function isFileSystemItem(value: unknown): value is FileSystemItem {
  if (!value || typeof value !== 'object') return false

  const item = value as Partial<FileSystemItem>

  // Check name property
  if (typeof item.name !== 'string') return false

  // Check kind property
  if (item.kind !== 'file' && item.kind !== 'directory') return false

  // Check boolean flags
  if (typeof item.isFile !== 'boolean') return false
  if (typeof item.isDirectory !== 'boolean') return false

  // Check method signatures
  if (typeof item.getFile !== 'function') return false
  if (typeof item.getEntries !== 'function') return false

  // Validate that the kind and boolean flags are consistent
  if (
    (item.kind === 'file' && !item.isFile) ||
    (item.kind === 'directory' && !item.isDirectory) ||
    (item.isFile && item.isDirectory)
  ) {
    return false
  }

  // We can't fully validate the return types of functions at runtime,
  // but we can check if they appear to have the right structure

  // Note: This is the best we can do at runtime without actually calling the functions

  return true
}
