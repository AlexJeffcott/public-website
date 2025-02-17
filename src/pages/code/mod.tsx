import { type FunctionComponent } from 'preact'
import classes from '@/pages/code/code.module.css'
import {
  NavigateToHomeBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'
import { effect, signal, useComputed, useSignal } from '@preact/signals'
import { onMount, useStableCallback } from '@/hooks/mod.ts'
import { runBenchmarkSuite } from './benchmark.ts'
import { runTestSuite } from './test-runner.ts'

const monacoStatus = signal<'initial' | 'loading' | 'ready' | 'complete'>(
  'initial',
)

type Editor = {
  setValue: (arg: string) => void
  getValue: () => string
}

type Monaco = {
  create: (domElement: HTMLElement, options?: any) => Editor
}

const editor = signal<Editor | undefined>()
const monaco = signal<Monaco | undefined>()
const dispose = signal<(() => void) | undefined>()
const configure = signal<((args: any) => void) | undefined>()
const cancelable = signal<
  Promise<
    {
      cancel?: () => void
      editor?: Monaco
    }
  > | undefined
>()

const currentFileName = signal<string>('script.ts')

const defaultRunFunction =
  `const defaultArr = new Array(999999).fill(undefined).map(i => i)

function run(arr: number[] = defaultArr): number {
    let sum = 0
    for (let i = 0; i < arr.length; i++) {
            sum += arr[i]
    }
    return sum;
}`

const defaultTestFunction =
  `await test('run function should sum arr items', () => {
    const arr = [0, 1, 2]
    const result = run(arr);
    if (result !== 3) {
        throw new Error("Expected '3' but got '" + result + "'");
    }
});

await test('run function should return a number', () => {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const result = run(arr);
    if (typeof result !== 'number') {
        throw new Error("Expected number but got '" + typeof result + "'");
    }
});
`

const currentProject = signal<
  Record<string, string>
>({
  'script.ts': defaultRunFunction,
  'script.test.ts': defaultTestFunction,
})

effect(() => {
  if (
    monacoStatus.value === 'ready' && monaco.value
  ) {
    const el = document.querySelector('#editor') as HTMLElement
    if (el) {
      editor.value = monaco.value.create(el, {
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        automaticLayout: true,
        lineNumbers: 'off',
      })

      monacoStatus.value = 'complete'
    }
  }
})

effect(() => {
  const ed = editor.value
  ed?.setValue(currentProject.value[currentFileName.value])
})

function MultiTabEditor() {
  const showTestResults = useSignal<boolean>(false)
  const testResults = useSignal<string | undefined>()
  const benchmarkResults = useSignal<string | undefined>()
  const fileNames = useComputed<string[]>(() =>
    Object.keys(currentProject.value)
  )

  onMount(() => {
    if (monacoStatus.value === 'initial') {
      monacoStatus.value = 'loading'
      import(
        'https://esm.sh/@monaco-editor/loader@1.5.0?target=es2022'
      ).then((loader) => {
        dispose.value = loader.default.init().cancel
        configure.value = loader.default.config

        cancelable.value = loader.default.init()
        cancelable.value?.then((res) => {
          monaco.value = res.editor
          monacoStatus.value = 'ready'
        })
      }).catch((err) => {
        monacoStatus.value = 'initial'
      })
    }
  })

  const runBenchmark = useStableCallback(async () => {
    if (esbuild.value && editor.value) {
      currentProject.value[currentFileName.value] = editor.value?.getValue() ||
        ''

      try {
        const runCode =
          (await esbuild.value.transform(currentProject.value['script.ts'], {
            loader: 'ts',
            target: 'chrome130',
          })).code
        const fn = new Function(runCode + '\nreturn run;')()

        const result = await runBenchmarkSuite(fn)
        benchmarkResults.value = result.success ? result.results : result.error
      } catch (error) {
        benchmarkResults.value = `Error: ${
          error instanceof Error && error.message
        }`
      }
      showTestResults.value = false
    }
  })

  const runTest = useStableCallback(async () => {
    if (editor.value && esbuild.value) {
      currentProject.value[currentFileName.value] = editor.value?.getValue() ||
        ''

      try {
        const runCode =
          (await esbuild.value.transform(currentProject.value['script.ts'], {
            loader: 'ts',
            target: 'chrome130',
          })).code
        const testCode = (await esbuild.value.transform(
          currentProject.value['script.test.ts'],
          {
            loader: 'ts',
            target: 'chrome130',
          },
        )).code

        const moduleCode = `return async function() {
    const results = { passed: 0, failed: 0, total: 0, details: [] }
    async function test(name, fn) {
        try {
            await fn()
	    results.passed++
	    results.details.push({ name, status: 'passed' })
        } catch (error) {
	    results.failed++
	    results.details.push({
		name,
		status: 'failed',
		error: error instanceof Error
			? error.message
			: '',
	    })
        }
        results.total++
    }

    ${runCode}

    ${testCode}
return results;
}
`

        const testMod = new Function(moduleCode)()
        const result = await runTestSuite(testMod)
        testResults.value = result.success ? result.results : result.error
      } catch (error) {
        testResults.value = `Error: ${error instanceof Error && error.message}`
      }

      showTestResults.value = true
    }
  })

  return (
    <>
      {fileNames.value.map((fileName: string) => (
        <button
          key={fileName}
          disabled={fileName ===
            currentFileName.value}
          onClick={() => {
            currentProject.value[currentFileName.value] =
              editor.value?.getValue() || ''
            currentFileName.value = fileName
          }}
        >
          {fileName}
        </button>
      ))}
      <div
        id='editor'
        style='height: 45vh; overflow: hidden; border-radius: 5px; padding-top: 8px; margin-bottom: 16px; background: var(--vscode-editor-background, #1e1e1e);'
      >
      </div>

      <button onClick={runBenchmark}>run benchmark</button>
      <button onClick={runTest}>run tests</button>
      <div style='height: 20vh; overflow: hidden; border-radius: 5px; padding: 16px; background: var(--vscode-editor-background, #1e1e1e);color: white;'>
        {showTestResults.value
          ? (
            <TestResults>
              {testResults.value?.split('\n').map((i) => <div>{i}</div>)}
            </TestResults>
          )
          : (
            <BenchmarkResults>
              {benchmarkResults.value?.split('\n').map((i) => <div>{i}</div>)}
            </BenchmarkResults>
          )}
      </div>
    </>
  )
}

import esbuildWasm from 'npm:esbuild-wasm@0.24.2/lib/main.d.ts'

type OnLoadArgs = esbuildWasm.OnLoadArgs
type OnLoadResult = esbuildWasm.OnLoadResult
type OnResolveArgs = esbuildWasm.OnResolveArgs
type OnResolveResult = esbuildWasm.OnResolveResult
type Plugin = esbuildWasm.Plugin
type PluginBuild = esbuildWasm.PluginBuild
type Loader = esbuildWasm.Loader
type BuildOptions = esbuildWasm.BuildOptions
type BuildResult = esbuildWasm.BuildResult<esbuildWasm.BuildOptions>
type Stop = typeof esbuildWasm.stop
type Build = typeof esbuild.build
type Initialize = typeof esbuildWasm.initialize
type InitializeOptions = esbuildWasm.InitializeOptions

const esbuild = signal<
  { initialize: Initialize; transform: typeof esbuildWasm.transform }
>()
const esbuildStatus = signal<'initial' | 'loading' | 'ready' | 'complete'>(
  'initial',
)

const TestResults: FunctionComponent = ({ children }) => {
  return <div>{children}</div>
}

const BenchmarkResults: FunctionComponent = ({ children }) => {
  return <div>{children}</div>
}

export const CodePage: FunctionComponent = () => {
  onMount(() => {
    if (esbuild.value === undefined) {
      import('https://unpkg.com/esbuild-wasm@0.24.2/esm/browser.min.js').then(
        (res) => {
          esbuild.value = res
          if (esbuildStatus.value === 'initial') {
            esbuildStatus.value = 'loading'
            res.initialize({
              wasmURL: 'https://unpkg.com/esbuild-wasm@0.24.2/esbuild.wasm',
            }).then(() => {
              esbuildStatus.value = 'ready'
            })
          }
        },
      )
    }
  })
  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <ToggleThemeBtn />
        <ToggleColorThemeBtn />
      </header>
      <div>
        <MultiTabEditor />
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}
