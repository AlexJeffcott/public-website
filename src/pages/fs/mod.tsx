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
import { getFileType } from '@/utils/get-file-type.ts'

export const FSPage: FunctionalComponent = () => {
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
            : editorStore.current.status.value === 'loading'
            ? <p>loading</p>
            : <WYSIWYG />
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
const MediaItem = ({ path, src }: { path: string; src: string }) => {
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
