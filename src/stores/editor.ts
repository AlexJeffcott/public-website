import {
  computed,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { type AsyncSignal, asyncSignal } from '@/utils/async-signal.ts'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'

let lastPath = ''
let createMarkup: ((txt: string, arg: unknown) => Promise<string>) | undefined =
  undefined
const v = '@3.2.1'

if (createMarkup === undefined) {
  const res = await import(`https://esm.run/shiki${v}`)
  createMarkup = res.codeToHtml
}

function getLangByFilePath(path?: string) {
  const ext = path?.split('.').pop() || ''
  switch (ext) {
    case 'ts': {
      return 'typescript'
    }
    case 'js': {
      return 'javascript'
    }
    case 'md': {
      return 'markdown'
    }
    case 'html': {
      return 'html'
    }
    case 'css': {
      return 'css'
    }
    case 'txt': {
      return 'text'
    }
    case 'json': {
      return 'json'
    }
    case 'jsx': {
      return 'jsx'
    }
    case 'tsx': {
      return 'tsx'
    }
    case 'sh': {
      return 'shellscript'
    }
    case 'sql': {
      return 'sql'
    }
    case 'regexp': {
      return 'regexp'
    }
    default: {
      return 'text'
    }
  }
}

export class EditorStore extends BaseStore {
  currentFilePath: Signal<string>
  text: ReadonlySignal<string>
  markup: ReadonlySignal<string>
  current: AsyncSignal<[string, string] | undefined>
  disposes: Set<() => void>

  constructor() {
    super('editorStore')
    this.currentFilePath = signal<string>('')
    this.current = asyncSignal<[string, string] | undefined>()
    this.disposes = new Set()

    this.current.init(() => [
      async (path) => {
        if (typeof path === 'string') {
          const txt = await fsHandlers.read(path)
          const lang = getLangByFilePath(path)
          const markup = createMarkup
            ? await createMarkup(txt, {
              lang,
              themes: { dark: 'min-dark', light: 'min-light' },
            })
            : ''
          return [txt, markup]
        }
        return ['', '']
      },
      () => {},
    ])

    this.text = computed(() => {
      return Array.isArray(this.current?.state?.value)
        ? this.current.state.value[0]
        : ''
    })

    this.markup = computed(() => {
      return Array.isArray(this.current?.state?.value)
        ? this.current.state.value[1]
        : ''
    })

    this.logger.info('editorStore initialised')
  }

  async update(txt: string) {
    const path = this.currentFilePath.value
    // NOTE: write to the file and then fetch
    await fsHandlers.write(path, txt)
    this.current.fetch(path)
  }

  setFilePath(filePath: string) {
    if (lastPath !== filePath) {
      this.currentFilePath.value = filePath
      this.current.fetch(filePath)
      lastPath = filePath
    } else {
      this.currentFilePath.value = lastPath
    }
  }

  set(filePath: string) {
    this.currentFilePath.value = filePath
  }

  clear() {
    this.disposes.forEach((d) => d())
  }
}
