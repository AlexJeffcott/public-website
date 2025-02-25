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

type EditorOptions = {
  language?: string
  theme?: string
  minimap?: { enabled: boolean }
  fontLigatures?: boolean | string
  automaticLayout?: boolean
  lineNumbers?:
    | 'on'
    | 'off'
    | 'relative'
    | 'interval'
    | ((lineNumber: number) => string)
  wordBasedSuggestions?:
    | 'off'
    | 'currentDocument'
    | 'matchingDocuments'
    | 'allDocuments'
  readOnly?: boolean
}

type Editor = {
  updateOptions(newOptions: EditorOptions): void
  setValue(newValue: string): void
  getValue(options?: { preserveBOM: boolean; lineEnding: string }): string
  getOptions(): EditorOptions
}

type EditorCreator = (
  domElement: HTMLElement,
  options?: EditorOptions,
  override?: { [index: string]: any },
) => Editor

type Monaco = {
  CancellationTokenSource: {}
  Emitter: {}
  KeyCode: {}
  KeyMod: {}
  MarkerSeverity: {}
  MarkerTag: {}
  Position: {}
  Range: {}
  Selection: {}
  SelectionDirection: {}
  Token: {}
  Uri: {}
  editor: {
    create: EditorCreator
  }
  languages: {}
}

type MonacoLoader = {
  init: () => Promise<Monaco>
  config: (args: any) => void
}

let monacoLoader: undefined | MonacoLoader = undefined

export class EditorStore extends BaseStore {
  #current: AsyncSignal<Monaco | undefined>
  #editor: Signal<Editor | undefined>
  loading: ReadonlySignal<boolean>
  error: ReadonlySignal<string | undefined>
  ready: ReadonlySignal<boolean>

  constructor() {
    super('editorStore')
    this.#current = asyncSignal<Monaco | undefined>()
    this.#current.init(this.#createLoadHandlers.bind(this))

    this.#editor = signal<Editor | undefined>()

    this.loading = computed(() => this.#current.status.value === 'loading')

    this.error = computed(() => {
      if (this.#current.status.value === 'errored') {
        return this.#current.error.value
      }
    })

    this.ready = computed(() =>
      this.#current.status.value === 'fetched' && !!this.#editor.value
    )

    this.logger.info('EditorStore initialized')
  }

  #createLoadHandlers(): ReturnType<CreateHandlers<Monaco | undefined>> {
    return [
      async () => {
        if (monacoLoader === undefined) {
          monacoLoader = (await import(
            'https://esm.sh/@monaco-editor/loader@1.5.0?target=es2022'
          )).default as MonacoLoader
        }

        if (monacoLoader) {
          const res = await monacoLoader.init()

          if (res) {
            this.logger.info('Monaco editor loaded successfully')
            return res
          }
        }

        this.logger.info('Monaco editor failed to load successfully')

        return undefined
      },
      () => {
        monacoLoader = undefined
      },
    ]
  }

  createEditor(element: HTMLElement) {
    this.#editor.value = this.#current.state.value?.editor.create(element, {
      language: 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      lineNumbers: 'off',
    })

    this.logger.info('Editor instance created')
  }

  setValue(value: string) {
    if (!this.#editor.value) {
      throw new Error('Cant set as Editor is not initialized')
    }
    this.#editor.value.setValue(value)
  }

  getValue(): string {
    if (!this.#editor.value) {
      throw new Error('cant get as Editor is not initialized')
    }
    return this.#editor.value.getValue()
  }

  fetch() {
    this.#current.fetch()
  }
}
