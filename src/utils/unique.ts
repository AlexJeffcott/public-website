import { splitFilename } from '@/utils/split-filename.ts'

export function preventDuplicateFilename(
  filename: string,
  filenames: Set<string>,
): string {
  while (filenames.has(filename)) {
    let { filename: beforeExt, ext } = splitFilename(filename)
    const regex = /\((\d*)\)/
    const numbers = regex.exec(beforeExt)
    if (numbers && numbers[1]) {
      const num = parseInt(numbers[numbers.length - 1]) + 1
      beforeExt = beforeExt.replace(regex, `(${num})`)
    } else {
      beforeExt += '(1)'
    }
    filename = `${beforeExt}.${ext}`
  }

  return filename
}
