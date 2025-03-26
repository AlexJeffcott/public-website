import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'
import { type FileSystemItem, type FSNode } from '@/types/fs.ts'
import { wait } from '@/utils/wait.ts'

export class FinderStore extends BaseStore {
  ls: Signal<FSNode>
  importStatus: Signal<{
    inProgress: boolean
    processed: number
    total: number
    errors: string[]
  }>
  importInProgress: ReadonlySignal<boolean>

  constructor() {
    super('finderStore')
    this.ls = signal<FSNode>({
      name: 'root',
      kind: 'directory',
      path: '',
    })

    this.importStatus = signal({
      inProgress: false,
      processed: 0,
      total: 0,
      errors: [],
    })

    this.importInProgress = computed(() => {
      return this.importStatus.value.total > this.importStatus.value.processed
    })

    effect(() => {
      if (this.importInProgress.value) {
        wait(100).then(() => this.refreshLs())
        wait(500).then(() => this.refreshLs())
        wait(1000).then(() => this.refreshLs())
      }
    })

    this.refreshLs = this.refreshLs.bind(this)
    this.create = this.create.bind(this)
    this.copy = this.copy.bind(this)
    this.delete = this.delete.bind(this)
    this.exists = this.exists.bind(this)
    this.processEntry = this.processEntry.bind(this)
    this.importFilesAndDirectories = this.importFilesAndDirectories.bind(this)

    this.refreshLs()
    this.logger.info('FinderStore initialized')
  }

  refreshLs() {
    fsHandlers.list().then((res) => {
      this.ls.value = res
    })
  }

  exists(fsNode: FSNode) {
    if (fsNode.kind === 'file') {
      return fsHandlers.existsFile(fsNode.path)
    } else {
      return fsHandlers.existsDirectory(fsNode.path)
    }
  }

  create(fsNode: FSNode, fsItem?: FileSystemItem): void {
    this.exists(fsNode).then((exists) => {
      if (!exists) {
        if (fsNode.kind === 'file') {
          fsHandlers.write(fsNode.path, fsItem || '').then(async () => {
            await wait(100)
            this.refreshLs()
          })
        } else {
          fsHandlers.createDirectory(fsNode.path).then(async () => {
            await wait(100)
            this.refreshLs()
          })
        }
      } else {
        // TODO: handle this error in some nice way
        // a toast?
        throw new Error(`${fsNode.kind} already exists at that path`)
      }
    })
  }

  delete(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (exists) {
        fsHandlers.delete(fsNode.path).then(() => {
          setTimeout(() => this.refreshLs(), 100)
        })
      } else {
        // TODO: handle this error in some nice way
        // a toast?
        throw new Error(`${fsNode.kind} doesn’t exist at that path`)
      }
    })
  }

  copy(sourceFSNode: FSNode, destinationFSNode: FSNode): void {
    fsHandlers.copy(sourceFSNode.path, destinationFSNode.path).then(() => {
      setTimeout(() => this.refreshLs(), 100)
    })
  }

  async processEntry(
    fsItem: FileSystemItem,
    basePath: string = '',
  ): Promise<void> {
    const path = basePath ? `${basePath}/${fsItem.name}` : fsItem.name

    if (fsItem.isFile) {
      this.importStatus.value = {
        ...this.importStatus.value,
        total: this.importStatus.value.total + 1,
      }

      try {
        const exists = await fsHandlers.existsFile(path)

        if (!exists) {
          await fsHandlers.write(path, fsItem)
        }

        this.importStatus.value = {
          ...this.importStatus.value,
          processed: this.importStatus.value.processed + 1,
        }
      } catch (error) {
        console.error(error)
        this.importStatus.value = {
          ...this.importStatus.value,
          errors: [
            ...this.importStatus.value.errors,
            `Error processing file ${path}: ${error}`,
          ],
        }
      }
    } else if (fsItem.isDirectory) {
      try {
        const exists = await fsHandlers.existsDirectory(path)

        if (!exists) {
          await fsHandlers.createDirectory(path)
        }

        for await (const entry of fsItem.getEntries()) {
          this.processEntry(entry, path)
        }
      } catch (error) {
        this.importStatus.value = {
          ...this.importStatus.value,
          errors: [
            ...this.importStatus.value.errors,
            `Error processing directory ${path}: ${error}`,
          ],
        }
      }
    }
  }

  importFilesAndDirectories(dataTransfer: DataTransfer): void {
    const supportsFileSystemAccessAPI = 'getAsFileSystemHandle' in
      DataTransferItem.prototype
    const supportsWebkitGetAsEntry = 'webkitGetAsEntry' in
      DataTransferItem.prototype

    if (!supportsFileSystemAccessAPI && !supportsWebkitGetAsEntry) {
      console.error('Cannot handle drag and drop')
      return
    }

    this.importStatus.value = {
      inProgress: true,
      processed: 0,
      total: 0,
      errors: [],
    }

    try {
      // NOTE: if you use async code, the contents of dataTransfer becomes unusable!!!
      for (const item of dataTransfer.items) {
        getHandleOrEntry(item).then((handleOrEntry) => {
          if (!handleOrEntry) {
            console.error('blahhhh')
            return
          }

          const fsItem = createFileSystemItem(handleOrEntry)

          this.processEntry(fsItem)
        })
      }
    } catch (error) {
      console.error(error)
      this.importStatus.value = {
        ...this.importStatus.value,
        errors: [...this.importStatus.value.errors, `Import error: ${error}`],
      }
    }
  }
}

