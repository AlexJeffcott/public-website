import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import * as ToggleTheme from '@/actions/toggle-theme/mod.ts'
import { type FunctionalComponent } from 'preact'
import { useStores } from '@/contexts/stores.tsx'
import { type Signal } from '@preact/signals'
import { type Theme } from '@/types/theme.ts'

const ThemeIcon: FunctionalComponent<{ theme: Signal<Theme> }> = ({
  theme,
}) => {
  switch (theme.value) {
    case 'light':
      return '☀️'
    case 'dark':
      return '🌙'
    case 'system':
      return '💻'
    default:
      return '💻'
  }
}

export const ToggleThemeBtn: FunctionalComponent<{ cb?: () => void }> = ({
  cb,
}) => {
  const { uiStore } = useStores()
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ToggleTheme.ActionEvent
  >()

  const onPress = useStableCallback(() => {
    dispatch(
      new ToggleTheme.ActionEvent({
        eventType: 'toggletheme',
        cb,
      }),
    )
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title={`Current theme: ${uiStore.theme.value}`}
    >
      <ThemeIcon theme={uiStore.theme} />
    </Btn>
  )
}
