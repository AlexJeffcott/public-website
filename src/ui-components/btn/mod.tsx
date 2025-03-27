import { type FunctionalComponent, type RefObject } from 'preact'
import { cls } from '@/utils/mod.ts'
import classes from '@/ui-components/btn/btn.module.css'

function createPressHandlers(onPress?: () => void, onLongPress?: () => void) {
  return {
    onClick: (event: Event) => handleClickEvent(event as MouseEvent, onPress),
    onTouchStart: (event: Event) =>
      handleTouchEvent(
        event as TouchEvent,
        onPress,
        onLongPress,
      ),
    onKeydown: (event: Event) =>
      handlekeyboardEvent(event as KeyboardEvent, onPress),
  }
}

function handleClickEvent(event: MouseEvent, onPress?: () => void) {
  if (typeof onPress === 'function') {
    onPress()
  }
}

function handlekeyboardEvent(event: KeyboardEvent, onPress?: () => void) {
  if (typeof onPress === 'function') {
    if (event.key === 'Enter') {
      onPress()
    }
  }
}

function handleTouchEvent(
  event: TouchEvent,
  onPress?: () => void,
  onLongPress?: () => void,
  longPressThreshold: number = 500,
) {
  if (typeof onPress === 'function') {
    const { target } = event

    if (!target) {
      return
    }

    let timeout: ReturnType<typeof setTimeout>

    const touchEndHandler = (event: Event) => {
      clearTimeout(timeout)
      if (
        event.type === 'touchend' &&
        'changedTouches' in event &&
        Array.isArray(event.changedTouches) &&
        event.changedTouches.length > 0
      ) {
        onPress()
      }
      target.removeEventListener('touchend', touchEndHandler)
    }

    timeout = setTimeout(() => {
      if (!onLongPress) {
        onPress()
      } else {
        onLongPress()
      }
      target.removeEventListener('touchend', touchEndHandler)
    }, longPressThreshold)

    target.addEventListener('touchend', touchEndHandler)
  }
}

type BtnProps = {
  ariaLabel?: string
  class?: string
  disabled?: boolean
  forwardRef?: RefObject<HTMLButtonElement>
  onPress?: () => void
  onLongPress?: () => void
  title?: string
  type?: 'button' | 'submit' | 'reset'
  children: preact.ComponentChildren
  popovertarget?: string
}

export const Btn: FunctionalComponent<BtnProps> = ({
  ariaLabel,
  title,
  children,
  type = 'button',
  disabled = false,
  class: className,
  forwardRef,
  onPress,
  onLongPress,
  ...rest
}) => {
  const pressHandlers = createPressHandlers(onPress, onLongPress)

  return (
    <button
      ref={forwardRef}
      class={cls(classes.btn, className)}
      {...pressHandlers}
      tabIndex={0}
      title={title || ariaLabel}
      aria-label={ariaLabel}
      disabled={disabled}
      type={type}
      {...rest}
    >
      {children}
    </button>
  )
}
