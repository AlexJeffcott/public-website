import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionComponent } from '@/types/mod.ts'
import * as Navigate from '@/actions/navigate/mod.ts'

export const NavigateToCodeBtn: FunctionComponent<{ cb?: () => void }> = ({
  cb,
}) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    Navigate.ActionEvent
  >()

  const onPress = useStableCallback(() => {
    dispatch(
      new Navigate.ActionEvent({
        eventType: 'navigate',
        to: '/code',
        cb,
      }),
    )
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='Go to Code Editor'
    >
      Go to Code Editor
    </Btn>
  )
}
