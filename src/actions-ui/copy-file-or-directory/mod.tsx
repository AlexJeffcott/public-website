import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { ActionEvent } from '@/actions/copy-file-or-directory/mod.ts'
import { type FunctionalComponent } from 'preact'
import { type FSNode, isFSNode } from '@/types/fs.ts'
import { promptForPath, removeFromEnd } from '@/utils/mod.ts'

type GetPathArg = { msg?: string; path?: string } | undefined

export const CopyFileOrDirectory: FunctionalComponent<
  { cb?: () => void; fsNode: FSNode }
> = ({ cb, fsNode: sourceFSNode }) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ActionEvent
  >()

  const onPress = useStableCallback(() => {
    const getPath = ({ msg, path }: GetPathArg = {}) => {
      const destinationFSNode = promptForPath(msg, path)
      if (destinationFSNode === undefined) {
        return
      } else if (!isFSNode(destinationFSNode)) {
        return getPath({ msg: `Please enter a valid path.`, path })
      }
      dispatch(
        new ActionEvent({
          eventType: 'copyfileordirectory',
          cb,
          sourceFSNode,
          destinationFSNode,
        }),
      )

      ref.current?.closest('[popover]')?.hidePopover()
    }

    if (isFSNode(sourceFSNode)) {
      getPath({
        path: sourceFSNode.kind === 'file'
          ? removeFromEnd(sourceFSNode.path, sourceFSNode.name)
          : sourceFSNode.path,
      })
    } else {
      getPath()
    }
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='copy'
    >
      copy
    </Btn>
  )
}
