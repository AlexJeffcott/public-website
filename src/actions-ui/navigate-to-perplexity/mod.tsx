import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { type FunctionComponent } from '@/types/mod.ts'
import * as Navigate from '@/actions/navigate/mod.ts'

export const NavigateToPerplexityBtn: FunctionComponent<{ cb?: () => void }> = (
  {
    cb,
  },
) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    Navigate.ActionEvent
  >()

  const onPress = useStableCallback(() => {
    dispatch(
      new Navigate.ActionEvent({
        eventType: 'navigate',
        to: '/perplexity',
        cb,
      }),
    )
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='Go to Perplexity'
    >
      Go to Perplexity
    </Btn>
  )
}
