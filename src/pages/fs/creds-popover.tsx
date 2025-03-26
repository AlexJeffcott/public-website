import { useSignal } from '@preact/signals'
import classes from '@/pages/fs/creds-popover.module.css'
import { Btn } from '@/ui-components/mod.ts'

export const CredsPopover = () => {
  const githubKey = useSignal(localStorage.getItem('githubpat') || '')
  const claudeKey = useSignal(localStorage.getItem('claudeApiKey') || '')
  const anthropicKey = useSignal(localStorage.getItem('anthropicApiKey') || '')
  const openaiKey = useSignal(localStorage.getItem('openaiApiKey') || '')

  const saveKey = (key: string, storageKey: string) => {
    localStorage.setItem(storageKey, key)
  }

  return (
    <div
      id='manage-credentials'
      popover='auto'
      class={classes.credentialsPopover}
    >
      <h3>Manage API Credentials</h3>

      <div class={classes.credentialRow}>
        <label for='github-key'>GitHub PAT:</label>
        <input
          id='github-key'
          type='password'
          value={githubKey.value}
          onInput={(e) =>
            githubKey.value = (e.target as HTMLInputElement).value}
        />
        <Btn
          onPress={() => saveKey(githubKey.value, 'githubpat')}
        >
          Save
        </Btn>
      </div>

      <div class={classes.credentialRow}>
        <label for='claude-key'>Claude API Key:</label>
        <input
          id='claude-key'
          type='password'
          value={claudeKey.value}
          onInput={(e) =>
            claudeKey.value = (e.target as HTMLInputElement).value}
        />
        <Btn
          onPress={() => saveKey(claudeKey.value, 'claudeApiKey')}
        >
          Save
        </Btn>
      </div>

      <div class={classes.credentialRow}>
        <label for='anthropic-key'>Anthropic API Key:</label>
        <input
          id='anthropic-key'
          type='password'
          value={anthropicKey.value}
          onInput={(e) =>
            anthropicKey.value = (e.target as HTMLInputElement).value}
        />
        <Btn
          onPress={() => saveKey(anthropicKey.value, 'anthropicApiKey')}
        >
          Save
        </Btn>
      </div>

      <div class={classes.credentialRow}>
        <label for='openai-key'>OpenAI API Key:</label>
        <input
          id='openai-key'
          type='password'
          value={openaiKey.value}
          onInput={(e) =>
            openaiKey.value = (e.target as HTMLInputElement).value}
        />
        <Btn
          onPress={() => saveKey(openaiKey.value, 'openaiApiKey')}
        >
          Save
        </Btn>
      </div>
    </div>
  )
}
