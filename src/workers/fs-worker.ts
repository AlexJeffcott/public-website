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
  isRead,
  isSharedWorkerGlobalScope,
  isWrite,
} from '@/workers/fs-worker.types.ts'

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

hub.on('REQUEST', (message) => {
  // skip messages not aimed at this worker
  if (message.target !== NAME) return

  const payload = message.payload
  if (isRead(payload)) {
    fs.read(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isWrite(payload)) {
    fs.write(payload.path, payload.data)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isDelete(payload)) {
    fs.delete(payload.path)
      .then((result) => hub.respond(message, result))
      .catch((err) => hub.error(message, err))
  } else if (isExistsFile(payload)) {
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
