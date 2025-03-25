import { Fragment } from 'preact'
import classes from '@/pages/fs/fs.module.css'
import {
  CopyFileOrDirectory,
  CreateFileOrDirectory,
  DeleteFileOrDirectory,
  NavigateToHomeBtn,
  SetColorThemeInput,
} from '@/actions-ui/mod.ts'
import { cls, encodeStringForUrl } from '@/utils/mod.ts'
import {
  onMount,
  useRef,
  useSignalEffect,
  useStableCallback,
} from '@/hooks/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import {
  type FSNode,
  type FunctionComponent,
  type JSX,
  type ReadonlySignal,
} from '@/types/mod.ts'
import { Btn } from '@/ui-components/mod.ts'
import { getFileType } from '@/utils/get-file-type.ts'

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
        <SetColorThemeInput />
      </header>
      <aside class={classes.fileTreeSection}>
        {!finderStore.ls.value?.children?.length && <CreateFileOrDirectory />}
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
              {fsNode.kind === 'directory' &&
                <CreateFileOrDirectory fsNode={fsNode} />}
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

const WYSIWYG: FunctionComponent<
  {
    class?: string
    isDisabled?: boolean
    isLoading: boolean
    onInputCB: (e: JSX.TargetedInputEvent<HTMLTextAreaElement>) => void
    markupSig?: ReadonlySignal<string>
    contentSig: ReadonlySignal<string>
  }
> = (
  {
    class: className,
    isDisabled = false,
    isLoading = true,
    onInputCB,
    markupSig,
    contentSig,
  },
) => {
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
    console.log('mount')
    textarea.addEventListener('scroll', handleScroll)

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
    }
  })
  console.log('render')
  return (
    <>
      {markupSig && (
        <span
          ref={displayDivRef}
          class={cls(classes.fileContentMarkup, className)}
          dangerouslySetInnerHTML={{
            __html: isLoading ? 'loading' : markupSig.value,
          }}
        >
        </span>
      )}

      <textarea
        ref={textareaRef}
        disabled={isDisabled}
        class={cls(classes.fileContentTextArea, className)}
        style={markupSig ? 'color: transparent;' : ''}
        autocomplete='off'
        autocorrect='off'
        autocapitalize='off'
        spellcheck={false}
        onInput={onInputCB}
        value={contentSig}
      >
      </textarea>
    </>
  )
}

//import { render } from 'preact';
//import { useSignal, useSignalEffect } from '@preact/signals';
//import { useCallback } from 'preact/hooks';
//
//function AudioPlayer() {
//  const audioSrc = useSignal<string | null>(null);
//  const isPlaying = useSignal(false);
//  const audioRef = useSignal<HTMLAudioElement | null>(null);
//
//  // Clean up object URL when component unmounts or src changes
//  useSignalEffect(() => {
//    return () => {
//      if (audioSrc.value) {
//        URL.revokeObjectURL(audioSrc.value);
//      }
//    };
//  });
//
//  const playAudioFromOPFS = useCallback(async (fileName: string) => {
//    try {
//      // Get OPFS root directory
//      const root = await navigator.storage.getDirectory();
//
//      // Get file handle and file
//      const fileHandle = await root.getFileHandle(fileName);
//      const file = await fileHandle.getFile();
//
//      // Create object URL and set it as audio source
//      const objectURL = URL.createObjectURL(file);
//      audioSrc.value = objectURL;
//
//      // Play the audio
//      if (audioRef.value) {
//        await audioRef.value.play();
//        isPlaying.value = true;
//      }
//    } catch (error) {
//      console.error('Error playing audio from OPFS:', error);
//    }
//  }, []);
//
//  const togglePlayPause = useCallback(() => {
//    if (audioRef.value) {
//      if (isPlaying.value) {
//        audioRef.value.pause();
//      } else {
//        audioRef.value.play();
//      }
//      isPlaying.value = !isPlaying.value;
//    }
//  }, []);
//
//  return (
//    <div>
//      <audio
//        ref={(el) => { audioRef.value = el; }}
//        src={audioSrc.value || undefined}
//        onEnded={() => { isPlaying.value = false; }}
//      />
//
//      <button onClick={() => playAudioFromOPFS('my-audio.mp3')}>
//        Load and Play from OPFS
//      </button>
//
//      {audioSrc.value && (
//        <button onClick={togglePlayPause}>
//          {isPlaying.value ? 'Pause' : 'Play'}
//        </button>
//      )}
//    </div>
//  );
//}
//
//
const MediaItem: FunctionComponent<{ path: string; src: string }> = (
  { path, src },
) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleLoad = () => {
    console.log('loaded')
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

const Tools: FunctionComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      class={classes.responsiveMediaContainer}
    >
      {renderMedia()}
    </div>
  )
}
