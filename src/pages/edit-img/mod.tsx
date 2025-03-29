import classes from '@/pages/edit-img/edit-img.module.css'
import { type FunctionComponent } from '@/types/mod.ts'
import { signal } from '@preact/signals'
import { PrimitivePersistence } from '@/persistence/mod.ts'
import { NavigateToHomeBtn, SetColorThemeInput } from '@/actions-ui/mod.ts'
import { Btn, WYSIWYG } from '@/ui-components/mod.ts'

const apiKey = new PrimitivePersistence('openaiApiKey', '')
const imageResult = signal('')
const error = signal('')
const isLoading = signal(false)
const prompt = signal('')
const image = signal()
const imageUrl = signal('')
const size = signal('1024x1024')
const maskUrl = signal('')
const brushSize = signal(20)
const isDrawing = signal(false)

const canvasElement = signal<HTMLCanvasElement | null>(null)
const ctx = signal<CanvasRenderingContext2D | null>(null)

let lastX: number = 0
let lastY: number = 0

function initCanvas() {
  const canvas = canvasElement.value

  if (!canvas) throw new Error('expected canvas to be truthy')

  // Set canvas size to match container dimensions
  const container = canvas.parentElement

  if (!container) throw new Error('expected canvas parentElement to be truthy')

  const rect = container.getBoundingClientRect()

  // NOTE: use max to ensure square canvas
  const size = Math.max(rect.width, rect.height)
  canvas.width = size
  canvas.height = size

  const _ctx = canvas.getContext('2d')
  if (!_ctx) throw new Error('expected canvas context to be truthy')

  // Fill with white (transparent mask)
  _ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  _ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Set the operation to "erase"
  _ctx.globalCompositeOperation = 'destination-out'
  ctx.value = _ctx
}

