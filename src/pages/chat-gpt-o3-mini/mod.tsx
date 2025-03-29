import classes from '@/pages/perplexity/perplexity.module.css'
import { cls } from '@/utils/mod.ts'
import { type FunctionComponent } from '@/types/mod.ts'
import { useSignal } from '@preact/signals'
import { PrimitivePersistence } from '@/persistence/mod.ts'
import { NavigateToHomeBtn, SetColorThemeInput } from '@/actions-ui/mod.ts'
import { Btn } from '@/ui-components/mod.ts'

const perplexityApiKey = new PrimitivePersistence('perplexityApiKey', '')

const depthToModelMap = {
  'super duper deep': 'sonar-deep-research',
  'dang deep': 'sonar-reasoning-pro',
  'deep': 'sonar-reasoning',
  '"deep"': 'sonar-pro',
  'good enough': 'sonar',
}

const Perplexity: FunctionComponent = () => {
  const question = useSignal('')
  const result = useSignal('')
  const error = useSignal('')
  const isLoading = useSignal(false)
  const depth = useSignal('deep')

  const handleSearch = () => {
    if (!question.value.trim()) {
      error.value = 'Please enter a question'
      return
    }

    isLoading.value = true
    error.value = ''

    fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${perplexityApiKey.current.value}`,
      },
      body: JSON.stringify({
        model: depthToModelMap[depth.value],
        messages: [
          {
            'role': 'system',
            'content': 'Be precise and concise.',
          },
          {
            'role': 'user',
            'content': question.value,
          },
        ],
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        result.value = data.choices?.reduce((acc, cur) =>
              acc += cur.message.content, '') +
            data.citations.reduce(
              (acc, cur) => acc += '\n' + cur,
              '\nCitations\n',
            ) || 'No response'
      })
      .catch((err) => {
        error.value = `Error: ${err.message}`
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  // Check for API key on initial load
  if (!perplexityApiKey.current.value) {
    const key = prompt('Please enter your Perplexity API key:')
    if (key) perplexityApiKey.current.value = key
  }

  return (
    <>
      <div class={classes.perplexityForm}>
        {!perplexityApiKey.current.value && (
          <div class={classes.error}>
            <p>No API key found! Please enter your Perplexity API key:</p>
            <input
              type='password'
              onInput={(e) =>
                perplexityApiKey.current.value =
                  (e.target as HTMLInputElement).value}
              value={perplexityApiKey.current.value}
            />
          </div>
        )}

        <h1>Perplexity</h1>

        <select
          class={classes.depthSelect}
          value={depth.value}
          onChange={(e) => depth.value = (e.target as HTMLSelectElement).value}
        >
          {Object.keys(depthToModelMap).map((option) => (
            <option value={option}>{option}</option>
          ))}
        </select>

        <textarea
          class={classes.questionInput}
          placeholder='Ask your question...'
          value={question.value}
          onInput={(e) =>
            question.value = (e.target as HTMLTextAreaElement).value}
        >
        </textarea>

        <Btn
          class={classes.searchBtn}
          onClick={handleSearch}
          disabled={isLoading.value}
        >
          {isLoading.value ? 'Searching...' : 'Search'}
        </Btn>

        {error.value && <div class={classes.error}>{error.value}</div>}

        <div class={classes.resultContainer}>
          {result.value && <div class={classes.result}>{result.value}</div>}
        </div>
      </div>
    </>
  )
}

export const PerplexityPage: FunctionComponent = () => {
  return (
    <article class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <SetColorThemeInput />
      </header>
      <main class={classes.content}>
        <Perplexity />
      </main>
    </article>
  )
}