/**
 * Adapts either a FileSystemHandle or FileSystemEntry to a standardized FileSystemItem
 */
function createFileSystemItem(
  entry: FileSystemHandle | FileSystemEntry,
): FileSystemItem {
  // Handle FileSystemHandle (modern API)
  if ('kind' in entry) {
    return adaptFileSystemHandle(entry as FileSystemHandle)
  } // Handle FileSystemEntry (legacy API)
  else {
    return adaptFileSystemEntry(entry as FileSystemEntry)
  }
}

function adaptFileSystemHandle(handle: FileSystemHandle): FileSystemItem {
  const isFile = handle.kind === 'file'
  const isDirectory = handle.kind === 'directory'

  return {
    name: handle.name,
    kind: handle.kind,
    isFile,
    isDirectory,
    getFile: async () => {
      if (!isFile) throw new Error('Not a file')
      return await (handle as FileSystemFileHandle).getFile()
    },
    getEntries: async function* () {
      if (!isDirectory) return

      for await (
        const entry of (handle as FileSystemDirectoryHandle).values()
      ) {
        if (!shouldIgnore(entry.name)) {
          yield createFileSystemItem(entry)
        }
      }
    },
  }
}

function adaptFileSystemEntry(entry: FileSystemEntry): FileSystemItem {
  const isFile = entry.isFile
  const isDirectory = entry.isDirectory

  return {
    name: entry.name,
    kind: isFile ? 'file' : 'directory',
    isFile,
    isDirectory,
    getFile: () => {
      return new Promise<File>((resolve, reject) => {
        if (!isFile) {
          reject(new Error('Not a file'))
          return
        }

        ;(entry as FileSystemFileEntry).file(resolve, reject)
      })
    },
    getEntries: async function* () {
      if (!isDirectory) return

      const dirReader = (entry as FileSystemDirectoryEntry).createReader()

      // Helper function to read entries as a promise
      const readEntriesBatch = (): Promise<FileSystemEntry[]> => {
        return new Promise((resolve, reject) => {
          dirReader.readEntries(resolve, reject)
        })
      }

      // Keep reading batches until no more entries
      let batch: FileSystemEntry[]
      do {
        batch = await readEntriesBatch()
        for (const item of batch) {
          if (!shouldIgnore(entry.name)) {
            yield createFileSystemItem(item)
          }
        }
      } while (batch.length > 0)
    },
  }
}

/**
 * Counts all items (files and directories) in a directory handle
 * Uses a non-recursive approach with a queue for better performance
 */
function countItems(fsItem: FileSystemItem) {
  // Reset state
  const count = signal(0)
  const isInProgress = signal(true)
  const error = signal<Error | null>(null)

  const { promise, resolve, reject } = Promise.withResolvers<number>()

  async function doCount() {
    if (shouldIgnore(fsItem.name)) {
      return
    }

    if (fsItem.isFile) {
      count.value = 1
      return
    }

    // Use a queue for breadth-first traversal to avoid recursion stack limits
    const queue = [fsItem]
    let cnt = 0

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current) {
        continue
      }
      // Use for-await to process entries without loading all into memory at once
      for await (const entry of current.getEntries()) {
        if (shouldIgnore(entry.name)) {
          continue
        }

        cnt++

        // Update signal periodically (not on every item to reduce UI updates)
        if (cnt % 100 === 0) {
          count.value = cnt
        }

        // If directory, add to queue for processing
        if (entry.isDirectory) {
          queue.push(entry)
        }
      }
    }

    // Final update
    count.value = cnt
    resolve(cnt)
  }

  doCount()
    .catch((e: Error) => {
      error.value = e instanceof Error ? e : new Error(String(e))
      reject()
    })
    .finally(() => isInProgress.value = false)

  return { count, isInProgress, error, promise }
}

/**
 * Gets a FileSystemHandle or FileSystemEntry from a DataTransferItem
 * based on browser support.
 */
export async function getHandleOrEntry(
  item: DataTransferItem,
): Promise<FileSystemHandle | FileSystemEntry | null> {
  // Try the modern File System Access API first
  if ('getAsFileSystemHandle' in item) {
    try {
      return await (item as any).getAsFileSystemHandle()
    } catch (error) {
      console.error('Error getting FileSystemHandle:', error)
    }
  }

  // Fall back to the older API
  if ('webkitGetAsEntry' in item) {
    return (item as any).webkitGetAsEntry()
  }

  return null
}

const ignoreList = ['.DS_Store']

function shouldIgnore(filename: string) {
  return ignoreList.includes(filename)
}
