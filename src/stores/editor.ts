import {
  computed,
  type ReadonlySignal,
  type Signal,
  signal,
} from '@preact/signals'
import {
  type AsyncSignal,
  asyncSignal,
  type CreateHandlers,
} from '@/utils/async-signal.ts'
import { BaseStore } from '@/stores/base.ts'

type Editor = {
  setValue: (arg: string) => void
  getValue: () => string
}

type Monaco = {
  create: (domElement: HTMLElement, options?: any) => Editor
}

type MonacoLoader = {
  init: () => { cancel: () => void }
  config: (args: any) => void
}

export class EditorStore extends BaseStore {
  current: AsyncSignal<Monaco>
  editor: Signal<Editor | undefined>

  monaco: ReadonlySignal<Monaco | undefined>
  loading: ReadonlySignal<boolean>
  error: ReadonlySignal<string | undefined>
  ready: ReadonlySignal<boolean>

  constructor() {
    super('editorStore')
    this.current = asyncSignal<Monaco>()
    this.current.init(this.#createLoadHandlers.bind(this))
    this.editor = signal<Editor | undefined>(undefined)

    this.monaco = computed(() => {
      if (this.current.status.value === 'fetched') {
        return this.current.state.value
      }
    })

    this.loading = computed(() => this.current.status.value === 'loading')

    this.error = computed(() => {
      if (this.current.status.value === 'errored') {
        return this.current.error.value
      }
    })

    this.ready = computed(() =>
      this.current.status.value === 'fetched' && !!this.monaco.value
    )

    this.logger.info('EditorStore initialized')
  }

  #createLoadHandlers(): ReturnType<CreateHandlers<Monaco>> {
    let dispose: (() => void) | undefined
    return [
      async (): Promise<Monaco> => {
        const loader = await import(
          'https://esm.sh/@monaco-editor/loader@1.5.0?target=es2022'
        ) as { default: MonacoLoader }
        dispose = loader.default.init().cancel

        const res = await loader.default.init()
        if (!res.editor) {
          throw new Error('Failed to initialize Monaco editor')
        }

        this.logger.info('Monaco editor loaded successfully')
        return res.editor
      },
      (): void => {
        dispose && dispose()
      },
    ]
  }

  createEditor(element: HTMLElement) {
    if (!this.monaco.value) {
      throw new Error('Monaco is not initialized')
    }

    this.editor.value = this.monaco.value.create(element, {
      language: 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      lineNumbers: 'off',
    })

    this.logger.info('Editor instance created')
  }

  setValue(value: string) {
    if (!this.editor.value) {
      throw new Error('Editor is not initialized')
    }
    this.editor.value.setValue(value)
  }

  getValue(): string {
    if (!this.editor.value) {
      throw new Error('Editor is not initialized')
    }
    return this.editor.value.getValue()
  }
}
