import {
  computed,
  effect,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import { type AsyncSignal, asyncSignal } from '@/utils/async-signal.ts'
import { BaseStore } from '@/stores/base.ts'
import { fsHandlers } from '@/broadcast/main.ts'

let lastPath = ''
let lastText = ''
let createMarkup: ((txt: string, arg: unknown) => Promise<string>) | undefined =
  undefined
const v = '@3.1.0'

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
      return 'typescript'
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
  markup: Signal<string>
  current: AsyncSignal<string | undefined>
  disposes: Set<() => void>

  constructor() {
    super('editorStore')
    this.currentFilePath = signal<string>('')
    this.markup = signal<string>('')
    this.current = asyncSignal<string | undefined>()
    this.disposes = new Set()

    this.current.init(() => [
      async (path) => {
        if (typeof path === 'string') {
          const txt = await fsHandlers.read(path)
          return txt
        }
        return ''
      },
      () => {},
    ])

    this.disposes.add(effect(() => {
      const path = this.currentFilePath.value
      if (lastPath !== path) {
        // NOTE: when the filePath changes fetch that file
        lastPath = path
        this.current.fetch(path)
      }
    }))

    this.text = computed(() => {
      const text = this.current.state.value || ''
      if (text !== lastText) {
        lastText = text
      }
      return lastText
    })

    this.disposes.add(effect(() => {
      const text = this.text.value
      if (text && createMarkup) {
        this.markup.value = ''
        createMarkup(text, {
          lang: getLangByFilePath(this.currentFilePath.value),
          themes: { dark: 'min-dark', light: 'min-light' },
        }).then((htmlStr: string) => {
          this.markup.value = htmlStr
        })
      }
    }))

    this.logger.info('editorStore initialised')
  }

  async update(txt: string) {
    const path = this.currentFilePath.value
    // NOTE: write to the file and then fetch
    await fsHandlers.write(this.currentFilePath.peek(), txt)
    this.current.fetch(path)
  }

  setFilePath(filePath: string) {
    this.currentFilePath.value = filePath
  }

  set(filePath: string) {
    this.currentFilePath.value = filePath
  }

  clear() {
    this.disposes.forEach((d) => d())
  }
}
