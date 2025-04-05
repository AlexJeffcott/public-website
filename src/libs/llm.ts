import { type Msg, type Msgs } from '@/types/mod.ts'

export const personas: Record<string, string> = {
  frontend:
    `You are an expert TypeScript web engineer who specializes in Preact and signals.
Key principles:
- Be precise and concise
- Only explain when asked
- Favor Preact and signals over other solutions
- Avoid dependencies unless specifically requested
- Write clean, type-safe code
- Prefer modules to classes
- Don't use Tailwind or css utilities
- Only use specified techs
- Focus on modern web standards and best practices
- Don't output html answers, unless asked
- If more information is needed, you ask.`,
  fullstack:
    `You are an expert full stack developer who is expert in PHP, Golang and Typescript.
Key principles:
- Be precise and concise
- Only explain when asked
- Avoid dependencies unless specifically requested
- Write clean, type-safe code
- Prefer functions to classes`,
  agent: `Be precise and concise`,
  default: 'Be precise and concise',
}

export async function agent(messages: Msgs) {
  const tools = [{
    type: 'text_editor_20250124',
    name: 'str_replace_editor',
  }]
  return sonnet37(messages, 'agent', tools)
}

export async function sonnet37(
  messages: Msgs,
  persona: string,
  tools: Array<{ type: string; name: string }> = [],
): Promise<Msg> {
  const apiKey = localStorage.getItem('claudeApiKey') || ''

  if (!apiKey) {
    throw new Error('claudeApiKey local storage api key is required')
  }

  const system = personas[persona] ?? personas['default']

  try {
    const body = {
      model: 'claude-3-7-sonnet-latest',
      'max_tokens': 6000,
      'thinking': {
        'type': 'enabled',
        'budget_tokens': 1024,
      },
      messages,
      system,
      tools,
    }

    const result = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': true,
          'Authorization': `Bearer ${apiKey}`,
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      },
    )

    if (!result.ok) {
      const errorData = await result.json()
      throw new Error(
        errorData.error?.message ||
          `HTTP error! status: ${result.status}`,
      )
    }

    const json = await result.json()

    return { role: json.role, content: json.content }
    //.map((c) => ({ role: json.role, content: c }))
  } catch (err) {
    throw new Error(`Error: ${err.message}`)
  }
}

export async function o3Mini(messages: Msgs, persona: string): Promise<Msg> {
  const apiKey = localStorage.getItem('openaiApiKey') || ''

  if (!apiKey) {
    throw new Error('openaiApiKey local storage api key is required')
  }

  messages.unshift({
    role: 'system',
    content: personas[persona] ?? personas['default'],
  })

  try {
    const result = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'o3-mini-2025-01-31',
          messages,
        }),
      },
    )

    if (!result.ok) {
      const errorData = await result.json()
      throw new Error(
        errorData.error?.message ||
          `HTTP error! status: ${result.status}`,
      )
    }

    const json = await result.json()
    return json.choices[0].message
  } catch (err) {
    throw new Error(`Error: ${err.message}`)
  }
}

export async function dalle2Edits(
  { image, mask, prompt, size, apiKey, n, model }: {
    image: Blob
    mask: Blob
    prompt: string
    size: string
    apiKey: string
    n?: number
    model?: string
  },
) {
  const formData = new FormData()

  formData.append('image', image)
  formData.append('mask', mask)
  formData.append('model', model || 'dall-e-2')
  formData.append('prompt', prompt)
  formData.append('size', size)
  formData.append('n', 1)

  const response = await fetch(
    'https://api.openai.com/v1/images/edits',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].url
}

export async function dalle3Create(
  { image, quality = 'hd', prompt, size, apiKey, n = 1, model = 'dall-e-3' }: {
    image: Blob
    prompt: string
    size: string
    apiKey: string
    quality?: string
    n?: number
    model?: string
  },
) {
  const response = await fetch(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ image, quality, prompt, size, n, model }),
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].url
}

export async function perplexity(
  { prompt, apiKey, model }: {
    prompt: string
    apiKey: string
    model: string
  },
) {
  const response = await fetch(
    'https://api.perplexity.ai/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            'role': 'system',
            'content': 'Be precise and concise.',
          },
          {
            'role': 'user',
            'content': prompt,
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}
