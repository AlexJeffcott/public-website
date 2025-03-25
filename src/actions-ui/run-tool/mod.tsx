import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { ActionEvent } from '@/actions/create-file-or-directory/mod.ts'
import { signal } from '@preact/signals'
import { type FSNode, type FunctionComponent, isFSNode } from '@/types/mod.ts'

const sig = signal(localStorage.getItem('claudeApiKey') || '')

export const RunTool: FunctionComponent<
  { cb?: () => void; fsNode?: FSNode }
> = ({ cb, fsNode }) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ActionEvent
  >()

  const onPress = useStableCallback(() => {
    if (!sig.peek()) {
      const key = prompt('Please enter your Claude API key:')
      if (key) {
        localStorage.setItem('claudeApiKey', key)
        sig.value = key
      }
    }

    if (isFSNode(fsNode)) {
      const newFSNode = {
        ...fsNode,
        path: fsNode.path.replace('.tool', '.output'),
        name: fsNode.name.replace('.tool', '.output'),
      }
      dispatch(
        new ActionEvent({
          eventType: 'createfileordirectory',
          cb,
          newFSNode,
        }),
      )
      ref.current?.closest('[popover]')?.hidePopover()
    }
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='run'
    >
      run
    </Btn>
  )
}
