import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { ActionEvent } from '@/actions/create-file-or-directory/mod.ts'
import { signal } from '@preact/signals'
import {
  type FSNode,
  type FunctionComponent,
  isFSNode,
  type ReadonlySignal,
} from '@/types/mod.ts'

const sig = signal(localStorage.getItem('claudeApiKey') || '')

export const RunTool: FunctionComponent<
  {
    cb?: () => void
    fsNodeSig?: ReadonlySignal<FSNode | undefined>
    disabled?: boolean
  }
> = ({ cb, disabled = false, fsNodeSig }) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ActionEvent
  >()

  // TODO: this should depend on the model?
  const onPress = useStableCallback(() => {
    if (!sig.peek()) {
      const key = prompt('Please enter your Claude API key:')
      if (key) {
        localStorage.setItem('claudeApiKey', key)
        sig.value = key
      }
    }

    const fsNode = fsNodeSig?.peek()
    if (isFSNode(fsNode)) {
      const newFSNode = {
        kind: 'file' as const,
        path: fsNode.path + '.output',
        name: fsNode.name + '.output',
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
      disabled={disabled}
    >
      run
    </Btn>
  )
}
