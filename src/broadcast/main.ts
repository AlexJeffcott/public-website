import { createBroadcastHub } from '@/broadcast/mod.ts'
import { computed, type Signal, signal } from '@preact/signals'

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

type FileSystemNode = {
  name: string
  kind: 'file' | 'directory'
  path: string
  children?: FileSystemNode[]
}

const fsHandlers = {
  read(path: string) {
    return hub.request<ArrayBuffer>('fs-worker', {
      operation: 'read',
      path,
    }).then((arrayBuffer) => {
      //Common operations with ArrayBuffer:
      //
      //1. Convert to string:
      // For text files
      //const text = new TextDecoder().decode(arrayBuffer);
      //
      //2. Process as binary data:
      // Access raw binary data
      //const dataView = new DataView(arrayBuffer);
      // Read specific data types
      //const value = dataView.getUint8(0); // Read first byte
      //
      //3. Convert to other formats:
      // To Blob (for file operations)
      //const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      //
      // To base64 (for data URLs)
      //const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      //
      //4. Use with specific APIs:
      // For images
      //const bitmap = await createImageBitmap(new Blob([arrayBuffer]));
      //
      // For audio
      //const audioContext = new AudioContext();
      //const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // assume text
      const txt = new TextDecoder().decode(arrayBuffer)
      return txt
    })
  },
  write(path: string, data: string | ArrayBuffer) {
    return hub.request<void>('fs-worker', {
      operation: 'write',
      path,
      data,
    })
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
    return hub.request<FileSystemNode>('fs-worker', {
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
