import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionalComponent } from 'preact'
import * as ToggleColorTheme from '@/actions/toggle-color-theme/mod.ts'
import { useStores } from '@/contexts/stores.tsx'

export const ToggleColorThemeBtn: FunctionalComponent<{ cb?: () => void }> = ({
  cb,
}) => {
  const { uiStore } = useStores()
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ToggleColorTheme.ActionEvent
  >()

  const onPress = useStableCallback(() => {
    dispatch(
      new ToggleColorTheme.ActionEvent({
        eventType: 'togglecolortheme',
        cb,
      }),
    )
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title={`Current colortheme: ${uiStore.colorTheme.value}`}
    >
      {uiStore.colorTheme}
    </Btn>
  )
}
