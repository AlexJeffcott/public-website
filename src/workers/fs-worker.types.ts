import { isObject } from '@/types/is-object.ts'
import { type FileSystemItem, isFileSystemItem } from '@/types/fs.ts'

export function isSharedWorkerGlobalScope(
  value: unknown,
): value is SharedWorkerGlobalScope {
  return isObject(value) && 'onconnect' in value
}

type ReadPayload = {
  operation: 'read'
  path: string
}

type WritePayload = {
  operation: 'write'
  path: string
  data: ArrayBuffer | string
}

type DeletePayload = {
  operation: 'delete'
  path: string
}

type ExistsFilePayload = {
  operation: 'existsFile'
  path: string
}

type ExistsDirectoryPayload = {
  operation: 'existsDirectory'
  path: string
}

type ListPayload = {
  operation: 'list'
}

type CopyPayload = {
  operation: 'copy'
  sourcePath: string
  destinationPath: string
}

type CreateDirectoryPayload = {
  operation: 'createDirectory'
  path: string
}

type InitMediaFilePayload = {
  operation: 'mediaFileInit'
  path: string
  name: string
  size: number
  type: string
}

type AddMediaFileChunkPayload = {
  operation: 'mediaFileAddChunk'
  path: string
  data: ArrayBuffer
}

type CompleteMediaFilePayload = {
  operation: 'mediaFileComplete'
  path: string
}

export const isRead = (p: unknown | ReadPayload): p is ReadPayload =>
  isObject(p) && p.operation === 'read' && typeof p.path === 'string'

export const isWrite = (p: unknown | WritePayload): p is WritePayload =>
  isObject(p) && p.operation === 'write' && typeof p.path === 'string' &&
  (p.data instanceof ArrayBuffer || typeof p.data === 'string')

export const isDelete = (p: unknown | DeletePayload): p is DeletePayload =>
  isObject(p) && p.operation === 'delete' && typeof p.path === 'string'

export const isExistsFile = (
  p: unknown | ExistsFilePayload,
): p is ExistsFilePayload =>
  isObject(p) && p.operation === 'existsFile' && typeof p.path === 'string'

export const isExistsDirectory = (
  p: unknown | ExistsDirectoryPayload,
): p is ExistsDirectoryPayload =>
  isObject(p) && p.operation === 'existsDirectory' && typeof p.path === 'string'

export const isList = (p: unknown | ListPayload): p is ListPayload =>
  isObject(p) && p.operation === 'list'

export const isCopy = (p: unknown | CopyPayload): p is CopyPayload =>
  isObject(p) && p.operation === 'copy' && typeof p.sourcePath === 'string' &&
  typeof p.destinationPath === 'string'

export const isCreateDirectory = (
  p: unknown | CreateDirectoryPayload,
): p is CreateDirectoryPayload =>
  isObject(p) && p.operation === 'createDirectory' && typeof p.path === 'string'

export const isMediaFileInit = (
  p: unknown | InitMediaFilePayload,
): p is InitMediaFilePayload =>
  isObject(p) && p.operation === 'mediaFileInit' &&
  typeof p.path === 'string' && typeof p.name === 'string' &&
  typeof p.size === 'number' && typeof p.type === 'string'

export const isMediaFileAddChunk = (
  p: unknown | AddMediaFileChunkPayload,
): p is AddMediaFileChunkPayload =>
  isObject(p) && p.operation === 'mediaFileAddChunk' &&
  typeof p.path === 'string' && p.data instanceof ArrayBuffer

export const isMediaFileComplete = (
  p: unknown | CompleteMediaFilePayload,
): p is CompleteMediaFilePayload =>
  isObject(p) && p.operation === 'mediaFileComplete' &&
  typeof p.path === 'string'
