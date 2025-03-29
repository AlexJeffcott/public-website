import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { ActionEvent } from '@/actions/delete-file-or-directory/mod.ts'
import { type FSNode, type FunctionComponent, isFSNode } from '@/types/mod.ts'

export const DeleteFileOrDirectory: FunctionComponent<
  { cb?: () => void; fsNode: FSNode }
> = ({ cb, fsNode }) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ActionEvent
  >()

  const onPress = useStableCallback(() => {
    if (!isFSNode(fsNode)) {
      return
    }
    const isSure = globalThis.confirm(
      `Are you sure you want to delete the ${fsNode.kind} "${fsNode.name}"?`,
    )
    isSure && dispatch(
      new ActionEvent({
        eventType: 'deletefileordirectory',
        cb,
        fsNode,
      }),
    )
    ref.current?.closest('[popover]')?.hidePopover()
  })
  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='delete'
    >
      delete
    </Btn>
  )
}
