export function cls(
  ...classNames: Array<string | undefined | boolean>
): string {
  return classNames.reduce<string>((acc, cur) => {
    if (typeof cur === 'string') {
      acc += ' ' + cur
    }
    return acc
  }, '')
}
