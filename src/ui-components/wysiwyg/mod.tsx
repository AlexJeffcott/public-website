import classes from '@/ui-components/wysiwyg/wysiwyg.module.css'
import { onMount, useRef } from '@/hooks/mod.ts'
import { cls } from '@/utils/mod.ts'
import {
  type FunctionComponent,
  type JSX,
  type ReadonlySignal,
} from '@/types/mod.ts'

export const WYSIWYG: FunctionComponent<
  {
    class?: string
    isDisabled?: boolean
    isLoading?: boolean
    onInputCB?: (
      e: JSX.TargetedInputEvent<HTMLTextAreaElement>,
    ) => void
    markupSig?: ReadonlySignal<string>
    contentSig?: ReadonlySignal<string>
    name?: string
  }
> = (
  {
    class: className,
    isDisabled = false,
    isLoading = true,
    onInputCB,
    markupSig,
    contentSig,
    name,
  },
) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayDivRef = useRef<HTMLDivElement>(null)

  onMount(() => {
    const textarea = textareaRef.current
    const displayDiv = displayDivRef.current

    if (!textarea) return

    if (textarea) {
      setTimeout(() => {
        const length = contentSig?.value.length || 0
        textarea.focus()
        textarea.setSelectionRange(length, length)
      }, 200)
    }

    if (!displayDiv) return

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
      {markupSig && (
        <span
          ref={displayDivRef}
          class={cls(
            classes.fileContentMarkup,
            className,
          )}
          dangerouslySetInnerHTML={{
            __html: !markupSig.value &&
                isLoading
              ? 'loading'
              : markupSig.value,
          }}
        >
        </span>
      )}

      <textarea
        ref={textareaRef}
        disabled={isDisabled}
        class={cls(
          classes.fileContentTextArea,
          className,
        )}
        style={markupSig ? 'color: transparent;' : ''}
        autocomplete='off'
        autocorrect='off'
        autocapitalize='off'
        spellcheck={false}
        onInput={onInputCB}
        name={name}
        value={contentSig}
      >
        {contentSig}
      </textarea>
    </>
  )
}
