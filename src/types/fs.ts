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
