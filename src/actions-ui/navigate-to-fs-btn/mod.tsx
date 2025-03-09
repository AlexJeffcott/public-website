import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionalComponent } from 'preact'
import * as Navigate from '@/actions/navigate/mod.ts'

export const NavigateToFSBtn: FunctionalComponent<{ cb?: () => void }> = ({
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
        to: '/fs',
        cb,
      }),
    )
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='Go to File System'
    >
      Go to File System
    </Btn>
  )
}
