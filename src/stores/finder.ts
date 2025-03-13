import { type Signal, signal } from '@preact/signals'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'
import { type FSNode } from '@/types/fs.ts'
//import { type AsyncSignal, asyncSignal } from '@/utils/async-signal.ts'

export class FinderStore extends BaseStore {
  ls: Signal<FSNode>

  constructor() {
    super('finderStore')
    this.ls = signal<FSNode>({
      name: 'root',
      kind: 'directory',
      path: '',
    })

    this.refreshLs = this.refreshLs.bind(this)
    this.create = this.create.bind(this)
    this.rename = this.rename.bind(this)
    this.copy = this.copy.bind(this)
    this.move = this.move.bind(this)
    this.delete = this.delete.bind(this)
    this.exists = this.exists.bind(this)

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

  create(fsNode: FSNode): void {
    this.exists(fsNode).then((exists) => {
      if (!exists) {
        if (fsNode.kind === 'file') {
          const data =
            `const defaultArr = new Array(999999).fill(undefined).map(i => i)

function run(arr: number[] = defaultArr): number {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
            sum += arr[i]
    }
    return sum;
}`
          fsHandlers.write(fsNode.path, data).then(
            () => {
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
