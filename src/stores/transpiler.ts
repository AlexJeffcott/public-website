import { computed, type ReadonlySignal } from '@preact/signals'
import {
  type AsyncSignal,
  asyncSignal,
  type CreateHandlers,
} from '@/utils/async-signal.ts'
import { BaseStore } from '@/stores/base.ts'
import esbuildWasm from 'npm:esbuild-wasm@0.25.0/lib/main.d.ts'

type ESBuild = {
  initialize: typeof esbuildWasm.initialize
  transform: typeof esbuildWasm.transform
}

export class TranspilerStore extends BaseStore {
  current: AsyncSignal<ESBuild>

  esbuild: ReadonlySignal<ESBuild | undefined>
  loading: ReadonlySignal<boolean>
  error: ReadonlySignal<string | undefined>
  ready: ReadonlySignal<boolean>

  constructor() {
    super('transpilerStore')
    this.current = asyncSignal<ESBuild>()
    this.current.init(this.#createLoadHandlers.bind(this))

    this.esbuild = computed(() => {
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
      this.current.status.value === 'fetched' && !!this.esbuild.value
    )

    this.logger.info('TranspilerStore initialized')
  }

  #createLoadHandlers(): ReturnType<CreateHandlers<ESBuild>> {
    return [
      async (): Promise<ESBuild> => {
        const esbuild = await import(
          'https://unpkg.com/esbuild-wasm@0.25.0/esm/browser.min.js'
        )

        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.0/esbuild.wasm',
        })

        this.logger.info('ESBuild initialized successfully')
        return esbuild
      },
      (): void => {
        // No cleanup needed for esbuild
      },
    ]
  }

  async transform(
    code: string,
    options: { loader: 'ts'; target: string } = {
      loader: 'ts',
      target: 'chrome130',
    },
  ) {
    if (!this.esbuild.value) {
      throw new Error('ESBuild is not initialized')
    }

    try {
      const result = await this.esbuild.value.transform(code, options)
      return result.code
    } catch (error) {
      this.logger.error('Transform failed', { error })
      throw error
    }
  }
}
