import { type FunctionalComponent } from 'preact'
import classes from '@/pages/gen-img/gen-img.module.css'
import { cls } from '@/utils/mod.ts'
import { isObject } from '@/types/is-object.ts'
import { useSignal } from '@preact/signals'
import { PrimitivePersistence } from '@/persistence/mod.ts'
import { NavigateToHomeBtn, SetColorThemeInput } from '@/actions-ui/mod.ts'

const openAIKey = new PrimitivePersistence('openaiApiKey', '')

const GenImage: FunctionalComponent = () => {
  const imageResult = useSignal('')
  const error = useSignal('')
  const isLoading = useSignal(false)

  return (
    <>
      <form
        class={cls(classes.aiForm, classes.genImg)}
        onFormData={(e) => {
          if (isObject(e) && 'formData' in e) {
            const data = e.formData as FormData
            const body = {
              model: data.get('model'),
              prompt: data.get('prompt'),
              size: data.get('size'),
              style: data.get('style'),
              quality: data.get('quality') ===
                  'hd'
                ? 'hd'
                : undefined,
              n: 1,
            }
            isLoading.value = true
            error.value = ''

            fetch(
              'https://api.openai.com/v1/images/generations',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${
                    data.get(
                      'apiKey',
                    )
                  }`,
                },
                body: JSON.stringify(
                  body,
                ),
              },
            )
              .then((response) => {
                if (!response.ok) {
                  throw new Error(
                    `HTTP error! status: ${response.status}`,
                  )
                }
                return response.json()
              })
              .then((data) => {
                imageResult.value = data.data[0].url
              })
              .catch((err) => {
                error.value = `Error: ${err.message}`
              })
              .finally(() => {
                isLoading.value = false
              })
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          new FormData(e.currentTarget)
        }}
      >
        <select name='size'>
          <option value='1024x1024' selected>
            1024x1024
          </option>
          <option value='1792x1024'>
            1792x1024
          </option>
          <option value='1024x1792'>
            1024x1792
          </option>
        </select>

        <select name='style'>
          <option value='vivid' selected>
            vivid
          </option>
          <option value='natural'>natural</option>
        </select>

        <label>
          <input
            type='checkbox'
            name='quality'
            value='hd'
          >
          </input>
          HD
        </label>

        <textarea name='prompt'></textarea>
        <input
          type='hidden'
          name='model'
          value='dall-e-3'
        >
        </input>
        <input
          type='hidden'
          name='apiKey'
          value={openAIKey.current.value}
        >
        </input>

        <button
          type='submit'
          disabled={isLoading.value}
        >
          {isLoading.value ? 'Generating image...' : 'Generate Image'}
        </button>
      </form>

      {error.value && <div class='error'>{error.value}</div>}
      <div class={classes.resultContainer}>
        {imageResult.value && (
          <img
            class={classes.imgResult}
            src={imageResult.value}
          />
        )}
      </div>
    </>
  )
}

export const GenImgPage: FunctionalComponent = () => {
  return (
    <article class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <SetColorThemeInput />
      </header>
      <h1>Generate an Image with Dall-e-3</h1>
      <main class={classes.content}>
        <GenImage />
      </main>
      <footer class={classes.footer}>Alex Jeffcott</footer>
    </article>
  )
}

//400
//{
//  "error": {
//    "code": "content_policy_violation",
//    "message": "Your request was rejected as a result of our safety system. Your prompt may contain text that is not allowed by our safety system.",
//    "param": null,
//    "type": "invalid_request_error"
//  }
//}
