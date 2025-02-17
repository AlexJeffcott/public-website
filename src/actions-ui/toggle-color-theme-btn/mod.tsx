import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionalComponent } from 'preact'
import * as ToggleColorTheme from '@/actions/toggle-color-theme/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import { type Signal } from '@preact/signals'
import { type ColorTheme } from '@/types/theme.ts'

const ColorThemeIcon: FunctionalComponent<{
  colorTheme: Signal<ColorTheme>
}> = ({ colorTheme }) => {
  switch (colorTheme.value) {
    case 'red':
      return '🔴'
    case 'blue':
      return '🔵'
    case 'green':
      return '🟢'
    case 'orange':
      return '🟠'
    case 'purple':
      return '🟣'
    case 'grey':
      return '⚪'
    default:
      return '🔵'
  }
}

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
      <ColorThemeIcon colorTheme={uiStore.colorTheme} />
    </Btn>
  )
}
