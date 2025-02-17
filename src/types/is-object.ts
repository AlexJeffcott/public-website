export function isObject(o: unknown): o is Record<string, unknown> {
  return !!o && typeof o === 'object'
}
