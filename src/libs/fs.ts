import { type FSNode } from '@/types/fs.ts'

/**
 * Type guard to check if a handle is a FileSystemDirectoryHandle
 * @param handle The handle to check
 * @returns True if the handle is a FileSystemDirectoryHandle
 */
function isDirectoryHandle(
  handle: FileSystemHandle,
): handle is FileSystemDirectoryHandle {
  return handle.kind === 'directory'
}

/**
 * Type guard to check if a handle is a FileSystemFileHandle
 * @param handle The handle to check
 * @returns True if the handle is a FileSystemFileHandle
 */
function isFileHandle(
  handle: FileSystemHandle,
): handle is FileSystemFileHandle {
  return handle.kind === 'file'
}

interface FileSystemAdapter {
  write(path: string, data: ArrayBuffer | string): Promise<void>
  read(path: string): Promise<File | undefined>
  delete(path: string): Promise<void>
  existsFile(path: string): Promise<boolean>
  existsDirectory(path: string): Promise<boolean>
  list(): Promise<FSNode>
  move(oldPath: string, newPath: string): Promise<void>
  copy(sourcePath: string, destinationPath: string): Promise<void>
  createDirectory(path: string): Promise<void>
}

class OPFSAdapter implements FileSystemAdapter {
  private root?: FileSystemDirectoryHandle

  constructor() {
    this.initialize()
  }

  private async initialize() {
    this.root = await navigator.storage.getDirectory()
  }

  async write(path: string, data: ArrayBuffer | string): Promise<void> {
    // I need to find a way to handle fileName collisions
    // how do I know whether I should create a new file with a modified name,
    // or edit the file?
    const parts = path.split('/').filter((part) => part.length > 0)
    const fileName = parts.pop()

    if (typeof fileName === 'string') {
      await navigator.storage.getDirectory().then(
        async (rootDirHandle) => {
          let handle = rootDirHandle
          for await (const dirName of parts) {
            handle = await this.getDirectoryHandle(handle, dirName, true)
          }

          const fileHandle = await handle.getFileHandle(fileName, {
            create: true,
          })

          if (fileHandle) {
            const writable = await fileHandle.createWritable()
            await writable.write(data)
            fileHandle
            await writable.close()
          }
        },
      ).catch((err) => console.error('getting OPFS root dir failed: ' + err))
    }
  }

  async read(path: string): Promise<File | undefined> {
    const parts = path.split('/').filter((part) => part.length > 0)
    const filename = parts.pop()

    let file = undefined

    if (typeof filename === 'string') {
      try {
        await navigator.storage.getDirectory().then(
          async (rootDirHandle) => {
            let handle = rootDirHandle
            for await (const dirName of parts) {
              handle = await this.getDirectoryHandle(handle, dirName, false)
            }

            const fileHandle = await handle.getFileHandle(filename, {
              create: false,
            })
            if (fileHandle) {
              file = await fileHandle.getFile()
            }
          },
        )
      } catch (err) {
        console.error('read error' + err)
      }
    }

    return file
  }

  async delete(path: string): Promise<void> {
    const parts = path.split('/').filter((part) => part.length > 0)
    const last = parts.pop()
    if (typeof last === 'string') {
      await navigator.storage.getDirectory().then(
        async (rootDirHandle) => {
          let handle = rootDirHandle
          for await (const dirName of parts) {
            handle = await this.getDirectoryHandle(handle, dirName, false)
          }

          handle.removeEntry(last, { recursive: handle.kind === 'directory' })
        },
      ).catch((err) => console.error('getting OPFS root dir failed: ' + err))
    }
  }

  async existsFile(path: string): Promise<boolean> {
    const parts = path.split('/').filter((part) => part.length > 0)
    const fileName = parts.pop()
    let exists = false
    if (typeof fileName === 'string') {
      try {
        await navigator.storage.getDirectory().then(
          async (rootDirHandle) => {
            let handle = rootDirHandle
            for await (const dirName of parts) {
              handle = await this.getDirectoryHandle(handle, dirName, false)
            }

            await handle.getFileHandle(fileName, { create: false })

            exists = true
          },
        )
      } catch (err) {
        exists = false
      }
    }
    return exists
  }

  async existsDirectory(path: string): Promise<boolean> {
    const parts = path.split('/').filter((part) => part.length > 0)
    let exists = false

    try {
      await navigator.storage.getDirectory().then(
        async (rootDirHandle) => {
          let handle = rootDirHandle
          for await (const dirName of parts) {
            handle = await this.getDirectoryHandle(handle, dirName, false)
          }

          exists = handle.kind === 'directory'
        },
      )
    } catch (err) {
      exists = false
    }
    return exists
  }

  async list(): Promise<FSNode> {
    return await navigator.storage.getDirectory().then(async (root) => {
      return await traverseDirectory(root, '')
    })
  }

  async move(oldPath: string, newPath: string): Promise<void> {
    await this.copy(oldPath, newPath)
    await this.delete(oldPath)
  }

