import { type FunctionComponent } from 'preact'
import classes from '@/pages/code/code.module.css'
import {
  NavigateToHomeBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'
import {
  signal,
  useComputed,
  useSignal,
  useSignalEffect,
} from '@preact/signals'
import { onMount, useStableCallback } from '@/hooks/mod.ts'
import { runBenchmarkSuite } from '@/pages/code/benchmark.ts'
import { runTestSuite } from '@/pages/code/test-runner.ts'
import { useStores } from '@/contexts/stores.tsx'

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

function MultiTabEditor() {
  const { editorStore, transpilerStore } = useStores()
  const showTestResults = useSignal<boolean>(false)
  const testResults = useSignal<string | undefined>()
  const benchmarkResults = useSignal<string | undefined>()
  const fileNames = useComputed<string[]>(() =>
    Object.keys(currentProject.value)
  )

  onMount(() => {
    if (!editorStore.ready.value) {
      editorStore.current.fetch()
    }
    if (!transpilerStore.ready.value) {
      transpilerStore.current.fetch()
    }
  })

  const runBenchmark = useStableCallback(async () => {
    if (transpilerStore.ready.value && editorStore.editor.value) {
      currentProject.value[currentFileName.value] = editorStore.getValue()

      try {
        const runCode = await transpilerStore.transform(
          currentProject.value['script.ts'],
        )
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
    if (editorStore.editor.value && transpilerStore.ready.value) {
      currentProject.value[currentFileName.value] = editorStore.getValue()

      try {
        const runCode = await transpilerStore.transform(
          currentProject.value['script.ts'],
        )
        const testCode = await transpilerStore.transform(
          currentProject.value['script.test.ts'],
        )

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

  useSignalEffect(() => {
    // Initialize editor when Monaco is ready
    if (editorStore.ready.value) {
      const editorElement = document.querySelector('#editor') as HTMLElement
      if (editorElement) {
        editorStore.createEditor(editorElement)
        editorStore.setValue(currentProject.value[currentFileName.value])
      }
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
            if (editorStore.editor.value) {
              currentProject.value[currentFileName.value] = editorStore
                .getValue()
              currentFileName.value = fileName
              editorStore.setValue(currentProject.value[fileName])
            }
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

      <div class={classes.results}>
        <button onClick={runTest}>run tests</button>
        <TestResults>
          {testResults.value?.split('\n').map((i) => <div>{i}</div>)}
        </TestResults>
        <button onClick={runBenchmark}>run benchmark</button>
        <BenchmarkResults>
          {benchmarkResults.value?.split('\n').map((i) => <div>{i}</div>)}
        </BenchmarkResults>
      </div>
    </>
  )
}

const TestResults: FunctionComponent = ({ children }) => {
  return <div>{children}</div>
}

const BenchmarkResults: FunctionComponent = ({ children }) => {
  return <div>{children}</div>
}

export const CodePage: FunctionComponent = () => {
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
