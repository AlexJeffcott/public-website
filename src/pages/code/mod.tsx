import { Fragment, type FunctionalComponent } from 'preact'
import classes from '@/pages/code/code.module.css'
import {
  NavigateToHomeBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'
import { useSignal, useSignalEffect } from '@preact/signals'
import { onMount, useStableCallback } from '@/hooks/mod.ts'
import { runTestSuite } from '@/pages/code/test-runner.ts'
import { runBenchmarkSuite } from '@/pages/code/benchmark.ts'
import { useStores } from '@/contexts/stores.tsx'

const MultiTabEditor: FunctionalComponent = () => {
  const { editorStore, transpilerStore, projectsStore } = useStores()
  const showTestResults = useSignal<boolean>(false)
  const testResults = useSignal<string | undefined>()
  const benchmarkResults = useSignal<string | undefined>()

  onMount(() => {
    editorStore.fetch()
    if (!transpilerStore.ready.value) {
      transpilerStore.current.fetch()
    }
  })

  const save = useStableCallback(() => {
    projectsStore.updateProjectFileContents(editorStore.getValue())
  })

  const addFile = useStableCallback(() => {
    const name = globalThis.prompt(
      'Please enter the new file name with the extension',
    )
    if (name) {
      projectsStore.createFile(name)
    }
  })

  const renameFile = useStableCallback((index: number) => {
    const name = globalThis.prompt(
      'Please enter the new file name with the extension',
      projectsStore.currentFile.peek()?.fileName,
    )
    if (name) {
      projectsStore.renameFile(index, name)
    }
  })

  const createProject = useStableCallback(() => {
    const name = globalThis.prompt(
      'Please enter the new project name with the extension',
    )
    if (name) {
      projectsStore.createProject(name)
    }
  })

  const deleteProject = useStableCallback(() => {
    if (globalThis.confirm()) {
      projectsStore.deleteProject()
    }
  })

  const deleteFile = useStableCallback((index: number) => {
    if (globalThis.confirm()) {
      projectsStore.deleteFile(index)
    }
  })

  const resetAll = useStableCallback(() => {
    if (globalThis.confirm()) {
      projectsStore.reset()
    }
  })

  const runBenchmark = useStableCallback(async () => {
    if (transpilerStore.ready.value && editorStore.ready.value) {
      save()

      try {
        const runCode = await transpilerStore.transform(
          projectsStore.currentProject.value?.files[0]?.fileContents || '',
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
    if (editorStore.ready.value && transpilerStore.ready.value) {
      save()

      try {
        const runCode = await transpilerStore.transform(
          projectsStore.currentProject.value?.files[0]?.fileContents || '',
        )
        const testCode = await transpilerStore.transform(
          projectsStore.currentProject.value?.files[1]?.fileContents || '',
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
    // NOTE: If editor is not created then create it, otherwise set the contents
    if (editorStore.ready.value) {
      const currentFile = projectsStore.currentFile.value
      editorStore.setValue(currentFile?.fileContents || '')
    } else {
      const editorElement = document.querySelector('#editor') as HTMLElement
      if (editorElement) {
        editorStore.createEditor(editorElement)
      }
    }
  })

  const handleProjectChange = (e: Event) => {
    save()

    const target = e.target as HTMLSelectElement

    if (target.value === 'create-project') {
      createProject()
    } else {
      projectsStore.currentProjectName.value = target.value
      projectsStore.currentFileIndex.value = 0
      editorStore.setValue(projectsStore.currentFile.value?.fileContents || '')
    }
  }

  const handleFileChange = (index: number) => {
    save()
    projectsStore.currentFileIndex.value = index
  }

  return (
    <>
      <div class={classes.controls}>
        <select
          class={classes.select}
          value={projectsStore.currentProjectName.value}
          onChange={handleProjectChange}
        >
          <option key='create-project' value='create-project'>
            create project
          </option>
          {projectsStore.projects.value.map((project) => (
            <option key={project.name} value={project.name}>
              {project.name}
            </option>
          ))}
        </select>
        <button onClick={resetAll}>Reset All</button>
        <button onClick={save}>Save</button>
        <button onClick={deleteProject}>delete project</button>
      </div>

      <div class={classes.fileControls}>
        <div>
          {projectsStore.currentProject.value?.files.map((file, index) => {
            return (
              <Fragment key={file.fileName}>
                <button
                  disabled={index ===
                    projectsStore.currentFileIndex.value}
                  onClick={() => handleFileChange(index)}
                >
                  {file.fileName}
                </button>
                <button onClick={() => renameFile(index)}>r</button>
                <button onClick={() => deleteFile(index)}>x</button>
              </Fragment>
            )
          })}
        </div>
        <div>
          <button onClick={() => addFile()}>add file</button>
        </div>
      </div>

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

const TestResults: FunctionalComponent = ({ children }) => {
  return <div>{children}</div>
}

const BenchmarkResults: FunctionalComponent = ({ children }) => {
  return <div>{children}</div>
}

export const CodePage: FunctionalComponent = () => {
  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <ToggleThemeBtn />
        <ToggleColorThemeBtn />
      </header>
      <h1>Write, test and benchmark Typescript</h1>
      <div>
        <MultiTabEditor />
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}
