import { isObject } from '@/types/mod.ts'

type ThinkingContent = {
  type: 'thinking'
  thinking: string
  signature: string
}

type TextContent = { type: 'text'; text: string }

type ToolContent = {
  type: 'tool_use'
  id: string
  name: 'str_replace_editor'
  input: {
    command: 'view'
    path: string
  }
} | {
  type: 'tool_use'
  id: string
  name: 'str_replace_editor'
  input: {
    command: 'str_replace'
    path: string
    new_str: string
    old_str: string
  }
} | {
  type: 'tool_use'
  id: string
  name: 'str_replace_editor'
  input: {
    command: 'create'
    path: string
    file_text: string
  }
} | {
  type: 'tool_use'
  id: string
  name: 'str_replace_editor'
  input: {
    command: 'insert'
    path: string
    insert_line: string
    new_str: string
  }
} | {
  type: 'tool_use'
  id: string
  name: 'str_replace_editor'
  input: {
    command: 'undo_edit'
    path: string
  }
}

type AssistantContent = Array<TextContent | ThinkingContent | ToolContent>

export const isToolContent = (c: unknown): c is ToolContent =>
  isObject(c) && c.type === 'tool_use' && c.name === 'str_replace_editor' &&
  isObject(c.input) && (
    (c.input.command === 'view' && typeof c.input.path === 'string') ||
    (c.input.command === 'str_replace' && typeof c.input.path === 'string' &&
      typeof c.input.new_str === 'string' &&
      typeof c.input.old_str === 'string') ||
    (
      c.input.command === 'create' && typeof c.input.path === 'string' &&
      typeof c.input.file_text === 'string'
    ) ||
    (
      c.input.command === 'insert' && typeof c.input.path === 'string' &&
      typeof c.input.insert_line === 'string' &&
      typeof c.input.new_str === 'string'
    ) ||
    (
      c.input.command === 'undo_edit' && typeof c.input.path === 'string'
    )
  )

export const isTextContent = (c: unknown): c is TextContent =>
  isObject(c) && c.type === 'text' && typeof c.text === 'string'

export const isThinkingContent = (c: unknown): c is ThinkingContent =>
  isObject(c) && c.type === 'thinking' && typeof c.thinking === 'string' &&
  typeof c.signature === 'string'

export const isAssistantContent = (c: unknown): c is AssistantContent =>
  Array.isArray(c) &&
  c.every((innerC) =>
    isTextContent(innerC) || isThinkingContent(innerC) || isToolContent(innerC)
  )

type RequestMsg = {
  role: 'user' | 'system'
  content: string | [
    { type: 'tool_result'; 'tool_use_id': string; content: string },
  ]
}

type ResponseMsg = { role: 'assistant'; content: AssistantContent }

export type Msg = RequestMsg | ResponseMsg

export const isMsg = (m: unknown): m is Msg =>
  isObject(m) && 'role' in m && 'content' in m &&
  (
    (
      (m.role === 'user' || m.role === 'system') &&
      (typeof m.content === 'string' ||
        (Array.isArray(m.content) &&
          m.content.every((c) =>
            typeof c.content === 'string' && c.type === 'tool_result' &&
            typeof c['tool_use_id'] === 'string'
          )))
    ) ||
    m.role === 'assistant' && isAssistantContent(m.content)
  )

export type Msgs = Array<Msg>

export const isMsgs = (ms: unknown): ms is Msgs =>
  Array.isArray(ms) && ms.every(isMsg)
