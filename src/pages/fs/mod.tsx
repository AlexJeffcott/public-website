import { Fragment, type FunctionalComponent } from 'preact'
import classes from '@/pages/fs/fs.module.css'
import {
  CopyFileOrDirectory,
  CreateFileOrDirectory,
  DeleteFileOrDirectory,
  MoveFileOrDirectory,
  NavigateToHomeBtn,
  ToggleColorThemeBtn,
  ToggleThemeBtn,
} from '@/actions-ui/mod.ts'
import { cls, encodeStringForUrl } from '@/utils/mod.ts'
import { onMount } from '@/hooks/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import { type FSNode } from '@/types/fs.ts'
import { Btn } from '@/ui-components/mod.ts'

export const FSPage: FunctionalComponent = () => {
  const { finderStore } = useStores()
  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <ToggleThemeBtn />
        <ToggleColorThemeBtn />
      </header>
      <div class={classes.content}>
        <div class={classes.fileTreeSection}>
          <div class={classes.fileTree}>
            <FileTree fsNode={finderStore.ls.value} />
          </div>
          <CreateFileOrDirectory />
        </div>
        <div style='overflow: auto'>
          {Array.from(finderStore.files.value.entries()).map(
            ([path, asyncSignal]) => (
              <section
                key={path}
                id={encodeStringForUrl(path)}
                class={classes.fileViewerSection}
                style='background-color:#2e3440ff;color:#d8dee9ff;'
              >
                <h2>{path}</h2>
                <div
                  class={classes.fileContent}
                  dangerouslySetInnerHTML={{
                    __html: asyncSignal.state.value || '',
                  }}
                >
                </div>
              </section>
            ),
          )}
        </div>
      </div>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </main>
  )
}

const FileTree = ({ fsNode }: { fsNode: FSNode }) => {
  const { finderStore, routerStore } = useStores()
  const hash = `#${encodeStringForUrl(fsNode.path)}`
  onMount(() => {
    finderStore.files.value.get(fsNode.path)?.fetch()
  })

  const nesting = Math.max(fsNode.path.split('/').length - 1, 0)
  return (
    <>
      {fsNode.path &&
        (
          <div
            class={cls(
              classes.fsItem,
              routerStore.hash.value === hash && classes.current,
            )}
          >
            <a class={classes.link} href={hash}>
              {!!nesting && (
                <span class={classes.spacer}>
                  {'––'.repeat(nesting)}
                </span>
              )}
              {fsNode.name}
            </a>
            <Btn class={classes.btn} popovertarget={fsNode.path}>…</Btn>
            <div
              id={fsNode.path}
              popover='auto'
            >
              <CreateFileOrDirectory fsNode={fsNode} />
              <CopyFileOrDirectory fsNode={fsNode} />
              <MoveFileOrDirectory fsNode={fsNode} />
              <DeleteFileOrDirectory fsNode={fsNode} />
            </div>
          </div>
        )}
      {fsNode.children?.map((child) => (
        <Fragment key={child.path}>
          <FileTree fsNode={child} />
        </Fragment>
      ))}
    </>
  )
}
