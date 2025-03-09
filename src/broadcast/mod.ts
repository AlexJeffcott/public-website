import { type Signal, signal } from '@preact/signals'

type MessageType = 'LOG' | 'ERROR' | 'DATA' | 'REQUEST' | 'RESPONSE'

export interface BroadcastMessage {
  type: MessageType
  source: string
  target?: string // Optional: if undefined, broadcast to all
  id?: string // For request/response pairing
  payload: unknown
  timestamp: number
}

type MessageHandler = (message: BroadcastMessage) => void
let clock = 0
export class BroadcastHub {
  private channel: BroadcastChannel
  private handlers: Map<MessageType, Set<MessageHandler>> = new Map()
  private id: string
  isReady: Signal<boolean>

  constructor(channelName: string, id: string) {
    this.isReady = signal(false)
    this.channel = new BroadcastChannel(channelName)
    this.id = id

    this.channel.onmessage = (
      event: MessageEvent<BroadcastMessage>,
    ) => {
      const message = event.data

      // Skip messages from self
      if (message.source === this.id) return

      // Skip messages not intended for this recipient if target is specified
      if (message.target && message.target !== this.id) return

      // Dispatch to handlers
      const typeHandlers = this.handlers.get(message.type)
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(message))
      }

      // Dispatch to wildcard handlers
      const wildcardHandlers = this.handlers.get(
        '*' as MessageType,
      )
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(message))
      }
    }

    this.isReady.value = true

    this.request = this.request.bind(this)
    this.respond = this.respond.bind(this)
    this.send = this.send.bind(this)
    this.on = this.on.bind(this)
    this.error = this.error.bind(this)
    this.close = this.close.bind(this)
  }

  // Register a handler for a specific message type
  on(type: MessageType | '*', handler: MessageHandler): () => void {
    if (!this.handlers.has(type as MessageType)) {
      this.handlers.set(type as MessageType, new Set())
    }

    this.handlers.get(type as MessageType)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(type as MessageType)
      if (handlers) {
        handlers.delete(handler)
      }
    }
  }

  send(
    type: MessageType,
    payload: unknown,
    target?: string,
    id?: string,
  ): void {
    const message: BroadcastMessage = {
      type,
      source: this.id,
      target,
      id,
      payload,
      timestamp: Date.now(),
    }

    this.channel.postMessage(message)
  }

  request<T>(
    target: string,
    payload: unknown,
    timeout = 5000,
  ): Promise<T> {
    const requestId = `${this.id}-${++clock}`

    const { promise, reject, resolve } = Promise.withResolvers<T>()

    const timeoutId = setTimeout(() => {
      dispose()
      reject(
        new Error(
          `Request to ${target} timed out after ${timeout}ms`,
        ),
      )
    }, timeout)

    const dispose = this.on('RESPONSE', (message) => {
      if (message.id === requestId) {
        clearTimeout(timeoutId)
        resolve(message.payload as T)
        dispose()
      }
    })

    this.send('REQUEST', payload, target, requestId)

    return promise
  }

  respond(requestMessage: BroadcastMessage, payload: unknown): void {
    if (!requestMessage.id) {
      throw new Error(
        'Cannot respond to a message without an ID',
      )
    }

    this.send(
      'RESPONSE',
      payload,
      requestMessage.source,
      requestMessage.id,
    )
  }

  error(requestMessage: BroadcastMessage, payload: unknown): void {
    this.send(
      'ERROR',
      payload,
      requestMessage.source,
      requestMessage.id,
    )
  }

  close(): void {
    this.channel.close()
    this.handlers.clear()
    this.isReady.value = false
  }
}

export function createBroadcastHub(
  channelName = 'app-channel',
  id: string,
): BroadcastHub {
  return new BroadcastHub(channelName, id)
}
