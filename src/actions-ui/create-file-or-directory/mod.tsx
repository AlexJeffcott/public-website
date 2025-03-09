import { Btn } from '@/ui-components/mod.ts'
import { useEventDispatcher, useStableCallback } from '@/hooks/mod.ts'
import { ActionEvent } from '@/actions/create-file-or-directory/mod.ts'
import { type FunctionalComponent } from 'preact'
import { promptForPath, removeFromEnd } from '@/utils/mod.ts'
import { type FSNode, isFSNode } from '@/types/fs.ts'

type GetPathArg = { msg?: string; path?: string } | undefined

export const CreateFileOrDirectory: FunctionalComponent<
  { cb?: () => void; fsNode?: FSNode }
> = ({ cb, fsNode }) => {
  const [ref, dispatch] = useEventDispatcher<
    HTMLButtonElement,
    ActionEvent
  >()

  const onPress = useStableCallback(() => {
    const getPath = ({ msg, path }: GetPathArg = {}) => {
      const newFSNode = promptForPath(msg, path)
      if (newFSNode === undefined) {
        return
      } else if (!isFSNode(newFSNode)) {
        return getPath({ msg: `Please enter a valid path.`, path })
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

    if (isFSNode(fsNode)) {
      getPath({
        path: fsNode.kind === 'file'
          ? removeFromEnd(fsNode.path, fsNode.name)
          : fsNode.path + '/',
      })
    } else {
      getPath()
    }
  })

  return (
    <Btn
      forwardRef={ref}
      onPress={onPress}
      title='create'
    >
      create
    </Btn>
  )
}
