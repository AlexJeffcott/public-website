import { createBroadcastHub } from '@/broadcast/mod.ts'
import { computed, signal } from '@preact/signals'
import { type FileSystemItem, type FSNode, type Signal } from '@/types/mod.ts'
import { isTextFile } from '@/utils/get-file-type.ts'
import { o3Mini, sonnet37 } from '@/libs/llm.ts'

function createSharedWorker(
  scriptPath: string,
  workerName: string,
): { worker: SharedWorker; isReady: Signal<boolean> } {
  const isReady = signal(false)
  const worker = new SharedWorker(scriptPath, {
    name: workerName,
    type: 'module',
  })
  worker.port.onmessage = (event) => {
    if (
      event.type === 'message' && event.data === 'pong'
    ) {
      isReady.value = true
    }
  }
  worker.port.postMessage({ type: 'PING' })
  return { worker, isReady }
}

let clock = 0
const hub = createBroadcastHub('app-channel', `main-${++clock}`)
const fsWorker = createSharedWorker('./fs-worker.js', 'fs-worker')

const areAllConnected = computed(() =>
  fsWorker.isReady.value && hub.isReady.value
)

const messages = signal<string[]>([])

function addMessage(msg: string[]) {
  messages.value = [...messages.peek(), msg.join(' : ')]
}

const { promise, resolve } = Promise.withResolvers<void>()
if (areAllConnected.peek()) {
  resolve()
} else {
  areAllConnected.subscribe((bool) => {
    if (bool) {
      resolve()
    }
  })
}
await promise

hub.on('RESPONSE', (message) => {
  addMessage([
    'RESPONSE',
    message.source,
    JSON.stringify(message.payload),
  ])
})

hub.on('LOG', (message) => {
  addMessage([
    'LOG',
    message.source,
    JSON.stringify(message.payload),
  ])
})

hub.on('DATA', (message) => {
  addMessage([
    'DATA',
    message.source,
    JSON.stringify(message.payload),
  ])
})

hub.on('ERROR', (message) => {
  addMessage([
    'ERROR',
    message.source,
    `ERROR: ${JSON.stringify(message.payload)}`,
  ])
})

// FIX: this does not have type safety
const fsHandlers = {
  read(path: string) {
    return hub.request<string>('fs-worker', {
      operation: 'read',
      path,
    }).then((result) => {
      return result
    })
  },
  write(path: string, data: FileSystemItem | string) {
    if (typeof data !== 'string') {
      return data.getFile().then((file) => {
        // handle txt files differently
        if (isTextFile(file.name)) {
          return file.text().then((data) =>
            hub.request<void>('fs-worker', {
              operation: 'write',
              path,
              data,
            })
          )
        }

        hub.request<void>('fs-worker', {
          operation: 'mediaFileInit',
          path,
          name: file.name,
          size: file.size,
          type: file.type,
        }).catch((err) => console.error(err))

        const stream = file.stream()
        const reader = stream.getReader()

        function readAndPost() {
          return reader.read().then(({ done, value }) => {
            // Send each chunk as an ArrayBuffer (which is transferable)
            if (value) {
              hub.request<void>('fs-worker', {
                operation: 'mediaFileAddChunk',
                path,
                data: value.buffer,
              })
            }
            if (!done) {
              readAndPost()
            } else {
              hub.request<void>('fs-worker', {
                operation: 'mediaFileComplete',
                path,
              })
            }
          }).catch((err) => console.error(err))
        }
        return readAndPost()
      }).catch((err) => console.error(err))
    } else {
      // tool .output files get more handling
      if (path.endsWith('.output')) {
        return sendToLLM(path)
      } else {
        return hub.request<void>('fs-worker', {
          operation: 'write',
          path,
          data,
        })
      }
    }
  },
  delete(path: string) {
    return hub.request<void>('fs-worker', {
      operation: 'delete',
      path,
    })
  },
  existsFile(path: string) {
    return hub.request<boolean>('fs-worker', {
      operation: 'existsFile',
      path,
    })
  },
  existsDirectory(path: string) {
    return hub.request<boolean>('fs-worker', {
      operation: 'existsDirectory',
      path,
    })
  },
  list() {
    return hub.request<FSNode>('fs-worker', {
      operation: 'list',
    })
  },
  move(oldPath: string, newPath: string) {
    return hub.request<void>('fs-worker', {
      operation: 'move',
      oldPath,
      newPath,
    })
  },
  copy(sourcePath: string, destinationPath: string) {
    return hub.request<void>('fs-worker', {
      operation: 'copy',
      sourcePath,
      destinationPath,
    })
  },
  createDirectory(path: string) {
    return hub.request<void>('fs-worker', {
      operation: 'createDirectory',
      path,
    })
  },
}

export { areAllConnected, fsHandlers, messages }

export async function sendToLLM(path: string) {
  const inputStr = await fsHandlers.read(path.replace('.output', ''))

  const { model, persona } = parseHashBang(inputStr)

  let data

  if (model === 'claude') {
    data = await sonnet37(inputStr, persona)
  } else if (model === 'chatgpt') {
    data = await o3Mini(inputStr, persona)
  }

  return hub.request<void>('fs-worker', {
    operation: 'write',
    path,
    data,
  })
}

function parseHashBang(firstLine: string) {
  const isHashBang = firstLine.startsWith('#! ')

  if (isHashBang) {
    const [model, persona] = firstLine.slice(3).split('/')

    return { model, persona }
  }

  return { model: 'claude', persona: 'frontend' }
}
