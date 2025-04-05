import { Fragment } from 'preact'
import classes from '@/pages/fs/fs.module.css'
import {
  CopyFileOrDirectory,
  CreateFileOrDirectory,
  DeleteFileOrDirectory,
  NavigateToHomeBtn,
  RunTool,
  SetColorThemeInput,
} from '@/actions-ui/mod.ts'
import { cls, encodeStringForUrl, getFileType } from '@/utils/mod.ts'
import { useRef, useSignalEffect, useStableCallback } from '@/hooks/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import { type FSNode, type FunctionComponent, type JSX } from '@/types/mod.ts'
import { Btn, Popover, WYSIWYG } from '@/ui-components/mod.ts'
import { IntegrationsPopover } from '@/pages/fs/integrations-popover.tsx'
import { AgentPopover } from '@/pages/fs/agent-popover.tsx'

export const FSPage: FunctionComponent = () => {
  const { finderStore, routerStore, editorStore } = useStores()

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer) {
      finderStore.importFilesAndDirectories(e.dataTransfer)
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  useSignalEffect(() => {
    // NOTE: when the hash changes, update the filePath
    editorStore.setFilePath(routerStore.decodedHash.value)
  })

  const inputCB = useStableCallback(
    (e: JSX.TargetedInputEvent<HTMLTextAreaElement>) => {
      editorStore.update(e.currentTarget.value)
    },
  )

  return (
    <main
      class={classes.page}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <header class={classes.header}>
        <NavigateToHomeBtn />
        {editorStore.text.value.startsWith('#! ')
          ? (
            <RunTool
              fsNodeSig={editorStore.currentFSNode}
            />
          )
          : <div></div>}
        <>
          <Popover class={classes.agentWidth} id='agent' cta='agent'>
            <AgentPopover />
          </Popover>
        </>
        <>
          <Popover id='manage-integrations' cta='manage integrations'>
            <IntegrationsPopover />
          </Popover>
        </>

        <SetColorThemeInput />
      </header>
      <aside class={classes.fileTreeSection}>
        <CreateFileOrDirectory />
        <FileTree fsNode={finderStore.ls.value} />
        {finderStore.importStatus.value.errors.length > 0 && (
          <div>
            <h3>Errors:</h3>
            <ul>
              {finderStore.importStatus.value.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      <article class={classes.fileViewerSection}>
        {routerStore.decodedHash.value
          ? editorStore.text.value.startsWith('blob:http')
            ? (
              <MediaItem
                path={editorStore.currentFilePath.value.split('/').at(-1) || ''}
                src={editorStore.text.value}
              />
            )
            : (
              <WYSIWYG
                isLoading={editorStore.current.status.value === 'loading'}
                isDisabled={!routerStore.decodedHash.value}
                onInputCB={inputCB}
                contentSig={editorStore.text}
                markupSig={editorStore.markup}
              />
            )
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

const FileTree: FunctionComponent<{ fsNode: FSNode }> = ({ fsNode }) => {
  const { routerStore } = useStores()
  const hash = `#${encodeStringForUrl(fsNode.path)}`
  return (
    <>
      {fsNode.path && !fsNode.name.endsWith('.crswap') &&
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
              {fsNode.kind === 'directory' && (
                <CreateFileOrDirectory fsNode={fsNode} />
              )}
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

const FileLink: FunctionComponent<{ fsNode: FSNode }> = (
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

const DirectoryLink: FunctionComponent<{ fsNode: FSNode }> = (
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

const MediaItem: FunctionComponent<{ path: string; src: string }> = (
  { path, src },
) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleLoad = () => {
    console.info('loaded')
  }

  const renderMedia = () => {
    switch (getFileType(path)) {
      case 'image':
        return <img src={src} onLoad={handleLoad} />
      case 'video':
        return <video src={src} controls onLoadedMetadata={handleLoad} />
      case 'audio':
        return (
          <div class={classes.audioWrapper}>
            <audio src={src} controls onLoadedMetadata={handleLoad} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={containerRef}
      class={classes.responsiveMediaContainer}
    >
      {renderMedia()}
    </div>
  )
}
