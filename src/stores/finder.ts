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

const v = '@3.1.0'
const { codeToHtml } = await import(`https://esm.run/shiki${v}`)

export class FinderStore extends BaseStore {
  ls: Signal<FSNode>
  files: ReadonlySignal<Map<string, AsyncSignal<string>>>

  constructor() {
    super('finderStore')
    this.ls = signal<FSNode>({
      name: 'root',
      kind: 'directory',
      path: '',
    })

    this.files = computed(() => {
      const map = new Map<string, AsyncSignal<string>>()
      // it would be cool to sort through and only change the changes
      // in an effect without swapping out the entire map
      function addToMap(fsNode: FSNode) {
        if (fsNode.kind === 'file') {
          const sig = asyncSignal<string>()
          sig.init(() => [
            async () => {
              const txt = await fsHandlers.read(fsNode.path)
              const htmlStr = await codeToHtml(txt, {
                lang: 'typescript',
                theme: 'nord',
              })
              return `<h2>${fsNode.name}</h2>${htmlStr}`
            },
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
