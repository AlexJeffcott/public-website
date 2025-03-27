import { signal } from '@preact/signals'
import classes from '@/pages/fs/integrations-popover.module.css'
import { Btn } from '@/ui-components/mod.ts'
import { GitHubIntegration } from '@/pages/fs/github-integration.tsx'

const inputs = [
  {
    id: 'githubpat',
    label: 'GitHub PAT',
    type: 'password',
    sig: signal(localStorage.getItem('githubpat') || ''),
  },
  {
    id: 'claudeApiKey',
    label: 'Claude Key',
    type: 'password',
    sig: signal(localStorage.getItem('claudeApiKey') || ''),
  },

  {
    id: 'anthropicApiKey',
    label: 'Anthropic Key',
    type: 'password',
    sig: signal(localStorage.getItem('anthropicApiKey') || ''),
  },

  {
    id: 'openaiApiKey',
    label: 'OpenAI Key',
    type: 'password',
    sig: signal(localStorage.getItem('openaiApiKey') || ''),
  },
]

const saveKey = (key: string, storageKey: string) => {
  localStorage.setItem(storageKey, key)
}

export const IntegrationsPopover = () => {
  return (
    <div
      id='manage-integrations'
      popover='auto'
      class={classes.credentialsPopover}
    >
      <h3>Manage API Credentials</h3>

      {inputs.map((i) => (
        <div class={classes.credentialRow} key={i.id}>
          <label for={i.id}>{i.label}:</label>
          <input
            id={i.id}
            type={i.type}
            value={i.sig.value}
            onInput={(e) => i.sig.value = (e.target as HTMLInputElement).value}
          />
          <Btn onPress={() => saveKey(i.sig.value, i.id)}>
            Save
          </Btn>
        </div>
      ))}
      <GitHubIntegration />
    </div>
  )
}
