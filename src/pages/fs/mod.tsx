import { Fragment, type FunctionalComponent } from 'preact'
import classes from '@/pages/fs/fs.module.css'
import {
  CopyFileOrDirectory,
  CreateFileOrDirectory,
  DeleteFileOrDirectory,
  NavigateToHomeBtn,
  SetColorThemeInput,
} from '@/actions-ui/mod.ts'
import { cls, encodeStringForUrl } from '@/utils/mod.ts'
import { onMount, useRef, useSignalEffect } from '@/hooks/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import { type FSNode } from '@/types/fs.ts'
import { Btn } from '@/ui-components/mod.ts'

export const FSPage: FunctionalComponent = () => {
  const { finderStore, routerStore, editorStore } = useStores()

  useSignalEffect(() => {
    // NOTE: when the hash changes, update the filePath
    editorStore.setFilePath(routerStore.decodedHash.value)
  })

  return (
    <main class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <SetColorThemeInput />
      </header>
      <aside class={classes.fileTreeSection}>
        {!finderStore.ls.value?.children?.length && <CreateFileOrDirectory />}
        <FileTree fsNode={finderStore.ls.value} />
      </aside>
      <article class={classes.fileViewerSection}>
        {routerStore.decodedHash.value
          ? <WYSIWYG />
          : (
            <h1 class={classes.center}>
              {finderStore.ls.value?.children?.length
                ? 'Click on a file!'
                : 'Create a file to get started!'}
            </h1>
          )}
      </article>
      <div class={classes.footer}>
        {editorStore.currentFilePath.value.split('/').at(-1) || ''}
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
  const hash = `#${encodeStringForUrl(fsNode.path)}`
  const nesting = Math.max(fsNode.path.split('/').length - 1, 0)

  return (
    <a
      class={classes.link}
      href={hash}
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

const WYSIWYG: FunctionalComponent = () => {
  const { editorStore, routerStore } = useStores()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayDivRef = useRef<HTMLDivElement>(null)

  onMount(() => {
    const textarea = textareaRef.current
    const displayDiv = displayDivRef.current

    if (!textarea || !displayDiv) return

    const handleScroll = () => {
      displayDiv.scrollTop = textarea.scrollTop
      displayDiv.scrollLeft = textarea.scrollLeft
    }

    textarea.addEventListener('scroll', handleScroll)

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
    }
  })

  return (
    <>
      <span
        ref={displayDivRef}
        class={classes.fileContentMarkup}
        dangerouslySetInnerHTML={{ __html: editorStore.markup.value }}
      >
      </span>

      <textarea
        ref={textareaRef}
        disabled={!routerStore.decodedHash.value}
        class={classes.fileContentTextArea}
        autocomplete='off'
        autocorrect='off'
        autocapitalize='off'
        spellcheck={false}
        onInput={(e) => {
          editorStore.update(e.currentTarget.value)
        }}
        value={editorStore.text.value}
      >
      </textarea>
    </>
  )
}
