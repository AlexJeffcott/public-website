/// <reference lib="webworker" />
import { createBroadcastHub } from '@/broadcast/mod.ts'
import { FileSystem } from '@/libs/fs.ts'
import {
  isCopy,
  isCreateDirectory,
  isDelete,
  isExistsDirectory,
  isExistsFile,
  isList,
  isMediaFileAddChunk,
  isMediaFileComplete,
  isMediaFileInit,
  isRead,
  isSharedWorkerGlobalScope,
  isWrite,
} from '@/workers/fs-worker.types.ts'
import { getFileType } from '@/utils/get-file-type.ts'

const ctx = isSharedWorkerGlobalScope(self) ? self : null

if (!ctx) {
  throw new Error('Not in a SharedWorkerGlobalScope context')
}

const fs = new FileSystem()
const connections = new Set<MessagePort>()

const NAME = 'fs-worker'

const hub = createBroadcastHub('app-channel', NAME)

ctx.onconnect = (e: MessageEvent) => {
  const port = e.ports[0]
  connections.add(port)

  port.onmessage = (event) => {
    if (event.data.type === 'DIRECT') {
      hub.send('DATA', {
        message: 'Received direct message in fs worker',
        originalData: event.data.payload,
      })
    } else if (event.data.type === 'PING') {
      port.postMessage('pong')
    }
  }

  port.start()

  hub.send('LOG', {
    message: 'New connection established with file system worker',
  })
}

const hash = new Map<string, string>()
const fileChunkHash = new Map<
  string,
  {
    metadata: { name: string; size: number; type: string; path: string }
    chunks: Uint8Array[]
  }
>()

hub.on('REQUEST', (message) => {
  // skip messages not aimed at this worker
  if (message.target !== NAME) return

  const payload = message.payload

  if (isExistsFile(payload)) {
    fs.existsFile(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isExistsDirectory(payload)) {
    fs.existsDirectory(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isList(payload)) {
    fs.list()
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isMediaFileInit(payload)) {
    // TODO: check to see whether we can have concurrancy issues here
    // if so we need to use a map
    fileChunkHash.set(payload.path, {
      metadata: {
        name: payload.name,
        path: payload.path,
        size: payload.size,
        type: payload.type,
      },
      chunks: [],
    })

    hub.respond(message, undefined)
  } else if (isMediaFileAddChunk(payload)) {
    const item = fileChunkHash.get(payload.path)
    if (item) {
      item.chunks.push(new Uint8Array(payload.data))
      hub.respond(message, undefined)
    }
  } else if (isMediaFileComplete(payload)) {
    const item = fileChunkHash.get(payload.path)
    if (item) {
      processFile(item.metadata, item.chunks)
      hub.respond(message, undefined)
    }
  } else if (isRead(payload)) {
    fs.read(payload.path)
      .then(async (file) => {
        // NOTE: this first then is like a processing middleware
        if (file) {
          if (hash.has(payload.path)) {
            return hash.get(payload.path)
            //url && URL.revokeObjectURL(url)
          }
          if (getFileType(payload.path) === 'text') {
            const txt = await file.text()
            return txt
          }
          const stream = file.stream()
          const response = new Response(stream)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          hash.set(payload.path, url)
          return url
        }
      })
      .then((processedResult) => hub.respond(message, processedResult))
      .catch((err) => hub.error(message, err))
  } else if (isWrite(payload)) {
    fs.write(payload.path, payload.data)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isDelete(payload)) {
    fs.delete(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isCopy(payload)) {
    fs.copy(payload.sourcePath, payload.destinationPath)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isCreateDirectory(payload)) {
    fs.createDirectory(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else {
    hub.error(message, `Unknown operation: ${payload}`)
  }
})

hub.on('*', (message) => {
  console.log(NAME, message)
})

function processFile(
  metadata: { name: string; size: number; type: string; path: string } | null,
  chunks: Uint8Array[],
) {
  if (metadata !== null) {
    const blob = new Blob(chunks, { type: metadata.type })
    blob.arrayBuffer().then((buffer) => {
      fs.write(metadata.path, buffer)
      const url = URL.createObjectURL(blob)
      metadata && hash.set(metadata.path, url)
      fileChunkHash.delete(metadata.path)
    }).catch((err) => {
      console.error(err)
    })
  }
}