const EditImage: FunctionComponent = () => {
  return (
    <>
      <div class={classes.controls}>
        <div class={classes.controlGroup}>
          <label for='image'>Source Image</label>
          <input
            type='file'
            id='image'
            accept='image/png'
            onChange={handleImageChange}
          />
          <div class={classes.fileRequirements}>
            Requirements:
            <ul>
              <li>PNG format</li>
              <li>Square dimensions</li>
              <li>Less than 4MB</li>
            </ul>
          </div>
        </div>

        <div class={classes.controlGroup}>
          <label for='size'>Output Size</label>
          <select
            id='size'
            value={size.value}
            onChange={(e) => (size.value = e.currentTarget.value)}
          >
            <option value='256x256'>256x256</option>
            <option value='512x512'>512x512</option>
            <option value='1024x1024'>1024x1024</option>
          </select>
        </div>

        <div class={classes.drawingControls}>
          <div class={classes.brushSize}>
            <label for='brush'>Brush Size:</label>
            <input
              type='range'
              id='brush'
              min='1'
              max='50'
              value={brushSize.value}
              onInput={(
                e,
              ) => (brushSize.value = parseInt(e.currentTarget.value))}
            />
            <div
              class={classes.brushPreview}
              style={`width: ${brushSize.value}px; height: ${brushSize.value}px;`}
            >
            </div>
          </div>
          <Btn onPress={clearMask}>Clear Mask</Btn>
        </div>
      </div>
      <div class={classes.prompt}>
        <WYSIWYG
          onInputCB={(e) => {
            prompt.value = e.currentTarget.value
          }}
        />
      </div>
      <Btn
        class={classes.submitBtn}
        onPress={generateImage}
        disabled={isLoading.value}
      >
        {isLoading.value ? 'Generating image...' : 'Generate Image'}
      </Btn>

      {error.value && <div class='error'>{error.value}</div>}

      <div class={classes.imageContainer}>
        <div
          class={classes.sourceContainer}
        >
          <img class={classes.sourceImage} src={imageUrl.value} />
          <canvas
            class={classes.drawingCanvas}
            ref={(el) => {
              if (el) {
                canvasElement.value = el
              }
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
          >
          </canvas>
        </div>
        <div
          class={classes.sourceContainer}
        >
          <img class={classes.sourceImage} src={maskUrl.value} />
        </div>
      </div>
      <div
        class={classes.resultContainer}
      >
        <img class={classes.imageResult} src={imageResult.value} />
      </div>
    </>
  )
}

export const EditImgPage: FunctionComponent = () => {
  return (
    <article class={classes.page}>
      <header class={classes.header}>
        <NavigateToHomeBtn />
        <SetColorThemeInput />
      </header>
      <main class={classes.content}>
        <EditImage />
      </main>
    </article>
  )
}

function startDrawing(e) {
  isDrawing.value = true
  ;[lastX, lastY] = getMousePos(canvasElement.value, e)
}

function stopDrawing() {
  isDrawing.value = false

  canvasElement.value?.toBlob((blob) => {
    if (!blob) return
    const img = new Image()
    img.src = URL.createObjectURL(blob)
    maskUrl.value = img.src
  }, 'image/png')
}

function getMousePos(canvas, e) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return [
    (e.clientX - rect.left) * scaleX,
    (e.clientY - rect.top) * scaleY,
  ]
}

function clearMask() {
  if (!canvasElement.value || !ctx.value) return
  ctx.value.fillStyle = 'white'
  ctx.value.fillRect(
    0,
    0,
    canvasElement.value.width,
    canvasElement.value.height,
  )
}

function draw(e) {
  if (!isDrawing.value) return
  const _ctx = ctx.value
  if (!_ctx) return

  const [x, y] = getMousePos(canvasElement.value, e)
  _ctx.beginPath()
  _ctx.moveTo(lastX, lastY)
  _ctx.lineTo(x, y)
  _ctx.lineWidth = brushSize.value
  _ctx.lineCap = 'round'
  _ctx.stroke()
  ;[lastX, lastY] = [x, y]
}

function validateImage(file: File) {
  return new Promise((resolve, reject) => {
    if (file.size > 4 * 1024 * 1024) {
      reject('File must be less than 4MB')
      return
    }

    if (file.type !== 'image/png') {
      reject('File must be a PNG image')
      return
    }

    const img = new Image()
    img.onload = () => {
      if (img.width !== img.height) {
        reject('Image must be square')
        return
      }
      resolve(true)
    }
    img.onerror = () => reject('Error loading image')
    img.src = URL.createObjectURL(file)
    imageUrl.value = img.src
  })
}

async function handleImageChange(e) {
  const file = e.target.files[0]
  if (!file) return

  try {
    await validateImage(file)
    image.value = file
    error.value = ''
    setTimeout(initCanvas, 100)
  } catch (err) {
    error.value = err
    e.target.value = ''
    image.value = undefined
    imageUrl.value = ''
  }
}

function scaleCanvasToBlob(
  originalCanvas,
  targetWidth,
  targetHeight,
) {
  const scaledCanvas = document.createElement('canvas')
  scaledCanvas.width = targetWidth
  scaledCanvas.height = targetHeight
  const ctx = scaledCanvas.getContext('2d')

  if (!ctx) {
    throw new Error('Failed to get 2D context')
  }

  ctx.drawImage(
    originalCanvas,
    0,
    0,
    originalCanvas.width,
    originalCanvas.height,
    0,
    0,
    targetWidth,
    targetHeight,
  )

  return new Promise((resolve, reject) => {
    scaledCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Failed to convert canvas to blob'))
      }
    }, 'image/png')
  })
}

async function generateImage() {
  if (!prompt.value.trim()) {
    error.value = 'Please enter a prompt'
    return
  }

  if (!image.value) {
    error.value = 'Please select an image'
    return
  }

  if (!canvasElement.value) {
    error.value = 'CanvasElement is falsey'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const maskBlob = await scaleCanvasToBlob(canvasElement.value, 1592, 1592)
    if (!(maskBlob instanceof Blob)) return

    const result = await openaiImagesEdits({
      apiKey: apiKey.current.value,
      image: image.value,
      mask: maskBlob,
      prompt: prompt.value,
      size: size.value,
    })

    imageResult.value = result
  } catch (err) {
    error.value = `Error: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

async function openaiImagesEdits(
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
