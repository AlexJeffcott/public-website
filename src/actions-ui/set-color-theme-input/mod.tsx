import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionalComponent, type JSX } from 'preact'
import * as SetColorTheme from '@/actions/set-color-theme/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import classes from '@/actions-ui/set-color-theme-input/color-picker.module.css'

export const SetColorThemeInput: FunctionalComponent<{ cb?: () => void }> = ({
  cb,
}) => {
  const { uiStore } = useStores()
  const [ref, dispatch] = useEventDispatcher<
    HTMLInputElement,
    SetColorTheme.ActionEvent
  >()

  const onPress = useStableCallback(
    (e: JSX.TargetedInputEvent<HTMLInputElement>) => {
      dispatch(
        new SetColorTheme.ActionEvent({
          eventType: 'setcolortheme',
          color: e.currentTarget.value,
          cb,
        }),
      )
    },
  )

  return (
    <label class={classes.colorPicker}>
      <input
        onInput={onPress}
        ref={ref}
        type='color'
        value={uiStore.colorTheme.value}
      />
    </label>
  )
}
