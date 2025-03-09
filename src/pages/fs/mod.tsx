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
import { useStores } from '@/contexts/stores.tsx'
import { type FSNode } from '@/types/fs.ts'

export const FSPage: FunctionalComponent = () => {
  const { finderStore } = useStores()

  return (
    <>
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
                >
                  <h2>{path}</h2>
                  <div class={classes.fileContent}>
                    {asyncSignal.state.value}
                  </div>
                </section>
              ),
            )}
          </div>
        </div>
        <footer class={classes.footer}>Alex Jeffcott</footer>
      </main>
    </>
  )
}

const FileTree = ({ fsNode }: { fsNode: FSNode }) => {
  const { finderStore, routerStore } = useStores()
  const hash = `#${encodeStringForUrl(fsNode.path)}`
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
            <a
              href={hash}
              onClick={() => finderStore.files.value.get(fsNode.path)?.fetch()}
              style={`--nesting: ${fsNode.path.split('/').length - 1};`}
            >
              {fsNode.name}
            </a>
            <button popovertarget={fsNode.path}>…</button>
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
