import {
  computed,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'
import { type FSNode } from '@/types/fs.ts'
import { type AsyncSignal, asyncSignal } from '@/utils/async-signal.ts'

export class FinderStore extends BaseStore {
  ls: Signal<FSNode>
  currentFileNode: Signal<FSNode | undefined>
  currentFileContent: Signal<string | undefined>
  files: ReadonlySignal<Map<string, AsyncSignal<string>>>

  constructor() {
    super('finderStore')
    this.ls = signal<FSNode>({
      name: 'root',
      kind: 'directory',
      path: '',
    })

    this.currentFileNode = signal<FSNode | undefined>()
    this.currentFileContent = signal<string | undefined>()

    this.files = computed(() => {
      const map = new Map<string, AsyncSignal<string>>()
      // it would be cool to sort through and only change the changes
      // in an effect without swapping out the entire map

      function addToMap(fsNode: FSNode) {
        if (fsNode.kind === 'file') {
          const sig = asyncSignal<string>()
          sig.init(() => [
            () => fsHandlers.read(fsNode.path),
            () => {},
          ])
          map.set(fsNode.path, sig)
        } else if (fsNode.children?.length) {
          for (const child of fsNode.children) {
            addToMap(child)
          }
        }
      }

      addToMap(this.ls.value)
      return map
    })

    this.refreshLs = this.refreshLs.bind(this)
    this.create = this.create.bind(this)
    this.rename = this.rename.bind(this)
    this.copy = this.copy.bind(this)
    this.move = this.move.bind(this)
    this.delete = this.delete.bind(this)
    this.readFile = this.readFile.bind(this)
    this.exists = this.exists.bind(this)

    this.refreshLs()
    this.logger.info('FinderStore initialized')
  }

  refreshLs() {
    fsHandlers.list().then((res) => {
      this.ls.value = res
    })
  }

  readFile(fsNode: FSNode): void {
    fsHandlers.existsFile(fsNode.path).then((exists) => {
      if (exists) {
        fsHandlers.read(fsNode.path).then((res) => {
          this.currentFileContent.value = res
          this.currentFileNode.value = fsNode
        })
      } else {
        console.error('file does not exist at path: ' + fsNode.path)
        this.currentFileNode.value = undefined
        this.currentFileContent.value = undefined
      }
    })
  }

  exists(fsNode: FSNode) {
    if (fsNode.kind === 'file') {
      return fsHandlers.existsFile(fsNode.path)
    } else {
      return fsHandlers.existsDirectory(fsNode.path)
    }
  }

  create(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (!exists) {
        if (fsNode.kind === 'file') {
          const data = 'this is some text content.'
          fsHandlers.write(fsNode.path, data).then(
            () => {
              this.currentFileNode.value = fsNode
              this.currentFileContent.value = data
              this.refreshLs()
            },
          )
        } else {
          fsHandlers.createDirectory(fsNode.path).then(() => this.refreshLs())
        }
      } else {
        // TODO: handle this error in some nice way
        // a toast?
        throw new Error(`${fsNode.kind} already exists at that path`)
      }
    })
  }

  rename(fsNode: FSNode, newName: string): void {
  }

  delete(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (exists) {
        fsHandlers.delete(fsNode.path).then(() => {
          if (fsNode.kind === 'file') {
            if (fsNode.path === this.currentFileNode.peek()?.path) {
              this.currentFileNode.value = undefined
              this.currentFileContent.value = undefined
            }
          } else {
            if (this.currentFileNode.peek()?.path.startsWith(fsNode.path)) {
              this.currentFileNode.value = undefined
              this.currentFileContent.value = undefined
            }
          }
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

  move(sourceFSNode: FSNode, destinationFSNode: FSNode): void {
    fsHandlers.move(sourceFSNode.path, destinationFSNode.path).then(() =>
      setTimeout(() => this.refreshLs(), 100)
    )
  }
}
