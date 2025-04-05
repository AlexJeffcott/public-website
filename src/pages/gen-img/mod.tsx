import classes from '@/pages/gen-img/gen-img.module.css'
import { cls } from '@/utils/mod.ts'
import { type FunctionComponent, isObject } from '@/types/mod.ts'
import { useSignal } from '@preact/signals'
import { PrimitivePersistence } from '@/persistence/mod.ts'
import { NavigateToHomeBtn, SetColorThemeInput } from '@/actions-ui/mod.ts'
import { Btn, WYSIWYG } from '@/ui-components/mod.ts'
import { dalle3Create } from '@/libs/llm.ts'

const openAIKey = new PrimitivePersistence('openaiApiKey', '')

const GenImage: FunctionComponent = () => {
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
            isLoading.value = true
            error.value = ''

            try {
              dalle3Create({
                prompt: data.get('prompt'),
                size: data.get('size'),
                style: data.get('style'),
                quality: data.get('quality') ===
                    'hd'
                  ? 'hd'
                  : undefined,
                apiKey: data.get('apiKey'),
              }).then((res) => {
                imageResult.value = res
              })
            } catch (err) {
              error.value = `Error: ${err.message}`
            } finally {
              isLoading.value = false
            }
          }
        }}
        onSubmit={(e) => {
          e.preventDefault()
          new FormData(e.currentTarget)
        }}
      >
        <select name='size' class={classes.size}>
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

        <select name='style' class={classes.style}>
          <option value='vivid' selected>
            vivid
          </option>
          <option value='natural'>natural</option>
        </select>

        <label class={classes.quality}>
          <input
            type='checkbox'
            name='quality'
            value='hd'
          >
          </input>
          HD
        </label>
        <div class={classes.prompt}>
          <WYSIWYG name='prompt' />
        </div>
        <input
          type='hidden'
          name='apiKey'
          value={openAIKey.current.value}
        >
        </input>

        <Btn
          class={classes.submitBtn}
          type='submit'
          disabled={isLoading.value}
        >
          {isLoading.value ? 'Generating image...' : 'Generate Image'}
        </Btn>
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

export const GenImgPage: FunctionComponent = () => {
  return (
    <article class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <SetColorThemeInput />
      </header>
      <main class={classes.content}>
        <GenImage />
      </main>
    </article>
  )
}
