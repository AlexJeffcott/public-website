import classes from '@/pages/fs/agent-popover.module.css'
import { Btn, WYSIWYG } from '@/ui-components/mod.ts'
import { useSignal, useStableCallback } from '@/hooks/mod.ts'
import { agent } from '@/libs/llm.ts'
import { isTextContent, isThinkingContent, type Msgs } from '@/types/mod.ts'
import { useStores } from '@/contexts/stores.tsx'
import { fsHandlers } from '@/broadcast/main.ts'
import { createFSNodeFromPath, wait } from '@/utils/mod.ts'

export const AgentPopover = () => {
  const { finderStore, routerStore } = useStores()
  const isProcessing = useSignal(false)
  const sig = useSignal('')
  const msgs = useSignal<Msgs>([])
  let target: null | HTMLTextAreaElement = null

  // TODO: add context to the agent call so that it can be added to the 'system' field
  // current file path
  // if the current file path is used, then we should act on the file via the editor store.
  //
  const onPress = useStableCallback(async () => {
    if (isProcessing.value) return
    msgs.value = [...msgs.value, { role: 'user', content: sig.value }]

    const process = async () => {
      isProcessing.value = true

      const resp = await agent(msgs.value).catch(console.error)
      if (resp) {
        msgs.value = [...msgs.value, resp]
        sig.value = ''
        if (target !== null) {
          target.value = ''
        }
      }

      if (resp.role === 'assistant' && Array.isArray(resp.content)) {
        for await (const c of resp.content) {
          if (c.type === 'tool_use') {
            if (c.name === 'str_replace_editor') {
              let content = ''
              if (c.input.command === 'create') {
                const fsNode = createFSNodeFromPath(c.input.path)
                if (fsNode) {
                  finderStore.create(
                    fsNode,
                    c.input.file_text,
                  )
                  content = 'success'
                } else content = 'failure'
              } else if (c.input.command === 'view') {
                content = (await fsHandlers.read(c.input.path).catch(
                  console.error,
                )) || ''
              } else if (c.input.command === 'str_replace') {
                const txt = await fsHandlers.read(c.input.path).catch(
                  console.error,
                ) || ''
                if (txt) {
                  await fsHandlers.write(
                    c.input.path,
                    txt.replace(c.input.old_str, c.input.new_str),
                  ).catch(console.error)
                  content = 'success'
                } else {
                  content = 'failure'
                }
              } else if (c.input.command === 'insert') {
                console.error('needs to be implemented')
              } else if (c.input.command === 'undo_edit') {
                console.error('needs to be implemented')
              } else {
                throw new Error(`Unknown tool: '${c.name}'`)
              }

              msgs.value = [...msgs.value, {
                role: 'user',
                content: [{
                  type: 'tool_result',
                  'tool_use_id': c.id,
                  content,
                }],
              }]

              await process()
            }
          }
        }
      }
    }

    await process().finally(() => {
      isProcessing.value = false
    })
    await wait(100)
    finderStore.refreshLs()
  })

  const onInput = useStableCallback((e) => {
    target = e.currentTarget
    sig.value = e.currentTarget.value
  })

  return (
    <>
      <div class={classes.msgs}>
        {msgs.value.map((msg) => {
          if (typeof msg.content === 'string') {
            return <p class={classes.question}>{msg.content}</p>
          } else if (Array.isArray(msg.content)) {
            return msg.content.map((c) => {
              if (isTextContent(c)) {
                return <p class={classes.response}>{c.text}</p>
              } else if (isThinkingContent(c)) {
                return <p class={classes.thinking}>{c.thinking}</p>
              }
            })
          }
        })}
      </div>
      <div class={classes.prompt}>
        <WYSIWYG
          contentSig={sig}
          onInputCB={onInput}
        />
      </div>
      <Btn onPress={onPress}>
        {isProcessing.value ? 'making' : 'make'} it so
      </Btn>
    </>
  )
}