  async copy(sourcePath: string, destPath: string): Promise<void> {
    const sourceFileExists = await this.existsFile(sourcePath)

    if (sourceFileExists) {
      const destinationExists = await this.existsFile(destPath)
      if (destinationExists) {
        // abort
        return
      } else {
        // copy file and end
        const file = await this.read(sourcePath)
        const data = await file?.arrayBuffer()
        if (data) {
          return this.write(destPath, data)
        }
      }
    } else {
      // if the sourceFile doesn't exist, try with a directory
      const sourceDirectoryExists = await this.existsDirectory(sourcePath)
      if (sourceDirectoryExists) {
        // determine the part of the sourcePath that is replaced with the destination path
        const [s, d] = getPathTransformation(sourcePath, destPath)

        const sourceHandle = await this.getLastDirectoryHandle(
          sourcePath,
        )

        if (sourceHandle) {
          traverseDirectoryWithFileSideEffect(
            sourceHandle,
            sourcePath,
            (handle: FileSystemFileHandle) => {
              handle.getFile().then((file) =>
                file.arrayBuffer().then((data) => {
                  this.write(
                    (sourcePath + '/' + handle.name).replace(s, d),
                    data,
                  )
                })
              )
            },
          )
        }
      } else {
        // no source no fun
        return
      }
    }
  }

  private getDirectoryHandle(
    dirHandle: FileSystemDirectoryHandle,
    dirName: string,
    create: boolean,
  ) {
    return dirHandle.getDirectoryHandle(dirName, { create })
  }

  async getLastDirectoryHandle(
    path: string,
  ): Promise<FileSystemDirectoryHandle | void> {
    const parts = path.split('/').filter((part) => part.length > 0)

    return await navigator.storage.getDirectory().then(
      async (rootDirHandle) => {
        let handle = rootDirHandle
        for await (const dirName of parts) {
          handle = await this.getDirectoryHandle(handle, dirName, false)
        }
        return handle
      },
    ).catch((err) => console.error('getting OPFS root dir failed: ' + err))
  }

  async createDirectory(path: string): Promise<void> {
    const parts = path.split('/').filter((part) => part.length > 0)

    return await navigator.storage.getDirectory().then(
      async (rootDirHandle) => {
        let handle = rootDirHandle
        for await (const dirName of parts) {
          handle = await this.getDirectoryHandle(handle, dirName, true)
        }
      },
    ).catch((err) => console.error('getting OPFS root dir failed: ' + err))
  }
}

export class FileSystem {
  private adapter: FileSystemAdapter

  constructor(_adapter?: 'opfs') {
    //this.adapter = adapter === 'opfs' ? new OPFSAdapter() : undefined
    this.adapter = new OPFSAdapter()
  }

  async write(
    path: string,
    data: ArrayBuffer | string,
  ): Promise<void> {
    await this.adapter.write(path, data)
  }

  async read(path: string): Promise<File | undefined> {
    return await this.adapter.read(path)
  }

  async delete(path: string): Promise<void> {
    await this.adapter.delete(path)
  }

  async existsFile(path: string): Promise<boolean> {
    return await this.adapter.existsFile(path)
  }

  async existsDirectory(path: string): Promise<boolean> {
    return await this.adapter.existsDirectory(path)
  }

  async list(): Promise<FSNode> {
    return await this.adapter.list()
  }

  async move(oldPath: string, newPath: string): Promise<void> {
    await this.adapter.move(oldPath, newPath)
  }

  async copy(
    sourcePath: string,
    destinationPath: string,
  ): Promise<void> {
    await this.adapter.copy(sourcePath, destinationPath)
  }

  async createDirectory(path: string): Promise<void> {
    await this.adapter.createDirectory(path)
  }
}

async function traverseDirectoryWithFileSideEffect(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
  sideEffect: (handle: FileSystemFileHandle) => void,
): Promise<void> {
  for await (const [name, handle] of dirHandle.entries()) {
    const entryPath = path ? `${path}/${name}` : name

    if (isFileHandle(handle)) {
      sideEffect(handle)
    } else if (isDirectoryHandle(handle)) {
      await traverseDirectoryWithFileSideEffect(handle, entryPath, sideEffect)
    }
  }
}

async function traverseDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string,
): Promise<FSNode> {
  const children: FSNode[] = []

  for await (const [name, handle] of dirHandle.entries()) {
    const entryPath = path ? `${path}/${name}` : name

    if (isFileHandle(handle)) {
      children.push({
        name,
        kind: 'file',
        path: entryPath,
      })
    } else if (isDirectoryHandle(handle)) {
      const subDir = await traverseDirectory(handle, entryPath)
      children.push(subDir)
    }
  }

  // Sort children directory first and alphabetically
  children.sort((a, b) => {
    if (a.kind === b.kind) {
      return a.name.localeCompare(b.name)
    }
    return a.kind === 'directory' ? -1 : 1
  })

  return {
    name: path.split('/').pop() || 'root',
    kind: 'directory',
    path,
    children,
  }
}

/**
 * Calculates the path transformation needed to convert from sourcePath to destPath
 * @param sourcePath The original file path
 * @param destPath The target file path
 * @returns A tuple containing [partToReplace, replacementPart]
 */
export function getPathTransformation(
  sourcePath: string,
  destPath: string,
): [string, string] {
  let commonPrefixLength = 0
  const minLength = Math.min(sourcePath.length, destPath.length)

  for (let i = 0; i < minLength; i++) {
    if (sourcePath[i] !== destPath[i]) {
      break
    }
    commonPrefixLength++
  }

  while (
    commonPrefixLength > 0 &&
    sourcePath[commonPrefixLength - 1] !== '/'
  ) {
    commonPrefixLength--
  }

  const partToReplace = sourcePath.slice(commonPrefixLength)
  const replacementPart = destPath.slice(commonPrefixLength)

  return [partToReplace, replacementPart]
}
