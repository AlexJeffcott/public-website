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
  const { finderStore, routerStore } = useStores()

  onMount(() => {
    // should I link the hash from the routerstore to a file content store?
    const hash = decodeURIComponent(routerStore.hash.value).slice(1)
    if (finderStore.files.value.has(hash)) {
      const f = finderStore.files.value.get(hash)
      if (f) {
        f.fetch()
      }
    }
  })

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
        <div>
          <section
            class={classes.fileViewerSection}
            style='background-color:#2e3440ff;color:#d8dee9ff;'
          >
            <div
              class={classes.fileContent}
              dangerouslySetInnerHTML={{
                __html: finderStore.files.value?.get(
                  decodeURIComponent(routerStore.hash.value).slice(1),
                )?.state.value ||
                  '',
              }}
            >
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

const FileTree = ({ fsNode }: { fsNode: FSNode }) => {
  const { routerStore } = useStores()
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
            {fsNode.kind === 'file'
              ? <FileLink fsNode={fsNode} />
              : <DirectoryLink fsNode={fsNode} />}
            <Btn class={classes.btn} popovertarget={fsNode.path}>…</Btn>
            <div id={fsNode.path} popover='auto'>
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

const FileLink: FunctionalComponent<{ fsNode: FSNode }> = (
  { fsNode },
) => {
  const { finderStore } = useStores()
  const hash = `#${encodeStringForUrl(fsNode.path)}`
  const nesting = Math.max(fsNode.path.split('/').length - 1, 0)

  return (
    <a
      class={classes.link}
      href={hash}
      onClick={() => finderStore.files.value.get(fsNode.path)?.fetch()}
    >
      {!!nesting && (
        <span class={classes.spacer}>
          {'––'.repeat(nesting)}
        </span>
      )}
      {fsNode.name}
    </a>
  )
}

const DirectoryLink: FunctionalComponent<{ fsNode: FSNode }> = (
  { fsNode },
) => {
  const nesting = Math.max(fsNode.path.split('/').length - 1, 0)

  return (
    <span
      class={classes.dlink}
    >
      {!!nesting && (
        <span class={classes.spacer}>
          {'––'.repeat(nesting)}
        </span>
      )}
      {fsNode.name}
    </span>
  )
}
